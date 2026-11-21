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

