# Controlled attribution pilot: no campaign mail, no general rollout, no Google

Owner requested pilot preparation, including TikTok content metadata. This is
separate from the unfinished campaign staging/sending/unsubscribe/reporting work.
It does not authorize enabling those workflows, bulk sends or live audiences.

## Current safe state and checks

Frontend general `enabled` remains false. The previous frontend window expired
on 19 October 2026 at 18:35 UTC / 19:35 BST. Its digest and timestamps have been
cleared and `pilot.enabled` reset to false. The owner reports BE's pilot is
paused and Meta's control receipt is confirmed after a domain change. This
receipt does not establish browser/server deduplication. A fresh window awaits
a resumed, isolated BE fixture and a newly supplied valid token/expiry.
The raw token is not stored in tracked source. Browser acceptance remains pending.
Google consent, purchase and destination-
verified flags remain false. Server Google callback remains disabled. Existing
anonymous site pixels are unchanged; no new Google enrichment is enabled.

Read-only Azure configuration check on 19 October 2026 found:

- Email visit collection false, frontend-ready false, mode disabled.
- Dedicated Meta token, Graph version and test code are present.
- Dedicated TikTok access token and test code are present.
- Google master, audience and purchase flags are false.

Presence does not verify pixel permission, valid test codes or vendor receipts.
No secret values were printed, copied to files or placed in frontend settings.
No pilot request, email, platform event or database fixture has been created here.
BE reports its separately created fixture is cancelled, inactive and has zero
CRM contact matches; general collection remains off and both vendors are forced
to test mode. These are supplied backend diagnostics, not browser acceptance.

## Frontend pilot isolation implemented

`src/config/email-attribution.json` has a separate pilot gate. Once prepared,
it accepts only a token matching a pinned SHA-256 digest and a maximum 60-minute
window (preparedAt/expiresAt). General enabled stays false. Wrong/missing tokens,
disabled/expired/overlong pilot windows and conflicting general+pilot modes fail
closed before any attributed ViewContent or API request. Expiry clears memory
and pending retries. Effect remounts and retries preserve event IDs. Refusal and
protected-route behavior remain unchanged. Only the digest goes into config.

The frontend gate is isolation for normal clients, NOT server authorization:
users can modify frontend code. BE MUST also restrict collection/worker delivery
to the same synthetic fixture/token-bound outbox and expiry. A global test-mode
switch alone is insufficient because real-recipient data could still reach a
vendor test endpoint. Do not turn on general campaign/environment gates merely
to make this pilot work unless an equivalent server-side fixture allowlist is
demonstrably enforced first.

## BE work/request: synthetic fixture and backend isolation

Provide a short-lived 43-character token bound only to a synthetic, non-customer
fixture and the canonical campaign/template. Return its expiry and safe IDs for
the fixture/outbox and test readiness diagnostics. Do not use a real client's
email or phone. Use a non-deliverable example.invalid fixture email and no phone,
or another approved vendor test identity; do not claim identity match rates from
synthetic identifiers. Do not create a sendable/queued email to mint a token.

Use the existing token-issuance and binding validation code with a non-sendable
fixture/outbox state consistent with existing SQL constraints. No sender call,
SMTP call, Resend request or recipient sequence enrollment may occur. Scope
fixtures so a worker cannot accidentally pick them up as email jobs. Bind the
real template fingerprint/campaign correctly; do not bypass backend validation.

If no isolated pilot capability exists yet, implement it in LaunchingStack:
explicit pilot mode, fixture/outbox allowlist and hard expiry at BOTH intake and
worker delivery. Keep general rollout disabled. Only Meta/TikTok vendor test
delivery is permitted; missing or invalid test codes must block rather than fall
back to live. Keep fixture jobs clearly distinguishable from production metrics.
Return an independently verified `backendPilotIsolated` readiness result before
frontend arming. No such backend capability is claimed as already implemented.

## TikTok content metadata: frontend and backend parity

The website now adds these static properties to the attributed browser
ViewContent event, with the existing shared event_id. Source file copied into
the portable bundle: `api/shared/email-attribution-content.json`.

```json
{
  "content_type": "product",
  "content_ids": ["bani-uk-ai"],
  "contents": [{
    "content_id": "bani-uk-ai",
    "content_name": "Bani în UK cu AI – Ediția fondatorilor",
    "quantity": 1
  }],
  "quantity": 1,
  "description": "Bani în UK cu AI – Ediția fondatorilor"
}
```

BE must attach the same static course identity to TikTok Events API ViewContent
properties, adapting to the configured current API schema if necessary. Keep
content_id/content_ids semantically identical on both sides and event_id exactly
unchanged. Return the actual accepted vendor test payload/result so parity can
be checked. These identify the course, not the person or their financial status.
They do not assert a catalog match, purchase, revenue, bank bonus or pension case.
No currency/value/price is invented for a view. Meta remains ViewContent with
the existing ID and parameters; no new Purchase/Lead stream.

Do NOT add content metadata as new top-level fields to the public visit POST:
that endpoint rejects unknown fields. The browser metadata is static; BE derives
it from the fixed campaign/page configuration rather than trusting client fields.
Normalize/hash contact identifiers only in the backend as already implemented.

References: [TikTok standard events](https://ads.tiktok.com/help/article/standard-events-parameters?lang=en)
and [TikTok event/property examples](https://ads.tiktok.com/gateway/docs/index?doc_id=1701890973258754&language=ENGLISH).
The backend team must validate its own selected Events API version; this change
does not silently change their version or reuse a deprecated endpoint.

## Arming and rollback: no email send

After BE returns the real fixture token, expiry, isolation proof and vendor test
readiness, supply this envelope through stdin to
`node scripts/prepare-email-attribution-pilot.mjs` (default: dry-run only):

```json
{
  "token": "<BE-issued fixture token; never commit or put in argv>",
  "expiresAt": "<no later than BE expiry or 60 minutes from preparation>",
  "syntheticFixture": true,
  "backendMode": "test",
  "vendorTestReady": true,
  "backendPilotIsolated": true
}
```

These booleans are operator attestations backed by BE evidence, not proof inferred
from an HTTP 202 or a token. `--write` writes ONLY the public digest and pilot
window into frontend config and still leaves general/Google off. Deploy through
GitHub main, confirm the exact deployed hash/window, then open the token-bearing
URL manually in the owner-controlled browser. Do not send an email to perform
the pilot. Use the existing trusted backend redirect chain when available to
test redirect behavior; never print a bearer URL in ordinary logs.

Browser-side vendor testing should use official Events Manager test workflows.
Do not invent undocumented SDK test-code fields or claim browser events are in
test mode merely because BE has a test_event_code. Existing anonymous page
hits follow current site behavior. If complete separation from production pixel
activity is required, arrange a dedicated test data source first with the account
team; do not silently change production pixel IDs.

Run `node scripts/prepare-email-attribution-pilot.mjs --disable --write` and push
through GitHub to disarm explicitly after the pilot. The frontend automatically
expires regardless, but BE must also stop its pilot and expire/invalidate the
fixture token, cancel pending fixture jobs, and retain only approved diagnostics.
Do not alter the permanent audience snapshot or re-subscribe any contact.

## Evidence required from the real pilot

### Fresh-window coordination

1. BE resumes only the synthetic pilot and supplies the current token, UTC
   expiry and refreshed readiness diagnostics. Confirm the cancelled fixture,
   inactive template, zero CRM matches, pinned worker isolation and forced
   vendor test codes still apply. Keep general collection/campaign and Google off.
2. Reconfirm the approved landing origin and Meta dataset after the reported
   domain change; keep the query-free browser/server source URL consistent.
   Do not infer a new domain or change pixel IDs from the control receipt.
3. Arm the frontend using the existing stdin preparation command, a window of
   at most 60 minutes and no later than BE expiry. Allow time for GitHub deployment;
   verify the deployed digest and expiry before the owner opens the private link.
4. Record the first actual browser visit's shared ViewContent event ID. BE must
   return sanitized vendor receipts bearing that same ID and event name for
   the same dataset/pixel. Verify actual vendor deduplication separately for
   Meta and TikTok; a prior standalone server control event is not this evidence.
5. Keep results per platform (browser observed, server accepted, dedup verified
   or still pending). Do not mark the pilot complete while either dedup check
   is missing. Disarm the frontend and pause BE again after evidence collection.

Use two separate synthetic fixture tokens if refusal permanently withdraws the
first fixture. Do not override a withdrawal simply to continue testing.

1. ec removed before Clarity/pixels; response/referrer and ingress-log redaction
   verified. No token/contact value/hash in analytics, browser storage or response.
2. General false, Google false; only the allowlisted fixture generates a visit.
   A wrong/expired token creates no frontend attributed event. Backend rejects
   non-fixture bindings even if a caller bypasses the frontend gate.
3. One browser Meta/TikTok ViewContent, one durable visit, stable shared IDs;
   remount/duplicate POST does not inflate counts. Inspect TikTok content fields.
4. Both vendor test receipts/diagnostics and actual dedup behavior verified. HTTP
   acceptance or Pixel Helper alone is insufficient; no audience membership or
   human identity claim is made from test events.
5. Refusal uses the same IDs and no optional cookie identifiers, cancels pending
   fixture jobs; later retry cannot override withdrawal. Validate from backend
   diagnostics. Requests already in flight cannot be recalled.
6. Expiry/rollback stop collection and retry; unavailable SDK/API never blocks
   the page. No additional Google, Purchase, Lead, email send or live audience job.

Status remains PREPARED, NOT RUN until the backend fixture/isolation details and
real browser/vendor evidence are supplied. Campaign send readiness remains a
separate project and must not be inferred from a successful attribution pilot.
