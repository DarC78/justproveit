# CRM JobApplication Details Update Backend Spec

## Context

The CRM details page:

`https://www.justproveit.co.uk/admin/crm/?tab=details`

now has a simplified JobApplication lead view. It displays all fields returned by the lead and lead-intent payloads, and only edits:

- `FU` -> `dataUrmatorContact`
- `rezultat` -> `statusOriginal`
- `obs` -> `observation`

The current frontend first calls the existing endpoint:

`POST /justproveit/admin/crm/leads/{id}`

For JobApplication records this can return:

`CRM lead not found.`

That means the backend is resolving `{id}` only against the legacy CRM lead table, while JobApplication rows may be represented primarily by `crm.LeadIntents`, contact IDs, or canonical contact IDs.

## Required Backend Behaviour

Update the CRM lead update route, or add an equivalent JobApplication-specific update route, so a JobApplication details save can be resolved by any of these identifiers:

- legacy CRM lead id, when present
- lead intent `leadId`
- lead intent `interestId`
- contact id
- canonical contact id
- email or phone fallback, if needed

## Current Frontend Request

The frontend sends the same editable fields as the existing lead update flow:

```json
{
  "observation": "text",
  "statusOriginal": "result/status",
  "dataUrmatorContact": "2026-08-10",
  "agent": "agent name or email",
  "leadId": "lead-intent leadId if available",
  "contactId": "contactId if available",
  "canonicalContactId": "canonicalContactId if available",
  "intentId": "interestId if available",
  "interestId": "interestId if available",
  "leadIntentId": "interestId if available",
  "interestType": "JobApplication"
}
```

The frontend currently tries multiple candidate path IDs for JobApplication saves before showing the backend error.

## Response Shape

Return:

```json
{
  "success": true,
  "lead": {
    "id": "resolved lead/contact id",
    "fullName": "Name",
    "phoneNumber": "Phone",
    "email": "Email",
    "statusOriginal": "saved result/status",
    "dataUrmatorContact": "saved FU",
    "observation": "saved obs"
  }
}
```

Include all available JobApplication fields in the returned `lead` object where practical, because the frontend renders all non-empty fields automatically.

## Acceptance Criteria

- Saving `obs`, `rezultat`, and `FU` on a JobApplication lead no longer returns `CRM lead not found`.
- The save works when the frontend identifies the row by `interestId`, `leadId`, `contactId`, or canonical contact id.
- `GET /justproveit/admin/crm/lead-intents?intent=JobApplication` returns the saved values on subsequent loads.
- Existing non-JobApplication CRM lead updates keep working.
