# Google handover: JustProveIt implementation and activation checklist

Source: `launchingstack-google-backend-handover-2026-10-19.md` supplied by owner.
Deployment update: the owner subsequently confirmed backend source commit
`ee19c09fcb6409e52ca4f3899df04a683eff4f04`, workflow run 39272127868 and
migrations 133/134 applied on 19 October. This supersedes the source document's
earlier not-deployed status. Collection flags and campaign readiness are still
off; generic 202 responses do not prove persistence or vendor delivery.
This website change prepares integration; it does NOT enable customer uploads,
create Google audiences, configure account actions or send the email campaign.

Backend review correction completed: Google refusals are now retained in memory
and POSTed even when browser storage or the vendor SDK throws. A stale disk
grant cannot override an in-memory denial. Network/non-202 failures reject and
emit no server-acceptance event, so the UI does not report success. Dedicated
tests cover blocked storage, quota failure, offline/503 and SDK failure.

## Implemented here

- An inline early document script captures one valid 43-character base64url `ec`
  token on `/bani-uk-ai/` into memory, strips every `ec` query parameter on every
  route before hydrated analytics starts, and retains other UTMs/hash. Invalid,
  duplicate and protected-route tokens are not used. The sales route sends
  Referrer-Policy no-referrer. No email, phone or hash is returned to the browser.
- Separate Google choices: ad user data and ad personalization, both initially
  unchecked. Existing anonymous Meta/TikTok/Google advertising behavior remains
  unchanged. Local Google preference is a separate, versioned record, not an
  inference from the existing default-on pixel setting. It expires after 180d.
- Conditional consent UI only for a token-bearing sales-page visit and only
  after `customerDataConsentEnabled` is enabled. It POSTs the exact token,
  `adUserData`, `adPersonalization`, `version=google-customer-data-v1`, and ISO `at`
  to the documented LaunchingStack public endpoint, asynchronously with timeout.
  Only generic 202 is acknowledged. Failure offers retry, not a success claim.
  A recorded local refusal cannot be publicly promoted back to a grant; the
  backend independently enforces permanent refusal/verified re-consent rules.
- Google browser conversion is gated by separately enabled and verified action
  configuration, real server-verified checkout result, both explicit choices and
  no current advertising opt-out. The transaction ID is exactly lowercase hex
  SHA256(UTF8(`google-purchase:` + Stripe checkout session ID)). Actual value,
  including a legitimate £0 checkout, is used. Existing Meta/TikTok IDs unchanged.
  Local/per-document queue markers prevent routine repeat queuing; they do not
  prove delivery. No raw CRM identifiers are sent by the browser.
  The verified Google destination is initialized with send_page_view false and
  no explicit page_view. Google Ads may still produce native hits; verify these
  in the pilot. The checkout session URL has already been cleaned before loading.
- Independent signed Stripe callback route below, isolated from welcome email
  fulfillment. Callback outages do not cause course-email handler retries.

## Defaults: all uploads/conversions off

`src/config/google-advertising.json`:

```json
{
  "customerDataConsentEnabled": false,
  "purchaseEnabled": false,
  "purchaseDestinationVerified": false,
  "customerId": "1424642598",
  "purchaseSendTo": "AW-17883073327/k4UsCLO2tqIdEK-WqM9C",
  "consentEndpoint": "https://launchingstack-func-dev.azurewebsites.net/api/justproveit/public/google-advertising-consent"
}
```

Public endpoints are deployed. Live non-mutating OPTIONS checks confirmed 204,
www.justproveit.co.uk origin and POST for both consent and visits. No actual
token was submitted and no collector was enabled. Do not place function keys in
this JSON. Backend flags remain false; no callback producer is registered.

The supplied destination is now configured; browser verification remains false.
Google audience 9490685374 and purchase action 7856823091 are configured in the
backend according to the deployment handoff. Do not alter unrelated
AW-11386018124 or derive a tag from customer ID 1424642598. Keep PURCHASE_TAG_READY false in
LaunchingStack until an owner-authorized real browser test proves that action,
actual amount and shared transaction ID. Browser and backend event deduplication
must be verified in Google diagnostics before production activation.

## Independent purchase callback

New URL: `https://www.justproveit.co.uk/api/bani-uk-ai/google-purchases`.
This is a SECOND Stripe webhook subscription for the course, not a replacement
for `/api/bani-uk-ai/webhook` (welcome onboarding). Do not register it yet.

The callback verifies Stripe's raw-body signature against a dedicated signing
secret, permits only completed/async-paid course-link events, then forwards only
`{"stripeEventId":"evt_..."}` with a server-only function key to
`https://launchingstack-func-dev.azurewebsites.net/api/justproveit/internal/google-course-purchases`.
LaunchingStack independently verifies event/session/payment/consent. No browser
endpoint can create a purchase. A bounded upstream call returns 503 on failure;
Stripe's independent durable webhook retries provide transport retry without
touching onboarding. Existing LaunchingStack durable unique jobs provide vendor
retry/dedup after acceptance. A 2xx backend response is treated as accepted;
please confirm this response contract before registering the subscription.

Managed API runtime settings:

- `BANI_UK_AI_GOOGLE_CALLBACK_ENABLED=false`
- `BANI_UK_AI_GOOGLE_CALLBACK_KEY`: dedicated least-privileged function key for
  the LaunchingStack internal route, now installed and read-back verified in
  protected website server settings. Retrieved directly through Azure from the
  named `bani-uk-ai-google-purchases` key on `googleCoursePurchase`; the sibling
  repository's private handoff file was not read. Values were never logged,
  committed, placed in browser config or included in the integration bundle.
- `BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET`: signing secret for the new Stripe
  subscription, distinct from the onboarding subscription secret.

Set the switch true only when migrations and backend route are ready, configure
keys in Azure app settings, then create the separate Stripe subscription for
`checkout.session.completed` / `checkout.session.async_payment_succeeded` using
the Proveit account. Do not change or duplicate the onboarding subscription.
Confirm retry window/receipt behavior with the backend. After Stripe's retry
window expires, recover by authorized event replay rather than silently dropping
or repeatedly manufacturing an event. The callback key is configured, but no
Stripe subscription/signing secret was created, the callback stays disabled,
and no old events were replayed or uploaded.

## Required return from LaunchingStack/account team

1. Deployed build and migrations are reported complete; now confirm coordinated
   collection-only activation through the tenant-admin readiness endpoint.
2. Confirm public consent endpoint/CORS and internal callback success contract.
3. A valid non-PII test token, with actual permitted test association and expiry.
4. IDs and OAuth configuration are reported provisioned. Terms flag is still
   false; Google destination permissions/validateOnly and browser receipt/action
   verification remain outstanding before any activation.
5. The Meta/TikTok visit contract has now been supplied and implemented in
   `src/lib/emailCampaignVisit.ts`, controlled by the separate disabled
   `src/config/email-attribution.json` switch. See
   `email-attribution-coordinated-readiness.md` for details and pilot gates.
   Consent POST and visit POST remain separate; neither generic 202 proves a job.

Frontend source can now be deployed dormant. Do not put `ec` links into a live
campaign until actual visit registration/token contract and consent integration
have passed together. Early token cleanup deliberately does not invent visits,
look up contacts, merge accounts or claim that forwarded links verify identity.

## Verification

`node --test tests/google-advertising-handoff.test.cjs tests/bani-uk-ai-onboarding.test.cjs tests/advertising-pixels.test.cjs tests/clarity.test.cjs`
checks early cleanup, protected paths, duplicate/invalid tokens, explicit choice
gates, transaction hash agreement, disabled/unverified destinations, public
refusal protection, callback signature/disable behavior and existing fulfillment.
`npm run build` validates the document and frontend types/static export.

Still required: backend validateOnly run, browser receipt/action diagnostics,
independent callback recovery test and owner-approved end-to-end pilot. Automated
tests do not create live platform events or evidence of real audience membership.
