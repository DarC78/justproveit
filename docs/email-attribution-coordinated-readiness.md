# Email visit attribution: current integration readiness

Backend handover supplied by owner, 19 October 2026: commit
`ee19c09fcb6409e52ca4f3899df04a683eff4f04`, workflow
[39272127868](https://github.com/DarC78/LaunchingStack/actions/runs/39272127868).
Migrations 133/134 are reported applied; handlers/workers are deployed. All new
collection/delivery switches remain off. No campaign or vendor event was sent.

Controlled pilot preparation: see `launchingstack-email-attribution-pilot-spec.md`.
The frontend now has a separate digest-pinned, expiring pilot gate (off pending
BE fixture token/isolation readiness) and static TikTok course content metadata.
General rollout and all new Google features remain disabled. The public visit
body is unchanged; BE must mirror the TikTok metadata in its vendor adapter.

Backend review follow-up: the requested Google storage-failure correction is
implemented with in-memory refusal protection and independent POST delivery.
The dedicated callback key was installed directly from Azure into the website's
protected server settings and verified; callback enabled remains false. No
sibling repository private file was read. No Stripe producer was registered.

## Implemented in JustProveIt

`src/config/email-attribution.json` deliberately has `enabled: false`, campaign
`CRM_PROMO_BANI_UK_AI_1` and the deployed endpoint
`https://launchingstack-func-dev.azurewebsites.net/api/justproveit/public/email-campaign-visits`.
Google consent/purchases have separate disabled switches; the supplied purchase
destination is configured as `AW-17883073327/k4UsCLO2tqIdEK-WqM9C`. Unrelated
AW-11386018124 is unchanged. Browser verification remains false.

The inline head script captures one valid 43-character ec token only on the
HTTPS www/apex sales route, in memory, with two lowercase random UUIDs: visitId
and eventId. ALL ec query values are removed before hydrated Clarity/pixels,
including invalid/duplicate tokens and protected routes. UTMs remain. The sales
response sends Referrer-Policy no-referrer. No token goes to cookies/storage or
analytics. Optional ttclid remains in memory. Edge/access-log redaction is still
an infrastructure check; this change does not alter Azure ingress logging.

When enabled, the background request uses the exact supplied contract:

```json
{
  "token": "<43-character ec token>",
  "visitId": "82357f01-1148-4f4f-8061-2cde5b6e5b61",
  "eventId": "12257f01-1148-4f4f-8061-2cde5b6e5b61",
  "pagePath": "/bani-uk-ai/",
  "dedupVersion": "email-view-v1",
  "consent": { "choice": "unknown", "version": "proveit-advertising-consent-v1", "purposes": [] }
}
```

Optional fbp/fbc/ttp cookies and ttclid are included only when available,
well-formed and not refused. No name/email/phone/contact/pixel ID, credentials,
claimed IP or user-agent is submitted. Bodies are bounded below 8KiB. Requests
use a five-second timeout, no-store, credentials omit, no-referrer and keepalive.
Network failures/503 get at most two delayed retries with the exact body/IDs.
No render delay, error banner or synchronous retry loop is introduced.

SDK readiness is independent of the API request. One additional real ViewContent
per available Meta/TikTok SDK uses the shared event ID in eventID/event_id. No
second PageView stream, identify call or browser contact data is added. Guards
survive effect remounts. Leaving the page clears attribution/cancels retries;
other pages are never associated with this recipient.

## Choices and withdrawal

Existing anonymous advertising behavior is preserved. Explicit accept/refuse now
stores actual ISO at alongside value/expires and dispatches a synchronous choice
event before revoke/cookie cleanup/reload. The collector reports refusal with
the SAME token/visit/event IDs and no cookie identifiers, using keepalive. Storage
failure also emits a real refusal signal. Older-choice retries are superseded;
backend stored withdrawal remains final. Legacy v1 records derive creation time
from expires minus 180 days. Missing/expired/unusable choice stays unknown.
purposes remains []: a cookie choice is not specific customer-data permission.

The owner's deployed policy is not-denied: unknown is eligible under that
server-controlled policy, not proof of consent/identity. It supersedes the earlier
explicit-only proposal. Backend can switch to explicit independently; frontend
does not invent a purpose grant to satisfy it. Google still requires separate
actual ad-user-data and personalization grants. Forwarded emails attribute the
original message recipient, never verify/login/merge the current visitor.

## Campaign producer metadata

Canonical campaign key is CRM_PROMO_BANI_UK_AI_1 in renderer tags, manifest and
handoff, superseding bani-uk-ai-2026-10. The portable renderer now also exports:

```js
const rendered = renderProveitCampaignEmail({ recipientName, unsubscribeUrl });
const metadata = emailCampaignMetadata(campaignRecipientId);
// Store rendering fields PLUS metadata in app.EmailOutbox.PayloadJson.
// metadata is not an additional field in the Resend API request.
```

The helper returns emailCampaign with the correct campaignKey and optional
validated lowercase recipient UUID. If omitted, the backend binds the outbox
UUID. The producer must preserve this metadata, single recipient and immutable
template fingerprint. Only the backend rewrites the CTA and issues tokens.

The deployed visit feature does NOT implement the separate campaign producer,
staging, content import, Resend reporting/webhooks or unsubscribe project. Those
remain the campaign handoff's work; visit deployment alone is not send readiness.

## Remaining coordinated checks

Live read-only OPTIONS confirmed www-origin 204/POST support on both public
endpoints. Disabled generic 202 is not proof of persistence. No real token was
submitted and no collection/delivery flags were enabled. Only the protected
callback key was installed; it is not a public setting or browser credential.

1. Backend team returns a valid non-PII pilot token, expiry and readiness report.
2. Verify dedicated Meta/TikTok credentials, supported Graph version and vendor
   test codes. Test mode must not fall back to live.
3. Coordinate frontend enabled flag with campaign/environment IsEnabled and
   FrontendReady. Do not silently activate or send token-bearing campaign links.
4. Owner-authorized browser pilot: cleanup before vendors, shared ViewContent
   IDs, one persisted visit despite retries, refusal cancellation, real vendor
   test receipt/dedup. No synthetic live events.
5. Google account 1424642598, audience 9490685374 and action 7856823091 are
   reported configured. Permissions/validateOnly, terms, browser label and shared
   purchase-ID verification remain outstanding. Provision dedicated course
   Stripe credential and callback signing secret through protected settings;
   the callback function key is already installed with its switch false. Do not
   enable the callback producer while disabled backend purchases merely ack.
6. Campaign sending, recipient/template reporting, real unsubscribe behavior
   and current audience exclusions must pass separate acceptance before bulk
   send. No campaign or pilot email is authorized by this preparation.

Tests: email-campaign-visit.test.cjs, google-advertising-handoff.test.cjs,
advertising-pixels.test.cjs and proveit-campaign-email.test.mjs cover duplicate
mounts/retries, shared IDs, post-visit refusal, disabled/private routes, missing
SDKs, timestamps/body fields, exact campaign metadata and independent Google gates.
