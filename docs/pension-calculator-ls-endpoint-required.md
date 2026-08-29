# Pension Calculator LaunchingStack Endpoint Requirement

## Context

The public Romanian pension calculator is:

`https://www.justproveit.co.uk/ro/calculator-varsta-pensionare`

Frontend primary API call:

`POST https://launchingstack-func-dev.azurewebsites.net/api/justproveit/pension-calculator/calculate`

As of 2026-08-29, this endpoint returns `404 Not Found`. The frontend now falls back to a local informational calculation so the page does not break, but backend support is still required for persistence and automated result email.

## Required Backend Endpoints

### Calculate

`POST /api/justproveit/pension-calculator/calculate`

Accept the existing frontend payload shape:

```json
{
  "tenantKey": "justproveit",
  "source": "ro-pension-calculator",
  "fullName": "Client Name",
  "email": "client@example.com",
  "phone": "07123456789",
  "birthYearMonth": "1966-05",
  "gender": "F",
  "applicationDate": "2026-08",
  "periods": {
    "normalRoYears": 30,
    "normalRoMonths": 0,
    "foreignYears": 5,
    "foreignMonths": 0,
    "deosebiteYears": 0,
    "deosebiteMonths": 0,
    "specialeYears": 0,
    "specialeMonths": 0,
    "grupaIYears": 0,
    "grupaIMonths": 0,
    "grupaIIYears": 0,
    "grupaIIMonths": 0
  },
  "foreignPeriods": [
    { "country": "UK", "years": 5, "months": 0, "monthsTotal": 60 }
  ],
  "childrenRaised": 0,
  "handicapType": "none",
  "handicapYears": 0,
  "handicapMonths": 0,
  "domain": "www.justproveit.co.uk",
  "pageUrl": "https://www.justproveit.co.uk/ro/calculator-varsta-pensionare",
  "referrer": ""
}
```

Return the existing response shape used by the frontend:

```json
{
  "success": true,
  "resultId": "stable-result-id",
  "leadId": "stable-lead-id",
  "emailSent": false,
  "emailError": null,
  "result": {
    "calculatorVersion": "ls-version",
    "lawVersion": "Legea 360/2023",
    "anexa": {
      "standardAge": { "years": 62, "months": 11 },
      "fullStagiu": { "years": 34, "months": 8 },
      "minimumStagiu": { "years": 15, "months": 0 }
    },
    "currentAge": { "years": 60, "months": 3 },
    "stagiu": {
      "ro": { "years": 30, "months": 0 },
      "roContributiv": { "years": 30, "months": 0 },
      "foreign": { "years": 5, "months": 0 },
      "asimilat": { "years": 0, "months": 0 },
      "total": { "years": 35, "months": 0 },
      "totalContributiv": { "years": 35, "months": 0 },
      "grupaI_plus_speciale": { "years": 0, "months": 0 },
      "grupaII_plus_deosebite": { "years": 0, "months": 0 }
    },
    "scenarios": [],
    "recommended": null,
    "warnings": [],
    "disclaimer": "Rezultatele sunt informative."
  }
}
```

### Send Result Email

`POST /api/justproveit/pension-calculator/results/{resultId}/email`

Payload:

```json
{
  "tenantKey": "justproveit",
  "fullName": "Client Name",
  "email": "client@example.com",
  "phone": "07123456789"
}
```

Return:

```json
{
  "success": true,
  "resultId": "stable-result-id",
  "emailSent": true,
  "emailError": null
}
```

## Acceptance Criteria

- Anonymous users can calculate from `/ro/calculator-varsta-pensionare`.
- The calculate endpoint returns HTTP 2xx and the response shape above.
- The backend persists the result and returns a stable `resultId`.
- The frontend no longer needs to show `localOnly` for normal production calculations.
- The result email endpoint sends the saved result by email.
- Unknown routes must not be used for this calculator; the exact paths above should be live under the LaunchingStack API base.
