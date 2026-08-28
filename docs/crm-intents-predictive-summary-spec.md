# CRM Intents Predictive Campaign Summary Backend Spec

## Objective

Update the backend for:

`GET /justproveit/admin/crm/lead-intents`

so every row in `predictiveCampaignSummary` includes:

- split finished lead counts:
  - `finishedLeadsToAg`
  - `finishedNotAg`
- call-code frequency rows:
  - `topCallCodes`, including call code `5`

The frontend already renders these fields on:

`https://www.justproveit.co.uk/admin/crm?tab=intents`

## Important Deployment Target

The JustProveIt frontend reads lead-intents from the canonical CRM read API:

`NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL`

The GitHub Static Web Apps workflow sets that value to:

`https://launchingstack-func-dev.azurewebsites.net/api`

So this backend change must be deployed to the CRM function app serving:

`https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/lead-intents`

The frontend source of truth for this CRM screen is `launchingstack-func-dev`; do not route this frontend screen away from `launchingstack-func-dev` as the fix.

## Current Problem

For `SIMULATOR_PENSII_JUNE_2026_REAL_TIME`, the frontend receives this shape from `launchingstack-func-dev`:

```json
{
  "queueId": 39,
  "campaignName": "SIMULATOR_PENSII_JUNE_2026_REAL_TIME",
  "totalLeads": 152,
  "finishedLeads": 57,
  "toBeDialled": 95,
  "toBeDialledLastCallCode5": 10,
  "topCallCodes": []
}
```

Because `topCallCodes` is empty and the new finished fields are missing, the frontend shows:

`Finished Leads To Ag 0 | Finished Not Ag 0 | VoiceMails: 10`

with no call-code frequency list.

## Required Response Contract

Each `predictiveCampaignSummary[]` item must return:

```json
{
  "queueId": 39,
  "campaignName": "SIMULATOR_PENSII_JUNE_2026_REAL_TIME",
  "totalLeads": 152,
  "finishedLeads": 57,
  "finishedLeadsToAg": 57,
  "finishedNotAg": 0,
  "toBeDialled": 95,
  "toBeDialledLastCallCode5": 10,
  "voiceMailCount": 10,
  "toBeDialledZeroTrials": 18,
  "toBeDialledOneToThreeTrials": 22,
  "toBeDialledFourToFiveTrials": 55,
  "toBeDialledFivePlusTrials": 0,
  "calledToday": 0,
  "connectedToday": 0,
  "calledYesterday": 0,
  "connectedYesterday": 0,
  "topCallCodes": [
    { "callCode": 5, "label": "Voice Mail", "count": 10 },
    { "callCode": 17, "label": "SE_MAI_GANDESTE", "count": 20 },
    { "callCode": 26, "label": "PROGRAMARE_CONSULTATIE", "count": 12 },
    { "callCode": 20, "label": "CLAR_NU", "count": 9 },
    { "callCode": 19, "label": "A_Inchis_Telefonul", "count": 7 },
    { "callCode": 7, "label": "NO_QUALIFY", "count": 4 }
  ]
}
```

Keep existing fields unchanged for backwards compatibility:

- `finishedLeads`
- `toBeDialled`
- `toBeDialledLastCallCode5`
- dial attempt buckets
- today/yesterday call stats

Optional aliases are tolerated by the frontend, but the preferred canonical names are:

- `finishedLeadsToAg`
- `finishedNotAg`

## Counting Rules

### Finished Leads To Ag

`finishedLeadsToAg` should count finished leads whose final/most relevant finished state means they should go to an agent or appointment/follow-up workflow.

Use the business classification implemented in LaunchingStack. During testing, the expected values were:

- `SIMULATOR_PENSII_JUNE_2026_REAL_TIME`: `finishedLeadsToAg = 57`
- `MISSED_CALLS`: `finishedLeadsToAg = 48`

### Finished Not Ag

`finishedNotAg` should count finished leads that are completed but should not go to an agent.

During testing, the expected values were:

- `SIMULATOR_PENSII_JUNE_2026_REAL_TIME`: `finishedNotAg = 0`
- `MISSED_CALLS`: `finishedNotAg = 25`

### VoiceMails

`voiceMailCount` must be the frequency count for call code `5`.

Also include the call code `5` row in `topCallCodes` so clients can derive the count if needed:

```json
{ "callCode": 5, "label": "Voice Mail", "count": 10 }
```

### Top Call Codes

`topCallCodes` should include frequency rows for call codes found in the queue/campaign summary.

Rules:

- Include call codes greater than `0`.
- Include call code `5`.
- Exclude default/no-call rows from the frequency list.
- Return enough rows for the frontend to display the top five non-voicemail codes after removing code `5`.
- Sort by `count` descending. If counts tie, sort by `callCode` ascending.
- Each row should include:
  - `callCode`
  - `label`
  - `count`

The frontend will display:

- call code `5` as `VoiceMails`
- the five most frequent `callCode > 0 && callCode !== 5` rows as:
  - `<label>: <count>`

## Frontend Display

The deployed frontend formats each campaign like:

`<queue_name> | Total Leads: <total> | Finished Leads To Ag <finishedLeadsToAg> | Finished Not Ag <finishedNotAg> | ToBeDialled <toBeDialled> | VoiceMails: <voiceMailCount> | <top1>: <count> | <top2>: <count> | <top3>: <count> | <top4>: <count> | <top5>: <count> | Dialled zero times: <zero> / 1-3 times: <oneToThree> / 4-5 times: <fourToFive> / 5+ times: <fivePlus> | Called Today: <today> (<yesterday>) Connected Today: <connectedToday> (<connectedYesterday>)`

## Expected Example

For `SIMULATOR_PENSII_JUNE_2026_REAL_TIME`, the page should show something like:

`SIMULATOR_PENSII_JUNE_2026_REAL_TIME | Total Leads: 152 | Finished Leads To Ag 57 | Finished Not Ag 0 | ToBeDialled 95 | VoiceMails: 10 | SE_MAI_GANDESTE: 20 | PROGRAMARE_CONSULTATIE: 12 | CLAR_NU: 9 | A_Inchis_Telefonul: 7 | NO_QUALIFY: 4 | Dialled zero times: 18 / 1-3 times: 22 / 4-5 times: 55 / 5+ times: 0 | Called Today: 0 (0) Connected Today: 0 (0)`

## Acceptance Criteria

- An authenticated browser request from `https://www.justproveit.co.uk/admin/crm?tab=intents` to `launchingstack-func-dev` returns `200` JSON for `/justproveit/admin/crm/lead-intents` and does not show `Failed to load CRM lead intents`.
- CORS preflight from `https://www.justproveit.co.uk` allows `GET` and the `authorization` header on `/justproveit/admin/crm/lead-intents`.
- `launchingstack-func-dev` returns `finishedLeadsToAg`, `finishedNotAg`, and populated `topCallCodes`.
- `launchingstack-func-dev` returns a stable `predictiveCampaignSummary` for the same filters, unless there is a documented reason results differ over time.
- `VoiceMails` equals the count for call code `5`.
- Call code `5` does not appear in the frontend top-five frequency list because the frontend separates it into `VoiceMails`.
- The top-five frequency list shows the most frequent non-zero, non-5 call codes.
- Existing filters for `/lead-intents` still work:
  - `createdLastDays`
  - `statusBucket`
  - `toBeContacted`
  - `intent`
  - `service`
  - `language`
  - `phone`
  - `lastCallAgentId`
  - `closed`
  - `includeMissedCalls`
  - `calendlyOnlyToday`
  - `limit`

## Verification

After deployment, call:

`GET https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/lead-intents?createdLastDays=30&statusBucket=nocall&toBeContacted=oricand&intent=all&service=all&language=all&lastCallAgentId=all&closed=false&includeMissedCalls=false&calendlyOnlyToday=false&limit=300`

with a valid JustProveIt admin bearer token.

For `SIMULATOR_PENSII_JUNE_2026_REAL_TIME`, verify:

- `finishedLeadsToAg` is non-zero when applicable.
- `finishedNotAg` is present.
- `topCallCodes` contains at least:
  - call code `5`
  - the most frequent non-5 call codes.

Then hard-refresh:

`https://www.justproveit.co.uk/admin/crm?tab=intents`

and confirm the summary line includes the call-code frequency labels and counts.
