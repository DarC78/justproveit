import sourceConfig from '@/config/google-advertising.json';
import { validPurchase, type VerifiedCoursePurchase } from '@/lib/baniUkAiPurchase';

export const GOOGLE_CONSENT_KEY = 'proveit-google-customer-data-consent-v1';
const config: { customerDataConsentEnabled: boolean; purchaseEnabled: boolean; purchaseDestinationVerified: boolean; purchaseSendTo: string | null; consentEndpoint: string } = sourceConfig;
export type GoogleChoice = { adUserData: 'granted' | 'denied'; adPersonalization: 'granted' | 'denied'; version: 'google-customer-data-v1'; at: string };
type GoogleWindow = Window & { proveitEmailToken?: string; dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
let sessionChoice: GoogleChoice | null = null;
function usableChoice(value: unknown): GoogleChoice | null {
  if (!value || typeof value !== 'object') return null;
  const choice = value as GoogleChoice;
  if (choice.version !== 'google-customer-data-v1' || typeof choice.at !== 'string' || !Number.isFinite(Date.parse(choice.at)) || Date.now() - Date.parse(choice.at) > 180 * 86400000 || Date.parse(choice.at) > Date.now() + 60000) return null;
  return ['granted', 'denied'].includes(choice.adUserData) && ['granted', 'denied'].includes(choice.adPersonalization) ? choice : null;
}
export function readGoogleChoice(): GoogleChoice | null {
  let stored: GoogleChoice | null = null;
  try {
    stored = usableChoice(JSON.parse(localStorage.getItem(GOOGLE_CONSENT_KEY) || 'null'));
  } catch { /* The in-memory choice still applies when storage is unavailable. */ }
  const memory = usableChoice(sessionChoice);
  if (!memory || !stored) return memory || stored;
  const latest = Date.parse(memory.at) >= Date.parse(stored.at) ? memory : stored;
  // A stale stored grant must not undo a refusal which could not be persisted.
  return { ...latest,
    adUserData: memory.adUserData === 'denied' || stored.adUserData === 'denied' ? 'denied' : 'granted',
    adPersonalization: memory.adPersonalization === 'denied' || stored.adPersonalization === 'denied' ? 'denied' : 'granted',
  };
}
export async function saveGoogleChoice(choice: GoogleChoice, token: string) {
  if (!config.customerDataConsentEnabled || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('Google customer matching is unavailable');
  // Persist a refusal even when the network fails; never silently replace it.
  const previous = readGoogleChoice();
  if ((previous?.adUserData === 'denied' && choice.adUserData === 'granted') || (previous?.adPersonalization === 'denied' && choice.adPersonalization === 'granted')) throw new Error('Verified re-consent is required');
  sessionChoice = { ...choice };
  try { localStorage.setItem(GOOGLE_CONSENT_KEY, JSON.stringify(choice)); }
  catch { /* Storage failure cannot prevent token-bound refusal delivery. */ }
  const w = window as GoogleWindow;
  try { w.gtag?.('consent', 'update', { ad_user_data: choice.adUserData, ad_personalization: choice.adPersonalization }); }
  catch { /* A vendor SDK failure must not block the server choice either. */ }
  const response = await fetch(config.consentEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...choice }), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, signal: AbortSignal.timeout(8000) });
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
