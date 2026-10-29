# AllCustomersView: required backend contract

Frontend implementation: `src/components/AllCustomersView.tsx`, client `src/lib/allCustomers.ts`, tab `allCustomersView` in `/admin/crm`. The frontend is ready for the following API. Do not enable the tab in production until this endpoint is deployed and verified.

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
