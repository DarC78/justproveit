# CRM High Level Funnels Spec

## Context

The JustProveIt CRM frontend now includes:

`https://www.justproveit.co.uk/admin/crm?tab=highLevelFunnels`

It calls:

`GET /justproveit/admin/crm/high-level-funnels`

This frontend repository only renders the returned aggregate rows. The backend route should be implemented in the CRM API repository that owns `justproveit/admin/crm` endpoints.

## Query Parameters

- `dateBegin`: inclusive date in `YYYY-MM-DD` format.
- `dateEnd`: inclusive date in `YYYY-MM-DD` format.
- `agentId`: `all` or a numeric dialler agent id.
- `service`: currently sent as `simulator pensie`.
- `intent`: currently sent as `all`.

## Required Report

Return a high-level funnel for lead intents matching the service/lead intent group "simulator pensie".

Each lead source must be split into two rows:

- Calendly booked `Yes`
- Calendly booked `No`

The frontend table columns are:

- `Lead source`
- `Number of leads`
- `Calendly booked`
- `Talk to an agent`
- `Sales`
- `Revenue`

## Matching Rules

- Lead date filtering should use the lead intent creation date unless the backend team documents a better field.
- `leadSource` should come from the lead intent source field. Use a stable fallback such as `Unknown` for blank/null source.
- `calendlyBooked` should be `true`/`false` or `Yes`/`No`.
- `Talk to an agent` means the lead had a connected dialler conversation where `agentId > 0` and `agentId != 5`.
- When an `agentId` filter is provided, include only leads that this agent talked to. The same connected-call rule applies.
- Sales and revenue should be attributed by matching the lead/contact to the sale using canonical contact id where available, otherwise normalized phone/email.
- Revenue should be returned as a numeric major currency amount, suitable for frontend GBP display.

## Response Contract

```json
{
  "rows": [
    {
      "leadSource": "facebook",
      "numberOfLeads": 42,
      "calendlyBooked": true,
      "talkToAnAgent": 18,
      "sales": 3,
      "revenue": 750
    }
  ],
  "total": 2,
  "options": {
    "agents": [
      { "agentId": 12, "agentName": "Agent Name" }
    ]
  }
}
```

The frontend also tolerates these aliases for compatibility:

- `items` instead of `rows`
- `source` instead of `leadSource`
- `leadCount` instead of `numberOfLeads`
- `talkedToAgent` instead of `talkToAnAgent`

## Acceptance Criteria

- `?tab=highLevelFunnels` loads a table for simulator pensie lead intents.
- Every source appears as separate Calendly booked Yes/No rows when both groups exist.
- Date begin/end filters restrict the lead-intent population.
- Agent filter restricts the report to leads that selected agent talked to.
- Connected dialler conversations count only when `agentId > 0` and `agentId != 5`.
- Sales count and revenue are numeric and align with the same lead/contact population used for leads.
- Existing CRM endpoints and tabs continue to work.
