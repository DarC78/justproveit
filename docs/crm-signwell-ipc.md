# Authority action — IPC and Private Pension

**Împuternicire** opens an empty type selector. Choosing IPC or Private Pension
shows that template's input fields. The flow is:

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


## IPC / Private Pension selector — 14 November 2026

The action is now **Împuternicire**, with no default type selected. The authenticated API supplies the catalogue for IPC and Private Pension. Fields appear only after selection; changing the type resets input, verification, explicit invitation confirmation and request UUID. IPC retains its existing inputs. Private Pension shows name, signing email, NINO, DOB, current address, five previous addresses and five employer/period pairs. The full name populates all three document name fields automatically. Email is needed for delivery, even though it is not a Private Pension document field. There is no Private Pension client-phone field.

Blank Private Pension fields are sent as one space under the owner's instruction. SignWell strips that space to an empty value; fields required in its template must still be completed by the client. The form explains that fact. Name and email remain required; other private inputs are optional, with format validation when supplied. Signing dates stay provider-controlled.

History identifies the type on every authority. Existing records without a type remain IPC. Pending or completed authorities only restrict another authority of that same type; both types may coexist. PDF filenames reflect the authority type. No SignWell communication occurs on open/check, no invitations occur before the existing explicit send confirmation, and service stages remain manual. Backend metadata/status reconciliation remains authoritative and legacy API paths are preserved.
