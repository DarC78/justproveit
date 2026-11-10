# CRM email history

Approved scope (9 November 2026): received and sent messages in exactly
`adriandefta@proveitweb.co.uk` and `oz@proveitweb.co.uk`, plus confirmed system
deliveries from `justproveit.co.uk` and its sending subdomains. Both presale and
postsale messages are matched by the lead's saved email addresses. The mailbox
`adrian@proveitweb.co.uk` is never connected, and messages from that exact sender
are excluded even if they appear in an approved mailbox. Matching never treats a
staff mailbox address as a lead identity.

## UI and access

Calls, WhatsApp and email subjects share the newest-first history in scheduled
calls, Attention and lead/customer views. Email bodies are requested only when
expanded; they are cached after retrieval. HTML is displayed in an opaque-origin
sandboxed iframe with scripts, forms and remote resources blocked. Subjects and
plain text use normal React escaping. Attachments are not downloaded. Mailbox
reads do not mark messages read, change labels, send mail or change the inbox.

`Email history connections` appears above the four CRM views. A tenant
administrator connects each of the two exact accounts separately. OAuth requests
only `https://www.googleapis.com/auth/gmail.readonly`, verifies the Google profile
against the requested address, and encrypts the refresh token with the existing
field-encryption key. A one-use state hash expires after ten minutes.

The Google OAuth web client must register:

`https://launchingstack-func-dev.azurewebsites.net/api/justproveit/admin/crm/email-oauth/callback`

`CRM_GMAIL_CLIENT_ID` and `CRM_GMAIL_CLIENT_SECRET` may configure a dedicated web
client. Otherwise only the existing personal Gmail application's client ID/secret
are reused; its mailbox refresh token is never used. `FieldEncryptionKey` (or its
existing configured fallback) must be 64 hexadecimal characters. No credentials
are exposed to the browser. Read authorization still requires the account owner
to complete Google consent. The older imported Wix account records are not trusted
as active mailbox connections.

## Storage and synchronization

Migration `sql/171_crm_email_history.sql` creates tenant-scoped message, participant,
mailbox-state and legacy-system-verification tables, plus recipient lookup indexes.
The Functions deployment runs `scripts/setup-crm-email-history.mjs` before release.
All routes enforce ProveIt CRM access and resolve email addresses from the actual
tenant-owned contact or booking, never from arbitrary caller-supplied addresses.
Body access rechecks that the specific message belongs to that lead.

Every five minutes `crmEmailMailboxSync` reads Gmail message-added history and one
50-message historical page per connected mailbox. Progress is committed only
after the batch is persisted; expired Gmail history restarts discovery. Drafts,
missing/invalid dates and excluded senders are skipped. An application lock prevents
overlapping sync workers. `CRM_EMAIL_SYNC_ENABLED=false` stops background reads.
Duplicate provider records are upserted; RFC Message-ID also coalesces copies in a
history page when present.

System histories initially materialize indexed, confirmed `Sent` Resend receipts
matching the lead. Records without reliable sender metadata enter a background
verification queue; only a retrieved original with an allowed sender is displayed.
The queue checks ten receipts per pass with bounded retries. Bodies are retrieved
read-only from Resend using the existing key and cached. Unknown/failed/queued
delivery attempts are never presented as sent. Legacy receipts that the provider
no longer retains cannot supply a verified original; email content is not rebuilt
from today's template. Some older logs lack recipient identity entirely and cannot
be attributed safely. No system email is sent by this feature.

API: `GET /justproveit/admin/crm/{contacts|scheduled-calls}/{id}/emails`
(50 summaries, optional cursor); `GET .../emails/{messageId}` (body).
Connections: `GET /justproveit/admin/crm/email-connections`,
`POST .../email-connections/connect` (tenant admin only).

PostgreSQL staging operation is not enabled in this release. Tests cover read-only
OAuth, exact mailbox exclusion, recipient matching, body access isolation, sync
checkpoint replay, temporary-table SQL, lazy expansion and sandboxed rendering.

References: [Google Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes),
[Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync).

Stripe activity is also merged into the shared lead timeline (pale purple, with ProveIt/JustProveIt account labels). It loads independently through the authenticated /contacts/{id}/stripe-events or /scheduled-calls/{id}/stripe-events routes, 50 events per page. Account connection and backend contract: docs/engineering/systems/crm-stripe-events.md in LaunchingStack. Historical Stripe backfill is not automatic.

Details tab: main, normalized-only and additional phone numbers now open the shared lead conversation history in a collapsible modal. Legacy rows resolve their canonical contact through an exact normalized phone match; legacy record IDs and fuzzy suffix matches are not used as contact IDs. The existing contact-history cache is reused. Navigation/unmount invalidates pending lookups.
