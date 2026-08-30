# Quick Report Internal CRM Answers Backend Spec

## Context

The CRM-only page is:

`https://www.justproveit.co.uk/ro/raport-gratuit/`

The frontend no longer shows the old `Faza 1 - verificari extinse` form or the `Rezultate Faza 1` preview on this page. It now shows a short internal CRM questionnaire after the Faza 0 free report.

These answers are internal only:

- they must not be included in the customer email
- they must not be returned by the public report results endpoint
- they must be visible only in CRM/admin context

## Required Endpoint

`POST /api/justproveit/quick-report/internal-answers`

The frontend calls the endpoint through the existing LaunchingStack API base:

`https://launchingstack-func-dev.azurewebsites.net/api`

Authentication:

- require the existing CRM bearer token
- reject anonymous/public requests
- require tenant `justproveit`

## Request

Current frontend compatibility note:

- until LS confirms support for `answers.agentObservations`, the live frontend sends only the six structured internal answer fields to this endpoint
- the free-text agent observation is currently written to the CRM lead observation field through the existing CRM update endpoint
- once LS implements `answers.agentObservations`, the frontend can send it in this payload and display it from the dedicated quick-report details endpoint

```json
{
  "tenantKey": "justproveit",
  "source": "raport_gratuit_crm_internal",
  "reportId": "optional-report-id-from-faza0-save",
  "leadId": "optional-lead-id-from-faza0-save",
  "fullName": "Client Name",
  "email": "client@example.com",
  "phone": "07123456789",
  "domain": "www.justproveit.co.uk",
  "pageUrl": "https://www.justproveit.co.uk/ro/raport-gratuit/",
  "referrer": "",
  "answers": {
    "ukEmploymentType": "employee",
    "knowsAllPrivatePensions": "no",
    "hadCarFinanceBeforeNov2024": "yes",
    "hasCreditCardOverdraftOrPaydayLoansDebt": "yes",
    "checkedCouncilTaxBand": "no",
    "creditScoreLevel": "medium",
    "agentObservations": "Clientul pare interesat de bank switching si pensii private pierdute."
  },
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
      "title": "Cod fiscal (tax code) greșit",
      "flag": "rosu",
      "output": "result text",
      "rawAnswer": {}
    }
  ]
}
```

## Answer Values

`ukEmploymentType`:

- `employee`
- `selfEmployed`
- `both`
- `notWorked`
- `unknown`

Yes/no fields use the existing quick-report values:

- `yes`
- `no`

The yes/no fields are:

- `knowsAllPrivatePensions`
- `hadCarFinanceBeforeNov2024`
- `hasCreditCardOverdraftOrPaydayLoansDebt`
- `checkedCouncilTaxBand`

`creditScoreLevel`:

- `low`
- `medium`
- `high`

`agentObservations`:

- optional free-text field written by the CRM agent
- store as internal CRM-only text
- do not require it for completion
- recommended limit: at least 4,000 characters
- not currently sent by the frontend until LS confirms the field is accepted and persisted

## Persistence

Attach the internal answers to the saved Faza 0 free-report simulation.

The quick-report save must also be linked to a real CRM lead/contact. The `leadId` returned by LS must be the same CRM lead identifier accepted by:

`POST /api/justproveit/admin/crm/leads/{leadId}`

Do not return a report id, interest id, intent id, or other internal id in the `leadId` response field unless the CRM lead update endpoint accepts that same id.

CRM lead lookup/create order:

1. Normalize the phone from `phone`.
2. Search for an existing CRM lead/contact by normalized phone first.
3. If no phone match exists, search by normalized/lowercase `email`.
4. If neither phone nor email finds a record, create a new CRM lead/contact with `fullName`, `email`, `phone`, tenant `justproveit`, and service/source metadata for `FreeMoneyCheck`.
5. Attach the Faza 0 answers/results and the internal CRM answers to that CRM lead/contact.
6. Return the canonical CRM `leadId` and, when available, `contactId` / `canonicalContactId`.

Report lookup order:

1. `reportId`
2. canonical CRM `leadId`
3. latest matching `FreeMoneyCheck` / quick-report record for the same tenant + normalized phone
4. latest matching `FreeMoneyCheck` / quick-report record for the same tenant + normalized email

Store the raw answer keys and enough labels for CRM display. Recommended labels:

- `ukEmploymentType`: "A muncit in UK ca angajat/self-employed?"
- `knowsAllPrivatePensions`: "Stie toate pensiile private?"
- `hadCarFinanceBeforeNov2024`: "Masina cu plata in rate inainte de Noiembrie 2024?"
- `hasCreditCardOverdraftOrPaydayLoansDebt`: "Datorii pe carduri de credit / overdraft / payday loans?"
- `checkedCouncilTaxBand`: "A verificat banda de council tax?"
- `creditScoreLevel`: "Scor de credit"
- `agentObservations`: "Observatii agent"

When LS supports `agentObservations`, save it in the same linked CRM context:

- persist it with the internal quick-report answers as `internalAnswers.agentObservations`
- also append or store it in the CRM lead observation area if that is the operational CRM field agents use
- make the save idempotent for retries, so the same note is not duplicated when a request is repeated
- do not return success if the structured internal answers save succeeds but the required lead link/create step fails

## Response

Return:

```json
{
  "success": true,
  "reportId": "report-id",
  "leadId": "lead-id",
  "message": "Informatiile interne au fost salvate in CRM."
}
```

On failure, return an appropriate non-2xx status with either:

```json
{
  "success": false,
  "error": "Human readable error"
}
```

or:

```json
{
  "success": false,
  "error": {
    "code": "server_error",
    "message": "Human readable error"
  }
}
```

## CRM Display

Show these answers in the CRM/admin lead/report detail area for the matching Free Money Check record.

They should be internal CRM fields only. Do not expose them on:

- the public `/ro/rezultate-raport/` page
- the customer report email
- public report token responses

## Acceptance Criteria

- The old Faza 1 sections are not visible on `/ro/raport-gratuit/`.
- A CRM user can send the Faza 0 free report as before.
- After Faza 0 is saved, a CRM user can save the internal questionnaire.
- Saved internal answers are attached to the same free-report simulation/lead.
- Saved agent observations are attached to the same free-report simulation/lead.
- Saved internal answers are visible in CRM.
- Saved agent observations are visible in CRM.
- Saved internal answers are not visible to the customer and are not included in emails.
