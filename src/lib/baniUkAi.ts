// Owner-supplied Proveit Payment Link: £97 less the DISC58 promotion (£58).
// Never reuse a checkout for another course or accept a URL from query parameters.
export const BANI_UK_AI_CHECKOUT_URL = "https://buy.stripe.com/00wdR8gUP7548yvd7R4Ni1o?prefilled_promo_code=DISC58";
export const BANI_UK_AI_DEADLINE = "2026-11-01T23:59:59Z";

export function courseCheckoutUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "buy.stripe.com" ? url.href : null;
  } catch {
    return null;
  }
}
