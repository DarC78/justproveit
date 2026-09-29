# LaunchingStack MANUAL_BOOK No-SMS Spec

## Context

The admin CRM page creates manually booked lead intents from:

`https://www.justproveit.co.uk/admin/crm/?tab=new`

The frontend calls LaunchingStack directly:

`POST /api/justproveit/leads/asap`

When an admin adds a new lead with a selected call date and time, the request uses:

`interestType = "MANUAL_BOOK"`

The current LaunchingStack behavior also sends an SMS. This must stop.

## New Frontend Payload Field

For `MANUAL_BOOK` requests, the frontend now sends:

```json
{
  "sendSms": false
}
```

Example request:

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
  "sendSms": false,
  "agent": "Adrian Defta"
}
```

## Required Backend Change

When `interestType = "MANUAL_BOOK"`:

- Do not send an immediate SMS.
- Do not schedule any SMS reminder.
- Do not insert any queued SMS campaign/sequence row.
- Treat `MANUAL_BOOK` as SMS-disabled by default, even if `sendSms` is missing.
- Continue creating or updating the CRM lead.
- Continue creating the `MANUAL_BOOK` lead intent.
- Continue storing the selected appointment date/time.
- Continue any non-SMS behavior that already exists, such as confirmation email, reminder email, or WhatsApp reminder if configured.

When `interestType = "ASAP"`:

- Preserve existing ASAP behavior.
- Do not change existing ASAP SMS behavior unless a separate request is made.

## Acceptance Criteria

- Creating a new `MANUAL_BOOK` lead from `/admin/crm/?tab=new` does not send an SMS.
- No SMS queue/campaign row is created for that manual booking.
- The lead and `MANUAL_BOOK` intent are still created successfully.
- The selected appointment date/time is still visible in the Lead Intents list.
- Existing manual SMS tools in the CRM continue to work.
- Existing ASAP lead creation behavior is unchanged.
