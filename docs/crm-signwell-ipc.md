# IPC authority action — two steps

**Împuternicire IPC** opens the agent form for full name, email, phone, address,
DOB and NINO. The flow is:

1. **Verifică datele** validates content through CRM only. Opening and validation
   do not call SignWell, including template reads, and do not create a remote
   draft/document. The verified input snapshot is kept locally; editing requires
   verification again. Local verification entries are not shown as documents.
2. **Confirmă și trimite prin SignWell** requires the agent's explicit recipient
   authorization. The backend validates the current template, then creates and
   sends once using `draft:false`. Provider validation errors appear directly in
   the interface, including the HTTP status and field error details.

There is no **Actualizează starea** button. Pending sending/signing records
update automatically through local polling, authenticated provider reads in the
background and signed webhooks. A missing or delayed send response does not
cause another creation or an automatic resend. Already confirmed sending clears
a stale transport error. Unknown outcomes stay blocked until safely reconciled.
The signed PDF download remains available after all signatures are completed.
An existing document returning HTTP 404 is labelled unavailable and shows the
provider error; no replacement document is created automatically.

The client and Adrian Defta sign in SignWell. LOADate/ClientSignDate are the
client's actual signing date; ProveitSignDate is Adrian's actual signing date.
These locked dates have no editable frontend fields. SignWell sends invitations
and its existing signing notifications under the user's explicit exception to
the usual Resend rule; no connected mailbox is used.

Endpoint: `/justproveit/admin/crm/contacts/{id}/signwell-ipc`, authenticated GET
local setup/history and POST validate/send/pdf. The legacy refresh action remains
backend-compatible but has no UI control. Credentials stay backend-only. Existing
active authorities block duplicates, and a new authority after completion needs
explicit confirmation. Service stages remain manual.

This replaces the previous draft-on-validation flow. Backend contract:
`docs/systems/crm-signwell-ipc.md` in LaunchingStack. IPC template 3 only;
templates 1 and 2 remain out of scope.
