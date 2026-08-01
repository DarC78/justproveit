# CRM Lead Intent Status Buckets Backend Spec

## Context

The CRM intents tab calls:

`GET /justproveit/admin/crm/lead-intents`

with `statusBucket` set to one of:

- `nocall`
- `postcallfu`
- `finished`

The frontend only sends the bucket value. The backend must own the technical filtering rules.

## Important Field Definitions

Use `LaunchingStack.crm.LeadIntents` as the CRM intent source.

Relevant columns:

- `CreatedAtUtc`
- `ClosedAtUtc`
- `Status`
- `LastCallTimeUtc`
- `LastCallAgentId`
- `LastCallCode`
- `LastCallCodeDetails`
- `LastCallTraceId`

## Qualifying Agent Conversation

A qualifying agent conversation is a post-intent call where the person actually spoke to an agent.

The backend should treat a call as qualifying only when:

- the call occurred after the intent `CreatedAtUtc`
- agent identity is present and valid: `LastCallAgentId IS NOT NULL AND LastCallAgentId > 0`
- call time is present: `LastCallTimeUtc IS NOT NULL`
- call code is meaningful: `LastCallCode IS NOT NULL`
- call code is not voicemail: `LastCallCode <> 5`
- call code is not default/no-agent/no-result: `LastCallCode > 0`

Do not treat voicemail as a qualifying conversation, even when `LastCallAgentId` is populated.

## `statusBucket=nocall`

Return open CRM lead intents where no qualifying agent conversation exists yet.

Technical condition:

```sql
li.ClosedAtUtc IS NULL
AND NOT EXISTS (
  -- a post-intent call for this contact/phone where:
  -- call time >= li.CreatedAtUtc
  -- agent id > 0
  -- call code > 0
  -- call code <> 5
)
```

This bucket may include rows with no call at all, voicemail only, default/no-agent call rows, or other non-qualifying call attempts.

## `statusBucket=postcallfu`

Return open CRM lead intents where a qualifying agent conversation exists, but the intent is not terminal/finished.

Technical condition:

```sql
li.ClosedAtUtc IS NULL
AND EXISTS (
  -- a post-intent call for this contact/phone where:
  -- call time >= li.CreatedAtUtc
  -- agent id > 0
  -- call code > 0
  -- call code <> 5
)
AND li.Status NOT IN (
  -- backend terminal statuses
)
```

Follow-up statuses such as `PostCallFU` and callback-style statuses should stay in this bucket while `ClosedAtUtc IS NULL`.

## `statusBucket=finished`

Return CRM lead intents that are terminal/closed.

Technical condition:

```sql
li.ClosedAtUtc IS NOT NULL
OR li.Status IN (
  -- backend terminal statuses
)
```

The backend should use `ClosedAtUtc` as the primary terminal marker. Terminal status values should include the existing closed/completed outcomes used by the CRM, for example `Closed`, `Solved`, `CollapsedDuplicate`, `cancelled`, final sale/no-sale callcode labels, and other statuses that the backend already treats as no longer actionable.

## Acceptance Criteria

- `/lead-intents?statusBucket=nocall` returns open intents with no qualifying post-intent agent conversation.
- `/lead-intents?statusBucket=postcallfu` returns open intents with a qualifying post-intent agent conversation and no terminal marker.
- `/lead-intents?statusBucket=finished` returns terminal intents.
- Voicemail (`LastCallCode = 5`) does not move an intent from `nocall` to `postcallfu`.
- Default/no-agent calls (`LastCallCode <= 0` or invalid/no agent) do not move an intent from `nocall` to `postcallfu`.
- If `statusBucket=finished` is supplied, the backend should not accidentally exclude finished rows because the request also includes `closed=false`; either ignore `closed=false` for this bucket or define a clear precedence rule.
