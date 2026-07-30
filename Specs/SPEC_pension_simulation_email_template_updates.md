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

Render only these concise labels as plain text, with no hyperlinks:

- `Romania - date de contact`
- `UK - International Pension Centre - date de contact`

### Authority contact labels must not be links

The two authority contact labels must not be wrapped in `<a>` tags and must not render as Markdown links.

These destination URLs must not appear in the email HTML or plain-text body:

- `https://www.cnpp.ro/contact`
- `https://www.cnpp.ro/relatii-cu-publicul`
- `https://www.gov.uk/international-pension-centre`

If the email currently renders these as Markdown links, replace:

- `[Romania - date de contact](https://www.cnpp.ro/relatii-cu-publicul)`
- `[UK - International Pension Centre - date de contact](https://www.gov.uk/international-pension-centre)`

with:

- `Romania - date de contact`
- `UK - International Pension Centre - date de contact`

## Acceptance criteria

- A pension simulation email is delivered from `Adrian Defta <adrian@mail.justproveit.co.uk>`.
- The email section `Unde puteti depune/verifica dosarul de pensie` does not include full contact details for CNPP/Romania or the UK International Pension Centre.
- The same section includes the plain-text labels:
  - `Romania - date de contact`
  - `UK - International Pension Centre - date de contact`
- The email HTML does not contain links around those two labels.
- The email HTML and plain-text body do not contain:
  - `https://www.cnpp.ro/contact`
  - `https://www.cnpp.ro/relatii-cu-publicul`
  - `https://www.gov.uk/international-pension-centre`
- Existing pension result data and CTA/template layout remain otherwise unchanged.
