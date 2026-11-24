# WhatsApp history and reply channel

History labels distinguish WhatsApp Mediatel (API/MCIC) and WhatsApp Agenti (linked Linux gateway), with Client/ProveIt direction retained. The shared lead/booking composer loads authenticated reply-routing context and shows its channel/availability. The backend rechecks latest inbound messages on Send.

Latest Mediatel inbound under 24 hours uses Mediatel; latest Agenti inbound uses Agenti; expired/no Mediatel customer window uses Agenti. Agenti requires its explicit backend/Linux activation and uses free text. Templates remain Mediatel-only. First expired-window contact prepends the authenticated agent name and UK-time greeting.

Uncertain/queued requests retain the same request ID and lock the draft until checked. Queued never means delivered. No timeout or status check switches transports. The gateway status is shown in the same history.

Linux activation handover: LaunchingStack/docs/whatsapp-agent-replies-linux-handover.md. Cloud UI deployment does not imply the gateway is enabled. No service-case stages or chatbot automations are changed.

Before a new request is reserved, backend routing checks the existing Meta
destination restriction. Qualification-test-reserved recipients use enabled
WhatsApp Agenti even when their latest Mediatel inbound is within 24 hours. The
recipient and exact text are preserved, with no introductory text added for this
exception. Meta qualification protection remains in force. Existing failed request
IDs remain pinned to Mediatel and never automatically move to Agenti; only a new
explicit Send creates another request. Refresh routing context to show the current
channel before submitting that new reply.

## Observed WhatsApp calls: manual lead association (2026-11-11)

In the WhatsApp gateway tab, expand **Show observed WhatsApp calls**. Each call
shows its linked lead (or review state), with **Link to lead** / **Change linked
lead** controls. Search existing leads by name, phone or email, select the verified
record and enter a verification note. Confirming links every observed status for
that call and makes future status updates inherit the decision. **Unlink call and
return to review** requires a note and prevents automatic rematching of that call.
This does not change reply routing, lead details, customer records or agent identity.

The dedicated authenticated `/calls/targets` endpoint searches CRM contacts only.
`/calls/{linkKey}/link` accepts requestId, callToken, expectedSnapshot, contactId
(or null), and reason. Tenant/account/actor come from the backend. A 409 requires
refresh before another confirmation. Uncertain network/server failures lock edits
and offer **Retry same action**, preserving the original request ID and payload
while polling continues; exact retries return the audited result. Existing lead
call history includes manually linked calls without creating duplicate call rows.
No transport or outbound operation is exposed by this control.

New observed calls on shared numbers appear on every matching lead up to three.
Larger groups select the three with the latest prior inbound WhatsApp/call activity;
tied/absent activity uses newest lead creation date and stable ID. The panel shows
all selected lead names. Automatic selection is fixed across that call's updates.
A manual lead selection replaces all automatic associations, and unlink removes
all of them. Existing legacy call links and message/reply routing are preserved.

## Agent drafts and Meta template labels

The shared composer uses the label Templates. Approved Meta options show Meta -
before the unchanged provider name; the API still receives the exact original name
and language. AGENTS - OFFER, FU1�FU3 and FUNA1�FUNA3 load independently from
GET /justproveit/admin/crm/whatsapp-composer/agent-templates. Selection fills editable
plain text with the signed-in agent's live Mediatel Full Name; it sends nothing.
When no verified name is available, the draft uses a manual [Numele agentului] placeholder. The agent edits the signature in the message. Sending and scheduling are blocked until the placeholder is replaced; a blank closing also remains blocked. Automatic Mediatel signatures are unchanged. This fallback was explicitly authorized by the user on 24 November 2026.
The existing send/schedule route rechecks channel, opt-out and idempotency normally.
The maintained corrected copy is in backend docs/systems/crm-agent-message-templates.md.
