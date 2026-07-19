# Raport Gratuit Faza 0 Backend Endpoint

## Context

The frontend page `/ro/raport-gratuit` is implemented in this repository.
It evaluates the 6 quick checks client-side and submits the completed report
through the same external API base used by the pension calculator:

`NEXT_PUBLIC_API_BASE_URL`, defaulting to `https://apiprocess.azurewebsites.net/api`.

This repository does not contain the existing pension calculator email service,
lead persistence, or email template engine. Implement the save/email endpoint in
the API service that already handles:

- `POST /justproveit/pension-calculator/calculate`
- `POST /justproveit/pension-calculator/results/{resultId}/email`

## Endpoint

`POST /justproveit/quick-report/faza0`

No admin bearer token is required. The page sends `tenantKey: "justproveit"` in
the request body, matching the pension calculator pattern.

## Request Body

```json
{
  "tenantKey": "justproveit",
  "source": "raport_gratuit_faza0",
  "fullName": "Client Name",
  "email": "client@example.com",
  "phone": "07123456789",
  "consentVerbalAt": "2026-07-20T10:00:00.000Z",
  "standardTaxCode": "1257L",
  "answers": {
    "taxCode": "BR",
    "multipleJobs": "no",
    "electoralRoll": "yes",
    "creditReportChecked": "no",
    "bankSwitchLast": "never",
    "insuranceRenewal": "autoNoCompare",
    "transferMethod": "bank",
    "transferCompared": "no",
    "utilitiesUpToDate": "yes",
    "utilitiesCompared": "no"
  },
  "results": [
    {
      "code": "MF01",
      "title": "Cod fiscal (tax code) greșit",
      "flag": "rosu",
      "output": "Codul tău fiscal pare greșit — poți fi impozitat în plus. Recomandăm verificare directă cu HMRC, posibilă rambursare pe ultimii 5 ani.",
      "rawAnswer": {
        "taxCode": "BR",
        "multipleJobs": "no",
        "standardTaxCode": "1257L"
      }
    }
  ],
  "domain": "www.justproveit.co.uk",
  "pageUrl": "https://www.justproveit.co.uk/ro/raport-gratuit",
  "referrer": ""
}
```

`results[]` always contains 7 rows because `FC07` is split into:

- `FC07_plata`
- `FC07_furnizor`

Allowed `flag` values are:

- `verde`
- `galben`
- `rosu`

The frontend blocks submission while any result is incomplete.

## Persistence

Reuse the existing lead/client model used by the pension calculator where
possible:

- name
- email
- phone
- consent timestamp
- source: `raport_gratuit_faza0`

Persist the report results either in a new minimal table or an existing generic
simulation-result table if one exists.

Minimum result fields:

- report id
- lead id
- optional agent/user id if the API already has an agent concept
- check code
- flag
- raw answer JSON
- output text snapshot
- created timestamp

## Email

Send the client an email using the same provider/template infrastructure as the
pension calculator.

Email content:

- the 7 submitted result rows
- each row's `title`, `flag`, and `output`
- closing CTA inviting the client to a full "radiografie financiară" call for
  the remaining checks, including state benefits
- compliance text approved by the business

Do not invent exact monetary outcomes beyond the text supplied by the frontend.

## Response

Success:

```json
{
  "success": true,
  "leadId": "lead_123",
  "reportId": "qr_123",
  "emailSent": true,
  "message": "Raportul a fost trimis pe email."
}
```

Email failure after save:

```json
{
  "success": true,
  "leadId": "lead_123",
  "reportId": "qr_123",
  "emailSent": false,
  "emailError": "Email provider error"
}
```

Validation failure:

```json
{
  "error": "fullName, email and phone are required."
}
```

## Acceptance Criteria

- `POST /justproveit/quick-report/faza0` accepts the frontend payload.
- The lead is saved with source `raport_gratuit_faza0`.
- All 7 result rows are persisted with their submitted flags and raw answers.
- The report email is sent to the submitted client email address.
- The endpoint response lets the frontend distinguish full success from
  save-success/email-failure.
- Existing pension calculator endpoints and templates continue to work
  unchanged.
