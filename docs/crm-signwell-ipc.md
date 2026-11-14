# IPC authority action

Contact lead actions now include **Împuternicire IPC**. The agent fills full name, email, phone, full address, DOB and NINO, reviews all details and the client/Adrian recipients, then explicitly confirms sending through SignWell. No invitation is sent merely by opening or reviewing the form.

LOADate and ClientSignDate are automatically the client's actual signing date; ProveitSignDate is Adrian's actual signing date. The dates are locked in the SignWell template and have no frontend inputs. SignWell delivers its own signing invitations and existing notifications under the user's explicit exception to the usual Resend delivery rule.

Authenticated endpoint: `/justproveit/admin/crm/contacts/{id}/signwell-ipc`, GET setup/history and POST validate/send/refresh/pdf. API credentials remain backend-only. History shows delivery/signing state, allows refresh, and offers the final signed PDF after completion. Active or uncertain requests block duplicate authorities; completed ones require explicit confirmation for a new document. No service stage is advanced automatically.

Backend contract: `C:\DevProjects\LaunchingStack\docs\systems\crm-signwell-ipc.md`. This implements IPC template 3 only. Templates 1/2 are not enabled.

## Verification before sending — 14 November 2026

**Verifică datele** validates inputs and template, creates a draft with draft:true, and verifies its recipient emails, field values and signature dates through the provider response. No invitations are sent in this step. Only a successful Verified result opens the review/confirmation step. Client email must differ from Adrian’s ProveIt signing email; SignWell rejects duplicate recipients (`recipients.duplicated_emails`), reproduced with a synthetic unsent draft. The former generic template error in the screenshot was caused by this duplicate email, not a broken template.

Send requires the same verified request UUID and input fingerprint, atomically reserves Sending and sends the stored draft. It never creates another draft or checks the template at send time. Authorization, confirmation, input integrity and duplicate-send guards remain mandatory. Editing requires verification again; a new verified draft supersedes the previous unsent draft, preserving history. Uncertain outcomes are still blocked from automatic retry. Both locked client dates and ProveIt signing date remain automatic.
