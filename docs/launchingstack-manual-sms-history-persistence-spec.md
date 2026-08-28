# LaunchingStack Manual SMS History Persistence Spec

## Context

The CRM InboundSMS page sends manual SMS replies through:

`POST /justproveit/admin/crm/manual-sms`

The selected phone history is read from the canonical CRM read API:

`GET /justproveit/admin/crm/activity?phone={phone}&limit=500`

In the frontend, `sendManualCrmSms()` and `searchCrmActivity()` use LaunchingStack
(`https://launchingstack-func-dev.azurewebsites.net/api` unless overridden).

If the SMS is sent successfully but does not appear in the SMS history after a refresh,
the backend write path is not persisting a canonical outbound activity row that LaunchingStack returns.

## Required Backend Behavior

After `POST /justproveit/admin/crm/manual-sms` successfully sends an SMS, the backend must persist an outbound SMS activity record in the same canonical store used by:

`GET /justproveit/admin/crm/activity`

The activity record should include:

- phone or normalized phone matching the request recipient
- timestamp in UTC
- `direction = "outbound"`
- action/type/event value containing `SMS`
- SMS body in one of `message`, `body`, `smsBody`, `text`, or `param2`
- agent from the manual SMS request when supplied
- provider/Twilio message id when available

The backend should also mark/update the related inbound SMS thread as answered when the manual SMS is a reply to an inbound sender, so:

`GET /justproveit/admin/crm/inbound-sms`

returns the thread with `status = "answered"` or equivalent answer metadata such as `lastReplyAtUtc`.

## Affected Areas

- Manual SMS send endpoint:
  `POST /justproveit/admin/crm/manual-sms`
- Canonical CRM activity read model:
  `GET /justproveit/admin/crm/activity?phone=...`
- Inbound SMS list/read model:
  `GET /justproveit/admin/crm/inbound-sms`
- Any sync job or shared store between manual sends and LaunchingStack CRM reads

## Acceptance Criteria

- Send a manual SMS from `/admin/crm/?tab=inboundSms`.
- Immediately refresh the selected phone history.
- The outbound SMS appears in the transcript/history with the correct timestamp, direction, agent, and body.
- Reload the page, select the same phone thread, and the outbound SMS still appears.
- The inbound SMS thread changes from `to_be_answered` or `past_due` to `answered`.
- Duplicate activity rows are not created when the same history is refreshed repeatedly.
- Logs do not include full phone numbers or full SMS bodies.
