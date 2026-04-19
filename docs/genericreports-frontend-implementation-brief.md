# GenericReports Frontend Implementation Brief

## Backend Status

The LaunchingStack backend is deployed and tested for the JustProveIt GenericReports/support inbox workflow.

Use the existing LaunchingStack auth flow. Do not use Wix member auth.

The admin routes use `/api/justproveit/admin/*`. Do not use the old `/api/admin/*` paths because Azure Functions did not serve those reliably.

## Base API URL

```env
VITE_API_BASE_URL=https://launchingstack-func-dev.azurewebsites.net/api
```

## Auth

All GenericReports requests require:

```http
Authorization: Bearer <accessToken>
```

The token must come from LaunchingStack login for:

```json
{
  "tenantKey": "justproveit"
}
```

Admin capability endpoint:

```http
GET /justproveit/admin/me
Authorization: Bearer <accessToken>
```

Expected success shape:

```json
{
  "user": {
    "id": "guid",
    "email": "adrian@proveitweb.co.uk",
    "name": "Adrian Defta"
  },
  "tenant": {
    "key": "justproveit",
    "name": "JustProveit"
  },
  "roles": ["tenant-admin"],
  "permissions": ["admin:access"]
}
```

Frontend admin check:

```js
const isAdmin =
  user?.roles?.includes("tenant-admin") ||
  user?.permissions?.includes("admin:access");
```

## GenericReports Namespace

```http
/justproveit/admin/generic-reports/*
```

## Endpoints

### Config

```http
GET /justproveit/admin/generic-reports/config
```

Tested response includes:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "emailPageSize": 20,
  "felicitariBccEmail": "georgianaaageo12@gmail.com",
  "felicitariAzureQueueId": 35,
  "stageOneTemplateKey": "felicitari"
}
```

### Gmail Profile

```http
GET /justproveit/admin/generic-reports/gmail/profile
```

Tested and working. Expected:

```json
{
  "connected": true,
  "emailAddress": "oz@proveitweb.co.uk",
  "expectedMailboxEmail": "oz@proveitweb.co.uk"
}
```

### Reply Templates

```http
GET /justproveit/admin/generic-reports/reply-templates
```

Tested and working. Current keys:

```text
felicitari
ati_semnat_cmc
cancelCMC
```

### Recent Messages

```http
GET /justproveit/admin/generic-reports/messages/recent?source=cached&limit=20
GET /justproveit/admin/generic-reports/messages/recent?source=live&limit=20
GET /justproveit/admin/generic-reports/messages/recent?source=merged&limit=20
```

The cached endpoint has been tested with `limit=5` and returned 5 messages.

Required next behaviour:

- The support inbox needs the newest 20 actionable messages.
- Actionable means the thread has not been marked replied and has not been marked skipped / "No reply from here".
- With a mailbox containing 20k+ messages, the backend should not simply return the latest 20 raw messages and expect the frontend to filter them.
- Add either:
  - `GET /justproveit/admin/generic-reports/messages/recent?source=merged&limit=20&actionableOnly=true`
  - or pagination support that lets the frontend keep scanning until it has 20 actionable messages.
- Server-side `actionableOnly=true` should exclude thread keys present in both thread-state stores:
  - `/thread-state/replied`
  - `/thread-state/skipped`
- Results should be sorted newest first.

### Search Messages By Email

```http
GET /justproveit/admin/generic-reports/messages/search?email=customer@example.com&limit=100
```

### Attachment

```http
GET /justproveit/admin/generic-reports/messages/{messageId}/attachments/{attachmentId}
```

### Customer Context

```http
GET /justproveit/admin/generic-reports/customers/context?email=customer@example.com
```

Tested and working. Response includes customer context plus support mailbox view.

### Add Customer Email

```http
POST /justproveit/admin/generic-reports/customers/emails
Content-Type: application/json
```

Request:

```json
{
  "customerEmail": "primary.customer@example.com",
  "newEmail": "new.customer.alias@example.com",
  "source": "genericreports_admin",
  "metadata": {
    "threadKey": "thread:gmail-thread-id",
    "selectedSubject": "Customer email subject"
  }
}
```

Expected success response:

```json
{
  "success": true,
  "customerEmail": "primary.customer@example.com",
  "newEmail": "new.customer.alias@example.com",
  "customerEmails": [
    "primary.customer@example.com",
    "new.customer.alias@example.com"
  ]
}
```

Expected errors:

```http
400 Bad Request
{ "error": "Invalid email address" }

404 Not Found
{ "error": "Customer not found" }

409 Conflict
{ "error": "Email already exists for this customer" }
```

The backend keeps the existing primary email unchanged, writes the expanded alias list through the existing Azure support mailbox store endpoint, and promotes the returned support customer aliases into GET /customers/context as customer.customerEmails, customer.aliases, and customer.manuallyAddedCustomerEmails.

### Thread State

```http
GET /justproveit/admin/generic-reports/thread-state/replied
GET /justproveit/admin/generic-reports/thread-state/skipped

POST /justproveit/admin/generic-reports/thread-state/replied
POST /justproveit/admin/generic-reports/thread-state/skipped
```

Mark replied request:

```json
{
  "threadKey": "thread:gmail-thread-id",
  "recipientEmail": "customer@example.com",
  "subject": "Re: subject"
}
```

Mark skipped request:

```json
{
  "threadKey": "thread:gmail-thread-id",
  "senderEmail": "customer@example.com",
  "subject": "subject"
}
```

### Gmail Search

```http
POST /justproveit/admin/generic-reports/gmail/search
Content-Type: application/json
```

Request:

```json
{
  "query": "in:inbox",
  "maxResults": 10,
  "pageToken": ""
}
```

### Gmail Send

```http
POST /justproveit/admin/generic-reports/gmail/send
Content-Type: application/json
```

Request:

```json
{
  "to": "customer@example.com",
  "bcc": "georgianaaageo12@gmail.com",
  "subject": "Re: Update from lender",
  "text": "Plain text reply",
  "html": "<p>HTML reply</p>",
  "threadId": "gmail-thread-id",
  "inReplyTo": "<message-id@example.com>",
  "references": "<message-id@example.com>",
  "metadata": {
    "templateKey": "felicitari",
    "source": "genericreports_admin"
  }
}
```

### Mark Read

```http
POST /justproveit/admin/generic-reports/gmail/threads/{threadId}/read
POST /justproveit/admin/generic-reports/gmail/messages/{messageId}/read
```

### Trash

```http
POST /justproveit/admin/generic-reports/gmail/threads/{threadId}/trash
POST /justproveit/admin/generic-reports/gmail/messages/{messageId}/trash
```

### Stage-One / Decizie Pozitiva

```http
POST /justproveit/admin/generic-reports/customers/stage-one-closed
```

Request:

```json
{
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "eventAt": "2026-04-18T10:00:00.000Z",
  "sourceRecordId": "manual-stage-one:customer@example.com:2026-04-18T10:00:00.000Z",
  "sourceParentId": "thread:gmail-thread-id",
  "sourceSystem": "genericreports_admin_manual",
  "sourceRecordType": "positive_decision_button",
  "templateKey": "buttonUpdateDeciziePoz",
  "mailboxEmail": "oz@proveitweb.co.uk",
  "description": "Positive decision manually marked from GenericReports",
  "matchedTemplateFrom": "genericreports_admin_manual_button",
  "metadata": {
    "threadKey": "thread:gmail-thread-id",
    "selectedSubject": "Update from lender"
  }
}
```

`r`n### Azure Queue

```http
POST /justproveit/admin/generic-reports/azure-queue
```

Request:

```json
{
  "phone": "07123456789",
  "queueId": 35,
  "reason": "felicitari-template-sent"
}
```

### Generic Update Email

```http
POST /justproveit/admin/generic-reports/emails/generic-update
```

Request:

```json
{
  "to": "customer@example.com",
  "customerName": "Customer Name",
  "customerSinceLabel": "18/04/2026",
  "statusLabel": "Customer"
}
```

## Known Limitation

This endpoint intentionally returns `501` for now:

```http
GET /justproveit/admin/generic-reports/leads/by-phone?phone=07123456789
```

Reason: the old Wix implementation depends on the Wix `crmLeads12Nov` collection, and no existing Azure endpoint has been provided for phone-to-lead lookup yet.

For the first frontend implementation, either hide phone search or show a graceful "Phone search is not available yet" state.

## Suggested UI Route

Create:

```text
/admin/support-inbox
```

Initial workflow:

1. On page load, verify admin access via `/justproveit/admin/me`.
2. Load `/justproveit/admin/generic-reports/config`.
3. Load `/justproveit/admin/generic-reports/gmail/profile`.
4. Load `/justproveit/admin/generic-reports/reply-templates`.
5. Load recent messages with:

```http
GET /justproveit/admin/generic-reports/messages/recent?source=cached&limit=20
```

6. Render:
   - date filters
   - source selector: cached/live/merged
   - message list
   - selected message preview
   - customer context panel
   - reply template dropdown
   - reply editor
   - action buttons:
     - Send reply
     - No reply from here / skip
     - Mark read
     - Delete/trash
     - Generic update
     - Update Decizie Pozitiva

All destructive/send buttons should require explicit frontend confirmation before calling the backend.

## Tested Backend Status

These protected endpoints were tested successfully with a JustProveIt tenant-admin token:

```text
/justproveit/admin/me
/justproveit/admin/generic-reports/config
/justproveit/admin/generic-reports/gmail/profile
/justproveit/admin/generic-reports/reply-templates
/justproveit/admin/generic-reports/thread-state/replied
/justproveit/admin/generic-reports/thread-state/skipped
/justproveit/admin/generic-reports/messages/recent?source=cached&limit=5
/justproveit/admin/generic-reports/gmail/search
/justproveit/admin/generic-reports/customers/context
```

Do not use the old `/api/admin/*` paths. Use `/api/justproveit/admin/*`.





