# Lead Pipeline

CRM `/admin/crm/?tab=leadPipeline` displays automatically calculated pipeline statuses for non-client contacts first received within the past 60 days. Backend contract: `docs/systems/crm-lead-pipeline.md` in LaunchingStack.

Status priority: `AgreedToBuy`, `SimulationDone`, `SimulationInProgress`, `newLead`. Contact/enquiry operational statuses remain unchanged. The page provides counts, bucket filtering, name/email/phone search, 30-row pagination and expandable contact history. Refresh recalculates evidence and removes contacts that have become clients.

No client workflow changes or outbound messages are triggered by this view. WhatsApp completion requires delivery/read evidence for the final simulation result, not just calculation or provider acceptance.

Lead source and Pipeline status selectors, plus the numeric “Inbound contact in the last X days” filter, are saved for the signed-in user in this browser and restored before the initial request after reload. Empty days displays N/A (no inbound restriction); 1–365 days requires an incoming call or incoming WhatsApp message. Missed calls qualify as inbound contact. Outbound communication, email and SMS do not. Changing source/days or refreshing preserves the chosen pipeline status. Clear is an explicit user reset. Counts respond to the non-status filters; each page contains at most 30 matching leads.
