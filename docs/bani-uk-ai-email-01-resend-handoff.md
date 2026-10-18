# Bani în UK cu AI — email 1

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
- After P.S.: `top100 romanians.png`, then `top100 romanians_AD.png` (the two additional Top 100 images in the supplied folder).
- Reviews: owner's `TrustPilot.png` and the two Romanian quotes supplied verbatim. No reviewer names, review URLs or ratings were invented for these quotes.
- Then WhatsApp, the website's verified TikTok/Facebook/Instagram URLs, and `Official Picture.jpg`.

Public asset path: `/email-assets/bani-uk-ai/`. Assets must be deployed through the existing GitHub main workflow before sending. No direct Azure upload/deployment is used.

## Rendering and sending

```text
node scripts/render-proveit-email.mjs
node scripts/render-proveit-email.mjs --test
node scripts/render-proveit-email.mjs --final
```

`--test` generates a Resend payload for the owner's address. `--final` additionally requires the campaign system's actual unsubscribe URL. No campaign audience, sequence or scheduled send is implemented or authorized here. The P.S. says “Mâine”, matching the source's intended Monday 19 October send; review that text if sending the campaign on another date.

The Azure Function App's existing credential is named **ResendApiKey**, not RESEND_API_KEY. The test sender reads that setting and RESEND_FROM_EMAIL into memory through the existing Azure CLI session and uses the same Resend account and sender (`Adrian Defta <adrian@mail.justproveit.co.uk>`). Credentials are never logged, written to disk, placed in command-line arguments or committed. No backend code change or template registration is needed for this one-off provider send. A separate backend-team change is still needed if this template is to be added to the CRM's registered manual-email picker later.

The sending script accepts only one recipient, an explicitly rendered test, exactly one main CTA and all five deployed image URLs. It uses a content-based idempotency key and writes a receipt containing only recipient, subject, provider ID and acceptance time. Provider acceptance is distinct from confirmed delivery.

Checks: HTML tables balanced; one main CTA; both quotes preserved; all five images in order; exact signature and recipient; no placeholders in test HTML; approximately 12 KB HTML. Browser-based email-client visual QA remains unavailable due to the in-app browser environment.