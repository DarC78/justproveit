# Bani UK AI: checkout return and onboarding

## Activation status

The website and managed API have been deployed through GitHub. The dedicated
Proveit Stripe webhook, success redirect and native 100-completion limit have
been activated. Runtime credentials are configured in Azure app settings.
The isolated founder table has been created and its read access verified.
The live signed webhook accepted and ignored a non-payment integration test;
no payment, buyer or conversion was fabricated. Live checks passed for noindex,
the exact calendar bytes, cancellation download, capacity, invalid checkout IDs,
unsigned webhook rejection and all 11 branded redirects. Account-side receipt
settings, actual payment/refund testing and mobile calendar import remain the
owner's operational checks below.

## Delivered in this repository

- `/bani-uk-ai-multumim/`: public instructions, shared legal footer, portrait,
  WhatsApp group, preparation, safety, 90-day guarantee and cancellation text.
- Time confirmed by owner: 20:00–21:30, Europe/London, 3/10/17/24 November 2026.
  Zoom is intentionally sent later. `api/shared/bani-uk-ai-course.json` is the
  content source, including the owner-provided group invitation.
- `/bani-uk-ai-sesiuni.ics`: four recurring-cohort events, stable UIDs, explicit
  VTIMEZONE and one-hour VALARMs, folded at 75 UTF-8 octets. Google Calendar
  button creates session one; the .ics contains all four.
- `/api/bani-uk-ai/verify` accepts POST `{sessionId}` and retrieves the session
  server-side. Only the exact Proveit Payment Link, live, complete, paid, positive
  integer GBP amounts qualify. It returns the real paid amount and email status;
  never customer details or the Stripe object. Responses are non-cacheable.
- `/api/bani-uk-ai/webhook`: signed raw-body Stripe events, 300-second tolerance,
  live session re-verification. Handles completed and async-payment-succeeded.
  Unpaid sessions and other Payment Links never send onboarding.
- A separate `BaniUkAiFounders` Azure Table, partition `FondatoriBaniUkAi`, stores
  each paid buyer/session once, email status and amount. Atomic creation/ETags
  and a short lease prevent concurrent sends. Resend uses a stable session-based
  idempotency key. Ambiguous unsent attempts older than 23 hours require manual
  reconciliation against Resend before retry, rather than risking duplicate mail.
- `api/shared/baniUkAiEmail.js` renders transactional HTML/text with the .ics
  attachment, exact amount, first name/fallback, fixed signature and legal footer.
  Uses the existing verified Resend sender and requested reply-to. The shared
  branded link rewriter now serves both the promotional and onboarding emails.
- Stripe's native 100-completion restriction blocks further checkout completions.
  The webhook also deactivates the link at the limit. Capacity API updates the
  sales page; exhausted enrollment offers an email-based January waitlist request.
  It does not automatically create an email-marketing subscription.

## Tracking and privacy boundaries

The thank-you route is excluded from Clarity and generic advertising page views.
The checkout session query is removed from the address before advertising SDKs
can load, and the page sets no-referrer/noindex/nofollow in HTML and SWA headers.
Only a server-verified purchase enables Meta/TikTok purchase queues. The original
advertising choice/opt-out is respected. Google Ads is not loaded on this page,
avoiding its automatic page view of a checkout reference.

Meta `Purchase` and TikTok `CompletePayment` use the verified amount and session
event ID. `dataLayer` receives ecommerce `purchase` with the transaction ID and
line item. A per-vendor localStorage marker prevents repeat queuing in the same
browser; event IDs support platform-side deduplication. This is not a global
cross-browser exactly-once guarantee. Queueing is not proof of vendor receipt.

There is no GA4 measurement ID or GTM container configured on this website.
Pushing `purchase` to dataLayer prepares the event; it does NOT send it to GA4
or create a Google Ads purchase conversion. Obtain the GA4 ID/GTM container and,
for Ads, the purchase conversion label before enabling those destinations.

IMPORTANT: the original brief's audience assumption was incorrect. URL contains
`justproveit.co.uk/bani-uk-ai` matches the thank-you route too. Replace the Google
audience condition with an exact sales pathname (both slash variants), or a
supported anchored URL rule, and exclude verified purchasers using a separate
purchase audience once configured. Apply equivalent Meta/TikTok audience rules.
The website stops generic thank-you page views, but cannot edit ad-account rules.

## Activation and runtime configuration

Code deploys ONLY by GitHub main/SWA workflow. Run the configuration script
without `-Activate` first to populate the managed API's course-specific Stripe,
Resend and storage settings. Credentials are reused from the existing integration
in memory; nothing is logged or written into files/CLI arguments.

After GitHub deployment and live checks, run
`scripts/configure-bani-uk-ai-onboarding.ps1 -Activate` to register the dedicated
Stripe webhook, save its signing secret, set the Payment Link redirect to
`https://www.justproveit.co.uk/bani-uk-ai-multumim/?session_id={CHECKOUT_SESSION_ID}`,
set its native 100-session limit and include cancellation information at checkout.
Rerunning activation reuses the existing webhook; missing signing secret requires
recovery rather than silently creating duplicate webhooks. It does not change
unrelated Stripe webhook endpoints or external repository code.

`BANI_UK_AI_STRIPE_SECRET_KEY`, `BANI_UK_AI_RESEND_API_KEY`,
`BANI_UK_AI_STORAGE_CONNECTION`, `BANI_UK_AI_WEBHOOK_SECRET` are runtime only.
The Azure Table is the private course/reminder list, not an additional general
marketing subscription. Access it with authorized administrative tooling only.

## Cancellation text

The owner requested drafting this text. It provides a clear 14-day cancellation
route and refund terms, plus a downloadable cancellation form, without claiming
an immediate-digital-access waiver was collected. No waiver checkbox is invented
or enabled in checkout. The 90-day guarantee remains separate from statutory
rights. Reference: [UK consumer-contract regulations](https://www.legislation.gov.uk/uksi/2013/3134/part/3/made).
This is new merchant wording, not a claim that a lawyer has approved the text.

## Remaining operational checks

- In Stripe Dashboard, Settings → Customer emails → Successful payments, verify
  receipts are enabled for Proveit. The public account API does not expose a
  supported toggle here; the activation script does not claim to enable it.
- A real payment and later refund requires an owner-run test with their payment
  method; no card payment is created by this implementation's automated tests.
- Verify the email attachment opens in iPhone/Android/Outlook and verify live
  Purchase/CompletePayment delivery in the ad accounts. Browser control is
  unavailable in this session, so these checks are not claimed as completed.
- Add the Zoom link before reminder dispatch; update recording links after live
  sessions. See the reminders worker spec below. Those emails are prepared,
  not yet scheduled by the static website or managed HTTP Functions.

## Local checks

`node scripts/render-bani-uk-ai-onboarding.mjs` generates calendar and email preview.
`node --test tests/bani-uk-ai-onboarding.test.cjs tests/advertising-pixels.test.cjs tests/clarity.test.cjs tests/bani-uk-ai.test.cjs tests/proveit-email-links.test.mjs tests/proveit-email-subject.test.mjs`
checks payment gating, signatures, concurrency, durable email idempotency,
calendar durations/folding, purchase payloads/deduplication, protected boundaries
and branded links. `npm run build` validates the static frontend.
