# Scheduled calls CRM report

The CRM needs an authenticated, tenant-scoped read endpoint:
`GET /justproveit/admin/crm/scheduled-calls?date=YYYY-MM-DD`.

The selected date is a Europe/London calendar day, defaulting to today in the UI.
Return all non-cancelled MANUAL_BOOK and CALENDLY appointments scheduled during
that day, across services, ordered by appointment time and then name/intent ID.
Do not hide reserved bookings or silently truncate rows. Each booking is a row;
separate appointments for the same person remain separate rows.

Response: `{ date, timeZone: "Europe/London", rows: ScheduledCallRow[] }`.
Each row contains:

- `intentId`, `contactId`, `name`, `phone`, `intentType`, `serviceName`.
- `leadCreatedAtUtc`: first lead/contact acquisition timestamp, respecting linked
  legacy lead dates where available; not the most recent booking timestamp.
- `bookedAtUtc`: creation timestamp of this appointment intent.
- `appointmentAtUtc`: scheduled call timestamp, shown prominently in the list.
- `bookingEmailSent`, `bookingWhatsAppSent`, `reminderEmailSent`,
  `reminderWhatsAppSent`: booleans based on actual recorded provider acceptance
  or successful send/delivery for this appointment, never on a queued item alone.
  Use intent/event linkage rather than an unrelated message to the same phone.
  Include the existing manual and Calendly communication paths.
- `manualCallsToday`: distinct manually placed outgoing calls to the normalized
  phone on the selected UK day. Use actual call records, not booking totals or
  attempts imported into predictive queues. Include phone formatting variants.
- `agentConversationsToday`: subset of those calls in which a human agent spoke
  to the client, using the canonical valid call-code rules and excluding voicemail,
  no audio, no answer, test and similar non-conversation outcomes. Duration alone
  does not establish a conversation.
- `onDialler`: current active dialler membership for the normalized phone across
  queues; do not infer this from a historical CRM AddToDialler flag.

Authorization must match the existing CRM admin endpoints. Validate dates and
return safe errors. Read-only: do not send messages, change bookings, close leads
or modify dialler memberships. Distinguish unavailable metrics from confirmed zero
or false (nullable values plus a warning if a data source is unavailable).

Acceptance checks: manual and Calendly bookings; UK daylight-saving day bounds;
bookings created on another day; multiple appointments per phone; cancellation;
booking-specific confirmation/reminder linkage; queued versus accepted messages;
manual versus predictive calls; distinct call counting; valid conversation versus
voicemail/no-audio codes; active versus removed dialler rows; tenant isolation.
