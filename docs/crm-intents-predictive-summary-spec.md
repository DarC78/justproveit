# CRM Intents Predictive Summary Spec

## Context

The JustProveIt admin CRM intents tab calls:

`GET /justproveit/admin/crm/lead-intents`

The response includes `predictiveCampaignSummary`, which the frontend renders underneath the lead intent filter summary.

The route is deployed in Azure Function app `apiprocess`, script file `justproveitcrmnative.js`, from the `DarC78/proveitweb-live` repository.

## Required Backend Fields

For each item in `predictiveCampaignSummary`, return:

- `finishedLeadsToAg`: number of finished leads that should be counted as "To Ag".
- `finishedNotAg`: number of finished leads that should be counted as "Not Ag".
- `topCallCodes`: call-code frequency rows covering call codes greater than zero, including call code `5`.

The frontend currently accepts fallback aliases for backwards compatibility:

- To Ag: `finishedLeadsToAg`, `finishedToAg`, or `leadsToAg`.
- Not Ag: `finishedNotAg` or `noAgLeads`.

## Display Rules

The frontend displays the queue summary as:

`<queue_name> | Total Leads: <total> | Finished Leads To Ag <finishedLeadsToAg> | Finished Not Ag <finishedNotAg> | ToBeDialled <toBeDialled> | VoiceMails: <voiceMailCount> | <top1>: <count> | <top2>: <count> | <top3>: <count> | <top4>: <count> | <top5>: <count> | Dialled zero times: <zero> / 1-3 times: <oneToThree> / 4-5 times: <fourToFive> / 5+ times: <fivePlus> | Called Today: <today> (<yesterday>) Connected Today: <connectedToday> (<connectedYesterday>)`

`VoiceMails` is the count for call code `5`.

The top call-code list should be sorted by `count` descending and should exclude:

- call code `0`
- call code `5`
- default/no-call labels

## Acceptance Criteria

- Call code `5` appears only as `VoiceMails`, not in the top five call-code list.
- The top five list contains the five most frequent call codes where `callCode > 0` and `callCode !== 5`.
- Existing totals for `Total Leads`, `ToBeDialled`, dial attempts, and today/yesterday call stats remain unchanged.
- If the backend omits the new finished AG fields, the frontend safely displays `0` until the API is updated.
