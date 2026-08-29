# CRM Sales Dialler Agent Spec

## Context

The JustProveIt admin CRM sales tab calls:

`GET /justproveit/admin/crm/sales`

The route should be deployed in Azure Function app `launchingstack-func-dev`.

This frontend repository only renders the returned fields.

## Required Backend Change

Update `/justproveit/admin/crm/sales` so each sale row returns:

- `dialerowner`: the dialler agent who first spoke with the sale phone number within the last 30 days.
- `dialerlast`: the dialler agent who most recently spoke with the sale phone number.
- `dialerownerCallDateUtc`: the UTC timestamp of the call used for `dialerowner`.
- `dialerlastCallDateUtc`: the UTC timestamp of the call used for `dialerlast`.

The existing frontend labels these fields as `DialerFirst` and `DialerLast`.
The frontend displays the agent and date as `Agent Name (DD/MM/YYYY, HH:mm)` when the timestamp fields are present.

## Matching Rules

- Match sale phone numbers to dialler call records using the normalized phone number where available.
- If a sale has no normalized phone, normalize `phone` before matching.
- "Spoke with" should mean a connected call, not a missed, failed, abandoned, or unanswered dial attempt.
- For `dialerowner`, restrict candidate calls to the 30-day window ending at the sales API request time.
- For `dialerlast`, use the most recent connected call for the phone number. If product requirements prefer the same 30-day window, document and apply that consistently.
- If no matching connected call exists, return `null` or an empty value.

## Sales Response Contract

Do not remove existing fields. The frontend currently consumes:

- `name`
- `phone`
- `email`
- `amountTotalMajor`
- `wixCreatedDateUtc`
- `dialerowner`
- `dialerlast`
- `dialerownerCallDateUtc`
- `dialerlastCallDateUtc`

`storeowner` may remain in the response for backwards compatibility, but the JustProveIt sales tab no longer displays it.

For backwards compatibility, the frontend also accepts these timestamp aliases:

- first call: `dialerOwnerCallDateUtc`, `dialerownerCallDate`, `dialerOwnerCallDate`, `dialerownerCallTimeUtc`, `dialerOwnerCallTimeUtc`, `dialerownerAtUtc`, `dialerOwnerAtUtc`, `dialerFirstCallDateUtc`, `dialerfirstCallDateUtc`, `dialerFirstCallDate`, `dialerfirstCallDate`, `dialerFirstCallTimeUtc`, `dialerfirstCallTimeUtc`, `dialerFirstCallAtUtc`, `dialerfirstCallAtUtc`, `dialerFirstAtUtc`, `dialerfirstAtUtc`, `firstDialerCallAtUtc`, `firstDialerCallDateUtc`, `firstDialerCallDate`, `firstDiallerCallAtUtc`, `firstDiallerCallDateUtc`, `firstCallAtUtc`, `firstCallDateUtc`, `dialerFirstDate`
- last call: `dialerLastCallDateUtc`, `dialerlastCallDate`, `dialerLastCallDate`, `dialerlastCallTimeUtc`, `dialerLastCallTimeUtc`, `dialerlastAtUtc`, `dialerLastAtUtc`, `dialerlastCallAtUtc`, `dialerLastCallAtUtc`, `lastDialerCallAtUtc`, `lastDialerCallDateUtc`, `lastDialerCallDate`, `lastDiallerCallAtUtc`, `lastDiallerCallDateUtc`, `lastCallAtUtc`, `lastCallDateUtc`, `dialerLastDate`

Alias matching in the frontend is case-insensitive, but the canonical field names above are preferred.

## Acceptance Criteria

- A sale whose phone number has multiple connected dialler calls in the last 30 days shows the earliest connected-call agent in `DialerFirst`.
- `DialerFirst` also shows the earliest connected-call timestamp in brackets.
- The same sale shows the latest connected-call agent in `DialerLast`.
- `DialerLast` also shows the latest connected-call timestamp in brackets.
- A sale whose phone number has no connected calls shows blank/`N/A` in those columns.
- Existing email and phone filters on `/justproveit/admin/crm/sales` continue to work.
- `limit` and `offset` behaviour is unchanged.
