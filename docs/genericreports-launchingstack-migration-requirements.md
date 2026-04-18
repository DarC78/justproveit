# GenericReports Migration Requirements

## Purpose

Recreate the existing Wix/Velo `GenericReports` support workflow inside the JustProveIt admin area, backed by LaunchingStack Azure Functions APIs.

Source Wix page:

```text
C:\Users\adria\proveitweb-live\src\pages\GenericReports.q6j1r.js
```

This page is not a normal public webpage. It is an internal support inbox tool used to review customer/lender emails, inspect customer context, send replies from the support mailbox, skip/delete threads, send generic updates, and record customer milestones.

## Important Auth Change

Do not migrate Wix member authentication.

The old Wix implementation uses:

```js
import { authentication, currentMember } from 'wix-members-frontend';
import { isAllowedSupportPageMember } from 'backend/SupportPageAuth.jsw';
```

The new JustProveIt implementation already uses LaunchingStack login and tenant-scoped admin roles.

All new backend endpoints must require:

```http
Authorization: Bearer <accessToken>
```

The token must belong to:

```text
tenantKey=justproveit
```

and include at least one of:

```text
role: tenant-admin
permission: admin:access
```

Expected auth failures:

| Scenario | Status | Response |
| --- | --- | --- |
| Missing token | `401` | `{ "error": "Authentication required" }` |
| Invalid/expired token | `401` | `{ "error": "Invalid or expired token" }` |
| Authenticated non-admin | `403` | `{ "error": "Admin access required" }` |

The frontend will no longer use Wix member IDs, Wix login modals, `ALLOWED_MEMBERS_ID`, or `/members` redirects.

## Current Backend Dependencies In Wix

The Wix page currently depends on these backend modules:

```text
backend/gmail.jsw
backend/SupportInbox.jsw
backend/AzureUniqueViews.jsw
backend/AzureLeadInsert.jsw
backend/GenericReportsMailer.jsw
backend/Utils.jsw
```

The replacement should expose equivalent functionality as LaunchingStack admin HTTP APIs.

## Constants To Preserve

```text
OZ_SUPPORT_MAILBOX=oz@proveitweb.co.uk
EMAIL_PAGE_SIZE=20
FELICITARI_BCC_EMAIL=georgianaaageo12@gmail.com
FELICITARI_AZURE_QUEUE_ID=35
STAGE_ONE_TEMPLATE_KEY=felicitari
```

The frontend should be able to receive these as either API config or hard-coded constants. Secret values must remain backend-only.

## Admin Capability Endpoint

The JustProveIt frontend currently expects:

```http
GET /api/admin/me
Authorization: Bearer <accessToken>
```

This endpoint should be deployed or the correct route should be confirmed.

Expected:

- `200` for `tenant-admin` / `admin:access`
- `403` for authenticated non-admin
- `401` for missing/invalid token

This is not the GenericReports workflow itself, but it is the common admin gate the frontend should use.

## Recommended API Namespace

Use a dedicated namespace:

```text
/api/admin/generic-reports/*
```

All endpoints below assume the base URL:

```text
https://launchingstack-func-dev.azurewebsites.net/api
```

All endpoints require the admin auth rule above.

## Phase 1: Read-Only Inbox

### 1. Get Recent Messages

Replaces:

```js
listRecentLiveSupportMailboxMessages()
listRecentSupportMailboxMessages()
```

Endpoint:

```http
GET /admin/generic-reports/messages/recent?limit=20&afterDate=2026/04/01&beforeDate=2026/04/19
Authorization: Bearer <token>
```

Query parameters:

| Name | Required | Notes |
| --- | --- | --- |
| `limit` | No | Default `20`, max `100` |
| `afterDate` | No | Gmail query format `YYYY/MM/DD` |
| `beforeDate` | No | Gmail query format `YYYY/MM/DD`; exclusive upper bound |
| `source` | No | `live`, `cached`, or `merged`; default `merged` |

Response:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "connectedMailboxEmail": "oz@proveitweb.co.uk",
  "source": "merged",
  "query": "in:inbox -from:oz@proveitweb.co.uk after:2026/04/01 before:2026/04/19",
  "messageCount": 2,
  "resultSizeEstimate": 2,
  "nextPageToken": "",
  "messages": [
    {
      "id": "gmail-message-id",
      "messageId": "gmail-message-id",
      "threadId": "gmail-thread-id",
      "externalMessageId": "gmail-message-id",
      "externalThreadId": "gmail-thread-id",
      "from": "Customer Name <customer@example.com>",
      "fromEmail": "customer@example.com",
      "fromDisplayName": "Customer Name",
      "to": "oz@proveitweb.co.uk",
      "subject": "Update from lender",
      "date": "Sat, 18 Apr 2026 09:00:00 +0000",
      "sentAtUtc": "2026-04-18T09:00:00.000Z",
      "snippet": "Email snippet...",
      "body": "Plain text body",
      "bodyHtml": "<p>HTML body</p>",
      "headers": {
        "Message-ID": "<message@example.com>",
        "In-Reply-To": "",
        "References": ""
      },
      "attachments": [
        {
          "filename": "document.pdf",
          "mimeType": "application/pdf",
          "attachmentId": "attachment-id",
          "size": 12345,
          "contentId": ""
        }
      ]
    }
  ]
}
```

Notes:

- Return enough message fields for the frontend to build reply headers and render previews.
- The frontend can filter locally replied/skipped threads, but backend should also be able to omit them later.
- Messages should be sorted newest first.

### 2. Search Messages By Email

Replaces Gmail searches and cached support view lookups by address.

Endpoint:

```http
GET /admin/generic-reports/messages/search?email=customer@example.com&limit=100
Authorization: Bearer <token>
```

Response:

```json
{
  "email": "customer@example.com",
  "messageCount": 2,
  "messages": []
}
```

Use the same message object shape as `messages/recent`.

### 3. Get Message Attachment

Replaces:

```js
gmailGetAttachmentData(messageId, attachmentId)
```

Endpoint:

```http
GET /admin/generic-reports/messages/{messageId}/attachments/{attachmentId}
Authorization: Bearer <token>
```

Response:

```json
{
  "messageId": "gmail-message-id",
  "attachmentId": "attachment-id",
  "data": "base64-data",
  "mimeType": "image/png",
  "filename": "image.png"
}
```

Notes:

- `data` should be standard base64 or base64url consistently documented.
- This is needed for inline CID images and attachments.

## Phase 2: Customer Context

### 4. Get Customer Reply Context

Replaces:

```js
getCustomerReplyContext({ email })
getSupportCustomerSupportView(email, options)
```

Endpoint:

```http
GET /admin/generic-reports/customers/context?email=customer@example.com
Authorization: Bearer <token>
```

Response should include all data needed by the current Wix customer panel:

```json
{
  "email": "customer@example.com",
  "customer": {
    "customerId": "customer-id",
    "customerName": "Customer Name",
    "primaryEmail": "customer@example.com",
    "phoneNumber": "07123456789",
    "customerSinceLabel": "18/04/2026",
    "statusLabel": "Customer",
    "status": "customer",
    "hasPositiveDecision": false,
    "successfulPayments": [
      {
        "amount": 120,
        "currency": "GBP",
        "paidAt": "2026-04-18T09:00:00.000Z"
      }
    ],
    "carFinanceCases": [
      {
        "carReg": "AB12CDE",
        "financeCompany": "Example Finance",
        "status": "Submitted"
      }
    ],
    "emails": [
      "customer@example.com",
      "other@example.com"
    ],
    "phones": [
      "07123456789"
    ]
  },
  "support": {
    "conversations": [],
    "messages": []
  }
}
```

The exact internal schema can differ, but the frontend needs these semantic values:

- display name
- primary email
- other emails
- phone
- status label
- customer-since label
- positive decision / stage-one flag
- finance companies
- car registrations
- number of services/cases
- successful payment total/count

### 5. Find Lead By Phone

Replaces:

```js
getLeadByPhone(phone)
```

Endpoint:

```http
GET /admin/generic-reports/leads/by-phone?phone=07123456789
Authorization: Bearer <token>
```

Response:

```json
{
  "phone": "07123456789",
  "lead": {
    "leadId": "lead-id",
    "email": "customer@example.com",
    "firstName": "Customer",
    "lastName": "Name",
    "fullName": "Customer Name",
    "phone": "07123456789"
  }
}
```

## Phase 3: Reply Templates

### 6. List Reply Templates

Replaces Wix collection:

```text
replyTemplates
```

Endpoint:

```http
GET /admin/generic-reports/reply-templates
Authorization: Bearer <token>
```

Response:

```json
{
  "templates": [
    {
      "key": "felicitari",
      "label": "Felicitari",
      "subjectPrefix": "",
      "plainText": "Buna ziua,\n\n...",
      "html": "<p>Buna ziua,</p>",
      "enabled": true,
      "sortOrder": 10
    },
    {
      "key": "ati_semnat_cmc",
      "label": "Ati semnat CMC",
      "plainText": "Buna ziua,\n\n...",
      "html": "",
      "enabled": true,
      "sortOrder": 20
    },
    {
      "key": "cancelCMC",
      "label": "Cancel CMC",
      "plainText": "Buna ziua,\n\n...",
      "html": "",
      "enabled": true,
      "sortOrder": 30
    }
  ]
}
```

Notes:

- The Wix page also has hard-coded fallback templates. LaunchingStack may either migrate the `replyTemplates` collection or return these canonical templates from config.
- Template placeholders should support at least:
  ```text
  firstName
  customerName
  email
  statusLabel
  customerSinceLabel
  ```

## Phase 4: Gmail Actions

### 7. Gmail Connection Status

Replaces:

```js
isGmailConnected()
gmailGetProfile()
```

Endpoint:

```http
GET /admin/generic-reports/gmail/profile
Authorization: Bearer <token>
```

Response:

```json
{
  "connected": true,
  "emailAddress": "oz@proveitweb.co.uk",
  "messagesTotal": 12345,
  "threadsTotal": 6789,
  "historyId": "history-id"
}
```

Requirement:

- If a Gmail account is connected but it is not `oz@proveitweb.co.uk`, return a clear error or `connected: false` with the connected address.

### 8. Search Gmail

Replaces:

```js
gmailSearchPage(q, maxResults, pageToken)
gmailGet(messageId)
```

Endpoint:

```http
POST /admin/generic-reports/gmail/search
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "query": "from:customer@example.com -in:drafts",
  "maxResults": 10,
  "pageToken": ""
}
```

Response:

```json
{
  "messages": [],
  "nextPageToken": "",
  "resultSizeEstimate": 0
}
```

The frontend can use this for “last email from customer” and “last email sent by support mailbox”.

### 9. Send Gmail Reply

Replaces:

```js
gmailSend({ to, bcc, subject, text, html, threadId, inReplyTo, references })
```

Endpoint:

```http
POST /admin/generic-reports/gmail/send
Authorization: Bearer <token>
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

Response:

```json
{
  "id": "sent-gmail-message-id",
  "threadId": "gmail-thread-id",
  "labelIds": ["SENT"]
}
```

Requirements:

- Only send from `oz@proveitweb.co.uk`.
- Validate `to` and `subject`.
- Require either `text` or `html`.
- Record an audit log entry for every send.

### 10. Mark Message/Thread Read

Endpoints:

```http
POST /admin/generic-reports/gmail/threads/{threadId}/read
POST /admin/generic-reports/gmail/messages/{messageId}/read
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true
}
```

### 11. Trash Message/Thread

Endpoints:

```http
POST /admin/generic-reports/gmail/threads/{threadId}/trash
POST /admin/generic-reports/gmail/messages/{messageId}/trash
Authorization: Bearer <token>
```

Response:

```json
{
  "success": true
}
```

Requirements:

- These are destructive actions. Audit them.
- Return clear errors if Gmail refuses the action.

## Phase 5: Thread State

### 12. Get Replied Thread Keys

Replaces:

```js
getRepliedSupportThreadKeys({ mailboxEmail })
```

Endpoint:

```http
GET /admin/generic-reports/thread-state/replied?mailboxEmail=oz@proveitweb.co.uk
Authorization: Bearer <token>
```

Response:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKeys": ["thread:gmail-thread-id"]
}
```

### 13. Get Skipped Thread Keys

Replaces:

```js
getSkippedSupportThreadKeys({ mailboxEmail })
```

Endpoint:

```http
GET /admin/generic-reports/thread-state/skipped?mailboxEmail=oz@proveitweb.co.uk
Authorization: Bearer <token>
```

Response:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKeys": ["thread:gmail-thread-id"]
}
```

### 14. Mark Thread Replied

Replaces:

```js
markSupportThreadAsReplied({ mailboxEmail, threadKey, recipientEmail, subject, repliedByEmail })
```

Endpoint:

```http
POST /admin/generic-reports/thread-state/replied
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKey": "thread:gmail-thread-id",
  "recipientEmail": "customer@example.com",
  "subject": "Re: Update from lender"
}
```

Response:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKey": "thread:gmail-thread-id",
  "alreadyMarked": false,
  "threadKeys": ["thread:gmail-thread-id"]
}
```

The backend should derive `repliedByEmail` or actor identity from the authenticated admin token.

### 15. Mark Thread Skipped

Replaces:

```js
markSupportThreadAsSkipped({ mailboxEmail, threadKey, senderEmail, subject, skippedByEmail })
```

Endpoint:

```http
POST /admin/generic-reports/thread-state/skipped
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKey": "thread:gmail-thread-id",
  "senderEmail": "customer@example.com",
  "subject": "Update from lender"
}
```

Response:

```json
{
  "mailboxEmail": "oz@proveitweb.co.uk",
  "threadKey": "thread:gmail-thread-id",
  "alreadyMarked": false,
  "threadKeys": ["thread:gmail-thread-id"]
}
```

## Phase 6: Customer Actions

### 16. Record Stage One Closed / Decizie Pozitiva

Replaces:

```js
recordGenericReportsStageOneClosed(...)
```

Endpoint:

```http
POST /admin/generic-reports/customers/stage-one-closed
Authorization: Bearer <token>
Content-Type: application/json
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

Response:

```json
{
  "success": true,
  "customerEmail": "customer@example.com",
  "eventType": "car_finance_stage_one_closed"
}
```

Requirements:

- Validate `customerEmail`.
- Validate `sourceRecordId` or generate one server-side.
- Record actor admin from JWT.
- Be idempotent where possible.

### 17. Add Phone To Azure Queue

Replaces:

```js
insertLeadIntoAzure(phone, 35)
```

Endpoint:

```http
POST /admin/generic-reports/azure-queue
Authorization: Bearer <token>
Content-Type: application/json
```

Request:

```json
{
  "phone": "07123456789",
  "queueId": 35,
  "reason": "felicitari-template-sent"
}
```

Response:

```json
{
  "queued": true,
  "phone": "07123456789",
  "queueId": 35
}
```

### 18. Send Generic Update Email

Replaces:

```js
sendGenericUpdateEmail({ to, customerName, customerSinceLabel, statusLabel })
```

Endpoint:

```http
POST /admin/generic-reports/emails/generic-update
Authorization: Bearer <token>
Content-Type: application/json
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

Response:

```json
{
  "success": true,
  "provider": "resend",
  "messageId": "resend-message-id"
}
```

Requirements:

- Use backend-side `RESEND_API_KEY`.
- Do not expose email provider secrets.
- Audit every send.

## Audit Logging Requirements

Audit the following:

- Admin viewed GenericReports inbox.
- Admin searched a customer/email.
- Gmail reply sent.
- Gmail thread/message marked read.
- Gmail thread/message trashed.
- Thread marked replied.
- Thread marked skipped.
- Generic update email sent.
- Stage-one / Decizie Pozitiva milestone recorded.
- Azure queue insert attempted.

Recommended fields:

```text
id
tenant_id
tenant_key
actor_user_id
actor_email
action
target_type
target_id
customer_email
mailbox_email
metadata_json
ip_address
user_agent
created_at
```

## Error Handling Contract

Return JSON errors consistently:

```json
{
  "error": "Human readable error",
  "code": "OPTIONAL_MACHINE_CODE"
}
```

Expected statuses:

| Status | Meaning |
| --- | --- |
| `400` | Missing/invalid input |
| `401` | Missing/invalid/expired token |
| `403` | Authenticated but not admin |
| `404` | Message/customer/resource not found |
| `409` | Conflict or duplicate action |
| `502` | Upstream Gmail/Azure/Resend failure |
| `500` | Unexpected backend failure |

## CORS Requirements

Allow JustProveIt frontend origins:

```text
https://justproveit.co.uk
https://www.justproveit.co.uk
http://localhost:3000
http://localhost:3001
```

Allowed headers:

```text
Authorization
Content-Type
```

Allowed methods:

```text
GET
POST
PATCH
PUT
DELETE
OPTIONS
```

## Secrets And Configuration

LaunchStack/Azure should own these backend-only values:

```text
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN or stored OAuth account record
RESEND_API_KEY
AZURE SQL / customer context connection settings
UNIQUE_CUSTOMER_INGEST endpoint/config
CUSTOMER_REPLY_CONTEXT endpoint/config
OZ_SUPPORT_MAILBOX=oz@proveitweb.co.uk
FELICITARI_BCC_EMAIL=georgianaaageo12@gmail.com
FELICITARI_AZURE_QUEUE_ID=35
```

## Frontend Migration Plan

Once LaunchingStack exposes the endpoints, JustProveIt can implement:

```text
/admin/support-inbox
```

Initial layout:

- Date range filters.
- Search by email.
- Search by phone.
- Recent messages table.
- Selected message preview.
- Customer context panel.
- Reply template dropdown.
- Reply editor.
- Buttons:
  - Send reply
  - No reply from here / skip
  - Delete
  - Generic update
  - Update Decizie Pozitiva

## Suggested Implementation Phases

1. **Read-only inbox**
   - recent messages
   - search by email
   - customer context
   - attachment fetch

2. **Reply templates**
   - template list endpoint
   - frontend template dropdown/editor

3. **Gmail actions**
   - send reply
   - mark read
   - skip/replied state

4. **Sensitive/destructive actions**
   - trash message/thread
   - stage-one milestone
   - Azure queue insert
   - generic update email

5. **Hardening**
   - audit logs
   - idempotency
   - clearer upstream error codes
   - confirmation UX for destructive actions

## Acceptance Criteria

- Admin users with `tenant-admin` or `admin:access` can load `/admin/support-inbox`.
- Non-admin users cannot call any GenericReports backend endpoint.
- Recent support messages load for `oz@proveitweb.co.uk`.
- Searching by email returns relevant Gmail/support messages.
- Searching by phone resolves a customer email and loads that customer.
- Selecting a message returns enough data to render body, headers, and attachments.
- Customer context displays status, finance companies, car registrations, payments, and positive decision status.
- Reply templates load without Wix `wixData`.
- Gmail profile confirms the connected mailbox is `oz@proveitweb.co.uk`.
- Sending a reply works in-thread and returns Gmail message/thread identifiers.
- Sent replies can mark support threads as replied.
- Threads can be skipped and hidden from the actionable inbox.
- Delete/trash moves Gmail message/thread to trash and records skipped state.
- Generic update email sends through backend provider.
- Stage-one / Decizie Pozitiva can be recorded manually or after the `felicitari` template.
- All sensitive actions are audit logged with actor identity.

## Open Questions For LaunchingStack

- Is `/api/admin/me` the intended admin capability route? It currently returns `404` in testing.
- Should Gmail OAuth remain tied to the existing Wix `EmailAccounts` records, or be migrated to LaunchingStack storage?
- Should recent messages come from live Gmail, cached Azure support mailbox data, or merged live+cached results by default?
- Where should reply templates live: database table, config file, or existing Wix collection export?
- Can LaunchingStack return sample JSON from current support/customer endpoints so the frontend can be typed accurately?
- Should destructive Gmail actions require an additional confirmation/audit reason field?
- Is `FELICITARI_BCC_EMAIL` still required in production?
- Is queue ID `35` still the correct destination for the `felicitari` workflow?
