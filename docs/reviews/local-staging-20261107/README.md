# Local staging review — 7 November 2026

This is a review package, not a release or deployment. Do not push to production workflow branches, deploy to Azure, switch production databases, use production Mediatel, or enable real outbound deliveries. Gmail/connected-mailbox sending is prohibited. Any later explicitly authorized real email must use Resend.

## Contents and exact identities

- `reports/revisions-and-modifications.json`: full base commits, reconstructable review code trees, per-file local modification hashes, patch hashes and classifications. Review tree IDs exclude data-bearing generated reports; this is deliberate.
- `patches/01-launchingstack-application.patch`: backend/application fixes, regression tests, configurable instance bindings and maintained pension specification.
- `patches/02-launchingstack-staging-tools.patch`: explicit local simulators and synthetic fixture generator SOURCE.
- `patches/01-justproveit-application.patch`: frontend/API fixes, UUID helper and repaired regression harnesses.
- `patches/02-justproveit-staging.patch`: local UI notice, its activation wiring and attribution configuration.
- `patches/03-launchingstack-staging-configuration.patch`: OPTIONAL new credential-free Linux runtime templates and a placeholder settings example. These templates do not activate themselves and are not deployment settings.
- `reports/manual-acceptance.json`: all four explicit user sign-offs (CRM, appointments, reporting, queue persistence), without test customer records.
- `reports/regression-summary.json` and `RELEASE-BLOCKERS.md`: current results, exclusions, remaining failures and acceptance boundaries.
- `reports/patch-application-verification.json`: patches checked against clean base indexes and resulting source blobs compared with the current source snapshot.

Credentials, encryption keys, real/private settings, runtime test customer/contact/lead records, queued-message contents, provider payloads, screenshots, sessions, database dumps and storage volumes are excluded. Synthetic fixture-generator code and unit-test vectors are included as source, not as exported runtime customer data. Raw test logs remain private on the VM.

Application runtime source matches the code previously accepted manually. Review preparation repairs test harnesses only: frontend module mocks/VM globals, explicit proxy configuration, delegated pension next-step assertions, and an isolated MSSQL throttle-test fixture with the correct error-message width. The existing internal-admin lockfile supplied the missing `linkedom` test dependency; its lockfile was not changed.

## Transfer to Windows

Run PowerShell on Windows. SSH will request authentication normally; do not put passwords in these commands or paste credentials into chat.

```powershell
$ReviewRoot = 'C:\DevProjects\StagingReview'
New-Item -ItemType Directory -Force $ReviewRoot | Out-Null
scp administrator@192.168.87.187:/home/administrator/projects/launchingstack-review-20261107.tar.gz $ReviewRoot
scp administrator@192.168.87.187:/home/administrator/projects/launchingstack-review-20261107.tar.gz.sha256 $ReviewRoot
Get-FileHash "$ReviewRoot\launchingstack-review-20261107.tar.gz" -Algorithm SHA256
Get-Content "$ReviewRoot\launchingstack-review-20261107.tar.gz.sha256"
# Compare the hash values before extracting.
tar -xzf "$ReviewRoot\launchingstack-review-20261107.tar.gz" -C $ReviewRoot
$Bundle = "$ReviewRoot\launchingstack-review-20261107"
```

Alternatively use WinSCP over SFTP as `administrator@192.168.87.187` and download only the named archive/checksum. Do not copy the whole `.launchingstack-staging` directory.

## Apply to isolated Windows worktrees

The known development paths are shown below; adjust them if your repositories live elsewhere. Preserve existing work. The following creates detached review worktrees and does not change your main checkouts. If a base commit is not available locally, obtain that exact revision before applying; do not substitute the current production branch or force a failed patch.

```powershell
$LS = 'C:\DevProjects\LaunchingStack'
$JPI = 'C:\DevProjects\JustProveit\justproveit'
$LSReview = 'C:\DevProjects\LaunchingStack-staging-review'
$JPIReview = 'C:\DevProjects\JustProveit-staging-review'

git -C $LS -c core.autocrlf=false worktree add --detach $LSReview a8277af6cfad2c65d18b0a4bf21fdde51b5001e9
git -C $JPI -c core.autocrlf=false worktree add --detach $JPIReview 778f49c12cf5d847c27d26344d037c8dcc038093

git -C $LSReview apply --check "$Bundle\patches\01-launchingstack-application.patch"
git -C $LSReview apply --index "$Bundle\patches\01-launchingstack-application.patch"
git -C $JPIReview apply --check "$Bundle\patches\01-justproveit-application.patch"
git -C $JPIReview apply --index "$Bundle\patches\01-justproveit-application.patch"

# Apply the separate staging source layers only to the review worktrees.
git -C $LSReview apply --check "$Bundle\patches\02-launchingstack-staging-tools.patch"
git -C $LSReview apply --index "$Bundle\patches\02-launchingstack-staging-tools.patch"
git -C $JPIReview apply --check "$Bundle\patches\02-justproveit-staging.patch"
git -C $JPIReview apply --index "$Bundle\patches\02-justproveit-staging.patch"

git -C $LSReview diff --cached --check
git -C $JPIReview diff --cached --check
git -C $LSReview diff --cached --stat
git -C $JPIReview diff --cached --stat
```

Before applying the optional configuration patch, compare the two `git write-tree` results against `reviewCodeTree` in the revision manifest. The optional configuration patch adds example files, so applying it subsequently changes the tree identity.

Review `configuration/` directly, or check/apply `03-launchingstack-staging-configuration.patch` separately. Its Linux paths are examples for this VM and must not be executed as Windows startup commands. Never add actual private settings or credentials to Git.

These commands do not commit, push, merge or deploy. Keep the worktrees detached during review. Do not push the staging layers to a branch that triggers production.

## Regression reproduction

Node22 was used. The group result JSON files list every selected test file and every exclusion. The private VM runner executes test files with concurrency1 and a loopback-only network guard. Normal database tests use `127.0.0.1:55432/launchingstack_test` and isolated local MSSQL databases at port51433, with no real provider credentials. The now-authorized bootstrap test creates and drops a random `jpi_validation_<uuid>` empty database on the same PostgreSQL instance. Its separate administrator URL is assembled privately from the local bootstrap credential file; migration assertions use launchingstack_migrator, which retains no CREATEDB privilege. Never supply a production connection or expose the maintenance credential. The runner includes bootstrap and reports no exclusions. All opt-in legacy SQL test flags were enabled in the full database run.

Database-dependent tests should continue to run in the isolated VM test environment. Do not point Windows tests at production and do not expose PostgreSQL/MSSQL on the LAN. Provider credentials are not needed for core CRM/appointment/history/report/queue acceptance.

Frontend dependencies: `npm ci`, then `node --test --test-concurrency=1 tests/*.test.cjs tests/*.test.mjs` and `node node_modules/typescript/bin/tsc --noEmit`. Internal-admin DOM tests require `npm ci` in `webapp/internal-agents` to install its declared `linkedom` development dependency. Apply the same loopback network restrictions when rerunning tests.

## Fixture/bootstrap follow-up

See `reports/fixture-bootstrap-resolution.md` for all three root causes and fixes. The fixture follow-up changed test setup only; the subsequent dispatch build fix changes the hydration flag and adds a regression assertion. Staging simulators/configuration remain unchanged. `scripts/run-regressions.mjs affected` runs the three affected tests; `database` includes bootstrap and every opt-in SQL contract. Reuse only the isolated VM private settings/credentials, which are not transferred in this archive.

Current status:1867 aggregate applicable tests pass with zero failures/skips/exclusions. All133 frontend tests, TypeScript, lint-enabled official production build and nine staging dispatch browser checks pass after the hydration fix. Backend/database/webapp evidence is carried forward from the preceding follow-up with unchanged source. Prior user manual sign-offs remain historical. See REGRESSION-REPORT.md and RELEASE-BLOCKERS.md.
