# Livrare Pensii Private: release handoff

Frontend implementation is in this repository. The owner has confirmed that the backend is deployed and requested frontend deployment for testing. The checks below remain the live verification checklist; frontend contract tests do not establish import or runtime correctness. No backend import or secret configuration was performed from this repository.

The owner should pass this handoff to the backend team. Before live verification, obtain confirmation of:

- SQL migration applied, server-only encryption key and password hash configured, encrypted case import completed, and Functions deployed through the backend's release process.
- Authenticated `/api/justproveit/admin/crm/private-pensions` GET/POST, `/{id}` GET/PATCH, `/unlock` POST and `/{id}/vault` GET/PUT available at the frontend's configured API base.
- Adrian-only authorization on every route, integer-version conflicts returning 409, unlock attempt limits, five-minute expiry, and CORS permitting Authorization, Content-Type and x-pension-unlock.
- Ordinary list/detail/activity responses contain no credential excerpts; API responses have appropriate no-store headers. Imported histories containing credentials are only returned by the vault route.
- Import reconciliation: prepared total 182 records and 101 exact-email matches; ambiguous/reused-number records remain separate UUIDs with original review reasons. Confirm actual deployed totals with the release owner.

No backend code changes are requested beyond readiness against the supplied API contract. If any endpoint differs, provide its response shape and status behavior before verification.

## Frontend implementation decisions

- `/admin/crm?tab=privatePensions` requires authenticated CRM access and normalized Adrian email. Other users fall back to Detalii Lead and do not mount the pension component.
- Every API request uses the existing bearer token and no-store; there is no service worker or service-worker cache in this repository. Future caching rules must exclude the complete private-pensions route tree.
- Tokens and decrypted records exist only in component memory. Lock aborts and invalidates vault requests. Password input is cleared when its request starts. Auth changes also prevent the old vault from rendering.
- Site-wide Clarity loading was removed. Merely omitting the script on CRM routes would leave a recorder loaded from a public page active across client-side navigation. Do not reintroduce replay without an isolated, verified boundary that excludes protected content.
- A 409 preserves drafts and disables both saves until explicit reload. Provider PUT increments the local case version without replacing unrelated field/note edits. If a PUT is interrupted after reaching the server, the next save can conflict and requires reload; there is no automatic overwrite/retry.

## Verification

Local commands: `node --test tests/private-pensions.test.cjs`, `npx tsc --noEmit`, `npm run build`.

Contract tests use synthetic responses and a minimal hook runner, not a browser or live API. They cover request configuration, creation payloads, conflicts, whitespace, version progression, denial/attempt-limit handling, auth refresh and late vault response invalidation. A successful build does not establish backend readiness.

After the owner confirms backend readiness, verify in a browser with Adrian and a second CRM account:

1. Direct URL and navigation visibility; second account makes no pension calls.
2. List counts, London follow-up dates (including DST/midnight), search, filters, review flags, mobile layout and keyboard controls.
3. Create a disposable case, change status/date/priority/action, append a multiline note, refresh and inspect persistence/history. Verify payment metadata is read-only and labelled imported.
4. Produce a concurrent 409 and verify drafts survive; reload only with explicit discard confirmation.
5. Incorrect password and 429; successful unlock exposes excerpts even with blank structured credentials, plus original documents/rows. Edit providers and verify persistence while retaining unsaved ordinary case edits.
6. Expiry, explicit lock, case switch, tab exit, hidden document, logout/auth change and delayed network responses clear protected content. Inspect network/storage to confirm no credentials in URLs, browser storage, cached responses or replay traffic.

Production frontend release must use a GitHub push to main and the Azure Static Web Apps GitHub workflow. Do not use direct package/CLI deployment. The owner has authorized production frontend deployment through this workflow.
