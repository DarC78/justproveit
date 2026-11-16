# CRM agent activity collection

The CRM mounts `CrmAgentActivityTracking` after successful CRM authorization.
It records focus, visibility and last trusted interaction once per minute per tab.
The first sample is after one minute. Mount, focus/visibility changes and leaving
the CRM create no extra samples. Operations are still recorded individually.
Opening a tab or polling
does not count as input. No keys, input values, message bodies or search strings
are collected. Recent input expires after 60 seconds; hidden/unfocused tabs are
separate states. Timer suspension and delivery outages leave unknown coverage.

Existing CRM authentication is used. The backend derives user/session/tenant and
uses an explicit mapping table from CRM User ID to Mediatel Agent ID. Emails,
display names and passwords remain independent; no name or email-prefix matching
is performed. Unmapped users still have activity collected under their CRM User ID.
Tenant administrators maintain links through the backend agent-mappings API.

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


## Agent Report productivity metrics - 16 November 2026

The first summary row shows Logged To Mediatel, Paused, Talked and Clerical totals. The former interval/outside-interval summary rows are replaced by Active in CRM total, Simulations done, Cases opened and Cases updated. Payment calculations are unchanged. The daily table also exposes these CRM metrics.

Active CRM time counts each UTC minute with trusted visible/focused browser input or a manual server action once across tabs. Failed manual requests count as activity, but do not count as opened/updated records. Idle presence and background requests do not count. Mediatel talk, clerical and pause intervals are converted from Romania time to UTC, unioned and subtracted from those minutes; current minutes are capped at the report snapshot. Daily grouping follows Romania dates. This is observed activity coverage, not a measurement of continuous attention.

Cases are CRM lead/customer records, not pension service-case files. Opened records require a successful recorded view; updated records require a confirmed saved change, excluding unchanged and replayed responses. Linked customer/contact views resolve to the same record. Each record counts once per agent in the selected period, and once per day in daily rows.

Only approved explicit CRM-to-Mediatel mappings are included. Adrian is currently linked to Mediatel agent 5; other agents show Not linked until mappings are supplied. No names are inferred. Activity/view history starts on 15 November 2026; earlier dates show Not recorded. Simulation and confirmed-update attribution begins with this release on 16 November; older work cannot be reliably backfilled. A missing telemetry source shows Unavailable while Mediatel totals remain usable.

Authenticated manual simulations use POST /api/justproveit/admin/crm/pension-simulations. The server records the authenticated user and explicit mapping in the persisted calculator result, using contract authenticated-crm-v1. The public calculator strips caller-supplied attribution. Counts use distinct persisted result IDs, not typed agent names, requests or chatbot calculations. This route does not send email.
