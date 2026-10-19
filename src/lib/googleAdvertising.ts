import sourceConfig from '@/config/google-advertising.json';
import { validPurchase, type VerifiedCoursePurchase } from '@/lib/baniUkAiPurchase';

export const GOOGLE_CONSENT_KEY = 'proveit-google-customer-data-consent-v1';
const config: { customerDataConsentEnabled: boolean; purchaseEnabled: boolean; purchaseDestinationVerified: boolean; purchaseSendTo: string | null; consentEndpoint: string } = sourceConfig;
export type GoogleChoice = { adUserData: 'granted' | 'denied'; adPersonalization: 'granted' | 'denied'; version: 'google-customer-data-v1'; at: string };
type GoogleWindow = Window & { proveitEmailToken?: string; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
export function readGoogleChoice(): GoogleChoice | null {
  try {
    const value = JSON.parse(localStorage.getItem(GOOGLE_CONSENT_KEY) || 'null');
    if (value?.version !== 'google-customer-data-v1' || !Number.isFinite(Date.parse(value.at)) || Date.now() - Date.parse(value.at) > 180 * 86400000 || Date.parse(value.at) > Date.now() + 60000) return null;
    return ['granted', 'denied'].includes(value.adUserData) && ['granted', 'denied'].includes(value.adPersonalization) ? value : null;
  } catch { return null; }
}
export async function saveGoogleChoice(choice: GoogleChoice, token: string) {
  if (!config.customerDataConsentEnabled || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Google customer matching is unavailable');
  // Persist a refusal even when the network fails; never silently replace it.
  const previous = readGoogleChoice();
  if ((previous?.adUserData === 'denied' && choice.adUserData === 'granted') || (previous?.adPersonalization === 'denied' && choice.adPersonalization === 'granted')) throw new Error('Verified re-consent is required');
  localStorage.setItem(GOOGLE_CONSENT_KEY, JSON.stringify(choice));
  const w = window as GoogleWindow;
  w.gtag?.('consent', 'update', { ad_user_data: choice.adUserData, ad_personalization: choice.adPersonalization });
  const response = await fetch(config.consentEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...choice }), credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000) });
  if (response.status !== 202) throw new Error('Could not record Google choice');
  window.dispatchEvent(new Event('proveit-google-consent-recorded'));
}
export async function googleTransactionId(sessionId: string): Promise<string> {
  const bytes = new TextEncoder().encode('google-purchase:' + sessionId);
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
}
const queued = new Set<string>();
export async function trackGooglePurchase(purchase: VerifiedCoursePurchase) {
  if (!config.purchaseEnabled || !config.purchaseDestinationVerified || !validPurchase(purchase) || !/^AW-\d+\/[A-Za-z0-9_-]+$/.test(config.purchaseSendTo || '')) return;
  const choice = readGoogleChoice();
  if (choice?.adUserData !== 'granted' || choice.adPersonalization !== 'granted') return;
  try {
    const advertising = JSON.parse(localStorage.getItem('proveit-advertising-consent-v1') || 'null');
    if (advertising?.value === 'denied' && advertising.expires > Date.now()) return;
    const id = await googleTransactionId(purchase.sessionId);
    const key = 'proveit-google-purchase:' + id;
    if (queued.has(key) || localStorage.getItem(key)) return;
    const w = window as GoogleWindow;
    w.dataLayer ||= [];
    // gtag's documented queue stores Arguments objects, not a normal rest array.
    // eslint-disable-next-line prefer-rest-params
    w.gtag ||= function () { w.dataLayer!.push(arguments); };
    w.gtag('js', new Date());
    // Only initialize the verified action after a verified checkout and choices.
    // No explicit page_view is emitted; check Ads-native behavior in the pilot.
    w.gtag('consent', 'update', { ad_user_data: 'granted', ad_personalization: 'granted' });
    w.gtag('config', config.purchaseSendTo!.split('/')[0], { send_page_view: false });
    if (!document.getElementById('proveit-google-purchase-tag')) {
      const script = document.createElement('script'); script.id = 'proveit-google-purchase-tag'; script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.purchaseSendTo!.split('/')[0];
      document.head.appendChild(script);
    }
    w.gtag('event', 'conversion', { send_to: config.purchaseSendTo, value: purchase.value, currency: 'GBP', transaction_id: id });
    queued.add(key); localStorage.setItem(key, 'queued');
  } catch { /* Never interrupt checkout or fabricate a delivery receipt. */ }
}
