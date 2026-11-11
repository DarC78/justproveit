# Release blockers and acceptance boundaries

## Local regression blockers resolved

The two MSSQL fixture failures and the excluded PostgreSQL bootstrap test are resolved. All three affected tests pass with original assertions intact. Isolated prerequisite schemas and reserved synthetic customer fixtures replace the accidental shared-baseline/staff-phone assumptions. Bootstrap uses a separate same-instance administrator only to create/drop a disposable empty database; the restricted migration and application roles were not elevated. See `reports/fixture-bootstrap-resolution.md` and the final regression totals.

No missing fixture or excluded bootstrap test remains from this follow-up. Runtime source and simulator behavior are unchanged. The subsequently discovered frontend build failure is also resolved.

## Application/runtime defects

The dispatch mount-effect build blocker is resolved with React server/client hydration snapshots. Official production build with lint/types enabled, TypeScript, all133 frontend tests and nine real-backend staging dispatch checks pass. No local fixture, test or frontend build blocker remains from these follow-ups.

No new application runtime defect was established by this review run. The user manually accepted CRM, appointments, reporting and durable queue processing. The dispatch hydration flag changed subsequently and passed automated regression/browser checks; other runtime source remains unchanged. A passing core workflow is not a statement that every legacy SQL test or production mode has been certified.

An inherited production-mode master-password authentication path remains outside LocalStaging. The staging guard disables it locally; this patch does not remove the upstream production behavior. Security review/sign-off on that path is required before promoting the application changes. No credential value is included here or in the patches.

## PostgreSQL migration acceptance versus external providers

Already verified locally: official CHECK for15 applied migrations/checksums; restricted application role versus migrator ownership; paired PostgreSQL/MSSQL behavior contracts; transaction/concurrency/rollback paths; real asynchronous queue intake, command receipts and idempotency; browser/manual CRM, appointments, history and reports. The local fixture blockers have been resolved; full empty-database validation/application/replay is also covered.

No Stripe, Resend, Google, Meta, TikTok or other real provider account is required to test or accept those core local database/application behaviors.

Priority vendor-specific acceptance before vendor-dependent cutover: use a designated isolated Mediatel test SQL installation/schema and the licensed vendor procedures to confirm actual InsertLead/ticket-history procedure semantics, triggers, result shapes and error behavior against the adapter. The local emulator is labelled and cannot establish proprietary vendor parity. A real SIP/PBX connection is a separate telephony acceptance task, not a prerequisite for validating PostgreSQL persistence.

Provider sandbox tests are separate: Stripe payment/webhook parity, Resend domain/acceptance/deliverability, WhatsApp/SMS handset delivery, Google mailbox/calendar/Sheets OAuth and API parity, and social publication/advertising matching. Configure only the providers for features being released. They do not all need to be configured before core PostgreSQL migration testing. Gmail sending is prohibited; later explicitly authorized real email must use Resend.

## Operational release work

Production data synchronization, backup/restore and rollback rehearsal, production-sized performance/capacity acceptance, and approval of a coordinated cutover remain operational release work. No production database access, provider delivery, Azure deployment or production-triggering push was performed for this review.

## Configuration review before any future application release

The legacy frontend proxy now requires an explicit `JUSTPROVEIT_API_BASE_URL`; the removed hardcoded Azure fallback must not be restored to mask missing configuration. Confirm that setting in the separately authorized release configuration. Keep LocalStaging/NEXT_PUBLIC_LOCAL_STAGING, synthetic enrollment/deadline settings, simulator keys, private LAN origins, and the staging patch layers out of production. This review has not accessed production settings to verify them.
