# Quick Report Faza 0 Public Results Backend Spec

## Context

The frontend page `/ro/raport-gratuit` submits Faza 0 report data to:

`POST /justproveit/quick-report/faza0`

The Faza 0 button sends `emailScope: "faza0"`.

The frontend now links users to two public pages:

- `https://www.justproveit.co.uk/ro/rezultate-raport/`
- `https://www.justproveit.co.uk/ro/hai-in-club/`

This frontend repository does not contain the LaunchingStack email renderer or report persistence tables, so LS must own the email template change, token generation, report snapshot persistence, and public result lookup endpoint.

## Objective

When a customer receives the Faza 0 report email and clicks `Vezi detalii`, the details page should show that customer's saved six Faza 0 results.

Do not put full report results directly in the email URL. The URL should contain only an opaque public token. LS should store the report snapshot and return it through a public token lookup endpoint.

## Required Flow

1. CRM user completes `/ro/raport-gratuit/` and clicks `Trimite raport faza zero`.
2. Frontend calls `POST /justproveit/quick-report/faza0` with:
   - `emailScope: "faza0"`
   - `fullName`
   - `email`
   - `phone`
   - `results`: the completed six Faza 0 result rows
3. LS validates the existing CRM bearer token as it does today.
4. LS persists a report snapshot for that submitted Faza 0 email.
5. LS generates one opaque public token for the snapshot.
6. LS sends the Faza 0 email with a `Vezi detalii` button.
7. The button opens:

```text
https://www.justproveit.co.uk/ro/rezultate-raport/?token=<raw-public-token>
```

8. The frontend page reads `token` and calls LS:

```text
GET /justproveit/quick-report/public-results?token=<raw-public-token>
```

9. LS returns the saved Faza 0 results for that token.

## Snapshot Persistence

Create or reuse a durable table for public quick-report snapshots.

Suggested table name:

`JustProveItQuickReportPublicSnapshots`

Minimum fields:

```text
id uniqueidentifier primary key
tenantKey nvarchar(80) not null
reportId uniqueidentifier null
leadId uniqueidentifier null
emailScope nvarchar(20) not null
fullName nvarchar(200) not null
firstName nvarchar(120) null
email nvarchar(320) not null
phone nvarchar(80) null
tokenHash nvarchar(128) not null unique
tokenPrefix nvarchar(16) null
resultsJson nvarchar(max) not null
sourcePayloadJson nvarchar(max) null
createdAtUtc datetime2 not null
expiresAtUtc datetime2 null
lastAccessedAtUtc datetime2 null
accessCount int not null default 0
revokedAtUtc datetime2 null
```

`resultsJson` should store only the completed Faza 0 results included in `payload.results`, not Faza 1 rows.

Recommended result shape:

```json
[
  {
    "code": "MF01",
    "title": "Cod fiscal (tax code) greșit",
    "flag": "rosu",
    "output": "Ai avut mai multe joburi și nu ai recuperat taxele pe ultimii 5 ani. Este posibil să fi plătit taxe în plus; valoarea uzuala care poate fi recuperată este £1,250–£4,000. Recomandăm logare in cont pe gov.uk (Government Gateway ID) si verificare."
  }
]
```

Allowed `flag` values:

- `verde`
- `galben`
- `rosu`

## Public Token Requirements

Generate a cryptographically secure random token:

- At least 32 random bytes before encoding.
- URL-safe encoding, for example base64url.
- Store only a hash of the token in the database.
- Use SHA-256 or stronger for `tokenHash`.
- The raw token must appear only in the email URL.
- Do not log the raw token.
- Do not use `reportId`, `leadId`, email, or phone as the token.

Recommended token URL:

```text
https://www.justproveit.co.uk/ro/rezultate-raport/?token=<raw-public-token>
```

Expiry:

- Preferred: no expiry for now, because email links may be opened later.
- If LS requires expiry, use at least 180 days and return a friendly expired response.

## Required Faza 0 Email Copy Changes

Replace this Portuguese line:

```text
Inscreva-se num curso com um horário que lhe permite continuar a trabalhar.
```

With:

```text
<nume>, ai mai jos doar cateva cai prin care se pare ca tu nu primesti banii tai!
```

Use the recipient first name where available; otherwise use the submitted full name.

Replace this line:

```text
Mai jos ai cele 6 verificari completate in raportul gratuit. Am pastrat exact textele generate pe baza raspunsurilor tale.
```

With:

```text
Ai mai jos doar 6 moduri in care tu pierzi bani acum sau nu accesezi banii care ti se cuvin:
```

## Required Result Table Change

In the Faza 0 email result table, add a `Vezi detalii` button inside the `Rezultat` column for every completed result row.

The button should link to:

```text
https://www.justproveit.co.uk/ro/rezultate-raport/?token=<raw-public-token>
```

Use the same details URL for each row in that email. The details page shows all six saved Faza 0 result rows plus the 20 club checks.

Implementation notes:

- Do not put `results` JSON in the URL.
- Include only completed Faza 0 rows sent by the frontend in the persisted snapshot.
- HTML-escape result text, names, titles, and codes before rendering.
- Style the email button as a real call-to-action link with text `Vezi detalii`.
- Keep the existing `emailScope: "faza0"` behavior: Faza 0 emails must not include Faza 1 result rows.

## Public Results Endpoint

Add a public endpoint on the official LS API host:

```text
GET https://launchingstack-func-dev.azurewebsites.net/api/justproveit/quick-report/public-results?token=<raw-public-token>
```

Auth:

- Anonymous/public.
- Do not require CRM login or bearer token.

Validation:

- `token` is required.
- Hash submitted token and look up by `tokenHash`.
- Reject if no matching snapshot exists.
- Reject if `revokedAtUtc` is not null.
- Reject if `expiresAtUtc` is set and is in the past.

Success response:

```json
{
  "success": true,
  "tenantKey": "justproveit",
  "reportId": "uuid-or-null",
  "leadId": "uuid-or-null",
  "emailScope": "faza0",
  "fullName": "Ion Popescu",
  "firstName": "Ion",
  "results": [
    {
      "code": "MF01",
      "title": "Cod fiscal (tax code) greșit",
      "flag": "rosu",
      "output": "Ai avut mai multe joburi și nu ai recuperat taxele pe ultimii 5 ani. Este posibil să fi plătit taxe în plus; valoarea uzuala care poate fi recuperată este £1,250–£4,000. Recomandăm logare in cont pe gov.uk (Government Gateway ID) si verificare."
    }
  ]
}
```

Invalid/expired response:

```json
{
  "success": false,
  "error": "Report link is invalid or expired."
}
```

HTTP status:

- `200` for success.
- `400` when token is missing.
- `404` for invalid token.
- `410` for expired or revoked token.

CORS:

- Allow `GET` from `https://www.justproveit.co.uk`.
- Allow local development origins if LS already has a dev CORS policy.

On successful lookup, LS should update:

- `lastAccessedAtUtc`
- `accessCount`

Do not expose:

- token hash
- raw source payload
- phone number, unless explicitly needed later
- internal user/agent identifiers
- CRM bearer-token-only fields

## Required MF01 Text

For the red `MF01` result, use:

```text
Ai avut mai multe joburi și nu ai recuperat taxele pe ultimii 5 ani. Este posibil să fi plătit taxe în plus; valoarea uzuala care poate fi recuperată este £1,250–£4,000. Recomandăm logare in cont pe gov.uk (Government Gateway ID) si verificare.
```

The row should render the structured result as:

```text
Cod fiscal (tax code) greșit
rosu
<result output>
Vezi detalii
```

## Acceptance Criteria

- When Faza 0 report email is sent, LS creates a persisted snapshot with the exact six submitted results.
- The email `Vezi detalii` button contains only `token`, not full result JSON.
- The public endpoint returns the correct saved results for the token without CRM login.
- Invalid, expired, or revoked tokens do not expose report data.
- The Faza 0 email no longer contains the Portuguese sentence.
- The Faza 0 email intro uses the new Romanian copy.
- Each completed row has a `Vezi detalii` button in the `Rezultat` column.
- The button opens `/ro/rezultate-raport/` and shows the six submitted Faza 0 results.
- The `/ro/rezultate-raport/` page shows the remaining 20 checks with a `Hai in Clubul Aici Sunt Banii Dumneavoastra` button linking to `/ro/hai-in-club/`.
