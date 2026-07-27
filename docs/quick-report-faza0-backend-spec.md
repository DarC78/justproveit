# Raport Gratuit Faza 0 Backend Endpoint

## Context

The frontend page `/ro/raport-gratuit` is implemented in this repository.
It is CRM-authenticated and evaluates the 6 quick checks client-side.
It sends the completed report email through the existing authenticated backend
email route used by other admin/generic report tooling:

`POST /justproveit/admin/generic-reports/emails/generic-update`

The frontend calls this through `API_BASE_URL`, which defaults to:

`https://apiprocess.azurewebsites.net/api`

This keeps the report on the same backend environment as the international
pension calculator and existing email infrastructure.

## Endpoint

`POST /justproveit/admin/generic-reports/emails/generic-update`

The request includes the logged-in user's bearer token.

## Request Body

```json
{
  "to": "client@example.com",
  "customerName": "Client Name",
  "customerSinceLabel": "Raport gratuit JustProveIt",
  "statusLabel": "Rosu: 3 | Galben: 1 | Verde: 2",
  "subject": "Raportul tau gratuit JustProveIt",
  "preheader": "Cele 6 verificari rapide pentru bani pierduti in UK.",
  "plainText": "Buna ziua Client Name...",
  "html": "<div>...</div>"
}
```

`results[]` always contains 6 rows. The quick checks are:

- `MF01`
- `MF02`
- `CD07`
- `FC02`
- `FC05`
- `FC07`

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

Send the client an email using the existing backend email infrastructure and
environment already used by the pension calculator/admin backend.

Email content:

- the 6 submitted result rows
- each row's `title`, `flag`, and `output`
- use the submitted `output` text snapshots in the email so the monetary risk
  ranges shown in the simulator are also included in the post-simulation email
- closing CTA inviting the client to a full "radiografie financiară" call for
  the remaining checks, including state benefits
- compliance text approved by the business

Do not invent exact monetary outcomes beyond the text supplied by the frontend.

## Response

Success:

```json
{
  "success": true,
  "provider": "resend",
  "messageId": "resend-message-id"
}
```

Email failure:

```json
{
  "error": "Email provider error"
}
```

Validation failure:

```json
{
  "error": "fullName, email and phone are required."
}
```

## Acceptance Criteria

- `/ro/raport-gratuit` requires CRM authentication.
- `Trimite raport` sends through `POST /justproveit/admin/generic-reports/emails/generic-update`.
- The lead is saved with source `raport_gratuit_faza0`.
- All 6 result rows are persisted with their submitted flags and raw answers.
- The report email is sent to the submitted client email address.
- Existing pension calculator endpoints and templates continue to work
  unchanged.
