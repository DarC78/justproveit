# Next Best Actions review

Open **Other → Next Best Actions**, or `/admin/crm/?tab=nextBestActions`. The page uses the existing CRM login and shows 25 recommendations per page with search, journey and review-status filters. It refreshes every minute while visible and preserves an open review dialog.

Every page states that sending is disabled. The row shows the journey, due time in London, proposed route/message, source evidence, Next Action Date and any blocking reasons. Institution enquiries are drafts with no assumed recipient. Missing source data remains visible. The page does not fetch full Mediatel history or create a CRM contact when opened.

Approve recommendation, Edit draft, Snooze, Take over NBA review, Resume NBA review and Dismiss with reason all save review commands to `/justproveit/admin/crm/next-best-actions/{key}`. Each command has a request UUID and expected version. A failed request retains its UUID for retry. Version conflicts require refreshing; no command creates an outbound message or booking. Blocked recommendations cannot be approved. Takeover/resume applies only to NBA review; it does not stop/restart existing chatbot processes. A review confirmation explicitly says that no message was queued or sent.

The source specification and database contract are maintained in backend `docs/crm-next-best-action.md`. The approved strategy is separate from messaging activation. Current first-payment dates, service status and call evidence must be reviewed before a pilot is enabled. Existing navigation hydration and URL aliases continue to use the shared CRM tab resolver.

Validation: `node --test tests/next-best-actions.test.cjs tests/crm-tab-navigation.test.cjs`, TypeScript and the production build. GitHub runs the NBA tests in the normal frontend deployment workflow.
