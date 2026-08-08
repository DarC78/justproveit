# CRM Inbound SMS Tab Backend Spec

## Objective

Support a new CRM tab on:

`https://justproveit.co.uk/admin/crm/?tab=inboundSms`

The tab will show received SMS messages grouped into phone-number threads, let an agent click one thread to see the
phone number history, and let the agent reply through the existing manual SMS endpoint.

The frontend groups received SMS messages by phone number into threads. The list status is the status of the latest SMS
for that phone number.

Do not use the Twilio webhook endpoint as the read endpoint. This endpoint remains the inbound receiver:

`POST /justproveit/sms/inbound`

The CRM UI needs a separate authenticated admin read endpoint.

## Backend Host

Implement this in the LaunchingStack backend API used by the CRM read routes:

`https://launchingstack-func-dev.azurewebsites.net/api`

The frontend already reads CRM data from this host for canonical CRM read routes.

## Required Endpoint 1: List Inbound SMS

Create:

`GET /justproveit/admin/crm/inbound-sms`

Authentication:

- Require the same CRM/admin bearer token auth as the other CRM admin routes.
- Return `401` or `403` consistently with existing CRM routes.

Default behavior:

- Return inbound SMS received in the last 30 days.
- Sort newest first.
- Default `limit=100`.
- Maximum `limit=500`.
- `offset` defaults to `0`.

Supported query params:

- `receivedLastDays`: optional number, default `30`
- `dateBegin`: optional `YYYY-MM-DD`
- `dateEnd`: optional `YYYY-MM-DD`
- `phone`: optional phone search
- `status`: optional `all | answered | to_be_answered | past_due`
- `limit`: optional number
- `offset`: optional number

If `dateBegin` or `dateEnd` is supplied, use the explicit date window instead of `receivedLastDays`.

The frontend can group individual inbound SMS rows by `normalizedPhone`/phone number. For accurate thread status after
an agent replies, the latest inbound SMS row for that phone number should be returned with `status = "answered"` and
reply metadata such as `lastReplyAtUtc` or `answeredAtUtc`.

Suggested response:

```json
{
  "items": [
    {
      "id": "inbound-sms-id",
      "receivedAtUtc": "2026-07-31T12:00:00.000Z",
      "fromPhone": "+447700900123",
      "normalizedPhone": "447700900123",
      "message": "Customer SMS body",
      "status": "to_be_answered",
      "answered": false,
      "answeredAtUtc": null,
      "lastReplyAtUtc": null,
      "replyAgent": null,
      "contactId": "optional-contact-id",
      "leadId": "optional-lead-id",
      "leadName": "Optional Lead Name",
      "source": "twilio",
      "providerMessageId": "optional-provider-message-id"
    }
  ],
  "total": 123,
  "limit": 100,
  "offset": 0,
  "filters": {
    "receivedLastDays": 30,
    "status": "all"
  }
}
```

## Status Rules

The UI will color rows using this status:

- `answered`: green
- `to_be_answered`: amber
- `past_due`: red

Backend should preferably compute and return `status`. If that is not practical, return enough fields for the frontend to compute it safely:

- `receivedAtUtc`
- `answered` or `answeredAtUtc` or `lastReplyAtUtc`

Definitions:

### answered

An inbound SMS is `answered` when there is an outbound SMS to the same normalized phone after the inbound SMS was received.

Use the existing manual SMS send records as outbound evidence.

Recommended:

- `answeredAtUtc` = earliest outbound SMS sent to the same normalized phone after `receivedAtUtc`
- `lastReplyAtUtc` = most recent outbound SMS sent to the same normalized phone after `receivedAtUtc`
- `replyAgent` = agent on the earliest or latest reply, whichever is easiest and documented

### past_due

An inbound SMS is `past_due` when:

- it is not answered
- and `receivedAtUtc < SYSUTCDATETIME() - 24 hours`

### to_be_answered

An inbound SMS is `to_be_answered` when:

- it is not answered
- and it was received less than or equal to 24 hours ago

## Required Endpoint 2: Phone History

The frontend plans to reuse the existing route:

`GET /justproveit/admin/crm/activity?phone=<phone>&limit=500`

This endpoint must return the whole useful history for that phone number, including:

- inbound SMS
- outbound SMS/manual replies
- dialler/calltrace calls
- missed calls, if stored separately
- relevant CRM activity rows

If the existing activity endpoint already does this, no new history endpoint is required.

If it does not currently include SMS and calls, update the existing route rather than creating a one-off frontend-only shape.

Expected existing response shape remains compatible:

```json
{
  "activities": [
    {
      "timestamp": "2026-07-31T12:00:00.000Z",
      "action": "Inbound SMS",
      "state": "received",
      "agent": null,
      "param1": "+447700900123",
      "param2": "SMS body or safe summary",
      "param3": null,
      "param4": null,
      "param5": null
    }
  ]
}
```

Recommended activity row conventions:

- inbound SMS: `action = "Inbound SMS"`
- outbound SMS: `action = "Outbound SMS"` or `action = "Manual SMS"`
- SMS direction: use `direction = "inbound" | "outbound"` when possible; otherwise the frontend infers it from `action`
- SMS body: use `message`, `body`, `smsBody`, `text`, or `param2`
- calls: include call direction, call code, call result, queue/campaign, agent, and timestamp in existing param fields

The selected thread transcript is rendered from this activity response. If outbound manual replies are not present here,
the frontend can still show inbound messages from the list response, but it cannot show the full two-way SMS thread.

## Reply Behavior

The frontend will reply through the existing endpoint:

`POST /justproveit/admin/crm/manual-sms`

Request body:

```json
{
  "phone": "447700900123",
  "message": "Reply text",
  "agent": "Agent Name"
}
```

Backend requirements for this route:

- send immediately through Twilio
- return success/failure for the send attempt
- record the outbound SMS in CRM activity/history so the InboundSMS history refresh shows the reply

No new reply endpoint is required unless `manual-sms` cannot reliably log the outbound reply.

## Close Case Behavior

The frontend closes an inbound SMS thread through:

`POST /justproveit/admin/crm/inbound-sms/close-case`

Request body:

```json
{
  "inboundSmsId": "latest-inbound-sms-id-if-available",
  "smsId": "alternate-sms-id-if-available",
  "phone": "447700900123",
  "status": "answered",
  "agent": "Agent Name"
}
```

Backend requirements for this route:

- require the same CRM/admin bearer token auth as the other CRM admin routes
- accept either a stable inbound SMS id or phone number; phone is required if no id is supplied
- mark the selected inbound SMS thread as finished by setting the green state, currently `answered`
- set answer metadata such as `answered = true`, `answeredAtUtc` or `lastReplyAtUtc`, and `replyAgent`
- persist enough activity/audit context to show who closed the case and when
- return the updated inbound SMS row or a success response

Suggested success response:

```json
{
  "success": true,
  "sms": {
    "id": "inbound-sms-id",
    "phone": "447700900123",
    "status": "answered",
    "answered": true,
    "answeredAtUtc": "2026-08-08T06:30:00.000Z",
    "replyAgent": "Agent Name"
  }
}
```

After a successful close, refreshing:

`GET /justproveit/admin/crm/inbound-sms`

should return that phone thread as `answered`.

## Data Storage Expectations

The inbound webhook:

`POST /justproveit/sms/inbound`

must persist every inbound SMS with at least:

- stable id
- provider message id if available
- raw from phone
- normalized phone
- message body
- received timestamp UTC
- optional matched contact/lead id
- created/updated timestamps

The read endpoint should not expose Twilio secrets, webhook signatures, or internal raw payloads.

## Acceptance Criteria

- `GET /justproveit/admin/crm/inbound-sms` returns recent inbound SMS for the last 30 days by default.
- The endpoint supports pagination through `limit` and `offset`.
- The endpoint supports filtering by `phone` and `status`.
- Each row has one of: `answered`, `to_be_answered`, `past_due`.
- Rows can be individual inbound SMS messages; the frontend groups them into phone-number threads.
- An answered SMS is returned with `status = "answered"` and enough reply metadata for the UI.
- An unanswered SMS older than 24 hours is returned with `status = "past_due"`.
- An unanswered SMS less than or equal to 24 hours old is returned with `status = "to_be_answered"`.
- `GET /justproveit/admin/crm/activity?phone=...&limit=500` returns SMS and call history for the selected phone.
- The activity response includes inbound and outbound SMS bodies, timestamps, and direction.
- `POST /justproveit/admin/crm/manual-sms` sends the reply and records it in activity/history.
- `POST /justproveit/admin/crm/inbound-sms/close-case` marks an inbound SMS thread as `answered`.
- After a successful manual reply, refreshing the inbound SMS list shows the message as `answered`.
- After a successful close case action, refreshing the inbound SMS list shows the message as `answered`.
- No full SMS bodies or full phone numbers are written to application logs.

## Frontend Implementation Plan After Backend Is Ready

1. Add `InboundSMS` to the CRM tab list.
2. Add `CrmInboundSms` types and `listCrmInboundSms()` in `src/lib/crmAdmin.ts`.
3. Add `InboundSmsPanel` in `src/pages/admin/crm.tsx`.
4. Render list rows with color:
   - green for `answered`
   - amber for `to_be_answered`
   - red for `past_due`
5. On row click, call existing `searchCrmActivity(token, { phone, limit: 500 })`.
6. Show the phone history underneath or beside the SMS list.
7. Add reply textarea and send button that calls `sendManualCrmSms()`.
8. After successful send, refresh both the history and inbound SMS list.
