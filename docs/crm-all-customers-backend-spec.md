# AllCustomersView: required backend contract

## Record comments

Every row exposes Add comment with optional Next Action Date. This is a record-level note, separate from the international pensions service's notes, stage progression and deadlines. Linked customers use the same CRM contact history as the other tabs; unlinked customers use the authorized customer-notes route. See `crm-lead-comments.md` and LaunchingStack `docs/engineering/systems/crm-lead-comments.md`.

## Service workflow business specification

Read the latest user-maintained [International pensions client workflow specification](https://docs.google.com/document/d/1TtiqQYsh5os8J_DDI916e5L9vSAeTlwP3eWhh-nm1r8/edit)
before changing service stages, agent actions, client-triggered events or their
resulting tasks, messages and automations in `/admin/crm/?tab=allCustomersView`.

Created 7 November 2026, this is a **draft template** for existing-client service
delivery, separate from the WhatsApp lead-qualification funnel. Examples and
`[TO DEFINE]` fields are not approved requirements or implemented functionality.
Fetch the live Google Doc rather than relying on an old copied version. A client
may have multiple service files with independent progress. If the document cannot
be accessed, report the gap rather than inferring its requirements.

The contract below describes existing functionality; it does not establish that
the proposed service workflow is live.

Backend counterpart: `LaunchingStack/docs/systems/crm-all-customers-view.md`.

## Existing frontend and API contract

### Manual international pensions service cases

The Services column in each customer list opens `InternationalPensionCase.tsx`.
It shows the 21-stage user-defined UK–Romania workflow, supports additional work
countries with years/months, initial CFN901 fields, document references, manual
verification, tasks/due dates, notes and recent audit history. Stage changes are
manual and require saving dirty form changes first. Existing booking and lead
actions are preserved; the new controls are only rendered for customer lists.

`src/lib/internationalPensionCases.ts` calls:

- `GET/POST /justproveit/admin/crm/customers/{customerId}/international-pension`.
- `POST /justproveit/admin/crm/international-pension/summaries` for at most 50 IDs.

Writes use an unchanged UUID request ID for retries and optimistic `expectedVersion`.
409 errors preserve the unsaved draft; the user explicitly reloads/reconciles.
UK date inputs convert to UTC independently of the workstation time zone.

Opening requires manual first-payment confirmation, associated sale and plan.
The selling agent is read from that sale or manually confirmed if unknown;
payment confirmation does not assign the confirming agent as owner. Backend
gates require signed authority and postal evidence before marking CFN901 posted,
ordered major stages, decision review/explanation and final client approval.
No new automatic emails, WhatsApp messages or reminder timers are enabled.

Backend implementation: `LaunchingStack/docs/engineering/systems/international-pension-client-workflow.md`.
Tests: `node --test tests/international-pension-case.test.cjs tests/crm-lead-search.test.cjs`.

Frontend implementation: `src/components/AllCustomersView.tsx`, client `src/lib/allCustomers.ts`, tab `allCustomersView` in `/admin/crm`. The matching backend API is implemented in LaunchingStack (`crmCustomers.js`, `justProveItCrmCustomers.js`) with the contract below.

## Endpoint

`GET /api/justproveit/admin/crm/customers?scope=inbound|all&name=&phone=&email=&limit=50&offset=0`

Use existing JustProveIt CRM authorization and tenant isolation. Never trust caller tenant IDs. Accept only `scope=inbound|all`, validate offset >=0 and limit=50. All three filters are combined with AND. Name and email are case-insensitive substrings; phone uses canonical normalization, with partial digits allowed for filtering. Parameterize every query. Pagination and totals apply after filtering, with stable sorting (latest received inbound contact descending for inbound; contact creation descending for all; contact UUID as tie-breaker).

`all` means all canonical customer/contact records, not only paying customers, leads with bookings, or contacts from the last seven days. No date range is requested. `inbound` means a customer has ever sent an email or WhatsApp message, or made an inbound telephone call. Include missed inbound calls; exclude outgoing/manual outbound calls, sent emails, queued outbound messages, and delivery/status callbacks. Deduplicate per canonical contact before counting/pagination. Include customers without bookings. Preserve unmatched sender identities for reconciliation rather than guessing by phone suffix/name.

Return:

```ts
{
  scope: 'inbound'|'all', total: number, limit: 50, offset: number,
  warnings?: string[],
  rows: [{
    contactId: string, name: string, phone: string|null, email: string|null,
    createdAtUtc: string|null,
    lastInbound: {channel:'email'|'whatsapp'|'call', atUtc:string, source:string|null, text:string|null}|null,
    booking: ScheduledCallRow|null,
    firstCallAtUtc: string|null, lastCallAtUtc: string|null, callCount:number|null,
    firstCallCode: string|number|null, lastCallCode:string|number|null,
    lastWhatsApp: {atUtc:string,direction:'inbound'|'outbound',source:string|null,text:string}|null
  }]
}
```

`booking` uses the existing scheduled-calls row contract, including the real intent ID, appointment version and action flags. Choose the next active booking, otherwise the latest historical booking. Never invent a booking to enable row actions. Call metrics cover all historical real calls for that customer, deduplicated by provider call ID; first/last codes refer to the same first/last calls. Latest WhatsApp is all-time, deduplicating mirrored provider messages and excluding unsent queue entries. Give explicit source/provider names. Null means unavailable, zero means known zero. Use warnings if a data source is incomplete; fail rather than silently excluding a channel from the inbound list.

## Existing UI behavior preserved

Both sections have independent filters, refresh, cancellation, totals and pagination. Each page has at most 50 customers. Name opens `/crmdispatch?phone=...`; a booked customer's phone opens the existing full phone history. Without a booking the phone opens CRM details. Booking actions appear only with a real booking.

## OZ email ingestion investigation

Read-only Azure function inventory confirms a deployed `adminInboundEmails` GET endpoint at `justproveit/admin/inbound-emails`. This proves an inbound-email reading surface exists, but does NOT confirm that OZ is currently ingesting emails, which mailbox is covered, or its freshness. No OZ-specific ingestion timer was identified by function-name inventory. Verify the actual ingestion job (including external jobs), successful recent runs, source mailbox and latest ingested received-at timestamp before claiming OZ ingestion works. Never invoke send endpoints or connected email accounts to investigate. Do not count outbound Resend delivery receipts as received customer email.

## Acceptance

- Each inbound channel alone qualifies a customer; outbound-only never qualifies.
- Repeated email/WhatsApp/call records and multiple identities/bookings still produce one row per contact.
- Customers without bookings and without inbound contact appear in all, never disappear due to inner joins.
- Name/phone/email filters, combined filters, 0/1/50/51/100 rows, stable page boundaries and accurate filtered totals.
- Cross-tenant access denied; queries parameterized; no tokens/message provider secrets returned.
- First/last calls and codes match, missed inbound included, outgoing-only excluded from qualification.
- Source failures explicitly reported; OZ ingestion verified with real job state before enabling email qualification.
- Frontend 404/501 reports unavailable service instead of misleading empty lists.

Read-only live checks on 29 October 2026: the proposed `/justproveit/admin/crm/customers` route returns HTTP 404; the existing `/justproveit/admin/inbound-emails` route returns HTTP 401 without authentication. No customer messages were read or sent.

## Implementation and source verification

User authorized backend changes on 29 October 2026. Backend tests and isolated SQL fixtures cover received emails, WhatsApp, inbound calls, outgoing-only exclusions, canonical deduplication, tenant isolation, filters and pagination. Live read-only queries found 31,080 contacts and 5,926 with recorded inbound contact at verification time.

Email coverage is explicitly limited: JustProveIt had zero Resend inbound email records; Mediatel stored 3,625 historical email tickets, latest 14 January 2025. No continuous OZ mailbox ingestion was found in backend processes. GenericReports Gmail access is on demand, while OZ campaign/reply audit records describe outbound mail. The view displays this coverage warning. It does not claim that current OZ mailbox emails are included.

## Client definition correction

Membership now comes exclusively from tenant-scoped `wix.ozClients`. Deduplicate by trimmed lowercase email; if missing, normalized phone; if both missing, the original row ID. CRM-only contacts do not qualify. Use the latest OZ row for display details, earliest OZ creation date for becoming a client, and retain all phones from grouped OZ rows for matching/filtering. Exact email links CRM contacts for bookings/history; phone fallback applies only to clients with no email. OZ clients without canonical CRM links still appear. The API row identifier identifies the client group; nested booking IDs remain real CRM IDs.

## Customer list filters (7 November 2026)
Customers who contacted us requests `inboundDays=7`, filtering the latest inbound event before count/pagination. All customers requests an explicit `service` filter: empty selection returns only the service catalogue and zero customers. Service and optional status filters apply to the same sale/service entry before deduplication-aware pagination (10 rows). International pension status uses the current major case stage (or closed); other services use recorded sale status, with untracked fallback. Unknown legacy services are shown explicitly, without guessing. Lead lists retain their existing behavior.

## Manual appointments before 10:00 UK (9 November 2026)

New Lead MANUAL_BOOK, contact Book a Call and manual rescheduling ask for an extra confirmation before submitting a time earlier than 10:00 Europe/London. Cancel preserves the form and sends no request; OK submits confirmEarlyAppointment=true for the selected date/time. The backend validates the explicit boolean and records the override in booking/action history. Future-date, DST conversion, stale-booking and idempotency protections remain. Automatically offered appointment slots still begin at 10:00.

### WhatsApp photo history (9 November 2026)
Phone history WhatsApp events may include `image: {mediaId, mimeType, name}`. Both contact and booking histories display lazy-loaded photo previews and an enlarged view, fetched with the CRM bearer authorization from `contacts/{id}/history/media/{messageId}` or `scheduled-calls/{id}/history/media/{messageId}` on the canonical backend. Blob URLs are revoked on unmount or target changes; credentials are never placed in image URLs. Unavailable provider media shows a clear message and retry button. Existing conversations use their saved Mediatel media metadata without backfill.

Call transcripts may return `status: budget_paused` under the shared USD 30 transcription spending guard (9 November 2026). The timeline explains that processing is paused and requires administrator review; it does not describe this as missing audio. Eligibility now includes all agents when a client's appointment date/time is in the inclusive 48 hours preceding call start; summaries and full transcripts retain their existing display.
## Customer creation date filter (2026-11-09)

Both customer sections expose "Became a customer (UK dates)" From/To date fields. Apply filters resets to page one; Clear removes the range. The API query uses optional `customerFrom`/`customerTo` (`YYYY-MM-DD`), inclusive Europe/London calendar dates, combined with all other filters. The backend filters the grouped customer creation timestamp before totals and pagination; either bound is optional. Invalid or reversed dates return 400. Rows without a creation date are excluded when a bound is active. Lead views are unchanged.
## Agents spoken with (2026-11-09)

Both customer sections show a single Agents spoken with column alongside Became a customer. `agentHistory.lastBeforePurchase` identifies the last positively recorded agent conversation before the displayed customer creation/purchase timestamp. `agentHistory.recentAgents` lists all distinct recorded participants in the rolling past 30 days up to now, with each agent's latest conversation date, including post-purchase calls. Dates display in UK time. The API supplies UTC timestamps and stable agent IDs; absent history is shown as No recorded conversation(s), or Purchase date unavailable for an unknown cutoff. Talk-time evidence excludes unanswered/test/voicemail records; transferred participants are included. On a shared last call, the positively recorded primary agent wins, otherwise the participant with highest talk time then smallest agent ID. The backend filters/enriches only the selected page and preserves current service ownership and lead lists.
## All services by default (2026-11-09)

The All customers list loads immediately with All services selected. Empty `service` means no service restriction, retaining all other filters and 10-row pagination. Selecting a service enables its status filter; returning to All services resets status and page. Clear restores All services. This supersedes the earlier requirement to select a service before displaying customers.

### Self-hosted WhatsApp inbox (test rollout)

Feature builds with `NEXT_PUBLIC_WHATSAPP_GATEWAY_CRM=true` expose a received-message
inbox and customer/contact WhatsApp history. `/justproveit/admin/crm/whatsapp-gateway`
provides GET capabilities/inbox/targets/history/{kind}/{id} and POST inbox/{id}/link.
Existing CRM authorization is required. Unresolved/shared identities stay in review;
a human selects an existing record, checks it and supplies a verification note.
Links use expectedVersion/requestId and remain per message, with an authenticated
audit. No sender-to-client guess is persisted. Display uses escaped React text.
There are no new send, automatic reply, client creation or workflow actions.
The initial test preview retains existing provider history and inbound aggregates;
self-hosted received history is available from the separate customer-row button.
Test preview uses same-origin `/api`; normal production build flag remains absent.
