# Bani în UK cu AI

Route: `/bani-uk-ai/`. Content supplied in Google Doc `144u2ewV-0SztQE9wiwuNoxvnUP02xYHjw1Pm96r63rA` on 18 October 2026. Visual reference: the live proveitweb.co.uk theme, General Sans fonts, logo, colours, contact and company disclosures. No navigation menu; the header logo does not link away. Footer links are limited to contact and the existing legal policies.

## Payment link supplied

The owner supplied `https://buy.stripe.com/00wdR8gUP7548yvd7R4Ni1o` and confirmed that `DISC58` reduces £97 to £39. All purchase buttons now use this link with `prefilled_promo_code=DISC58`; the page also displays the code and asks customers to check the £39 total. No duplicate Stripe product or link was created. Browser checkout verification remains unavailable, so the discount, final total and account settings have not been independently verified.

Remaining Stripe account checks (the supplied URL replaces the need to create a new link):

1. Verify the supplied link belongs to Proveit and the intended live account.
2. Verify the course is a one-time purchase for **GBP 39.00 total after DISC58**, with no subscriptions, adjustable quantities or extra fees. Check that promotion codes are enabled and DISC58 remains valid for the founder offer.
3. Check that the Payment Link collects purchaser email and name, with one seat per purchase and a real limit of 100 completed purchases. Configure an appropriate sold-out response. Enforce the 1 November 2026 23:59 UK cutoff in Stripe as well: the page hides its buttons after that time but cannot deactivate a bookmarked Payment Link.
4. Present the course cancellation rights, digital-content access consent where relevant and guarantee terms at checkout. The existing general website terms are linked in the footer; do not assume that they contain the new course-specific provisions. Confirm purchase confirmation and delivery of session joining information. No enrollment or email automation has been implemented in this frontend.
5. Read back the product, currency, final amount, link, quantity and purchase limit, and verify the total in checkout. Never expose Stripe credentials in the frontend.

## Content decisions

- No invented personal earnings, testimonials, photos, screenshots or remaining-seat counter. Owner will provide proof later.
- £1,000/year is presented as a target rather than an evidenced minimum; keep this until real results support a more specific claim. The credit-check FAQ states that a separate account does not eliminate credit checks. Cashback points are distinguished from bank withdrawals.
- The source lists conflicting January prices. The page follows its introductory sequence: £79 at the January 2027 launch, then £97; founder price £39. No fabricated prior selling price is struck through.
- All four sessions are listed for Tuesdays 3, 10, 17 and 24 November 2026. The proposed 20:00 time is omitted because it is unconfirmed.
- The draft's 90-day guarantee is included, with the period measured from the first session, participation or recordings, applied steps and anonymized evidence. Confirm final course-specific checkout terms before enabling sales.
- No JamDoughnut referral link or invented partnership disclosure. If a referral link is added later, disclose the actual relationship.
- This is a public page and inherits the existing public-page Clarity recording boundary.

## Verification and deployment

Use `npx.cmd tsc --noEmit`, `node --test tests/*.test.cjs` and `npm.cmd run build`. Inspect the exported page at `out/bani-uk-ai/index.html`. Browser visual QA was unavailable because the in-app browser connection failed before opening a tab; mobile and desktop layout still need an actual browser review.

Deploy only through a GitHub push to `main` and the existing Azure Static Web Apps workflow, per AGENTS.md. This page has not been deployed.
