# CRM ASAP Intent Reservation Backend Spec

## Context

CRM agents work from:

`/admin/crm/?tab=intents`

Today, double-clicking a row in the `Lead Intents` table opens the selected lead in `Detalii Lead`.

For `ASAP` intents only, double-click should also reserve the intent so it disappears from the `Lead Intents` queue while the agent manually calls the lead. After the reservation expires, the intent should appear again if it was not otherwise completed.

## Timing

The requested timing needs one business confirmation:

- "not visible ... for 5 minutes"
- "After 15 minutes the lead should be visible again"

Recommended default:

- use a configurable reservation TTL
- set the first production default to `15` minutes unless the business confirms `5`

The frontend can send a desired TTL, but the backend should enforce the configured min/max.

## Required Endpoint 1: Reserve ASAP Intent

Create:

`POST /justproveit/admin/crm/lead-intents/{interestId}/reservation`

Authentication:

- require the same CRM/admin bearer token auth as the other CRM admin routes
- derive the agent/user from the auth token when possible
- also accept `agent` in the body for display/audit compatibility with the current frontend

Request body:

```json
{
  "agent": "Agent Name",
  "reservationTtlMinutes": 15,
  "reason": "Opened ASAP intent from Lead Intents tab"
}
```

Behavior:

- only allow reservation for intents where `interestType = "ASAP"`
- atomically reserve the intent if it is not already reserved with an unexpired reservation
- set:
  - `reservedByUserId`
  - `reservedByAgent`
  - `reservedAtUtc`
  - `reservationExpiresAtUtc`
  - optional `reservationReason`
- if the same agent opens the same already-reserved intent, return success and refresh/extend the reservation if desired
- if another agent already has an unexpired reservation, return `409 Conflict`
- do not close or finish the intent
- do not add the lead to dialler or remove it from dialler
- do not hide non-ASAP intents

Suggested success response:

```json
{
  "success": true,
  "reservation": {
    "interestId": "intent-id",
    "reservedByAgent": "Agent Name",
    "reservedAtUtc": "2026-08-08T07:30:00.000Z",
    "reservationExpiresAtUtc": "2026-08-08T07:45:00.000Z"
  },
  "intent": {
    "interestId": "intent-id",
    "interestType": "ASAP"
  }
}
```

Suggested conflict response:

```json
{
  "success": false,
  "error": {
    "code": "intent_reserved",
    "message": "This ASAP intent is already reserved.",
    "reservedByAgent": "Other Agent",
    "reservationExpiresAtUtc": "2026-08-08T07:45:00.000Z"
  }
}
```

## Required Endpoint 2: Lead Intent List Filtering

Update:

`GET /justproveit/admin/crm/lead-intents`

Default behavior:

- exclude `ASAP` intents with `reservationExpiresAtUtc > current UTC time`
- exclude active reservations for every agent, including the agent who created the reservation
- continue returning non-ASAP intents normally
- expired reservations should not hide rows
- if an intent is completed/closed while reserved, existing closed/completed filtering still takes precedence

Optional query params:

- `includeReserved=true`: include reserved rows for admin/debug views
- `reservationMode=available`: default, exclude unexpired reservations
- `reservationMode=all`: include all rows and return reservation metadata

If reservation metadata is returned, add optional fields to each row:

```json
{
  "interestId": "intent-id",
  "interestType": "ASAP",
  "reservedByAgent": "Agent Name",
  "reservedAtUtc": "2026-08-08T07:30:00.000Z",
  "reservationExpiresAtUtc": "2026-08-08T07:45:00.000Z"
}
```

## Frontend Flow After Backend Is Ready

On double-click in the `Lead Intents` table:

1. If `interestType !== "ASAP"`, keep the current behavior: open `Detalii Lead`.
2. If `interestType === "ASAP"`, call:
   `POST /justproveit/admin/crm/lead-intents/{interestId}/reservation`
3. If reservation succeeds:
   - open `Detalii Lead`
   - remove the row locally from the current table
4. If reservation returns `409`:
   - do not open the lead
   - show the conflict message
   - refresh the Lead Intents list
5. When the agent later returns to `Lead Intents`, the list endpoint should already exclude active reservations.

## Acceptance Criteria

- Double-clicking a non-ASAP intent keeps the existing behavior.
- Double-clicking an ASAP intent reserves it and opens `Detalii Lead`.
- A reserved ASAP intent disappears from `Lead Intents` for all agents.
- The same reserved ASAP intent appears again after the configured TTL if it is still open.
- If two agents double-click the same ASAP intent at nearly the same time, only one reservation succeeds.
- A conflicting reservation returns `409` with the reserving agent and expiry time when available.
- Existing filters such as `createdLastDays`, `statusBucket`, `intent`, `service`, `language`, `phone`, `lastCallAgentId`, `closed`, `includeMissedCalls`, and `calendlyOnlyToday` continue to work.
- Reservation events are auditable without logging full phone numbers unnecessarily.
