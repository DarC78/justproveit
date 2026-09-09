# MANUAL_BOOK Lead Intent Backend Spec

## Context

The admin CRM page at:

`https://www.justproveit.co.uk/admin/crm/?tab=new`

now lets an admin create a lead with one of two intent types:

- `MANUAL_BOOK`
- `ASAP`

`MANUAL_BOOK` is the default. The frontend no longer exposes a language selector on this form and always sends Romanian as `language: "ro"`.

When the admin selects `MANUAL_BOOK`, the form also sends a manually selected appointment date and time in UK local time. When the admin selects `ASAP`, the date/time fields are hidden and no appointment date/time is sent.

## Frontend Payload

The frontend continues to call:

`POST https://launchingstack-func-dev.azurewebsites.net/api/justproveit/leads/asap`

For `MANUAL_BOOK`, the request body is:

```json
{
  "fullName": "Ion Popescu",
  "email": "ion@example.com",
  "phoneNumber": "07771866203",
  "language": "ro",
  "service": "simulator pensie",
  "interestType": "MANUAL_BOOK",
  "appointmentDate": "2026-09-16",
  "appointmentTime": "14:30",
  "appointmentTimeZone": "Europe/London",
  "appointmentLocalDateTime": "2026-09-16T14:30",
  "agent": "Adrian Defta"
}
```

For `ASAP`, the request body is:

```json
{
  "fullName": "Ion Popescu",
  "email": "ion@example.com",
  "phoneNumber": "07771866203",
  "language": "ro",
  "service": "simulator pensie",
  "interestType": "ASAP",
  "agent": "Adrian Defta"
}
```

## Required Backend Behavior

When `interestType = "MANUAL_BOOK"`:

- Create or update the CRM lead from `fullName`, `email`, `phoneNumber`, `language`, `service`, and `agent`.
- Create a separate row/event in the lead intent list.
- The lead intent row must use `interestType = "MANUAL_BOOK"`.
- Store the selected appointment time as the lead intent contact time.
- Convert `appointmentLocalDateTime` from `Europe/London` to UTC and populate the same field used by Calendly bookings, preferably `contactTimeUtc`.
- Keep enough raw booking fields for audit/debugging:
  - `appointmentDate`
  - `appointmentTime`
  - `appointmentTimeZone`
  - `appointmentLocalDateTime`
- Show this intent in `/justproveit/admin/crm/lead-intents` responses, similar to `CALENDLY`.
- Do not reserve it as an ASAP intent automatically.

Recommended normalized lead intent shape:

```json
{
  "interestType": "MANUAL_BOOK",
  "serviceKey": "simulator pensie",
  "language": "ro",
  "contactTimeUtc": "2026-09-16T13:30:00.000Z",
  "source": "admin_manual_book",
  "agent": "Adrian Defta"
}
```

The exact UTC value depends on UK daylight saving time for the selected date.

When `interestType = "ASAP"`, preserve current ASAP behavior.

## Lead Intent List

The admin Lead Intents page must be able to filter and display `MANUAL_BOOK` rows.

Required response fields:

- `interestType: "MANUAL_BOOK"`
- `contactTimeUtc`
- `serviceKey` or `serviceDisplayName`
- `language: "ro"`
- lead identity fields already used by the CRM table:
  - lead/contact id
  - full name
  - email
  - phone

`MANUAL_BOOK` should behave like `CALENDLY` for displaying the appointment date/time. It should not behave like `ASAP` for reservation-only queue handling unless explicitly requested later.

## Immediate Confirmation Email

After successfully creating a `MANUAL_BOOK` intent, send this email to the lead.

Subject recommendation:

`Confirmare programare consultatie pensii internationale`

Body:

```text
Buna ziua,

Multumim ca v-ati facut o programare pentru o consultatie pe pensii internationale.

Aveti aici un mic video pe care o sa va rog sa il urmariti inainte de programare:

https://www.youtube.com/watch?v=VyI9vtWqGwQ

In data de <date> si la ora <time> (ora din Marea Britanie), va voi suna.

O zi buna,
Adrian Defta
Fondator si CEO Proveit
```

Use the selected UK local date and time for `<date>` and `<time>`.

Recommended display format:

- `<date>`: `16/09/2026`
- `<time>`: `14:30`

## 24 Hour Reminder Email

Schedule this email for 24 hours before the selected appointment time.

Subject recommendation:

`Reminder programare consultatie pensii internationale`

Body:

```text
Buna ziua,

Va reamintim ca v-ati facut o programare pentru o consultatie pe pensii internationale cu dl. Adrian Defta.

Aveti aici un mic video pe care o sa va rog sa il urmariti inainte de programare:

https://www.youtube.com/watch?v=VyI9vtWqGwQ

In data de <date> si la ora <time> (ora din Marea Britanie), dl. Adrian Defta va va suna.

O zi buna,
Echipa de suport Proveit
```

If the selected appointment is less than 24 hours away, either send this reminder immediately or skip it with an auditable reason. Prefer skipping if immediate reminder would be confusing.

## 1 Hour WhatsApp Reminder

Schedule a WhatsApp template message for 1 hour before the selected appointment time.

Template:

`pensii_internationale_reminder_call_reminder_1h`

Language:

`ro`

Parameters:

```json
{
  "firstname": "Ion",
  "calltime": "14:30"
}
```

Template text:

```text
Ai o programare viitoare
Buna ziua, {{firstname}},

Acesta este un memento despre viitoarea ta consultatie cu dl. Adrian Defta la ora {{calltime}}.

Va vom suna atunci!
```

Use the first token from `fullName` as `firstname`, unless the CRM already has a better first-name field.

If the selected appointment is less than 1 hour away, skip the WhatsApp reminder with an auditable reason.

## Idempotency

Creating a manual booking should be idempotent enough to protect against admin double-clicks or retries.

Recommended idempotency key:

`MANUAL_BOOK:{normalizedEmailOrPhone}:{appointmentLocalDateTime}:{service}`

If the same lead intentionally needs another booking at the same date/time, support a backend override later rather than creating accidental duplicates now.

## Validation

Reject `MANUAL_BOOK` requests when:

- `appointmentDate` is missing or invalid.
- `appointmentTime` is missing or invalid.
- `appointmentTimeZone` is missing or not `Europe/London`.
- The appointment date/time cannot be converted to UTC.
- The appointment is in the past.
- Both email and phone are missing.

Return a non-2xx response or `success: false` with a clear `message` that the frontend can show.

## Response Requirement

Return the created or matched lead and intent where available:

```json
{
  "success": true,
  "lead": {},
  "intent": {
    "interestType": "MANUAL_BOOK",
    "contactTimeUtc": "2026-09-16T13:30:00.000Z"
  },
  "message": "Programarea manuala a fost creata."
}
```

The current frontend accepts queued/async responses too, but returning the created intent helps admin users verify the booking faster.

## Acceptance Criteria

- Admin can add a new lead from `/admin/crm/?tab=new` with default `MANUAL_BOOK`.
- The language is Romanian without any frontend language selector.
- `ASAP` creation keeps working.
- `MANUAL_BOOK` requires date and time in the frontend and backend.
- `MANUAL_BOOK` appears in the Lead Intents list with the selected appointment time, similar to Calendly.
- Immediate confirmation email is sent after booking creation.
- 24h reminder email is scheduled using the selected UK appointment time.
- 1h WhatsApp reminder is scheduled with template `pensii_internationale_reminder_call_reminder_1h`, language `ro`, and parameters `firstname` and `calltime`.
- Duplicate retries do not create duplicate manual bookings or duplicate reminders.
