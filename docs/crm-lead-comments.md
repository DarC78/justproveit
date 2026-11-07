# Add comment and Next Action Date

Every lead/customer shown in Scheduled Calls, Attention, AllCustomersView and All Leads has Add comment. Existing VA_CUMPARA closure remains separate. The dialog shows private history, authenticated actor and creation time, a required comment and optional calendar-date input. The current follow-up date is prefilled and can be changed or cleared. After saving, the history and displayed date update without resolving the lead or sending any client communication.

`InternalLeadActions` is shared by the four lists. `useLeadNoteSummaries` fetches current dates/counts in batches of at most 200 targets and cancels stale reads. Dates remain `YYYY-MM-DD` values without timezone conversion and display as DD/MM/YYYY. Existing canonical contacts share the same history across tabs. Customer rows without a CRM contact use `/customers/{id}/internal`; only the first explicit save may create a plain CRM identity, without a lead intent, dialler insertion or service-stage change.

API routes: GET/POST `contacts/{id}/internal`, GET/POST `customers/{id}/internal`, POST `contacts/internal-summaries` under `/justproveit/admin/crm`. A note's `nextActionDate` sets a date, null clears it, omission preserves it. The request UUID is retained for retries and regenerated after editing text/date. Date-only saves are not exposed: a comment is required. Saving is blocked if the initial record read was not verified.

Backend contract: LaunchingStack `docs/engineering/systems/crm-lead-comments.md`. Tests cover date setting/clearing, comment-only saves, no closure side effects, idempotency, actor/tenant authorization and both database providers.

Rows with a Next Action Date use pale red for past dates, pale green for today and pale blue for future dates, compared in Europe/London. No date preserves the existing row styling, including chatbot handoff highlighting. The colours indicate date timing, not task completion.
