# Lead Pipeline

## ToAdrian and pipeline controls (11 November 2026)

ToAdrian follows AgreedToBuy and precedes clients, with the same first UK date/time column and P0–P5 presentation. Received files/photos route eligible non-clients into ToAdrian automatically; automatic existing clients remain in clients. Historical evidence recalculates on read.

PipelineLeadControls is rendered in every pipeline category, including the shared ScheduledCall table through its optional extra-actions renderer. Assign pipeline stage offers Automatic, AgreedToBuy and ToAdrian. Manual selection overrides computed classification until cleared and puts the lead first as manual P0 (also before other rows in All). The service/client purchase records and bookings are preserved. Explicitly reassigning the same stage can re-pin P0.

P0 rows also expose Mark as handled. This uses the new metadata-only pipeline-control API, not Solve. The request carries the displayed incoming timestamp and pipeline version; retries retain the same request ID/payload. Handling clears only the current incoming/manual alert, retaining the stage. New incoming contact can reactivate P0. A stale assignment from another agent returns a conflict rather than silently being overwritten. Successful changes refresh the list with the user's filters intact. No message is sent and no appointment/reminder is cancelled.

## AgreedToBuy priorities (11 November 2026)

AgreedToBuy adds Date / time (UK) as its first column, showing the backend-selected priority timestamp plus P0–P5 and a reason. Next Action Dates are date-only and display “No time set”. Backend priority order is applied before pagination: P0 client reply after our latest contact (light red, newest first); P1 today's appointment over 30 minutes overdue without call/WhatsApp follow-up (red, oldest first); P2 overdue Next Action Date (red, oldest first); P3 appointment within 30 minutes or upcoming, including future days (green, soonest first); P4 today/future Next Action Date (green, soonest first); P5 remainder (no background, latest activity first). First matching priority wins. The 30-minute threshold uses the scheduled appointment time, not booking creation.

AgreedToBuy includes future appointments/action dates even with the general future-date checkbox off so P3/P4 are usable. Source/inbound/search filters, saved selections, linked history and contact/booking actions remain. Priority colours override ordinary Next Action Date colours in this stage only; other stages are unchanged. Load/Refresh and successful actions reload priorities, with source data in the backend rather than browser-only page sorting.

## Activity eligibility and clients (11 November 2026 — current rules)

The old first-received-in-60-days rule is replaced by actual calls (any outcome/direction) or incoming/outgoing WhatsApp activity in the past 60 elapsed days. Old active contacts qualify; a new contact or appointment alone does not. Car-finance-only clients are excluded. Other and mixed-service clients appear exclusively in `clients`, displayed after AgreedToBuy, while classification prioritizes clients above all lead stages. Unidentified purchases remain explicitly unidentified.

Clients adds Purchased service (All purchased services by default), saved in the existing per-user browser preferences. Purchase services and individual purchase dates are displayed in an additional column; contact history/actions and other ordinary columns remain. Dates use UK time and the CRM's existing recorded sale date. Last qualifying call/WhatsApp activity is also displayed. Older scope/exclusion statements below are superseded by this section. No client service workflow, messages or operational status changes are performed by this view.

## ScheduledCall daily view (11 November 2026)

Selecting ScheduledCall displays ScheduledDate, defaulting to today in Europe/London on each page load (not persisted). The server filters appointments by that date before pagination. This stage reuses ScheduledCallsTable in pipeline mode with nine columns: UK call time, name and lead source, agent assignment, linked phone/history, shared coloured call/callcode history, became a lead, booking creation, combined inbound/outbound WhatsApp messages on the booking date, and the identical booking actions plus internal comments. Other pipeline filters remain applicable. The existing Scheduled calls tab keeps its full original columns.

CRM `/admin/crm/?tab=leadPipeline` displays automatically calculated pipeline statuses for non-client contacts first received within the past 60 days. Backend contract: `docs/systems/crm-lead-pipeline.md` in LaunchingStack.

Status priority: `AgreedToBuy`, `SimulationDone`, `SimulationInProgress`, `newLead`. Contact/enquiry operational statuses remain unchanged. The page provides counts, bucket filtering, name/email/phone search, 30-row pagination and expandable contact history. Refresh recalculates evidence and removes contacts that have become clients.

No client workflow changes or outbound messages are triggered by this view. WhatsApp completion requires delivery/read evidence for the final simulation result, not just calculation or provider acceptance.

Rows reuse `ContactActions` and, where a booking exists, `BookingActions`, as in All Leads CRM. Contact controls include Reply on WhatsApp, Solve, Add comment, New ASAP and Book a Call. Note summaries and Next Action Date colours use the existing shared hook. Successful actions reload the filtered pipeline; filter selections stay unchanged.

“Show Leads Scheduled in the future” starts unchecked. The default hides active contact schedules or Next Action Dates after today in UK time; no date, overdue dates and today remain visible. Cancelled/completed schedules do not hide leads. Checking includes future-scheduled leads and updates counts/pagination. The setting persists in this browser; Clear resets it to unchecked. Note saves also refresh the pipeline so a future Next Action Date applies immediately. The Evidence column displays the next contact date where available.

Lead source and Pipeline status selectors, plus the numeric “Inbound contact in the last X days” filter, are saved for the signed-in user in this browser and restored before the initial request after reload. Empty days displays N/A (no inbound restriction); 1–365 days requires an incoming call or incoming WhatsApp message. Missed calls qualify as inbound contact. Outbound communication, email and SMS do not. Changing source/days or refreshing preserves the chosen pipeline status. Clear is an explicit user reset. Counts respond to the non-status filters; each page contains at most 30 matching leads.

Pipeline follow-up (10 November 2026): phone-history controls are visibly blue and underlined, with keyboard focus styling. newLead and SimulationInProgress use descending latest inbound WhatsApp/call time, before pagination, with no-inbound leads last. The earlier SimulationDone booked-call filter below was superseded by ScheduledCall on 11 November. Unchecked hides active future calls and past/today bookings with no meaningful agent call on/after the UK appointment day. Checking restores these rows; future Next Action Dates still obey the general scheduling checkbox. Cancelled, closed, solved and completed bookings are ignored. Received files/photos now count as AgreedToBuy evidence for non-client leads, including historical records. Display the received-file timestamp. A later explicit closure still clears agreement. No operational status is overwritten. Clear resets both checkbox preferences.

ScheduledCall (11 November 2026): fifth pipeline status, with priority AgreedToBuy > ScheduledCall > SimulationDone > SimulationInProgress > newLead. All retained valid manual/Calendly bookings qualify (past/today/future, including completed or cancelled history) unless agreement/document evidence makes the lead AgreedToBuy. Existing non-client 60-day cohort limits remain. Historical classification is recomputed without mutating operational statuses. Recorded appointment date/status are displayed. ScheduledCall always includes future-booked leads regardless of the general scheduling checkbox; other filters still apply. The redundant SimulationDone call-booked checkbox is removed; legacy saved values/API flags remain compatible. New status selections persist across reload.

### ScheduledCall future bookings
With Show Leads Scheduled in the future unchecked, only ScheduledDate is shown. Checked includes the selected UK date and every later booking, with date/time shown in the first column. Existing stage eligibility and other filters remain in force.
