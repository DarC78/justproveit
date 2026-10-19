# Google customer matching and verified course purchases

Prepared backend source, not deployed or enabled. Migration 134 has NOT been applied. No Google uploads, audience creation or campaign changes have occurred. This document supersedes the original Google-off restriction in the email visit handoff. Google delivery has independent switches and consent; Meta/TikTok behavior is unchanged.

Account confirmed by owner: **142-464-2598** (environment value `1424642598`). Campaign `CRM_PROMO_BANI_UK_AI_1`. The owner sees `JPI | Bani UK AI | Visitors | 30d`; its type and ID are not yet verified. Do not assume a website visitor audience is a Customer Match list. Check Audience Manager and identify/create a separate customer list, suggested name `JPI | Bani UK AI | CRM Email Visitors`.

## Activation dependencies

1. Google Cloud project with Data Manager API enabled. The backend supports OAuth client ID/secret/refresh token authorized for `https://www.googleapis.com/auth/datamanager` by a user with access to the Ads account. Gmail authorization does not grant this access. Provision secrets directly in protected backend configuration, never chat or tracked files. Account manager ID is optional if authorization uses a manager account.
2. Eligible Customer Match list ID and accepted Customer Match terms in the account. The backend does not create lists or accept account terms on the owner's behalf.
3. Website purchase conversion action ID and browser conversion label for account 1424642598. Inspect existing actions before creating another. The existing website tag `AW-11386018124` is not this customer ID and must be checked against the intended destination; do not silently reuse it.
4. Frontend agent implements affirmative Google customer-data choice, purchase tag and server callback below, then validates them together with the backend.

Google references: [API access](https://developers.google.com/data-manager/api/devguides/quickstart/set-up-access), [Customer Match ingestion](https://developers.google.com/data-manager/api/devguides/audiences/send-audience-members), [online purchase matching](https://developers.google.com/data-manager/api/devguides/events/google-ads/online/send-events).

## Backend setup

Apply migrations 133 then 134 through the normal deployment process. Nothing in this change executes migrations automatically. Configure these non-secret settings initially:

```text
JUSTPROVEIT_GOOGLE_ADS_ENABLED=false
JUSTPROVEIT_GOOGLE_ADS_MODE=validate
JUSTPROVEIT_GOOGLE_ADS_CUSTOMER_ID=1424642598
JUSTPROVEIT_GOOGLE_ADS_LOGIN_CUSTOMER_ID=<optional manager ID>
JUSTPROVEIT_GOOGLE_ADS_AUDIENCE_ID=<customer list numeric ID>
JUSTPROVEIT_GOOGLE_ADS_PURCHASE_ACTION_ID=<website conversion action numeric ID>
JUSTPROVEIT_GOOGLE_AUDIENCE_ENABLED=false
JUSTPROVEIT_GOOGLE_PURCHASES_ENABLED=false
JUSTPROVEIT_GOOGLE_CUSTOMER_TERMS_ACCEPTED=false
JUSTPROVEIT_GOOGLE_PURCHASE_TAG_READY=false
JUSTPROVEIT_BANI_UK_AI_STRIPE_TEST_MODE=false
```

Secret settings: `JUSTPROVEIT_GOOGLE_ADS_CLIENT_ID`, `JUSTPROVEIT_GOOGLE_ADS_CLIENT_SECRET`, `JUSTPROVEIT_GOOGLE_ADS_REFRESH_TOKEN`, and dedicated course `JUSTPROVEIT_BANI_UK_AI_STRIPE_SECRET_KEY`. Never use another product's Stripe credentials.

Enable selected features in **validate** mode first: requests use Google's `validateOnly`, upload no members/events and terminate as `Validated`. After review and successful frontend checks, switch to **live**. Validate jobs and live jobs have distinct uniqueness keys. Website visit candidates cover the preceding 24 hours only, not an automatic historical CRM upload. Pending validation purchase jobs are not automatically replayed live: re-submit the same verified Stripe event ID after activation if appropriate.

## Frontend agent contract

Keep the anonymous pixel behavior requested by the owner. For Google CRM matching, collect actual choices for **ad user data** and **ad personalization**; defaults, email-token possession and the existing default-granted tag settings are insufficient. Both choices must be `granted` before an upload. Do not add email or phone to browser code.

Use the existing early capture/removal of `ec` from the email visit handoff. After an actual choice, POST JSON to `/api/justproveit/public/google-advertising-consent`:

```json
{"token":"<43-character ec token>","adUserData":"granted","adPersonalization":"granted","version":"google-customer-data-v1","at":"<current ISO timestamp>"}
```

Choices: `unknown`, `granted`, `denied`. Only www/apex justproveit origins allowed, bounded JSON, token expiry and purpose checked, 30 requests/token/minute. Generic 202 reveals no CRM membership. 503 requires retry. A recorded refusal cannot be overwritten by public-token grants; an authenticated admin must record subsequent verified re-consent. Tokens attribute to the original email recipient, including forwarded links, as instructed by the owner; they do not prove the visitor's identity.

The Customer Match worker scans eligible campaign visits separately from Meta/TikTok; recognized scanner user agents and bot-suppressed messages are excluded. Jobs store hashed identifiers only. Email uses Google's Gmail dot normalization; phone requires canonical E.164 and no guessed country. Current consent, sharing refusal and marketing suppressions are checked immediately before upload.

For purchases, send the real browser Google Ads purchase conversion to the verified action and label with the actual GBP value and transaction ID:

```text
SHA256_UTF8_HEX("google-purchase:" + stripeCheckoutSessionId)
```

Use exactly the same ID in Google browser and server events. Do not change existing Meta/TikTok event IDs. Google server events enrich verified purchases, never turn email visits into purchases. Mark `PURCHASE_TAG_READY=true` only after the browser event, destination and shared transaction ID have been verified.

In the signed Stripe webhook, for `checkout.session.completed` or `checkout.session.async_payment_succeeded`, enqueue/retry a server-only call to `/api/justproveit/internal/google-course-purchases` with `x-functions-key` and JSON `{"stripeEventId":"evt_..."}`. Keep the key off the browser. Retry delivery independently of fulfillment so a backend outage does not repeat course delivery or payment emails. The backend independently retrieves the event and session from Stripe, checks course payment link `plink_1URr5mCtvr7Xjh2glmk6zJmm`, paid/valid-free status, GBP, mode and event age. Browser-supplied email, value and payment status are never trusted. Test purchases cannot enter live Google delivery.

Purchases match consent by the verified checkout email; a different checkout email requires its own recorded consent. The existing email token is not an account merge.

## Operations

Tenant-admin GET `/api/justproveit/admin/google-advertising` returns configuration readiness and safe outbox diagnostics. POST `/api/justproveit/admin/google-advertising/consent` with `email`, `adUserData`, `adPersonalization`, and `source` (reference to real recorded evidence) records consent; never fabricate consent to populate an audience.

Durable unique jobs, leases and stable purchase transaction IDs prevent routine duplicate sends. A receipt means `Accepted`, not completed; poll status rather than re-uploading. Statuses distinguish `Validated`, `Completed`, `Partial`, `Blocked` and `Indeterminate`. Six send attempts maximum; unresolved receipt polling stops after 30 polls or 24h for manual review. No raw Google/Stripe responses or identifiers appear in logs/diagnostics. OAuth tokens stay in process memory.

When a previously uploaded audience member loses permission, the live worker queues removal using the exact original identifier/account/list snapshot. Deletion does not require renewed consent and continues when the audience-add feature is off, provided the global worker remains enabled in live mode for that account. Keep credentials active during withdrawal processing. Completed removals are not automatically reversed upon re-consent; a new eligible visit may create a new addition. Purchases are not retracted by audience-removal jobs. Protected outbox hashes remain personal data: apply the application's database access and retention policies.

Verification: `node --test src/googleAdvertising.test.js` and `node scripts/test-google-advertising-sql.mjs --run` (opt-in, session-local temporary tables, rollback; no persistent schema/data changes). Live API authorization and browser-to-server matching remain activation checks.
