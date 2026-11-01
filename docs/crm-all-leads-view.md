# All Leads and customer CRM inbox

The All Leads CRM tab has one search section. It does not load or display lead records until an agent submits a nonblank name, phone or email filter. Clear removes the results. The former “Leads who contacted us” section has been removed. AllCustomersView retains its two sections and 50-customer pagination.

Lead results use server pagination of five canonical CRM contacts. Each summary row is immediately followed by that contact's full recorded WhatsApp and call history, oldest first, with UK timestamps. Each history loads independently and can be retried with Refresh history. A missing phone is shown explicitly. Activity enrichment runs after the backend selects the five matching contacts.

Each history includes the existing WhatsApp composer with free text and approved Meta templates, including parameter and media inputs. Contacts do not need a booking. Text replies remain subject to the WhatsApp reply window. Contact sending uses the same durable request reservation, status checks, template validation and accepted-message MCIC recording as booking replies. Send does not mark the lead solved; the existing explicit contact actions remain available.

Contact endpoints (authenticated CRM access, tenant resolved from the session):

- `GET /justproveit/admin/crm/contacts/{contactId}/history`
- `POST /justproveit/admin/crm/contacts/{contactId}/whatsapp/replies`

The contact's primary phone is resolved on the server and checked against the displayed phone before sending. No messages are sent by loading or searching the page.

The shared table renders first/last callcode descriptions, never numeric IDs. Customer actions use the canonical actionContactId supplied by the backend (preferring the displayed booking's contact), not the OZ record identifier. Records without a canonical contact have no contact actions.

Row actions call POST /justproveit/admin/crm/contacts/{canonicalContactId}/actions with {action, requestId, text?}:
- reply: native floating modal with text area; Send & solve queues a WhatsApp text reply and resolves current work. Cancel/Escape sends nothing. The UI reports queued, not delivered.
- solve: marks current CRM work and associated open WhatsApp tickets solved, without sending messages.
- asap: creates an ASAP / SimulatorPensie intent using the existing backend intake and dialler routing. Previous open work is resolved first.

The request ID is stable after a failed attempt; a synchronous guard prevents double-click submissions. Backend authorization, durable idempotency and transaction rollback protect both endpoints. Resolving work cancels its pending confirmation/reminder messages; in-flight messages return a conflict rather than being silently overwritten. No live customer messages were sent as part of implementation validation.

Backend implementation: LaunchingStack crmCustomers.js, crmPhoneHistory.js, crmWhatsAppReplies.js and their authenticated routes, plus the existing contact actions.

Validation: `npm run test:crm-lead-search` exercises initial empty state, search, five-lead pagination, inline histories, unique composer IDs, text/template sends with mocked delivery, and Clear. Backend tests cover authorization, contact history and sending; isolated SQL fixtures verify pagination and filtering. A live read-only check verified history for a contact with no booking. No live messages were sent. Browser visual QA was unavailable because the browser access host was unavailable.
