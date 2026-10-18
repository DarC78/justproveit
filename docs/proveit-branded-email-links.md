# Branded email links

## Existing mechanisms and scope

The repository had Resend open/click tracking configuration, plus a marketing
schema describing email links/events. It had no public redirect endpoint or
outbound link rewriter. A read-only request to the existing
`https://track.mail.justproveit.co.uk/r` returned HTTP 404 on 18 October 2026.

This implementation lives entirely in this repository and deploys through the
existing GitHub/Azure Static Web Apps workflow, including its managed `api` app.
No LaunchingStack repository or service changes are required.

## Contract

Email HTTP(S) links now use `https://www.justproveit.co.uk/r?id=whatsapp` (or
another approved ID). Static Web Apps rewrites `/r` to `/api/email-link`.
The function resolves the ID in `api/shared/email-links.json`, then returns a
302 with the exact destination and `Cache-Control: no-store`.
Missing/unknown IDs return 400. GET and HEAD are supported. Arbitrary `url`,
`ct`, or other supplied parameters cannot override or change a destination.

Unlike the handoff's base64 URL mode, these are registered link IDs: encoding a
URL does not authorize it, and an unrestricted URL redirect would permit abuse.
The registry contains no credentials or recipient data. IDs are public routing
identifiers, not authentication tokens. Keep existing IDs/destinations stable
after sending; introduce a new ID when an offer or destination changes.

## Rendering and sending

`scripts/lib/proveit-email-links.mjs` checks the configured sender domain, parses
HTML anchors, decodes entities, and patches only their href attributes. It also
rewrites HTTP(S) URLs in the text alternative. Images, visible text, relative
links, fragments, mailto and tel are unchanged. Unsubscribe URLs are explicitly
excluded. Rewriting twice does not add another redirect.

`scripts/render-proveit-email.mjs` applies this to every rendered preview/test/
final export immediately before output and Resend payload generation. Rendering
fails for an unregistered destination; add it to the registry and deploy before
sending. Other senders in external services do not automatically use this helper.

## Tracking and domain warnings

Resend's already enabled native open/click tracking remains responsible for
per-message metrics and its `links.mail.justproveit.co.uk` tracking hostname.
The redirect itself stores no click events and accepts no attribution token.
There is no duplicated analytics system or assumption that scanners are humans.

The branded URL uses the existing first-party website domain and its TLS; no DNS
change is needed. It shares the organizational domain of the sender
`mail.justproveit.co.uk`, though it is not the exact sending subdomain.
This does not guarantee that every Resend deliverability advisory disappears.
In particular, email and phone links stay usable mailto/tel links.

## Validation

Run `node scripts/render-proveit-email.mjs`, then
`node --test tests/proveit-email-links.test.mjs tests/proveit-email-subject.test.mjs`.
Build with `npm run build`. After GitHub deployment, check every registered link
with redirects disabled: HTTP 302, exact Location, no-store. Also check missing
and unknown IDs return 400 before sending a newly rendered test.
