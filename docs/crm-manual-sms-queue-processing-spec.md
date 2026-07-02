# CRM Manual SMS Queue Processing Backend Spec

## Objective

Fix manual SMS sending from:

`https://www.justproveit.co.uk/admin/crm?tab=manual`

The manual CRM tab should send single SMS messages immediately when the agent clicks `Send SMS`.

Queued campaign/sequence SMS can still use the SMS campaign queue, but the manual one-off SMS button should not depend on the campaign timer.

## Frontend Code Path

The manual CRM tab is implemented in:

`src/pages/admin/crm.tsx`

`ManualEmailSmsPanel.handleSendSms()` should call:

`sendManualCrmSms(token, { phone, message, agent })`

from:

`src/lib/crmAdmin.ts`

That function posts to:

`POST /justproveit/admin/crm/manual-sms`

using `API_BASE_URL`, which defaults to:

`https://apiprocess.azurewebsites.net/api`

So the live frontend sends one-off manual SMS requests to:

`https://apiprocess.azurewebsites.net/api/justproveit/admin/crm/manual-sms`

## Observed Live Behavior

Historical behavior before the frontend was changed:

Application Insights for `apiprocess` shows successful queue API calls:

- `2026-06-29T10:15:36Z` `justProveItNativeCrmSmsCampaigns` returned `201`
- `2026-06-29T10:34:17Z` `justProveItNativeCrmSmsCampaigns` returned `201`

The timer function is enabled and runs every 5 minutes:

`smscampaignstimer`

Timer schedule:

`0 */5 * * * *`

Recent timer executions succeed, but report:

`[smscampaignstimer] completed { claimedCount: 0, sentCount: 0, failedCount: 0 }`

No Twilio/send exceptions were observed in the checked Application Insights traces.

## Database Evidence

The SMS queue table inspected was:

`wix.ozSMSCampaigns`

Columns include:

- `Id`
- `TenantId`
- `WixId`
- `phonenumber`
- `normalizedPhone`
- `smstext`
- `status`
- `toSendAfterDate`
- `sentAtUtc`
- `errorMessage`
- `CreatedAtUtc`
- `UpdatedAtUtc`

Recent manual SMS rows exist with:

- `status = 'to_send'`
- `sentAtUtc = NULL`
- `errorMessage = NULL`

Status counts observed included `to_send` rows accumulated since May/June 2026, which means queued messages are not being processed.

This still matters for SMS sequences/campaigns, but it should not block one-off manual SMS if `/manual-sms` is implemented as an immediate-send endpoint.

## Likely Failure Area

The frontend and queue API are working. The broken part is downstream:

- `smscampaignstimer`, or
- the shared SMS campaign claiming/sending logic used by `smscampaignstimer`, or
- the table/status/date criteria used by the worker.

The worker currently completes successfully while claiming zero rows, despite queued `wix.ozSMSCampaigns` rows with `status = 'to_send'`.

## Confirmed Root Cause From Backend Code

Backend repo:

`DarC78/proveitweb-live`

Relevant files:

- `azure-api-logger/src/functions/justproveitcrmnative.js`
- `azure-api-logger/src/jpiCrmNative/crmData.mjs`
- `azure-api-logger/src/functions/smscampaignstimer.js`
- `azure-api-logger/src/smsCampaigns.js`

The CRM manual SMS endpoint:

`POST /justproveit/admin/crm/manual-sms`

is registered in `justproveitcrmnative.js` as `justProveItNativeCrmManualSms`.

At the time of investigation, it called the same internal `queueSms()` helper as `justProveItNativeCrmSmsCampaigns`, which calls `queueManualCrmSms()` from `jpiCrmNative/crmData.mjs`.

`queueManualCrmSms()` inserts manual SMS rows into:

`wix.ozSMSCampaigns`

But `smscampaignstimer.js` calls `processDueSmsCampaigns()` from `smsCampaigns.js`.

`processDueSmsCampaigns()` calls `claimDueSmsCampaignRecords()`, which selects and updates rows from:

`dbo.ozSMSCampaigns`

So the timer is successfully running, but it is looking in a different table/schema from the one used by the CRM manual SMS endpoint. This explains why Application Insights shows:

`[smscampaignstimer] completed { claimedCount: 0, sentCount: 0, failedCount: 0 }`

even though manual SMS rows exist in `wix.ozSMSCampaigns` with `status = 'to_send'`.

For the requested product behavior, `/manual-sms` should stop using the queue path and should send immediately.

Check for one of these mismatches:

- Worker reads a different schema/table than `wix.ozSMSCampaigns`. This has been confirmed: the worker reads `dbo.ozSMSCampaigns`.
- Worker expects a different status value than `to_send`.
- Worker filters by `toSendAfterDate` in a way that excludes due rows.
- Worker filters by `TenantId`, campaign, source, or import metadata that manual CRM rows do not populate.
- Worker uses a different SQL connection/database than the queue API.
- Worker only processes rows inserted through `POST /smscampaigns/schedule`, not rows inserted through `POST /justproveit/admin/crm/sms-campaigns`.

## Required Backend Behavior

When the CRM manual tab posts to:

`POST /justproveit/admin/crm/manual-sms`

the backend must send the SMS immediately via Twilio and return success/failure for that send attempt.

Required request body:

```json
{
  "phone": "447...",
  "message": "Text to send",
  "agent": "Agent Name"
}
```

Required success response:

```json
{
  "success": true,
  "result": "sent",
  "message": "SMS sent."
}
```

Required failure response:

```json
{
  "success": false,
  "error": {
    "code": "sms_send_failed",
    "message": "Useful failure reason"
  }
}
```

The send implementation can reuse the existing Twilio helper in:

`azure-api-logger/src/smsCampaigns.js`

`sendTwilioSms(toNumber, message)`

but the route should not insert a `to_send` row and wait for `smscampaignstimer`.

Validate:

- CRM auth/permission still applies.
- `phone` is present and can be normalized to a Twilio number.
- `message` is present and non-empty.
- Twilio settings are present.
- Full phone numbers and full SMS bodies are not logged.

## Queued SMS Behavior

When CRM sequences or campaign imports post to:

`POST /justproveit/admin/crm/sms-campaigns`

the backend should insert a row that the existing SMS worker can claim.

The timer worker should claim due rows from the same table used by the queue endpoint:

`wix.ozSMSCampaigns`

Alternatively, if `dbo.ozSMSCampaigns` is the intended canonical sending queue, then `queueManualCrmSms()` and `queueCrmSmsSequence()` must insert into `dbo.ozSMSCampaigns` using the column names expected by `smsCampaigns.js`. Do not leave CRM queue writes and timer reads split across `wix` and `dbo`.

For due queued rows:

- `status = 'to_send'`
- `toSendAfterDate IS NULL OR toSendAfterDate <= SYSUTCDATETIME()`
- valid phone in `phonenumber` or `normalizedPhone`
- non-empty SMS body in `smstext`

the worker should:

1. Claim the row so another worker cannot send it twice.
2. Send the SMS through the configured Twilio sender.
3. Update the row with:
   - successful send status
   - `sentAtUtc`
   - provider result/message id if available
4. On failure, update:
   - failure/error status
   - `errorMessage`
   - `UpdatedAtUtc`

## Logging Requirements

Add safe logs that do not expose full phone numbers or SMS text:

- number of eligible `to_send` rows before claiming
- number claimed
- number sent
- number failed
- reason rows were skipped, if applicable

Example:

`[smscampaignstimer] eligible=12 claimed=10 sent=9 failed=1 skippedFuture=2`

## Acceptance Criteria

- Posting from the manual CRM tab to `/manual-sms` sends the SMS immediately and returns success/failure for the send attempt.
- Manual one-off SMS does not rely on `smscampaignstimer`.
- `/sms-campaigns` remains available for queued campaign/sequence SMS.
- A due queued SMS row is claimed by the next `smscampaignstimer` run.
- `claimedCount` is greater than zero when due `to_send` rows exist.
- Successfully sent rows have `sentAtUtc` populated.
- Failed rows have `errorMessage` populated.
- Old stuck `to_send` rows are either processed or intentionally marked with a documented terminal status.
- No full SMS body or full phone number is written to logs.

## Verification

1. Submit a test SMS from:

   `https://www.justproveit.co.uk/admin/crm?tab=manual`

2. Verify Application Insights shows:

   `justProveItNativeCrmManualSms` returned success.

3. Verify the SMS is received without waiting for the 5-minute timer.

4. Verify a failed Twilio response returns a visible frontend error and does not say the SMS was sent.

5. Separately verify queued SMS still works:

   `justProveItNativeCrmSmsCampaigns` returned `201`.

6. Verify the queued row appears in:

   `wix.ozSMSCampaigns`

   with `status = 'to_send'`.

7. Wait for the next 5-minute timer run.

8. Verify Application Insights for `smscampaignstimer` shows non-zero claimed/sent or failed counts.

9. Verify the database row has either:

   - `sentAtUtc` populated, or
   - `errorMessage` populated with a useful failure reason.
