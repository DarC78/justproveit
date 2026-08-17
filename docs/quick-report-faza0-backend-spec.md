# Raport Gratuit Quick Report Endpoint

## Current Frontend Flow

The CRM-authenticated page `/ro/raport-gratuit` collects the existing Faza 0
checks plus the extended Faza 1 answers.

Submission uses the existing backend quick-report endpoint:

`POST /justproveit/quick-report/faza0`

The frontend keeps the same submit button and sends:

- the existing Faza 0 answers
- the existing Faza 0 result rows
- `faza1Answers` for the extended checks

The backend appends/calculates the Faza 1 result rows, persists the lead/report,
sends the full report email, and marks specialist follow-up for triggered
`MF07`, `PE03`, and `AA02`.

## Frontend Payload

```json
{
  "tenantKey": "justproveit",
  "source": "raport_gratuit_faza0",
  "fullName": "Ion Popescu",
  "email": "ion@example.com",
  "phone": "07123456789",
  "consentVerbalAt": "2026-08-17T10:00:00.000Z",
  "standardTaxCode": "1257L",
  "domain": "www.justproveit.co.uk",
  "pageUrl": "https://www.justproveit.co.uk/ro/raport-gratuit/",
  "referrer": "",
  "answers": {
    "existingFaza0Answers": {}
  },
  "results": [
    {
      "code": "MF01",
      "title": "Cod fiscal (tax code) gresit",
      "flag": "rosu",
      "output": "Text rezultat...",
      "rawAnswer": {}
    }
  ],
  "faza1Answers": {
    "marriedOrCivilPartner": true,
    "lowerPartnerAnnualIncome": 10000,
    "higherPartnerBasicRateTaxpayer": true
  }
}
```

## Faza 0 Rows

The current frontend evaluates 6 Faza 0 rows:

- `MF01` - Cod fiscal
- `CD01` - Credit score / raport de credit
- `CD07` - Bank switching
- `FC02` - Asigurari auto/casa
- `FC05` - Remitere bani spre Romania
- `FC07` - Utilitati

## Faza 1 Answer Keys

The frontend sends booleans, numbers, and strings using these backend keys:

```json
{
  "marriedOrCivilPartner": true,
  "lowerPartnerAnnualIncome": 10000,
  "higherPartnerBasicRateTaxpayer": true,
  "worksOvertimeOrVariableHours": true,
  "holidayPayChecked": false,
  "redundancyInLast3Years": true,
  "ageAtDismissal": 45,
  "yearsService": 10,
  "weeklyPay": 800,
  "redundancyAmountReceived": 5000,
  "selfAssessmentIncome": true,
  "declaredUsualExpenses": false,
  "hasStudentLoan": true,
  "studentLoanPlan": "Plan 2",
  "annualIncome": 28000,
  "repaymentsTaken": true,
  "hasRomanianIncomeWhileUkResident": true,
  "checkedStatePensionForecast": false,
  "knownContributionGaps": true,
  "ukEmployersCount": 3,
  "checkedAllWorkplacePensions": false,
  "workedInRomania": true,
  "hadCarFinance2007To2024": true,
  "hadGapInsuranceOrAddOns": true,
  "hadPaydayLoans": true,
  "paysMonthlyCurrentAccountFee": true,
  "usesIncludedBenefits": false,
  "usesOverdraftRegularly": true,
  "overdraftApr": 39.9,
  "checkedCouncilTaxBand": false,
  "hasActiveSubscriptionsList": false,
  "receivesLowIncomeBenefit": true,
  "hasSocialTariff": false,
  "hasMortgage": true,
  "fixedRateEndsInMonths": 4,
  "hasOldBankAccounts": true,
  "hasRomanianInheritanceOrProperty": true
}
```

## Response

Success:

```json
{
  "success": true,
  "leadId": "uuid",
  "reportId": "uuid",
  "emailSent": true,
  "message": "Raportul a fost trimis pe email."
}
```

If the report is saved but email fails, the frontend treats the save as success
and shows the email error.
