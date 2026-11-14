# IPC authority action

Contact lead actions now include **Împuternicire IPC**. The agent fills full name, email, phone, full address, DOB and NINO, reviews all details and the client/Adrian recipients, then explicitly confirms sending through SignWell. No invitation is sent merely by opening or reviewing the form.

LOADate and ClientSignDate are automatically the client's actual signing date; ProveitSignDate is Adrian's actual signing date. The dates are locked in the SignWell template and have no frontend inputs. SignWell delivers its own signing invitations and existing notifications under the user's explicit exception to the usual Resend delivery rule.

Authenticated endpoint: `/justproveit/admin/crm/contacts/{id}/signwell-ipc`, GET setup/history and POST send/refresh/pdf. API credentials remain backend-only. History shows delivery/signing state, allows refresh, and offers the final signed PDF after completion. Active or uncertain requests block duplicate authorities; completed ones require explicit confirmation for a new document. No service stage is advanced automatically.

Backend contract: `C:\DevProjects\LaunchingStack\docs\systems\crm-signwell-ipc.md`. This implements IPC template 3 only. Templates 1/2 are not enabled.
