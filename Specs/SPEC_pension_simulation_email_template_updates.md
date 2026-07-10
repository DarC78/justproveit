# Pension simulation email template updates

## Context

The frontend repository only submits pension calculator payloads and calls:

- `POST /justproveit/pension-calculator/calculate`
- `POST /justproveit/pension-calculator/results/{resultId}/email`

The actual pension email template, sender configuration, and authority contact/link rendering are implemented in the API/email service, not in this repository.

## Required API/email changes

### Sender

For pension calculator result emails, including simulation emails, send from:

- From email: `adrian@mail.justproveit.co.uk`
- From name: `Adrian Defta`

### Authority contact section

In the email section titled:

`Unde puteti depune/verifica dosarul de pensie`

Do not render authority address/phone/email/contact-detail blocks.

Render only these concise labels, with the existing relevant links preserved:

- `Romania - date de contact`
- `UK - International Pension Centre - date de contact`

### JustProveIt-domain outbound links

These destination URLs must not appear directly in the email:

- `https://www.gov.uk/state-pension-age`
- `https://www.cnpp.ro/contact`
- `https://www.gov.uk/international-pension-centre`

Instead, each link should go through a `justproveit.co.uk` URL that redirects/tracks to the final destination.

Suggested route pattern:

`https://www.justproveit.co.uk/go?to=<encoded-url>&source=pension-calculator-email`

If the API already has a preferred tracking/redirect route, use that instead, as long as the visible `href` domain is `www.justproveit.co.uk` or `justproveit.co.uk`.

## Acceptance criteria

- A pension simulation email is delivered from `Adrian Defta <adrian@mail.justproveit.co.uk>`.
- The email section `Unde puteti depune/verifica dosarul de pensie` does not include full contact details for CNPP/Romania or the UK International Pension Centre.
- The same section includes the labels:
  - `Romania - date de contact`
  - `UK - International Pension Centre - date de contact`
- The email HTML does not contain direct `href` values for:
  - `https://www.gov.uk/state-pension-age`
  - `https://www.cnpp.ro/contact`
  - `https://www.gov.uk/international-pension-centre`
- The three links route via the JustProveIt domain and redirect to the correct final public pages.
- Existing pension result data and CTA/template layout remain otherwise unchanged.
