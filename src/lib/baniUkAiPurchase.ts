export type VerifiedCoursePurchase = { paid: true; sessionId: string; value: number; currency: "GBP"; emailSent: boolean };
type AnalyticsWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  ttq?: { track: (...args: unknown[]) => void };
  dataLayer?: unknown[];
  proveitPurchaseVerified?: boolean;
};
export function validPurchase(value: unknown): value is VerifiedCoursePurchase {
  if (!value || typeof value !== "object") return false;
  const p = value as VerifiedCoursePurchase;
  return p.paid === true && /^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(p.sessionId) && Number.isFinite(p.value) && p.value > 0 && p.currency === "GBP";
}
export function trackVerifiedCoursePurchase(purchase: VerifiedCoursePurchase) {
  if (!validPurchase(purchase)) return;
  const w = window as AnalyticsWindow;
  const once = (platform: string, send: () => void) => {
    const key = `bani-uk-ai-purchase:${platform}:${purchase.sessionId}`;
    try {
      if (localStorage.getItem(key)) return;
      send(); localStorage.setItem(key, 'queued');
    } catch { /* No persistent deduplication available: do not retry automatically. */ }
  };
  if (w.fbq) once('meta', () => w.fbq!('track', 'Purchase', { value: purchase.value, currency: 'GBP', content_name: 'Bani in UK cu AI - Fondator' }, { eventID: purchase.sessionId }));
  if (w.ttq) once('tiktok', () => w.ttq!.track('CompletePayment', { value: purchase.value, currency: 'GBP', content_id: 'bani-uk-ai-fondator', content_type: 'product' }, { event_id: purchase.sessionId }));
  once('dataLayer', () => { (w.dataLayer ||= []).push({ event: 'purchase', ecommerce: { transaction_id: purchase.sessionId, value: purchase.value, currency: 'GBP', items: [{ item_id: 'bani-uk-ai-fondator', item_name: 'Bani in UK cu AI - Fondator', price: purchase.value, quantity: 1 }] } }); });
}
