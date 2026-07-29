# CRM ASAP Lead Async Backend Spec

## Objective

Fix the Azure Functions timeout on:

`POST https://launchingstack-func-dev.azurewebsites.net/api/justproveit/leads/asap`

Observed error:

`RequestId: 678ef786-483b-4bf0-93e2-e5ef8fb2c5be Error: Task timed out after 160.00 seconds`

The endpoint must return to the CRM caller quickly, then continue the slow lead creation and downstream work in a background worker.

## Important Constraint

Do not implement this as in-process fire-and-forget work after sending the HTTP response.

Azure Functions can stop, recycle, or cancel in-process work after the HTTP request finishes. The safe implementation is:

1. Validate and accept the request in the HTTP-triggered function.
2. Persist a durable job or enqueue a message.
3. Return `202 Accepted` quickly.
4. Process the job in a queue-triggered function or Durable Functions orchestration.

## Current Caller

The JustProveIt frontend posts from:

`https://www.justproveit.co.uk/admin/crm/?tab=new`

Current payload shape:

```json
{
  "fullName": "Client Name",
  "email": "client@example.com",
  "phoneNumber": "07123456789",
  "language": "Romanian",
  "service": "simulator pensie",
  "interestType": "ASAP",
  "agent": "Agent Name"
}
```

The frontend sends:

`Authorization: Bearer <token>`

The frontend remains compatible with the old synchronous response:

```json
{
  "success": true,
  "lead": {}
}
```

It is now also compatible with the async response below.

## Required HTTP Behavior

The HTTP route must do only fast work:

- authenticate the caller
- validate required fields
- normalize email and phone
- generate or receive a correlation id
- persist a queued job or enqueue a durable message
- return in under 3 seconds

Recommended response:

```http
HTTP/1.1 202 Accepted
Content-Type: application/json
```

```json
{
  "success": true,
  "accepted": true,
  "queued": true,
  "jobId": "asap-lead-job-id",
  "requestId": "correlation-id",
  "status": "queued",
  "message": "Lead accepted for background processing."
}
```

Return `400` for invalid payloads and `401`/`403` for auth failures before queueing.

## Durable Job Options

Use one of these patterns, in order of preference:

1. Azure Storage Queue trigger.
2. Azure Service Bus queue trigger.
3. Durable Functions orchestration.

The message should contain only the data needed to replay the existing ASAP lead creation flow:

```json
{
  "jobId": "uuid",
  "requestId": "uuid",
  "source": "justproveit-admin-crm-new-lead",
  "receivedAtUtc": "2026-07-29T00:00:00.000Z",
  "payload": {
    "fullName": "Client Name",
    "email": "client@example.com",
    "phoneNumber": "07123456789",
    "language": "Romanian",
    "service": "simulator pensie",
    "interestType": "ASAP",
    "agent": "Agent Name"
  },
  "normalized": {
    "email": "client@example.com",
    "phone": "447123456789"
  }
}
```

## Background Worker Behavior

Move the existing slow logic from the HTTP handler into a reusable function, for example:

```ts
async function processAsapLeadJob(job) {
  // Call the existing code path that creates/resolves contact, lead, intent,
  // dialler records, sheets/import records, notifications, and logs.
}
```

The queue-triggered function should call that helper.

The HTTP handler should only enqueue:

```ts
async function justProveItLeadsAsapHttp(req, context) {
  const caller = await requireCrmAuth(req);
  const payload = await readAndValidatePayload(req);
  const normalized = normalizeLeadPayload(payload);
  const job = buildAsapLeadJob(payload, normalized, caller);

  await saveJobOrEnqueue(job);

  return {
    status: 202,
    jsonBody: {
      success: true,
      accepted: true,
      queued: true,
      jobId: job.jobId,
      requestId: job.requestId,
      status: "queued",
      message: "Lead accepted for background processing."
    }
  };
}
```

## Idempotency

Protect against duplicate leads when the browser retries after a timeout.

Recommended:

- accept an optional `Idempotency-Key` header
- if missing, derive one from:
  - normalized phone
  - normalized email
  - service
  - interest type
  - source
  - a short time bucket, for example 10 minutes
- store the idempotency key with the job
- if the same key already exists and is `queued`, `processing`, or `completed`, return the existing `jobId` with `202`

Suggested response for a duplicate accepted request:

```json
{
  "success": true,
  "accepted": true,
  "queued": true,
  "deduped": true,
  "jobId": "existing-job-id",
  "requestId": "existing-request-id",
  "status": "queued"
}
```

This idempotency does not replace the active-intent dedupe rules. The worker should still use the shared CRM active-intent idempotency logic for `ASAP` intents.

## Job Status Storage

Create a small job/status record if one does not already exist:

- `jobId`
- `requestId`
- `idempotencyKey`
- `source`
- `status`: `queued`, `processing`, `completed`, `failed`, `deadletter`
- `attemptCount`
- `payloadJson`
- `resultJson`
- `errorMessage`
- `createdAtUtc`
- `startedAtUtc`
- `completedAtUtc`
- `updatedAtUtc`

This can be SQL, Table Storage, Cosmos DB, or the backend's existing job tracking store.

## Retries And Failures

- Let the queue retry transient failures.
- Log safe correlation data: `jobId`, `requestId`, `phoneLast6`, `emailDomain`, `service`, `agent`.
- Do not log full phone numbers, full email addresses, access tokens, or message bodies.
- After max retries, mark the job as `deadletter` and keep enough error detail for support.

## Acceptance Criteria

- `POST /justproveit/leads/asap` returns `202` within 3 seconds for normal valid requests.
- The endpoint no longer reaches the 160 second Azure Functions timeout.
- Existing synchronous response `{ success: true, lead: ... }` remains allowed during rollout.
- The background worker completes the same business actions that the current synchronous endpoint performs.
- Retried browser requests do not create duplicate queued jobs or duplicate active CRM intents.
- Failures are visible by `jobId` or `requestId` in backend logs/status storage.
- The JustProveIt CRM page does not show `Not Found` or timeout errors when the backend accepts the job.
