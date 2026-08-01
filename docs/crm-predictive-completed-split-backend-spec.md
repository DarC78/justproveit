# CRM Predictive Completed Split Backend Spec

## Objective

Update:

`GET /justproveit/admin/crm/lead-intents`

so each `predictiveCampaignSummary[]` item can split the existing `completed` count into:

- `completedNoAgent`
- `completedTalkedToAgent`

The frontend will display:

`Completed - no agent: <completedNoAgent> | Completed - talked to agent: <completedTalkedToAgent>`

When these fields are missing, the frontend keeps the old `Completed: <completed>` fallback.

## Required Response Fields

Add these fields to every predictive campaign summary row:

```json
{
  "completed": 332,
  "completedNoAgent": 275,
  "completedTalkedToAgent": 57
}
```

The exact values above are illustrative. The required invariant is:

```text
completedNoAgent + completedTalkedToAgent = completed
```

## Completed Base Set

Use the same backend predicate currently used for `completed`.

Do not introduce a second definition of completed. The split must partition the same lead set that currently produces:

```text
completed = totalLeads - notDialled - availableLeads
```

For the current predictive dialler tables this appears to be equivalent to leads that are not still available under the predictive trial cap:

```sql
NOT (
  lc.STATUS = -1
  AND ISNULL(lc.CLIENT_TRIALS, 0) < qpp.MaxTrialsFor
)
```

where:

- `lc` = `server.dbo.leads_clients`
- `qpp` = `server.dbo.queuespredictiveprops`
- `qpp.QueueID = lc.QUEUE_ID`

If the LaunchingStack API already has a canonical completed predicate, use that exact predicate instead.

## Completed - Talked To Agent

`completedTalkedToAgent` counts completed leads where the lead was transferred/connected to an agent and the final/qualifying call code is not voicemail.

Recommended technical condition:

```sql
completed lead
AND EXISTS (
  SELECT 1
  FROM server.dbo.leads_numbers ln
  JOIN server.dbo.calltrace ct
    ON ct.DNIS = ln.PHONE_NO
   AND ct.QUEUEID = lc.QUEUE_ID
  WHERE ln.CLIENT_ID = lc.CLIENT_ID
    AND ct.AGENTID IS NOT NULL
    AND ct.AGENTID > 0
    AND ct.CALLCODE IS NOT NULL
    AND ct.CALLCODE > 0
    AND ct.CALLCODE <> 5
)
```

If the existing backend already has a more reliable "connected to agent" classifier, use that classifier, but it must still exclude voicemail `CALLCODE = 5`.

## Completed - No Agent

`completedNoAgent` counts every completed lead that is not counted in `completedTalkedToAgent`.

This includes:

- completed leads with no `calltrace` row
- completed leads dialled by the dialler but not connected to an agent
- completed leads with default/no-result call codes
- completed leads where the only connected result is voicemail, `CALLCODE = 5`

Recommended calculation:

```text
completedNoAgent = completed - completedTalkedToAgent
```

This avoids double-counting and guarantees the split reconciles to `completed`.

## Acceptance Criteria

- `predictiveCampaignSummary[]` includes `completedNoAgent` and `completedTalkedToAgent`.
- For every row, `completedNoAgent + completedTalkedToAgent = completed`.
- `CALLCODE = 5` is counted under `completedNoAgent`, not `completedTalkedToAgent`.
- Leads still in the available set are not counted in either completed split.
- The frontend summary line replaces `Completed: <n>` with the two split labels after these fields are present.
