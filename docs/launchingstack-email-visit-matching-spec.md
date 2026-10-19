# Email visits: asynchronous lead matching for advertising events

Addendum to `launchingstack-bani-uk-ai-campaign-spec.md`, 19 October 2026.
Status: proposed integration contract, NOT enabled. No audience upload, event
delivery, API credential change or email send is performed by this document.

Google implementation update: see `google-advertising-frontend-readiness.md`
and the supplied `launchingstack-google-backend-handover-2026-10-19.md`.
Google frontend preparation now exists with all delivery switches off. The
general Meta/TikTok contract was subsequently supplied and is implemented behind
a separate disabled frontend switch. The original explicit-only policy proposal
below is superseded by the owner's later not-denied backend policy; frontend
reports actual choice/unknown and never invents customer-data permission. See
`email-attribution-coordinated-readiness.md` for the current integration state.

## Desired behavior

A person follows the Bani UK AI campaign CTA. The page displays immediately.
A background request associates the visit with the campaign message, resolves
the associated lead in the database, and queues an eligible server-side event
for advertising matching. No name, email or phone is returned to the browser.

Use Meta Conversions API and TikTok Events API with advanced matching, rather
than exposing contact details to browser pixels. Normalize and SHA-256 hash
supported contact identifiers using each platform's exact rules/SDK. Email and
phone are the initial match fields. Include names only where supported, necessary
and permitted; do not send an arbitrary full-name field to every platform.
Hashing does not make personal data anonymous or remove consent requirements.

Google is a separate integration: enhanced conversions associate eligible real
conversion events with customer data, not a general way to force email visitors
into remarketing lists. Do not send fabricated Lead/Purchase conversions for
page visits. Evaluate Customer Match/eligible Google audience products only
after checking account eligibility, first-party data rules and consent. Keep
Google enrichment disabled until that integration is configured and approved.

## Responsibility split and prerequisites

LaunchingStack: message-bound tokens, CRM resolution, consent enforcement,
queue/outbox, platform API adapters and delivery diagnostics. Reuse existing
`app.MetaEventDeliveries` and `app.TikTokEventDeliveries` if compatible; inspect
their implementations/schema before creating another event pipeline.

JustProveIt follow-up: early token capture and URL cleanup, asynchronous visit
request, shared browser/server event IDs and explicit advertising-data-sharing
consent signal. This addendum is not an assertion that frontend code is deployed.
Return the implemented API contract and configured endpoint to this repository
before enabling the frontend integration. Preserve existing anonymous pixel
behavior and protected-page boundaries; never infer new data-sharing permission
from the current default-on advertising rollout.

## Token and navigation contract

Generate an opaque, high-entropy token for each campaign message (or signed,
authenticated equivalent). Bind it server-side to tenant, campaign-recipient,
template/version and outbox ID; store its digest, expiry and purpose. It confers
attribution only, never account access, purchaser status or CRM read access.
Do not encode plaintext name/email/phone in UTM parameters, URLs or tokens.

The main CTA needs this message-specific token. The current shared `/r?id=...`
redirect ignores attribution parameters; simply appending a token will NOT
implement matching. Extend the LaunchingStack tracked click route to attach an
opaque landing token only to the approved sales destination. Its destination
must come from the campaign's allowlist, never caller-supplied arbitrary URLs.
Unsubscribe and external social/Trustpilot/WhatsApp links must not expose this
token. A recorded email click by itself is not a website visit.

Proposed landing contract: `/bani-uk-ai/?ec=<opaque-token>` plus normal UTMs.
Before any advertising/Clarity script or page-view dispatch, JustProveIt must
capture `ec` in memory and remove it using history.replaceState. Do not write it
into localStorage, logs, analytics page URLs or third-party referrers. Implement
no-referrer for the landing request and exclude this parameter from access logs
where possible. Token expiry and the capture/cleanup behavior must be agreed
before LaunchingStack sends token-bearing links. Until then use normal links.

A forwarded email identifies the original recipient's message, NOT necessarily
the current visitor. Treat this as attributed-lead evidence, not verified visitor
identity; never auto-login, show personal details or permanently merge anonymous
browser history into that contact. Use a verified account/form identity when
available, and define a conservative forwarded-link policy before sharing CRM
identifiers. Consent does not prove the person is the original recipient.

## Proposed backend API

POST `/justproveit/public/email-campaign-visits` on LaunchingStack, optionally
exposed by a same-origin JustProveIt proxy after the team confirms the route.
Use HTTPS, rate limiting, strict body size limits and an origin allowlist.
Origin/CORS alone is not authentication; validate the attribution token and its
bindings on the server. Never accept arbitrary email, phone, contact ID, pixel
ID or platform token from a public request.

Request fields:

- `token`: opaque landing token.
- `visitId`: random UUID per actual visit; stable across retries.
- `eventId`: shared random browser/server ID, if browser event dedup is enabled.
- `pagePath`: allowlisted `/bani-uk-ai/` only; strip query and fragments.
- `consent`: version, explicit user choice, time and allowed purposes.
- Optional existing platform browser/click identifiers only when permitted.

Server looks up tenant/pixel configuration and message association itself. Read
IP/user-agent from the trusted request/proxy chain when needed; do not trust
caller-supplied IPs. Browser identifiers and IP/user-agent are not hashed with
the same rules as contact email/phone. Follow the relevant platform schema.

Perform bounded validation and persist a lightweight job; return generic 202
without waiting on CRM joins or vendor requests. Response contains an opaque
receipt/accepted flag only, never contact data, hashes, existence details or
secrets. Use uniform responses for invalid/unknown token cases where practical;
do not expose a contact enumeration API. Worker resolves identity and consent,
normalizes supported fields and submits events asynchronously. A slow/failed
vendor never blocks page rendering, scrolling, checkout or WhatsApp buttons.
Frontend must not wait for the request before showing content. Request failures
are quiet and bounded, with no synchronous retries or disruptive error banner.

## Consent and event semantics

Email marketing subscription, a link click, snapshot membership, default-on
anonymous pixels and identity-sharing consent are different things. Use recorded
permission for advertising customer-data sharing where required by the platform
and applicable policy. Unknown/denied permission means no enriched platform send.
The public body is a user-choice signal, not authority to override a stored
withdrawal. Recheck current consent and suppression in the worker immediately
before vendor delivery; cancel pending jobs on withdrawal. Keep necessary email
delivery and transactional onboarding independent.

Associate the real page visit with a supported page/content-view event. Never
invent a purchase, lead submission, bank-account opening or financial result.
Do not send pension/financial case details, balances, eligibility decisions,
purchase tokens or other sensitive CRM content as event parameters.

Meta pixel `674835348003619`, TikTok pixel `CLLIILJC77UBIO8OFG1G` and Google Ads
`AW-11386018124` are known website IDs, not sufficient server API credentials.
Server access tokens, account permissions and test-event configuration must be
verified/configured by LaunchingStack; none belong in frontend environment vars.

Browser and server copies of the SAME event must use platform-compatible event
name + event ID deduplication. Current anonymous page views lack this integration;
do not enable a second PageView stream until dedup behavior is verified. Persist
unique tenant/platform/visit/event keys, attempt counts and vendor receipts.
Rate-limit replayed tokens but support legitimate later visits with distinct
visit IDs; distinguish network retries from new visits. Never claim a match or
audience membership merely because the API accepted an event.

## Reporting and acceptance

Report campaign/message -> attributed visit -> platform delivery status, field
availability and eligibility/exclusion reason. Keep raw contact values out of
ordinary application logs and admin diagnostics. Hashes remain protected data.
Existing campaign open/click metrics remain separate from visits and platform
matching. Exclude known email-security scanners and bots where identifiable;
browser execution alone does not prove a human visit.

Acceptance before enabling:

1. Real per-message CTA token resolves only its own tenant/message; invalid,
   expired, replayed and forged bindings expose no CRM details.
2. Token is removed before any vendor sees page location/referrer; no raw or
   hashed CRM identifier appears in HTML, browser storage, URL or response.
3. Absent/denied/revoked identity-sharing permission produces no enriched send;
   a queued job respects a later withdrawal before vendor delivery.
4. Explicitly permitted matching uses valid normalized hashes, correct tenant
   credentials, real view events and tested browser/server deduplication.
5. API/vendor outage leaves the page fully usable; worker retries do not inflate
   visit/event counts. Forwarded-link policy is tested and documented.
6. Admin/login/private report/thank-you routes never trigger this enrichment.
7. Owner-approved pilot in vendor test mode confirms field receipt and dedup;
   no fabricated live engagement and no automatic campaign launch.

## Primary references

- [Meta official Business SDK: CAPI normalization and hashing](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/README.md)
- [TikTok advanced matching](https://ads.us.tiktok.com/resources/help/article/advanced-matching-web?redirected=2)
- [Google enhanced conversions](https://support.google.com/google-ads/answer/9888656)
- [Google customer data policies](https://business.google.com/en-all/accelerate/resources/articles/customer-data-policies/)
