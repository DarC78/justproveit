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
- `callsSinceAppointmentDay`: distinct matched calltrace records from midnight of
  the appointment date in UK time onwards, including later days and all call types.
  Null means the phone is unavailable; zero means no calls were found.
- `callCodesSinceAppointmentDay`: every code as `{ callCode, description, count }`,
  including a null code for calls without an outcome. Counts include voicemail and
  other non-conversation outcomes. Used in both the compact list and full table.
- `whatsAppClientMessages`, `whatsAppTeamMessages`: inbound and outbound messages
  on the appointment day only (UK time), including confirmed automated messages,
  deduplicated by provider ID. Unknown phones give null, known phones give zero
  when there are no messages. Queued messages are excluded.

The compact list opens a third column when a client name is clicked, loading
`GET /justproveit/admin/crm/scheduled-calls/{intentId}/whatsapp?date=YYYY-MM-DD`.
Return `{ intentId, date, timeZone, clientMessages, teamMessages, messages }`, where
each message has `id`, `direction` (`inbound`/`outbound`), `atUtc`, `author`, `text`
and `type`. Include only the selected UK day, sorted chronologically. Check CRM
access and booking ownership/date; do not accept a caller-supplied phone number.
Changing the date or client must abort stale requests; closing the discussion
restores the two-column form. Text is rendered as plain text and this view sends
no messages.

## Booking actions

Both booking lists offer Reprogrameaza and Delete book. Rescheduling submits
`POST /scheduled-calls/{intentId}/reschedule` with `requestId`,
`expectedAppointmentAtUtc`, `appointmentDate` and `appointmentTime` in UK time.
Delete book uses `DELETE /scheduled-calls/{intentId}` with the UUID and expected
timestamp. Confirm each action inline; disable duplicate submissions and preserve
the request UUID after an uncertain network result so a retry cannot duplicate mail.

The backend atomically changes the booking, cancels linked pending confirmations
and reminders, and queues the requested reschedule email when a valid address exists
plus a WhatsApp text when a valid phone exists. Missing email/phone does not block
rescheduling; stale bookings are rejected. `emailQueued`, `whatsAppQueued` and the
channel skip reasons drive the success notice. Request UUIDs prevent duplicate
notifications. Delete book retains history and sends no cancellation email.
Success reports queued email rather than claiming delivery. Refresh the list and
close any selected WhatsApp panel after either action. No new reminders are created.
Calendly actions manage the CRM copy and CRM queues; external Calendly notifications
are outside this integration and this is stated in the action editor.

Authorization must match the existing CRM admin endpoints. Validate dates and
return safe errors. Read-only: do not send messages, change bookings, close leads
or modify dialler memberships. Distinguish unavailable metrics from confirmed zero
or false (nullable values plus a warning if a data source is unavailable).

Acceptance checks: manual and Calendly bookings; UK daylight-saving day bounds;
bookings created on another day; multiple appointments per phone; cancellation;
booking-specific confirmation/reminder linkage; queued versus accepted messages;
manual versus predictive calls; distinct call counting; valid conversation versus
voicemail/no-audio codes; active versus removed dialler rows; tenant isolation.
## WhatsApp Business and Attention extension

The scheduled-calls response now includes `onWhatsAppBusiness`,
`whatsAppBusinessAtUtc`, `whatsAppBusinessBy`,
`meaningfulCallsSinceAppointment`, `lastMediatelWhatsAppFromClient` and
`lastMediatelWhatsAppAtUtc`.

`POST /scheduled-calls/{id}/whatsapp-business` records the authenticated actor,
server timestamp and current appointment version. The request must contain
`expectedAppointmentAtUtc`; a changed or cancelled appointment returns 409.
The mark is persisted in booking metadata with an append-only mark history.
The action sends no messages. Rescheduling invalidates the current mark.

`GET /scheduled-calls?view=attention&days=7` returns the same row format plus
`attentionReasons`, `lookbackDays`, `periodStart` and `asOfUtc`. The lookback
uses UK appointment dates (1–90 days, default seven), through the current
instant, excluding future and cancelled appointments. Include overdue bookings
with no meaningful call and no Business mark, or with a client-last Mediatel
WhatsApp conversation. A meaningful call requires a valid conversation outcome
and more than 60 seconds of recorded agent talk time on or after the appointment day.
Day-level table metrics refer to each row's appointment day. Unknown call
history remains visible when no Business mark exists. Both lists refresh after
marking, rescheduling or cancellation.
