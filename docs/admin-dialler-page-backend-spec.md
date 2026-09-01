# Admin Dialler Page Backend Spec

## Context

The frontend now has a protected admin page at:

`/admin/dialler`

The page shows clients that have been dialled or are waiting to be dialled, with filters for queue, date interval, and whether the client connected to an agent. It also lets an admin edit a free-text note next to each row. That note must be persisted as the CRM lead `observation` and pre-populated from the current CRM record.

This frontend repository does not own the dialler database or CRM write logic. The backend/API service must expose the read endpoint below and ensure the existing CRM update endpoint can save observations for rows returned by the dialler endpoint.

On initial page load, the frontend loads only the dropdown options for predictive active queues. It must not load or display any dialler records until the admin selects filters and presses Refresh.

## Endpoint 1: List Predictive Active Queues

Implement:

`GET /justproveit/admin/crm/dialler/queues`

Use the same authentication and admin authorization model as the existing CRM admin endpoints under:

`/justproveit/admin/crm/*`

Return only predictive queues that are currently active and relevant to the dialler page.

Preferred response:

```json
{
  "queues": [
    {
      "queueId": 37,
      "queueName": "Queue 37",
      "campaignName": "Predictive campaign name",
      "label": "Queue 37 - Predictive campaign name",
      "active": true
    }
  ],
  "total": 1
}
```

Required fields:

- `queueId`
- at least one display label field: `label`, `queueName`, or `campaignName`

The frontend can also tolerate `records`, `rows`, or `items` instead of `queues`, but `queues` is preferred.

## Endpoint 2: List Dialler Records

Implement:

`GET /justproveit/admin/crm/dialler`

Use the same authentication and admin authorization model as the existing CRM admin endpoints under:

`/justproveit/admin/crm/*`

### Query Parameters

- `queue` or `queueId`: optional queue filter. The frontend sends the selected predictive active queue id from `/justproveit/admin/crm/dialler/queues`. If empty, return records from all predictive active queues.
- `dateFrom`: optional inclusive start date. The frontend sends `YYYY-MM-DD`.
- `dateTo`: optional exclusive end date. The frontend sends `YYYY-MM-DD`, already advanced by one day for date input end-date inclusion.
- `status` or `connectionStatus`: optional status filter. Values:
  - `all`: include dialled and to-be-dialled rows.
  - `to_be_dialled`: only rows still waiting to be dialled.
  - `dialled`: any row with at least one dial attempt in the interval.
  - `connected`: dialled rows where the customer genuinely connected/talked to an agent.
  - `not_connected`: dialled rows where no customer-agent connection happened.
- `limit`: optional. Backend must cap at `100`, even if a larger value is requested.
- `offset`: optional. The frontend currently sends `0`.

### Date Filtering

Apply the date filter to the best available dialler event timestamp:

1. Use the dial attempt/call timestamp for dialled rows.
2. Use scheduled/created/enqueued timestamp for to-be-dialled rows.

Return timestamps in UTC ISO-8601 strings.

### Connection Semantics

`connectedToAgent=true` must only be returned when the dialler data shows that the customer spoke with or was connected to an agent.

Do not treat these as connected:

- missed calls
- failed calls
- abandoned calls
- unanswered calls
- busy/no answer
- voicemail-only outcomes
- rows merely assigned to an agent but not connected

If the current dialler schema uses call codes, map those codes centrally in the backend and return both:

- `connectedToAgent`
- the raw/labelled result fields, such as `callCode` and `callCodeDetails`

## Response Contract

Return:

```json
{
  "records": [
    {
      "id": "stable dialler row id",
      "diallerRecordId": "optional dialler row id",
      "callTraceId": "optional call trace id",
      "clientId": "optional dialler client id",
      "queueId": 37,
      "queueName": "Queue name",
      "campaignName": "Campaign name",
      "scheduledAtUtc": "2026-09-01T10:00:00Z",
      "dialledAtUtc": "2026-09-01T10:12:00Z",
      "lastCallAtUtc": "2026-09-01T10:12:00Z",
      "createdAtUtc": "2026-09-01T09:55:00Z",
      "status": "dialled",
      "connectedToAgent": true,
      "agentId": 123,
      "agentName": "Agent Name",
      "callCode": 5,
      "callCodeDetails": "Connected to agent",
      "callResult": "Connected",
      "fullName": "Client Name",
      "phone": "+447...",
      "normalizedPhone": "447...",
      "email": "client@example.com",
      "leadId": "crm lead id",
      "wixId": "optional legacy CRM id",
      "contactId": "optional CRM contact id",
      "canonicalContactId": "optional canonical contact id",
      "intentId": "optional lead intent id",
      "observation": "Current CRM observation"
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

`records` is preferred. The frontend can also tolerate `rows` or `items`, but new backend work should use `records`.

### Required Fields Per Row

Each returned row should include:

- a stable row identifier: `id`, `diallerRecordId`, or `callTraceId`
- queue identity: `queueId` and/or `queueName`
- client identity: at least `fullName`, `phone`, or `email`
- dialler timestamp: `dialledAtUtc`, `lastCallAtUtc`, `scheduledAtUtc`, or `createdAtUtc`
- status fields: `status` and `connectedToAgent`
- CRM observation: `observation`
- CRM update identifier: preferably `leadId`

The note-save button requires a CRM lead identifier. If `leadId` is not available, the frontend will try `id`, `wixId`, `lead.id`, `lead.wixId`, or `lead.leadid`, but the preferred contract is always `leadId`.

## CRM Matching Rules

For every dialler row, match back to the CRM contact/lead using the most reliable available key:

1. Direct CRM lead/contact id already stored on the dialler row.
2. Normalized phone number.
3. Raw phone number normalized in the backend.
4. Email address, if present.

When multiple CRM leads match the same phone/email, prefer:

1. active/open lead intent for the same service/campaign, if known
2. most recently updated CRM lead
3. most recently created CRM lead

Return the `observation` from the CRM record that will be updated by the save endpoint.

## Endpoint 3: Save CRM Observation

The frontend uses the existing endpoint:

`POST /justproveit/admin/crm/leads/{leadId}`

The backend must support updating the CRM observation for the `leadId` returned by the dialler list endpoint.

Request body:

```json
{
  "observation": "Updated note text",
  "agent": "Admin name or email",
  "leadId": "optional same lead id",
  "contactId": "optional contact id",
  "canonicalContactId": "optional canonical contact id",
  "intentId": "optional lead intent id"
}
```

Required behaviour:

- Update only the CRM observation/note field unless additional fields are explicitly supplied.
- Preserve existing status, language, finance company, phone, email, and other CRM fields.
- Return the updated lead, including the new `observation`.
- Record an audit trail if the CRM backend already audits admin updates. Include `agent` where possible.

Preferred response:

```json
{
  "success": true,
  "lead": {
    "id": "crm lead id",
    "leadid": "legacy lead id if applicable",
    "fullName": "Client Name",
    "phoneNumber": "+447...",
    "email": "client@example.com",
    "observation": "Updated note text"
  }
}
```

## Acceptance Criteria

- An authenticated admin can request `/justproveit/admin/crm/dialler/queues`.
- `/justproveit/admin/crm/dialler/queues` returns only predictive active queues.
- The frontend can render the queue filter as a dropdown using `queueId` and `label`, `queueName`, or `campaignName`.
- Opening `/admin/dialler` does not trigger `/justproveit/admin/crm/dialler` and does not display dialler records before Refresh is pressed.
- An authenticated admin can request `/justproveit/admin/crm/dialler`.
- Non-admin or unauthenticated requests are rejected consistently with existing CRM admin endpoints.
- The endpoint never returns more than 100 records.
- Queue filtering works for queue id and, if possible, queue/campaign name.
- Date filtering returns rows in the selected interval.
- `status=all` returns both dialled and to-be-dialled rows.
- `status=to_be_dialled` returns only rows not yet dialled.
- `status=dialled` returns rows with at least one dial attempt.
- `status=connected` returns only rows genuinely connected to an agent.
- `status=not_connected` excludes genuinely connected rows.
- Each row includes the current CRM `observation`.
- Each row includes a CRM id that can be passed to `POST /justproveit/admin/crm/leads/{leadId}`.
- Saving a note from `/admin/dialler` updates the same CRM observation shown by the main CRM admin page.
- Saving a note does not overwrite unrelated CRM fields.

## Frontend Notes

The frontend currently sends both aliases for compatibility:

- `queue` and `queueId`
- `status` and `connectionStatus`

The backend may standardize internally, but should accept both names to keep the page stable.

If the list endpoint is missing or a row has no CRM lead id, the page shows an actionable error rather than silently failing.
