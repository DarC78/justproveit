import { GOOGLE_CONSENT_KEY, type GoogleChoice } from '@/lib/googleAdvertising';
export type PaidCheckoutReference = { source: 'proveit' | 'justproveit'; sessionId: string };
export type PaidCheckout = { paid: true; amount: number; currency: string; products: {name: string; quantity: number}[]; continueUrl: string | null; confirmationMessage: string | null; language?: 'ro'|'en'|'es'|'pl' };
export function capturedPaidCheckout(): PaidCheckoutReference | null {
  const value = (window as Window & { proveitPaidCheckout?: PaidCheckoutReference }).proveitPaidCheckout;
  return value && ['proveit','justproveit'].includes(value.source) && /^cs_live_[A-Za-z0-9]{10,200}$/.test(value.sessionId) ? value : null;
}
async function send(body: object) {
  const response = await fetch('/api/google-purchase-consent', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body), cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Error('Preferințele nu au putut fi salvate. Poți continua și reîncerca mai târziu.');
  return response.json();
}
export async function verifyPaidCheckout(reference: PaidCheckoutReference): Promise<PaidCheckout | null> {
  const result = await send({...reference,action:'verify'});
  return result?.paid === true && Number.isSafeInteger(result.amount) && result.amount > 0 && /^[A-Z]{3}$/.test(result.currency) && Array.isArray(result.products) ? result : null;
}
export async function savePaidCheckoutChoice(reference: PaidCheckoutReference, sharing: boolean, personalization: boolean) {
  const choice: GoogleChoice = {adUserData:sharing?'granted':'denied',adPersonalization:personalization?'granted':'denied',version:'google-customer-data-v1',at:new Date().toISOString()};
  const result = await send({...reference,action:'choice',...choice});
  if (!result.saved || !['granted','denied'].includes(result.adUserData) || !['granted','denied'].includes(result.adPersonalization)) throw Error('Salvarea nu a putut fi confirmată.');
  try { localStorage.setItem(GOOGLE_CONSENT_KEY,JSON.stringify({...choice,adUserData:result.adUserData,adPersonalization:result.adPersonalization})); } catch { /* Server-side refusal remains authoritative. */ }
  return result;
}
