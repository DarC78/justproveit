# Exact-snapshot regression report

The local regression and production frontend build gates now pass. The MSSQL fixture/bootstrap fixes remain passing, and the dispatch hydration build blocker is resolved without lint suppression or disabled build checks. Exact base commits, review trees, source hashes and patch hashes are recorded in `reports/revisions-and-modifications.json`.

| Group | Passed | Failed | Skipped | Excluded | Evidence |
|---|---:|---:|---:|---:|---|
| Backend units | 968 | 0 | 0 | 0 | Preceding fixture follow-up; source unchanged |
| Frontend tests | 133 | 0 | 0 | 0 | Rerun after dispatch fix |
| Internal-admin/marketing/simulator tests | 42 | 0 | 0 | 0 | Preceding follow-up; source unchanged |
| PostgreSQL/MSSQL and legacy SQL contracts including bootstrap | 724 | 0 | 0 | 0 | Preceding fixture follow-up; source unchanged |
| **Aggregate applicable evidence** | **1867** | **0** | **0** | **0** | Scope/timestamps in group JSON |

Rerun after the dispatch fix: official production `next build` PASS with lint/type checks enabled; `tsc --noEmit` PASS; all133 frontend tests PASS, including actual server-render/hydrate invalid-phone validation; nine staging browser checks PASS against the real local backend. Build runtime/config files were compared byte-for-byte to the working tree. Existing nonfatal unused-import/directive warnings remain. The earlier failed build is historical and retained in the attempt history. See `reports/dispatch-build-resolution.md`, `build-followup.json` and `dispatch-browser-result.json`.

Dispatch browser checks: unauthenticated return URL; invalid-phone validation/no dispatch lookup; unknown-contact manual choice; reload; explicit pension-queue contact prefill and queue/agent preservation; backend history-based routing; lookup-error behavior; real-backend retry recovery; no browser exceptions or external requests. The external inbound destination was not opened; its URL selection remains unit-tested. No fake success replaced backend logic.

Retained database evidence: all724 database tests including full empty-database validation/apply/replay passed; bootstrap and MSSQL test schemas cleaned up; all15 official migration checksums matched; restricted-role permission checks passed; staging ledger and CRM/queue stable identities/states preserved. These backend/database tests were not redundantly rerun for a frontend-only hydration change. All opt-in SQL flags were enabled in their recorded run, with no exclusions or runtime skips.

Earlier CRM/history/report browser evidence and four user-confirmed manual workflows remain recorded historically. Dispatch source changed after those manual sign-offs and was rechecked automatically; no new manual acceptance is inferred. Other application runtime source, staging configuration and simulator code are unchanged in this follow-up.

Application fixes/tests remain separate from staging configuration/simulators. No credentials, runtime customer records, provider payloads, database dumps, browser sessions or raw logs are exported. Synthetic fixture generator source and unit vectors remain reviewable code. No production access, real deliveries, deployments or pushes occurred. External/proprietary and security/operational release acceptance remains in RELEASE-BLOCKERS.md.
