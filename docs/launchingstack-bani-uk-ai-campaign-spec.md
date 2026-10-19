# Bani UK AI email 01: LaunchingStack implementation handoff

Prepared 19 October 2026. Status: template/rendering prepared; campaign NOT sent,
scheduled or enabled. This document requests backend implementation, not launch.

Additional requested feature: see
[email-visit advertising matching](launchingstack-email-visit-matching-spec.md)
for asynchronous token-based CRM resolution and eligible server-side matching.
That feature is specified separately and is not yet enabled.

Backend visit integration update: the owner supplied the deployed contract for
`CRM_PROMO_BANI_UK_AI_1`. See `email-attribution-coordinated-readiness.md`.
When staging outbox messages, use the bundle's `emailCampaignMetadata(recipientId)`
export to stamp `PayloadJson.emailCampaign`; this DB-only metadata must not be
passed as an extra Resend API field. Collection and delivery remain disabled.

## Outcome and ownership

Adrian needs a report for each recipient AND template: delivery, observed opens,
observed clicks, each clicked destination, timestamps and counts. Aggregate
Resend dashboard totals alone are insufficient. Preserve history across future
campaigns and template versions.

JustProveIt owns the approved content, assets, shared renderer, public link
registry and audience snapshot. LaunchingStack owns campaign registration,
audience staging, final exclusions, sending/outbox, Resend webhook processing,
unsubscribe handling and authenticated reporting. No code in the LaunchingStack
repository was edited. Locate the existing implementations by the table/function
names below; repository file paths were not inspected or guessed.

## Identifiers and deliverables

| Item | Value |
| --- | --- |
| Tenant | `justproveit` / `11B93F34-CB3D-46F5-8FD9-7B941CBCFE19` |
| Campaign key | `CRM_PROMO_BANI_UK_AI_1` |
| Template key | `ro-bani-uk-ai-email-01` |
| Snapshot table | `wix.ozLeadsBanks1910` |
| Historical snapshot size | 28,105 distinct emails |
| From | `Adrian Defta <adrian@mail.justproveit.co.uk>` |
| Reply-to | `adrian@proveitweb.co.uk` |
| Owner review recipient | `adrian@proveitweb.co.uk` |
| Sales destination | `https://www.justproveit.co.uk/bani-uk-ai/` |

Run `node scripts/export-bani-uk-ai-campaign.mjs` in JustProveIt. Transfer the
entire generated `artifacts/campaigns/bani-uk-ai-email-01` directory, preserving
its relative paths. It contains a manifest with SHA-256 hashes and renderer
version, source JSON, base HTML, pure renderer and branded-link dependencies.
No secrets or audience email addresses are included. Node >=20 and htmlparser2
are required; use the receiving project's dependency policy/lockfile.

The manifest has `sendEnabled: false`. Do not convert it to an enabled job during
import. Treat the manifest hash as the immutable template version for this run.

```js
import { renderProveitCampaignEmail } from './scripts/lib/proveit-campaign-email.mjs';
const rendered = renderProveitCampaignEmail({
  recipientName: contact.firstName || '',
  unsubscribeUrl: recipientSpecificUnsubscribeUrl,
});
// Rendering does not send. The backend sets exactly one actual recipient:
const payload = { ...rendered, to: [campaignRecipient.email] };
// Persist campaign, recipient, template/version, rendered content/hash and
// outbox ID before invoking the existing sender. Do not send in this example.
```

Do not use `config.testRecipient` or `testRecipientName` for the campaign. Missing
names fall back to the unprefixed subject. Never guess names from email local
parts; resolve a deterministic, non-conflicting name from canonical contacts.
Recipient input is escaped, subject control characters rejected. The renderer
requires an approved first-party HTTPS unsubscribe URL in campaign mode.
It returns subject, HTML, text, sender, reply-to, tags and unsubscribe headers;
it intentionally returns no recipient, API credential or sending function.
The preview/test CLI remains available; `--final` exports content, never sends.

## Audience: snapshot membership versus current eligibility

The snapshot already exists; DO NOT recreate it or broaden it automatically.
`scripts/snapshot-ozLeadsBanks1910.sql` records how it was produced and refuses
to overwrite an existing table. Columns: Email (normalized, primary key),
TenantId, AudienceSegment, Language, OzLeadCreatedAtUtc, SnapshotCreatedAtUtc.

- 2,369 rows: `AudienceSegment = 'romanian'`, Language `ro`.
- 25,736 additional rows: `ozLeads_unknown_language_before_20260401`, language
  NULL, original `wix.ozLeads.WixCreatedDateUtc < '2026-04-01'`.
- The original blank-language group had 26,277 eligible emails; 541 overlapped
  the Romanian group and occur only once in the combined snapshot.
- Missing language is an explicitly authorized audience rule, not inferred
  Romanian language or evidence of marketing consent. Keep that distinction.

Import membership once into campaign-recipient records with a unique constraint
on tenant/campaign/template-version/normalized-email. Store snapshot segment and
snapshot timestamp. Never mutate the source snapshot to record engagement.

Before staging AND immediately before each provider send, recheck current:

1. Canonical/legacy clients: `crm.Contacts` client/customer/sale flags,
   `crm.ContactServices`, `crm.ContactLegacyLinks`, `wix.crmLeads12Nov.isCustomer`,
   `wix.ozClients`. Exclude at contact identity as well as all associated emails;
   use normalized-phone identity where available. The snapshot SQL records the
   original conservative customer categories, including date-valued customer
   markers. Reuse the established CRM client resolver where possible.
2. `app.EmailSuppressions`, provider suppressions, known invalid addresses,
   bounces, complaints and unsubscribe state across every linked identity.
3. `app.Leads.MarketingSubscribed = 0` where present and current consent/audience
   policy. NULL/absent consent is not affirmative consent; never set subscribed
   merely because a row was included in the historical snapshot.
4. Current course purchasers. The course fulfillment list is Azure Table
   `BaniUkAiFounders`, partition `FondatoriBaniUkAi`, course key
   `bani-uk-ai-fondator`. Read via authorized server credentials or the existing
   paid-checkout integration; no public purchaser-list endpoint. Include fully
   discounted completed purchases. Do not expose credentials in this handoff.

Store the exclusion reason and timestamp. Final sendable count may be less than
28,105; show this in the dry-run report. The historical count is not an assertion
of mailbox deliverability. Do not enroll recipients in unrelated sequences.

## Sending and message identity

Reuse the existing sender/outbox and campaign conventions rather than creating
an independent delivery worker. Inspect `app.EmailOutbox`, `app.EmailTemplates`,
`app.EmailLogs`, `app.EmailClickTokens`, `app.EmailRedirectClicks`,
`app.EmailSuppressions` and existing throttling before adding migrations.
Do not insert a parallel copy into `marketing.*` unless that is the chosen
canonical subsystem; this database contains both models.

Persist these associations (new tables/columns only where existing schema lacks
them): campaign ID/key, campaign-recipient ID, contact ID if known, normalized
email, template ID/key/version/hash, outbox ID, provider and Resend email ID,
accepted/sent/delivered timestamps, tracking enabled-at-send, test flag, rendered
payload hash and eligibility result. Template key/version must survive later
template edits. Do not rely on subject text or Resend template_id: we send custom
HTML, so a provider-hosted template ID may be absent.

One provider message per recipient; no shared To/CC/BCC broadcast. Extend tags
with non-PII campaign-recipient/outbox IDs if supported. Store provider response
ID durably and join events by tenant/provider/email ID, not by address alone.
Use an outbox lease, unique send key and stable Resend idempotency key per
campaign-recipient/template version. Keep the rendered payload immutable across
retries. Beyond the provider's idempotency window, reconcile ambiguous delivery
before retrying; never silently issue a new message/key. Handle the webhook-before-
send-response race using pending-event reconciliation or trusted internal tags.

Use existing sending-rate/daily-limit controls. Surface provider quota failures,
pause/resume state and delivery errors. No bypass of current sender limits.

## Tracking and clicked destinations

Open/click tracking was enabled on `mail.justproveit.co.uk` with tracking host
`links.mail.justproveit.co.uk`; verify both still enabled before a pilot send and
save that fact on each message. Do not add a second open pixel.

The JustProveIt public `/r?id=...` endpoint is a STATELESS allowlisted redirect.
It does NOT persist recipient clicks and ignores caller tracking tokens. Do not
assume adding `ct` to it creates attribution. Native Resend click events must be
persisted against the Resend email ID. Keep the approved website links unchanged.

Subscribe the existing Resend webhook to sent, delivered, opened, clicked,
bounced, complained, failed, suppressed and delivery-delayed events as supported.
Preserve unrelated event subscriptions. Verify the raw body using Resend/Svix
signature verification, timestamp tolerance and endpoint-specific signing secret.
Deduplicate deliveries on provider/endpoint + `svix-id` with a unique constraint.
Persist before acknowledging; unknown message IDs go into a reconciliation queue,
not an unbounded retry loop. Duplicated events must not inflate counts. Distinct
genuine events remain distinct even if type and timestamp happen to match.

Resend `data.email_id` identifies the message. For clicked events,
`data.click.link` is the clicked URL; store its raw value plus a canonical
destination. `data.click.timestamp`, when valid, is the interaction timestamp;
use top-level `created_at` for open events and as fallback, NOT the message's
`data.created_at`. Store receipt time separately. Preserve the verified event
payload under existing restricted retention rules. These schemas come from the
official references below; validate real payloads during integration.

Resolve known `https://www.justproveit.co.uk/r?id=...` URLs using a per-template
snapshot of `api/shared/email-links.json`, preserving the original raw URL.
Do not HTTP-fetch arbitrary click URLs to resolve them. If a provider returns
an opaque tracking URL, retain it and mark destination unresolved until safely
mapped. Do not invent a destination. Main CTA maps to link ID `bani-uk-ai`,
WhatsApp to `whatsapp`; Trustpilot and social/legal links have separate IDs.
Map as-sent link destinations, not a registry potentially changed months later.

Preserve existing bot/scanner classifications from
`app.EmailBotTrafficSuppressions` and `app.EmailBotTrafficSuppressedRecipients`.
Expose raw observed and filtered engagement separately; do not call either
proof of a human reading. Never double-count the same interaction from native
Resend events and the legacy redirect-click table. Mailto/tel and untracked links
must not be reported as reliably measured clicks.

## Unsubscribe contract

Use the existing backend unsubscribe implementation when compatible. Renderer
allowlist: `www.justproveit.co.uk`, `send.justproveit.co.uk`,
`mail.justproveit.co.uk`. Provide a real deployed URL on one of these hosts;
fixture URLs in tests are not a deployed endpoint. Reuse `send.justproveit.co.uk`
routing if applicable; report an API/host change back to JustProveIt if necessary.

Each URL uses an opaque, high-entropy server-side token or authenticated signed
token, bound to tenant/recipient/scope. No plaintext email address in the URL.
Headers: List-Unsubscribe contains that URL; List-Unsubscribe-Post is
`List-Unsubscribe=One-Click`. POST supports that body without login and is
idempotent. Ordinary GET renders a Romanian confirmation form; scanners must not
unsubscribe someone by fetching GET. Confirmation submits POST. Do not route
unsubscribe through campaign click redirects or count it as a promotional click.
Ensure native tracking does not wrap the unsubscribe body link (use Resend's
documented link opt-out if needed). Validate actual received MIME in the pilot.

Persist the global JustProveIt marketing unsubscribe/suppression immediately and
cancel pending marketing jobs for that recipient. Do not suppress necessary
transactional course onboarding or receipts as a side effect. Do not permit
arbitrary re-subscription through this endpoint. Invalid tokens get a generic
response without revealing whether an email is in the audience.

## Reporting API and presentation

Provide tenant-authorized, paginated recipient/template reporting using existing
admin conventions; suggested new endpoints (not implemented in JustProveIt):

- GET `/justproveit/admin/email-campaigns/CRM_PROMO_BANI_UK_AI_1/summary`
- GET `/justproveit/admin/email-campaigns/CRM_PROMO_BANI_UK_AI_1/recipients`
- GET `/justproveit/admin/email-campaigns/CRM_PROMO_BANI_UK_AI_1/recipients/{id}/events`

Filters: email search, template key/version, segment, delivery status, opened,
clicked, clicked link ID, date range, test/live. Return email, template/version,
delivery status, first/last observed open, unique event count, first/last click,
per-link raw/canonical URL and count/timestamps, bot classification, unsubscribe
and exclusion reason. No public email lookup. Authorized CSV export escapes
spreadsheet formula prefixes and respects tenant isolation.

Summary: selected, excluded by reason, eligible, queued, accepted, delivered,
failed, bounced, suppressed, complained, unsubscribed, unique recipients opened,
unique recipients clicked, per-link unique recipients and total distinct events.
Open rate = distinct delivered messages observed opened / delivered messages;
CTR = distinct delivered messages observed clicked / delivered messages.
Use the same campaign/template-version/test cohort for numerator/denominator;
show N/A with zero denominator or unavailable tracking. State observed events
with missing delivery events separately and reconcile instead of rates >100%.
Do not display “unopened” as certain when no open event has been observed.

Current database inspection found historical records (4 opened events and 141
redirect clicks linked to recipient/template), but this campaign is NOT connected
merely because those tables contain data. Existing recipient-sender aggregate
first-open fields were empty; report from durable message/event associations.

## Acceptance and launch boundaries

1. Import bundle offline; hash/version checks pass; content matches the approved
   preview, one primary CTA, four images, orange/blue styling and signature.
2. Two fixture recipients get separate names, tokens, outbox/provider IDs;
   no owner-test address leaks into live recipient selection.
3. Dry-run only: historical snapshot count 28,105; produce current exclusions and
   final eligible count; duplicate import/enqueue is idempotent. No send call.
4. Invalid/forged webhook rejected; duplicate/reordered events processed once;
   early webhook reconciles once provider ID is persisted. No unrelated tenant
   or template can receive another message's events.
5. Open and two different clicked URLs appear against the correct fixture
   message/template. Raw /r URL resolves to the as-sent destination. A repeated
   genuine click increments events; a retried webhook does not.
6. Unsubscribe GET does not mutate; one-click POST and browser confirmation do;
   retries remain successful; queued marketing stops and future sends skip.
7. New client, course buyer or suppression after staging is excluded before send.
   Existing template/source snapshot rows are not rewritten.
8. Owner-only pilot through the SAME campaign/outbox/webhook/report flow, marked
   test and excluded from live metrics; require separate authorization to send
   that pilot. User opens/clicks voluntarily. No synthetic live engagement.
9. Show recipient/template report plus aggregate summary and send/retry evidence.
   Keep campaign draft/paused until owner explicitly authorizes actual launch.

No automatic sequence/email 02 is authorized. The P.S. says “Mâine”; confirm the
actual send date and whether email 02 is ready before launch. Recheck current
bank offer claims and course capacity/closing date (1 November) for the actual
send date; do not silently modify approved copy or send an expired offer.

## References

- [Resend clicked payload](https://resend.com/docs/webhooks/emails/clicked)
- [Resend opened payload and measurement limits](https://resend.com/docs/webhooks/emails/opened)
- [Raw-body webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Unsubscribe headers](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails)
- [Native tracking](https://resend.com/docs/dashboard/domains/tracking)
- Local: `docs/proveit-branded-email-links.md`,
  `docs/bani-uk-ai-email-01-resend-handoff.md`,
  `docs/bani-uk-ai-onboarding-handoff.md`.
