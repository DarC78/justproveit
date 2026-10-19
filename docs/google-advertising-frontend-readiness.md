# Google handover: JustProveIt implementation and activation checklist

Source: `launchingstack-google-backend-handover-2026-10-19.md` supplied by owner.
The source explicitly says backend not deployed, migrations 133/134 not applied.
This website change prepares integration; it does NOT enable customer uploads,
create Google audiences, configure account actions or send the email campaign.

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
  "purchaseSendTo": null,
  "consentEndpoint": "https://launchingstack-func-dev.azurewebsites.net/api/justproveit/public/google-advertising-consent"
}
```

The endpoint is taken from the handover, not a claim that it is deployed. The
browser sends Origin www/apex justproveit; backend CORS must support POST and the
Content-Type preflight from both. Do not place function keys in this JSON.

Fill purchaseSendTo only after the Ads team verifies the correct `AW-.../label`
destination belongs to the intended account/action. Never derive it from customer
ID 1424642598 or silently reuse AW-11386018124. Keep PURCHASE_TAG_READY false in
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

Managed API runtime settings (initially absent/off):

- `BANI_UK_AI_GOOGLE_CALLBACK_ENABLED=false`
- `BANI_UK_AI_GOOGLE_CALLBACK_KEY`: dedicated least-privileged function key for
  the LaunchingStack internal route, provisioned directly in protected settings.
- `BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET`: signing secret for the new Stripe
  subscription, distinct from the onboarding subscription secret.

Set the switch true only when migrations and backend route are ready, configure
keys in Azure app settings, then create the separate Stripe subscription for
`checkout.session.completed` / `checkout.session.async_payment_succeeded` using
the Proveit account. Do not change or duplicate the onboarding subscription.
Confirm retry window/receipt behavior with the backend. After Stripe's retry
window expires, recover by authorized event replay rather than silently dropping
or repeatedly manufacturing an event. No subscription or secrets were configured
by this website change. No old events were replayed or uploaded.

## Required return from LaunchingStack/account team

1. Deployed build and successful migrations 133 then 134; enabled/disabled state
   reported through their tenant-admin readiness endpoint.
2. Confirm public consent endpoint/CORS and internal callback success contract.
3. A valid non-PII test token, with actual permitted test association and expiry.
4. Verified Google customer-list numeric ID/type, accepted terms, account OAuth
   configuration, and exact website purchase action + browser AW/label.
5. Original Meta/TikTok email-visit API handover (this Google-only document does
   not specify the earlier visit endpoint/body/token issuance details). Consent
   POST alone is not a campaign visit and must not be counted as one. General
   email-visit matching remains unconnected until that contract is supplied.

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
