# Lead Pipeline

CRM `/admin/crm/?tab=leadPipeline` displays automatically calculated pipeline statuses for non-client contacts first received within the past 60 days. Backend contract: `docs/systems/crm-lead-pipeline.md` in LaunchingStack.

Status priority: `AgreedToBuy`, `SimulationDone`, `SimulationInProgress`, `newLead`. Contact/enquiry operational statuses remain unchanged. The page provides counts, bucket filtering, name/email/phone search, 30-row pagination and expandable contact history. Refresh recalculates evidence and removes contacts that have become clients.

No client workflow changes or outbound messages are triggered by this view. WhatsApp completion requires delivery/read evidence for the final simulation result, not just calculation or provider acceptance.
