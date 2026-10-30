# All Leads and customer CRM inbox

The All Leads tab now uses the same table component as AllCustomersView. Both sections have independent name/phone/email filters and server pagination of 50 rows. The inbound section uses the backend's shared received-email, inbound WhatsApp and inbound-call predicate; outbound-only activity does not qualify. The customers tab retains OZ-client membership; the leads tab uses canonical CRM contacts.

The shared table renders first/last callcode descriptions, never numeric IDs. Customer actions use the canonical actionContactId supplied by the backend (preferring the displayed booking's contact), not the OZ record identifier. Records without a canonical contact have no contact actions.

Row actions call POST /justproveit/admin/crm/contacts/{canonicalContactId}/actions with {action, requestId, text?}:
- reply: native floating modal with text area; Send & solve queues a WhatsApp text reply and resolves current work. Cancel/Escape sends nothing. The UI reports queued, not delivered.
- solve: marks current CRM work and associated open WhatsApp tickets solved, without sending messages.
- asap: creates an ASAP / SimulatorPensie intent using the existing backend intake and dialler routing. Previous open work is resolved first.

The request ID is stable after a failed attempt; a synchronous guard prevents double-click submissions. Backend authorization, durable idempotency and transaction rollback protect both endpoints. Resolving work cancels its pending confirmation/reminder messages; in-flight messages return a conflict rather than being silently overwritten. No live customer messages were sent as part of implementation validation.

Backend implementation: LaunchingStack crmCustomers.js, crmContactActions.js, crmAdminLeadIntents.js and their authenticated routes. The user explicitly authorized cross-repository implementation for this task, overriding AGENTS.md's usual backend handoff rule.

Validation: CRM API/component tests, backend unit/SQL fixture tests, frontend production build and real read-only database queries. Browser visual QA could not run because native Chrome access approval timed out. The broader frontend suite has two unrelated existing date-sensitive Bani UK AI checkout failures.
