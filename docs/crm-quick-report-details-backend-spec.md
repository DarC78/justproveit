# CRM Quick Report Details Backend Spec

## Context

The admin CRM lead details page should show the Money Check information captured on:

`/ro/raport-gratuit/`

When an agent opens a lead in CRM, especially by double-clicking a row in:

`/admin/crm/?tab=intents`

the frontend now tries to load the latest saved free Money Check snapshot for that lead/contact/intent.

The details panel should show:

- the 6 free assessment results
- the Faza Zero answers used to produce those results
- the `Informatii interne CRM` answers
- the existing `Observatii curente` and `Informatii precedente` sections already stored on the CRM lead

## Required Endpoint

Add a CRM-authenticated read endpoint on the official LaunchingStack API:

```text
GET /api/justproveit/admin/crm/quick-report/latest
```

The frontend calls this through:

```text
https://launchingstack-func-dev.azurewebsites.net/api
```

Auth:

- require the same CRM bearer token used by the other `/justproveit/admin/crm/*` endpoints
- reject anonymous requests with `401` or `403`
- scope the lookup to tenant `justproveit`

## Query Params

The frontend may send any combination of:

```text
leadId
contactId
canonicalContactId
intentId
email
phone
serviceKey
```

Example:

```text
GET /api/justproveit/admin/crm/quick-report/latest?leadId=123&contactId=abc&intentId=456&email=client@example.com&phone=07123456789&serviceKey=FreeMoneyCheck
```

Recommended lookup order:

1. Exact saved quick-report `leadId`
2. `contactId` / `canonicalContactId`
3. `intentId` / lead intent linkage
4. Latest matching `FreeMoneyCheck` / quick-report record for tenant `justproveit` by normalized email
5. Latest matching `FreeMoneyCheck` / quick-report record for tenant `justproveit` by normalized phone

If multiple records match, return the latest by submitted/created timestamp.

## Success Response

Return `200` with `report: null` when no report exists. Do not return `404` for normal "no report for this lead" cases.

```json
{
  "success": true,
  "report": {
    "reportId": "quick-report-id",
    "leadId": "crm-lead-id",
    "contactId": "crm-contact-id",
    "canonicalContactId": "crm-contact-id",
    "fullName": "Ion Popescu",
    "email": "client@example.com",
    "phone": "07123456789",
    "source": "raport_gratuit_faza0",
    "createdAtUtc": "2026-08-30T10:00:00.000Z",
    "submittedAtUtc": "2026-08-30T10:00:00.000Z",
    "updatedAtUtc": "2026-08-30T10:05:00.000Z",
    "faza0Answers": {
      "multipleJobs": "yes",
      "taxRecoveredLast5Years": "no",
      "electoralRoll": "yes",
      "creditReportChecked": "no",
      "bankSwitchLast": "never",
      "insuranceRenewal": "autoNoCompare",
      "transferMethod": "bank",
      "transferCompared": "no",
      "utilitiesCompared": "no"
    },
    "faza0Results": [
      {
        "code": "MF01",
        "title": "Cod fiscal (tax code) gresit",
        "flag": "rosu",
        "output": "Result text shown in the free report.",
        "rawAnswer": {
          "multipleJobs": "yes",
          "taxRecoveredLast5Years": "no"
        }
      }
    ],
    "internalAnswers": {
      "ukEmploymentType": "employee",
      "knowsAllPrivatePensions": "no",
      "hadCarFinanceBeforeNov2024": "yes",
      "hasCreditCardOverdraftOrPaydayLoansDebt": "yes",
      "checkedCouncilTaxBand": "no",
      "creditScoreLevel": "medium",
      "agentObservations": "Clientul pare interesat de bank switching si pensii private pierdute."
    }
  }
}
```

The frontend is also tolerant of these aliases while LS is migrating data:

- `quickReport`, `item`, `latest`, `reports[0]`, or `items[0]` instead of `report`
- `results` instead of `faza0Results`
- `answers.existingFaza0Answers` instead of `faza0Answers`
- `internal.answers` instead of `internalAnswers`

Canonical response should still use `report`, `faza0Answers`, `faza0Results`, and `internalAnswers`.

## Expected Free Assessment Codes

Return the 6 free assessment results using these codes:

```text
MF01 - Cod fiscal (tax code) gresit
CD01 - Credit score / raport de credit
CD07 - Bank switching bonus neaccesat
FC02 - Asigurari auto/casa
FC05 - Comisioane remitere bani spre Romania
FC07 - Facturi de utilitati
```

Supported `flag` values:

```text
rosu
galben
verde
necompletat
```

## Internal CRM Answer Values

`ukEmploymentType`:

```text
employee
selfEmployed
both
notWorked
unknown
```

Yes/no fields:

```text
knowsAllPrivatePensions
hadCarFinanceBeforeNov2024
hasCreditCardOverdraftOrPaydayLoansDebt
checkedCouncilTaxBand
```

Use:

```text
yes
no
```

`creditScoreLevel`:

```text
low
medium
high
```

`agentObservations`:

```text
optional free-text CRM-only observation written by the agent
```

## Data Linkage Requirement

The existing submit endpoints should persist enough identifiers to make this lookup reliable:

- `POST /api/justproveit/quick-report/faza0`
- `POST /api/justproveit/quick-report/internal-answers`

When saving Faza Zero, LS should create/link the CRM lead and store:

- `reportId`
- `leadId`
- `contactId` / `canonicalContactId`, when known
- normalized email
- normalized phone
- `serviceKey` or equivalent value `FreeMoneyCheck`
- `faza0Answers`
- `faza0Results`

When saving `Informatii interne CRM`, LS should attach the internal answers, including `internalAnswers.agentObservations` when supplied, to the same saved quick-report simulation, preferably by `reportId`, then `leadId`, then normalized email/phone.

## Privacy

This endpoint is CRM-only. Do not expose `internalAnswers` through:

- public report token endpoints
- customer emails
- public `/ro/rezultate-raport/` page calls

## Acceptance Criteria

- Opening a Money Check lead in CRM details loads the latest matching quick-report record.
- The CRM details panel displays all 6 free assessment result rows returned by LS.
- The panel displays the saved Faza Zero answer values.
- The panel displays the saved `Informatii interne CRM` answer values.
- The panel displays the saved `agentObservations` text when present.
- `Observatii curente` and `Informatii precedente` remain visible in the lead details view.
- If no report exists, the endpoint returns `200` with `report: null`, and the CRM shows a friendly empty state.
- Anonymous calls are rejected.
