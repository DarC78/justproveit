# Bani în UK cu AI — email 1

Current branded link routing is documented in [proveit-branded-email-links.md](proveit-branded-email-links.md). All rendered HTTP(S) links now use approved first-party redirect IDs; older no-redirect notes below describe the prior implementation.

The first email uses the owner's Google Doc `16EnB_6Dx1iLeShrhO6u1jILIHpNnaweqhb_yqIkFqFA`, orange/blue website palette, table layout and inline styles.

## Source and output

- `email-templates/proveit/base.html`: reusable email shell.
- `email-templates/proveit/bani-uk-ai-01.json`: subject, preheader, content, links and assets.
- `scripts/render-proveit-email.mjs`: produces HTML/plain-text preview and test files under `artifacts/email/`.
- `scripts/send-proveit-email-test.ps1`: validates the actual image URLs, then sends only the authorized test to `adrian@proveitweb.co.uk` when called with `-Send`.

The latest owner instruction supersedes the original two-button layout: **one main campaign button**, plus the separate WhatsApp footer CTA. Signature remains exactly:

```text
Mersi mult,
Adrian Defta
Director Proveit
Top 100 Romani de Pretutindeni
```

## Images and footer

Images were read from the owner's explicitly supplied `D:\DevProjects\!Assets` folder and copied into this repository. No other repository was accessed or changed.

- Opening: `Barclays.png`.
- After P.S.: only `top100 romanians_AD.png`. The owner requested removal of the Top 100 cover.
- Reviews: owner's `TrustPilot.png` and the two Romanian quotes supplied verbatim. No reviewer names, review URLs or ratings were invented for these quotes.
- Then WhatsApp, TikTok `https://www.tiktok.com/@proveit.ai`, the website's Facebook/Instagram URLs, and `Official Picture.jpg`.

Public asset path: `/email-assets/bani-uk-ai/`. Assets must be deployed through the existing GitHub main workflow before sending. No direct Azure upload/deployment is used.

## Rendering and sending

Campaign preparation update (19 October 2026): the renderer is now reusable as
`renderProveitCampaignEmail` in `scripts/lib/proveit-campaign-email.mjs`.
Campaign mode requires a real per-recipient unsubscribe URL and returns
personalized content plus List-Unsubscribe headers, never a recipient or send
operation. CLI `--final --unsubscribe-url URL --name NAME` exports HTML/text
only; only `--test` creates the guarded owner-test Resend payload. It does not
register or activate a campaign. See
[the LaunchingStack campaign spec](launchingstack-bani-uk-ai-campaign-spec.md)
and run `node scripts/export-bani-uk-ai-campaign.mjs` for the portable bundle.

```text
node scripts/render-proveit-email.mjs
node scripts/render-proveit-email.mjs --test
node scripts/render-proveit-email.mjs --final
```

`--test` generates a Resend payload for the owner's address. `--final` requires the campaign system's actual unsubscribe URL through `--unsubscribe-url`. No campaign sequence or scheduled send is implemented or authorized here. The audience snapshot is now `wix.ozLeadsBanks1910`; membership is not sending authorization. The P.S. says “Mâine”, matching the source's intended Monday 19 October send; review that text if sending the campaign on another date.

The Azure Function App's existing credential is named **ResendApiKey**, not RESEND_API_KEY. The test sender reads that setting and RESEND_FROM_EMAIL into memory through the existing Azure CLI session and uses the same Resend account and sender (`Adrian Defta <adrian@mail.justproveit.co.uk>`). Credentials are never logged, written to disk, placed in command-line arguments or committed. No backend code change or template registration is needed for this one-off provider send. A separate backend-team change is still needed if this template is to be added to the CRM's registered manual-email picker later.

The sending script accepts only one recipient, an explicitly rendered test, exactly one main CTA and all four deployed image URLs. It uses a content-based idempotency key and writes a receipt containing only recipient, subject, provider ID and acceptance time. Provider acceptance is distinct from confirmed delivery.

Checks: HTML tables balanced; one main CTA; both quotes preserved; all four images in order; exact signature and recipient; no placeholders in test HTML; approximately 12 KB HTML. Browser-based email-client visual QA remains unavailable due to the in-app browser environment.

Latest owner edits: offer includes the additional eight methods and £39 reminder; bonus wording is £150–£300 for moving a separate account; WhatsApp uses `https://api.whatsapp.com/send/?phone=447447707829&text=CRM_PROMO_BANI_UK_AI&type=phone_number&app_absent=0` in HTML and plain text. Updated test sent to the owner and delivery confirmed through Resend.

## Recipient names and analytics

The renderer accepts `--name "Popescu"` and produces `Popescu, soția mea nu m-a crezut (până a văzut contul)`. Test rendering uses the configured test recipient name Adrian. Campaign integration must pass the actual contact name per recipient; Popescu is an example, never a hardcoded campaign name. A missing name falls back to the original subject; CR/LF and control characters are rejected. Keep the `[TEST]` prefix for owner-only review sends.

Payload tags identify campaign `bani-uk-ai`, template `ro-bani-uk-ai-email-01` and audience `owner-test`. The main CTA has non-personal UTM parameters. These help attribution; they do not create an open-tracking pixel or measure opens by themselves.

Native [Resend tracking](https://resend.com/docs/dashboard/domains/tracking) requires a verified tracking subdomain. Existing domain `mail.justproveit.co.uk` had open/click tracking disabled. The owner added the requested CNAME in Cloudflare. Resend verified `links.mail.justproveit.co.uk` on 18 October 2026; both open tracking and click tracking are now enabled and were read back as true.

Required Cloudflare record in the `justproveit.co.uk` zone:

| Type | Name | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| CNAME | links.mail | links2.resend-dns.com | DNS only (grey cloud) | Auto |

Full hostname: `links.mail.justproveit.co.uk`. Resend returned this actual CNAME target; it is not a guessed DNS value. No Cloudflare credential or connection is available in this workspace/session. The owner added this DNS record; no DNS records were changed directly by the agent.

After the owner adds the record, run `scripts/configure-proveit-email-tracking.ps1 -Enable`. The helper verifies the exact CNAME and Resend's verification result before enabling native open and click tracking; it does not modify unrelated TLS or sending records. This setting applies to all future emails from the sending domain, not only this template. Send a fresh test after activation: old emails do not acquire tracking retroactively.

`scripts/get-proveit-email-metrics.ps1` retrieves the last test's provider metrics by email ID. It reports open rate and click-through rate as unavailable when tracking was absent or unconfirmed at send time, rather than presenting untracked zeroes as actual engagement. Resend's [metrics API](https://resend.com/docs/api-reference/emails/get-metrics) defines open rate as unique opened messages / delivered messages and click rate as unique clicked messages / delivered messages. Metrics can be cached for up to 15 minutes. Image blocking, privacy prefetching and automated link scanners affect interpretation; these are measurements of events, not guaranteed human reads.

For campaign-wide reports, the backend must retain all provider IDs and distinguish campaign sends from owner tests. The current script intentionally sends only the owner test; this task has not sent a broadcast or enrolled recipients.

The Resend domain-alignment warning is a deliverability heuristic, not a requirement to disguise destinations. Preserve the legitimate external Trustpilot, WhatsApp, social, contact and legal links. The duplicate Trustpilot image hyperlink was removed, leaving one explicit review link. Native branded tracking will use the verified tracking host while preserving actual destinations. No open redirect or fake same-domain legal page was added.

Activation verification: a fresh named test was sent with `trackingAtSend=true`; Resend confirmed delivery. The metrics API successfully returned sent=1, delivered=1 and initial open/click counts of zero for that new message. Opening/clicking was not simulated, so the test did not manufacture engagement events. The sender idempotency key now distinguishes tracked from earlier untracked tests. Activation helper preserves an already verified tracking record rather than restarting DNS verification.
