# JustProveIt internal hosting

This release moves the Next.js static export and all twelve existing HTTP API
handlers together. The business handlers are unchanged. Stripe, Resend and Azure
Tables settings are supplied through root-managed `/etc/ls-justproveit`; secrets
never enter Git, container images or the public site directory. The existing
fulfillment ledger, leases and provider idempotency keys remain authoritative.

Gitea's `deploy-inhouse.yml` builds and publishes the `justproveit-inhouse`
release branch. A root-owned internal puller builds its API container, verifies
host health, and then switches the static export atomically. API failure restores
the previous image and leaves the previous static release active. Source SHA and
CI run are recorded in `/opt/ls-justproveit/deployed.json`.

The API is bound only to `127.0.0.1:7077`. Nginx exposes the original twelve
routes, `/r` and the legacy receipt rewrite. Functions `/admin` endpoints and
source/configuration files are inaccessible publicly. Payment pages retain their
no-referrer/no-store behavior. The two existing public hostnames and their URLs
are preserved; no mailbox or mail-authentication DNS records are changed.

Stage on loopback port 8092, verify the export, redirects, authenticated CRM and
invalid-input/signature guards, then issue trusted certificates before changing
the apex/www records. Preserve a private DNS/settings snapshot and the Azure
deployment for rollback. Never submit a real payment or send an acceptance email.

Shared Azure Tables remain a dependency for the course's fulfillment ledger.
The older Azure backend URLs still forward to the internal main backend. A DNS
cutover does not authorize deleting those resources or replaying ambiguous sends.

Readiness exercises the local invalid-email-link guard (400), without requiring host administrative keys or contacting external providers. API routes accept an optional trailing slash, preserving existing callback URLs.

## Completed public cutover: 21 November 2026

Both apex and www now use DNS-only A records to `86.125.177.14`. Their previous
target was `white-beach-053c59810.3.azurestaticapps.net`. All other DNS records
were preserved. The original Azure Free deployment remains available for rollback;
it is not the public website host. Its normal Gitea Azure workflow still updates
that rollback copy; the additional in-house workflow publishes the active release.

The internal preview passed 23 acceptance checks, and both public domains passed
22 checks each, including all twelve API handlers, receipt/email redirects,
invalid payment/signature guards, capacity reads and private-path denial. CRM
login and the canonical agents API bundles were verified separately. No payment,
welcome email or real webhook fulfillment was created by acceptance checks.

Certificate `justproveit` covers both hostnames. Initial DNS challenges were
removed after issuance. Certbot was reconfigured successfully with a simulated
HTTP-01 renewal using `/var/lib/ls-frontends-acme`. Install the certificate and
health service/timer files from the CI release and enable their timers. Health
checks run every minute; certificate checks twice daily. API logs are bounded by
Docker's 10 MB x 3 rotation and existing local telemetry configuration.

### Private runtime metadata storage

Run `configure-host-storage.py` as root during infrastructure setup, before
starting the API. It provisions a dedicated pinned Azurite container for Functions
host locks/metadata only, with persistent files in
`/var/lib/ls-justproveit/host-storage`. It binds solely to loopback ports
10003-10005 and creates its own random account key in root-only
`/etc/ls-justproveit/host-storage.env`. The API reads its connection through the
existing private settings file. This clears the host's missing-storage health
warning without sharing the voicebot's storage or moving business data.

The course fulfillment ledger remains in its existing Azure Table, preserving
leases and Resend idempotency state. Other handlers still use the existing Azure
backend compatibility URLs, which forward processing in-house. These dependencies
must be migrated separately before retiring their Azure resources.

### Operations and rollback

The pull timer follows CI releases every minute. Root migration evidence,
acceptance scripts, DNS-before settings and the original private Azure settings
snapshot are under `/opt/ls-justproveit/migration`; never publish those settings.
Current deployment metadata is `/opt/ls-justproveit/deployed.json`.

For an application rollback, publish the known-good source through Gitea CI.
For a complete hosting rollback, restore only the two original DNS CNAME records;
keep the shared fulfillment ledger authoritative and never replay ambiguous
deliveries. No database rollback to the stale legacy MSSQL is part of this plan.

