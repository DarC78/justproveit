# CRM Lead Intents Call Metrics Backend Spec

## Objective

Update:

`GET /justproveit/admin/crm/lead-intents`

so the intents table on:

`https://justproveit.co.uk/admin/crm/?tab=intents`

can display call metrics around each intent creation time.

## Required Row Fields

For every row in `rows[]` / `items[]`, return:

```json
{
  "totalPreviousCalls": 3,
  "postIntentLastCallAgentId": 123,
  "postIntentLastCallAgentName": "Agent Name",
  "postIntentLastCallTraceId": 987654,
  "postIntentLastCallTimeUtc": "2026-08-01T10:30:00.000Z",
  "postIntentLastCallCode": 17,
  "postIntentLastCallCodeDetails": "SE_MAI_GANDESTE"
}
```

Preferred canonical names:

- `totalPreviousCalls`
- `postIntentLastCallAgentId`
- `postIntentLastCallAgentName`
- `postIntentLastCallTraceId`
- `postIntentLastCallTimeUtc`
- `postIntentLastCallCode`
- `postIntentLastCallCodeDetails`

Optional aliases accepted by the frontend for the human-readable callcode label:

- `postIntentLastCallCodeName`
- `postIntentLastCallCodeDescription`

The frontend also tolerates these aliases for backwards compatibility:

- `totalPreviousTalkedCalls`
- `totalPreviousConnectedCalls`
- `lastPostIntentCallAgentId`
- `lastPostIntentCallAgentName`
- `lastPostIntentCallTimeUtc`
- `lastPostIntentCallCode`
- `lastPostIntentCallCodeDetails`
- `lastPostIntentCallCodeName`
- `lastPostIntentCallCodeDescription`
- existing `lastCallAgentId`, `lastCallAgentName`, `lastCallTimeUtc`, `lastCallCode`, `lastCallCodeDetails` if LaunchingStack changes those fields to the new semantics

## Matching Rules

Match calls by the intent person's phone number:

- include calls to that number
- include calls from that number
- use the same phone normalization/canonical contact matching as the other CRM call-history endpoints
- if the contact has multiple known phone numbers, use all known numbers for that contact where possible

## Talked-To-Agent Rule

Only count/select calls where the person spoke with an agent:

- exclude voicemail / `callCode = 5`
- exclude no-agent / no-answer / abandoned rows according to the existing backend calltrace classification
- require the existing backend condition that means a real agent conversation occurred, for example agent id/name present, connected duration, or the established calltrace connected-call rule

Use the same rule consistently for all fields below.

## Field Rules

### TotalPreviousCalls

`totalPreviousCalls` is the number of qualifying talked-to-agent calls for that person before the intent creation timestamp.

Rules:

- compare against the intent row's `createdAtUtc`
- call timestamp must be strictly before `createdAtUtc`
- include inbound and outbound calls
- exclude `callCode = 5`
- return `0` when there are no qualifying previous calls

### LastAgent

`postIntentLastCallAgentName` / `postIntentLastCallAgentId` is the agent from the latest qualifying talked-to-agent call after the intent creation timestamp.

Rules:

- call timestamp must be on or after `createdAtUtc`
- include inbound and outbound calls
- exclude `callCode = 5`
- choose the latest qualifying call by call timestamp

### LastCall

`postIntentLastCallTimeUtc` is the timestamp of that same latest qualifying post-intent call.

### LastCallCode

`postIntentLastCallCode` is the numeric call code of that same latest qualifying post-intent call.

`postIntentLastCallCodeDetails` must be the human-readable name/description for that same call code. The CRM table
displays this description in `LastCallCode`, not the numeric ID. If no description is available, the frontend falls back
to the numeric code only as a last resort.

## Frontend Mapping

The deployed frontend table displays:

- `TotalPreviousCalls`: `totalPreviousCalls`
- `LastAgent`: `postIntentLastCallAgentId` + `postIntentLastCallAgentName`
- `LastCall`: `postIntentLastCallTimeUtc`
- `LastCallCode`: `postIntentLastCallCodeDetails`

The old `Agent Name` column has been replaced by `TotalPreviousCalls`.

## Acceptance Criteria

- `/lead-intents` returns `totalPreviousCalls` for every visible intent row.
- For contacts with qualifying calls before the intent date, `totalPreviousCalls` is greater than `0`.
- Calls with `callCode = 5` do not count.
- Calls where the person did not speak with an agent do not count.
- For contacts with qualifying calls after the intent date, `postIntentLastCall*` fields describe the latest such call.
- Inbound and outbound calls are both considered.
- Existing filters continue to work, including `createdLastDays`, `statusBucket`, `intent`, `service`, `language`, `phone`, `lastCallAgentId`, `closed`, `includeMissedCalls`, and `calendlyOnlyToday`.
