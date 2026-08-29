# CRM Sale History Backend Timeout Spec

## Objective

Implement and keep performant:

`GET /justproveit/admin/crm/sales/history`

The JustProveIt frontend renders this from the Sales tab on:

`https://www.justproveit.co.uk/admin/crm?tab=sales`

Users click `History` on a sale row.

As of 2026-08-29, LaunchingStack returns `404 Not Found` for this endpoint:

```text
GET https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/sales/history?limit=150
```

This route should exist on the LaunchingStack Function App and require the same CRM/admin bearer token auth as the other
CRM admin routes. An unauthenticated request should return `401`/`403`, not `404`.

The frontend has a temporary fallback: if this endpoint returns 404, it calls `/justproveit/admin/crm/activity` by sale
phone/email and displays contact activity. That fallback is only partial; the dedicated sale history endpoint is still
required for the complete per-sale timeline.

## Current Frontend Behavior

The frontend has already narrowed the request as much as possible.

Request priority:

1. If `sourceRecordId` is present, call with:
   - `sourceSystem`
   - `sourceRecordId`
   - 30-day post-sale date window
   - `limit=150`
2. If no source record exists, call with:
   - `saleId`
   - 30-day post-sale date window
   - `limit=150`
3. Only as a final fallback, call with:
   - `phone`
   - `email`
   - 30-day post-sale date window
   - `limit=50`

If `sourceRecordId` exists and `sourceSystem` is missing, the frontend sends:

`sourceSystem=stripe`

The frontend sends multiple date aliases for backend compatibility:

- `dateBegin`
- `dateEnd`
- `occurredFromUtc`
- `occurredToUtc`
- `fromUtc`
- `toUtc`
- `createdFromUtc`
- `createdToUtc`

## Example Fast Path Request

```text
GET /api/justproveit/admin/crm/sales/history?sourceSystem=stripe&sourceRecordId=<stripe-id>&dateBegin=2026-07-03&dateEnd=2026-08-02&occurredFromUtc=2026-07-03T00:00:00.000Z&occurredToUtc=2026-08-02T00:00:00.000Z&limit=150
```

## Required Backend Behavior

### Use Identifier Fast Paths First

When `sourceSystem + sourceRecordId` are provided:

- Find the sale by those fields first.
- Do not start with phone/email matching.
- Do not scan all CRM history before locating the sale/contact.
- Normalize source system comparison case-insensitively.

When `saleId` is provided:

- Find the sale by sale id first.
- Do not start with phone/email matching.

Only use phone/email search when no sale identifier is available.

### Apply Time Window Early

Apply the provided 30-day post-sale window inside each event query before unioning or sorting events.

Supported date params should include at least:

- `occurredFromUtc`
- `occurredToUtc`

If those are missing, fall back to:

- `fromUtc` / `toUtc`
- `createdFromUtc` / `createdToUtc`
- `dateBegin` / `dateEnd`

Do not fetch all contact events and then filter in application memory.

### Limit Early

Respect `limit` and cap backend work.

Recommended:

- Hard maximum: `500`
- For each event source, query only the requested window and a bounded limit before final merge.
- Return events sorted oldest first.

### Indexes / Query Shape

Backend should verify supporting indexes for:

- sales/source system + source record id
- sales/sale id
- sales/phone/email fallback keys
- lead/contact event contact id + occurred date
- lead intents contact id or normalized phone/email + occurred date
- dialler calls normalized phone/contact id + call date

If the endpoint uses SQL, avoid predicates that defeat indexes, such as wrapping indexed columns in functions in the `WHERE` clause. Normalize values before querying where possible.

## Response Contract

Keep the existing response shape:

```json
{
  "sale": {},
  "contact": {},
  "events": [],
  "total": 0,
  "limit": 150
}
```

Events should remain oldest first and include:

- `eventId`
- `eventType`
- `occurredAtUtc`
- `title`
- `description`
- `metadata`

## Acceptance Criteria

- A sale history request using `sourceSystem=stripe&sourceRecordId=<id>` returns within 5 seconds for a normal sale.
- A sale history request using `saleId=<id>` returns within 5 seconds for a normal sale.
- Phone/email fallback does not exceed the requested date window and limit.
- The backend does not perform broad all-history scans for identified sales.
- Existing response fields remain compatible with the frontend.
- If no events are found, return HTTP 200 with an empty `events` array, not a timeout.

## Frontend Status

Frontend changes have already been deployed in this repository.

Relevant files:

- `src/pages/admin/crm.tsx`
- `src/lib/crmAdmin.ts`

Latest frontend behavior:

- sends sale/source identifiers before phone/email.
- sends a 30-day post-sale window.
- limits source/sale-id lookups to `150`.
- limits phone/email fallback to `50`.
