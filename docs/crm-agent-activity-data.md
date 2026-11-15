# CRM agent activity collection

The CRM mounts `CrmAgentActivityTracking` after successful CRM authorization.
It records focus, visibility and last trusted interaction every 15 seconds, with
immediate visibility/focus and best-effort leave samples. Opening a tab or polling
does not count as input. No keys, input values, message bodies or search strings
are collected. Recent input expires after 60 seconds; hidden/unfocused tabs are
separate states. Timer suspension and delivery outages leave unknown coverage.

Existing CRM authentication is used. The backend derives user/session/tenant and
matches `platform.Users.DisplayName` exactly to Mediatel AGENTNAME after trimming
and case normalization. Passwords are independent. Unmatched/ambiguous/offline
mapping is explicit and does not block CRM work.

Browser batches go to the canonical CRM API's `/justproveit/admin/crm/agent-telemetry`
endpoint. Retries reuse IDs, expire after 110 seconds and remain in memory only.
The tracker correlates requests to that API origin and CRM path with a random
tab ID and a recent-input flag. Other origins are untouched. The flag is a
correlation signal, not proof of a manual request. The fetch wrapper/listeners
are removed on unmount or authentication change. Tracking errors do not interrupt
the CRM. Existing API requests retain their authentication and request options.

The backend independently records authenticated CRM operation outcomes; automatic
refreshes and requests without recent input are distinguishable. Cached/local-only
views do not create server operation records. This release creates the data layer,
not the report UI or a completed inactivity calculation. Full maintained storage,
API, coverage, permissions and reporting rules are in the backend counterpart:
`docs/systems/crm-agent-activity-data.md`. Browser verification:
`node --test tests/crm-agent-telemetry.test.cjs`.
