# CRM High Level Funnels Backend Spec

## Objective

Implement a proper backend aggregate endpoint for:

`GET /justproveit/admin/crm/high-level-funnels`

The JustProveIt frontend renders this endpoint on:

`https://www.justproveit.co.uk/admin/crm?tab=highLevelFunnels`

The first required funnel is for lead intents related to `simulator pensie`.

This endpoint must replace the temporary frontend fallback. The fallback can only infer partial counts from `/lead-intents`; the backend should join lead intents, contact identity, Calendly bookings, dialler calls, sales, and revenue properly.

## Deployment Target

Implement this in the backend repository that owns the JustProveIt CRM API routes:

`/justproveit/admin/crm/*`

Official CRM API host:

- `https://launchingstack-func-dev.azurewebsites.net/api`

The frontend calls CRM read endpoints through `NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL`, currently defaulting to `launchingstack-func-dev` in this frontend repository. Deploy the new route to `launchingstack-func-dev`.

Do not implement this as a frontend-only calculation.

## Endpoint

`GET /justproveit/admin/crm/high-level-funnels`

### Auth

Use the same bearer-token CRM admin auth as:

- `GET /justproveit/admin/crm/lead-intents`
- `GET /justproveit/admin/crm/sales`

Reject unauthenticated or non-CRM users consistently with existing CRM endpoints.

### Query Parameters

- `dateBegin`: inclusive date in `YYYY-MM-DD` format.
- `dateEnd`: inclusive date in `YYYY-MM-DD` format.
- `agentId`: `all` or a numeric dialler agent id.
- `service`: currently sent as `simulator pensie`.
- `intent`: currently sent as `all`.

Treat blank/missing values as:

- `dateBegin`: last 30 days start date.
- `dateEnd`: today.
- `agentId`: `all`.
- `service`: `simulator pensie`.
- `intent`: `all`.

Validate invalid dates and invalid agent ids with HTTP 400.

## Report Shape

Return one row per:

`leadSource + calendlyBooked`

For every lead source with matching leads, split rows into:

- `calendlyBooked: true`
- `calendlyBooked: false`

If a source has only one side, returning only the populated row is acceptable. Returning both rows, with zeroes for the missing side, is also acceptable and preferred for stable table rendering.

Frontend table columns:

- `Lead source`
- `Number of leads`
- `Calendly booked`
- `Talk to an agent`
- `Sales`
- `Revenue`

## Core Definitions

### Base Lead Population

The base population is lead-intent records for the selected service group:

`simulator pensie`

Use the backend's canonical service identifiers where available. The matching should include known variants such as:

- `simulator pensie`
- `simulatorpensie`
- `SIMULATOR_PENSIE`
- `SIMULATOR_PENSII`
- service display names containing `simulator pensie`

The base lead rows should be non-Calendly intent rows, especially `ASAP` rows. This is important because a user may first submit a Facebook lead form as `ASAP`, then later book Calendly as a second event/intent.

Recommended base intent rule:

- Include `ASAP` and other non-Calendly acquisition/contact-request intents.
- Exclude `CALENDLY` rows from the base lead count, otherwise the same person can be counted twice.
- If business wants only `ASAP`, implement `intent=ASAP` support and default this report to `ASAP`.

### Date Filter

Apply `dateBegin` / `dateEnd` to the base acquisition/contact-request lead intent creation timestamp.

Use inclusive local-date semantics:

- `dateBegin` means `YYYY-MM-DD 00:00:00.000`
- `dateEnd` means `YYYY-MM-DD 23:59:59.999`

If database timestamps are UTC, convert consistently and document the timezone used. Production frontend users expect UK/Europe-London business dates unless the CRM already standardizes on UTC.

### Lead Source

`leadSource` should come from the base lead intent source field.

Examples:

- `facebook_lead_ad`
- `meta`
- `website`
- `google`
- `Unknown`

Use `Unknown` for blank/null sources.

### Unique Person / Lead Identity

Build a canonical identity per person/contact so that multiple intent rows for the same person are correlated.

Preferred matching order:

1. Canonical CRM contact id.
2. CRM contact id.
3. Lead id / legacy lead id / Wix id.
4. Normalized phone number.
5. Normalized email.

Important:

- Phone matching should use normalized phone where available.
- If only raw phone is available, normalize before comparing.
- Email matching should be case-insensitive and trimmed.
- A person should be counted once per base lead source in the date range.
- Avoid double-counting the same person when they have both `ASAP` and `CALENDLY` simulator-pensie intent rows.

## Calendly Booked Logic

This is the key business rule.

`calendlyBooked = true` when the same person/contact from the base lead population has any matching Calendly booking for simulator pensie.

Do not require the base row itself to have `interestType = CALENDLY`.

Example:

1. Person leaves phone number through Meta/Facebook lead ad.
2. Backend creates base intent:
   - `source = facebook_lead_ad`
   - `interestType = ASAP`
   - `service = simulator pensie`
3. The same person later books a call through Calendly.
4. Backend creates or stores a second event/intent:
   - `interestType = CALENDLY`
   - same canonical contact id, phone, or email.

The report row should count that person under:

`facebook_lead_ad | calendlyBooked: true`

Not under:

`facebook_lead_ad | calendlyBooked: false`

Calendly matching should use the identity rules above.

Calendly booking should be counted if it is associated with the same simulator-pensie service. If the backend has a reliable Calendly appointment table, prefer that over inferring only from lead-intent rows.

Recommended Calendly sources, in priority order:

1. Canonical appointment/Calendly booking table with contact id/phone/email.
2. Lead-intent rows where `interestType = CALENDLY`.
3. CRM activity rows that explicitly represent a Calendly booking.

## Talk To An Agent Logic

`talkToAnAgent` counts unique people in the row who had at least one connected dialler conversation.

Connected conversation rule:

- Dialler record has an agent id.
- `agentId > 0`.
- `agentId != 5`.
- The call is connected/spoken, not missed, failed, abandoned, voicemail-only, or unanswered.

Use the same connected-call definition used by existing CRM sales/dialler reporting where possible.

If call code is needed, document the call-code list considered connected. Do not count voicemail code `5` as talked to agent.

### Agent Filter

When `agentId=all`:

- Include all base leads.
- `talkToAnAgent` counts people spoken to by any valid agent.

When `agentId=<number>`:

- Include only base leads where that specific agent spoke with the person/contact.
- Count `talkToAnAgent` for people spoken to by that selected agent.
- Still keep Calendly booking correlation independent of agent; after the base lead passes the agent filter, decide Yes/No by whether the person booked Calendly.

Example:

If lead A was created from `facebook_lead_ad`, booked Calendly, and agent 12 spoke to them:

- `agentId=all`: included in `facebook_lead_ad | Yes`.
- `agentId=12`: included in `facebook_lead_ad | Yes`.
- `agentId=13`: not included unless agent 13 also spoke to them.

## Sales And Revenue Logic

`sales` counts unique sales attributed to people in the row.

`revenue` sums the sale amount for those attributed sales.

Sales matching priority:

1. Canonical contact id.
2. CRM contact id.
3. Normalized phone.
4. Normalized email.

Use the same sale source and amount fields as the existing CRM sales endpoint:

- `amountTotalMajor` is preferred if available.
- If only minor units exist, convert to major units before returning.

Return revenue as a numeric major GBP amount, not formatted text.

Avoid double-counting:

- One sale should count once.
- One person with multiple sales can count multiple sales if those are genuine distinct transactions.
- If the same sale is visible through multiple matching keys, dedupe by sale id.

Recommended sale window:

- Include sales created after the base lead intent creation date.
- If a sale occurred before the lead intent creation date, do not attribute it to that lead.
- No hard upper window unless business specifies one.

If backend cannot safely implement revenue in the first pass, return `sales: 0`, `revenue: 0`, and document the limitation. Preferred implementation includes both.

## Response Contract

Preferred JSON:

```json
{
  "rows": [
    {
      "leadSource": "facebook_lead_ad",
      "numberOfLeads": 24,
      "calendlyBooked": true,
      "talkToAnAgent": 11,
      "sales": 3,
      "revenue": 750
    },
    {
      "leadSource": "facebook_lead_ad",
      "numberOfLeads": 81,
      "calendlyBooked": false,
      "talkToAnAgent": 27,
      "sales": 4,
      "revenue": 1000
    }
  ],
  "total": 2,
  "filters": {
    "dateBegin": "2026-06-01",
    "dateEnd": "2026-07-03",
    "agentId": "all",
    "service": "simulator pensie",
    "intent": "all"
  },
  "options": {
    "agents": [
      { "agentId": 12, "agentName": "Agent Name" }
    ]
  }
}
```

Required row fields:

- `leadSource`: string.
- `numberOfLeads`: number.
- `calendlyBooked`: boolean.
- `talkToAnAgent`: number.
- `sales`: number.
- `revenue`: number.

Compatibility aliases currently tolerated by the frontend:

- `items` instead of `rows`.
- `source` instead of `leadSource`.
- `leadCount` instead of `numberOfLeads`.
- `talkedToAgent` instead of `talkToAnAgent`.

Do not rely on aliases for the new backend implementation; return the preferred field names.

## Suggested SQL / Implementation Outline

Exact table names may differ. Adapt to the backend schema.

1. Select base simulator-pensie lead intents:
   - service matches simulator pensie.
   - created date inside range.
   - intent is non-Calendly, preferably `ASAP`.
   - include source and contact identity fields.

2. Build a deduped base lead/contact set:
   - one row per canonical person/contact/source.
   - preserve earliest base intent created date for attribution.

3. Build Calendly set:
   - simulator-pensie Calendly bookings/intents.
   - keyed by canonical contact id/contact id/lead id/phone/email.

4. Build connected-call set:
   - valid connected dialler calls.
   - `agentId > 0 AND agentId <> 5`.
   - keyed by person/contact.
   - include agent ids for filtering.

5. Build sales set:
   - sales keyed by person/contact.
   - dedupe by sale id.
   - use amount major.
   - sale date >= base lead created date.

6. Join:
   - base leads left join Calendly set.
   - base leads left join connected-call set.
   - base leads left join sales set.

7. If `agentId != all`, filter joined base leads to those with a connected call by the selected agent.

8. Group by:
   - base lead source.
   - Calendly booked boolean.

9. Aggregate:
   - `numberOfLeads = COUNT(DISTINCT basePersonKey)`.
   - `talkToAnAgent = COUNT(DISTINCT basePersonKey WHERE hasConnectedCall)`.
   - `sales = COUNT(DISTINCT saleId)`.
   - `revenue = SUM(DISTINCT sale amount by saleId)`.

## Diagnostic Requirements

Backend developers should add temporary SQL/API verification queries for these known checks:

### Facebook ASAP Then Calendly

Find base leads where:

- `source = facebook_lead_ad`
- service = simulator pensie
- base intent = `ASAP`
- same person/contact has Calendly booking

Expected:

- These people count under `facebook_lead_ad | calendlyBooked: true`.
- They do not count under `facebook_lead_ad | calendlyBooked: false`.

### Agent Filter

Pick one known agent who spoke to simulator-pensie leads.

Expected:

- `agentId=all` has total leads >= selected-agent report.
- `agentId=<agent>` includes only people that agent spoke with.
- `talkToAnAgent` should equal `numberOfLeads` or be close for selected-agent filtered rows, depending on whether the selected-agent filter includes all qualifying people by spoken-call existence.

### Sales Attribution

Pick one known sale connected to a simulator-pensie lead.

Expected:

- Sale appears in exactly one source + Calendly bucket.
- Revenue is included once.
- Same sale does not duplicate through phone and email joins.

## Example Requests

Production-style request:

`GET https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/high-level-funnels?dateBegin=2026-06-01&dateEnd=2026-07-03&agentId=all&service=simulator%20pensie&intent=all`

Agent-filtered request:

`GET https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/high-level-funnels?dateBegin=2026-06-01&dateEnd=2026-07-03&agentId=12&service=simulator%20pensie&intent=all`

## Acceptance Criteria

- Endpoint returns HTTP 200 for authorized CRM users.
- The frontend no longer needs its lead-intents fallback for this report.
- `facebook_lead_ad` ASAP leads that later booked Calendly are counted in `calendlyBooked: true`.
- Calendly booking is correlated by person/contact, not by requiring the same base row to be `CALENDLY`.
- Date filters apply to the base lead acquisition/contact-request intent.
- Agent filter includes only leads the selected agent actually spoke with.
- `talkToAnAgent` uses connected calls only and excludes `agentId = 5`.
- Sales and revenue are deduped and attributed to the same lead/contact population.
- Existing CRM endpoints continue to work unchanged.

## Frontend Cleanup Status

The temporary frontend fallback has been removed after backend deployment. The current frontend uses:

`listCrmHighLevelFunnels()`

as the source of truth for High Level Funnels.

The relevant frontend file is:

`src/pages/admin/crm.tsx`
