# Pension Calculator Polluted Locality Backend Spec

## Context

The Romanian pension calculator at:

`https://www.justproveit.co.uk/ro/calculator-varsta-pensionare`

now asks whether the user had domicile for at least 30 years in an eligible polluted locality in Romania.

This is based on the polluted-locality reduction described in Legea 263/2010 art. 65 alin. (5), as amended by Legea 212/2023. The frontend treats this as a separate reduction scenario because the reduction should not be cumulated with other age reductions.

Official reference checked on 2026-09-03:

`https://legislatie.just.ro/Public/DetaliiDocument/271989`

## Payload Extension

`POST /justproveit/pension-calculator/calculate`

Add support for these optional top-level fields:

```json
{
  "pollutedLocalityBenefit": true,
  "pollutedLocalityName": "Ploiesti",
  "pollutedLocalityResidenceYears": 30
}
```

Field semantics:

- `pollutedLocalityBenefit`: boolean. `true` means the user declares that the locality may be eligible.
- `pollutedLocalityName`: free text locality name supplied by the user.
- `pollutedLocalityResidenceYears`: number of years of domicile declared by the user.

Missing fields must behave as:

```json
{
  "pollutedLocalityBenefit": false,
  "pollutedLocalityName": "",
  "pollutedLocalityResidenceYears": 0
}
```

## Backend Calculation Requirement

When `pollutedLocalityBenefit=true`, backend should add a separate scenario:

- `type`: `limita_varsta_localitate_poluata`
- label: `Pensie limita de varsta - reducere localitate poluata`
- reduction: 2 years from the standard retirement age
- legal reference: `Legea 263/2010 art. 65 alin. (5), modificata prin Legea 212/2023`

Eligibility requirements:

- declared domicile is at least 30 years
- locality is in the official eligible list or within the legally accepted radius, if the backend implements locality validation
- full contributive stage is met
- this reduction is not cumulated with reductions for work groups, special conditions, children, handicap, or other age reductions

If locality validation is not implemented yet, backend may treat `pollutedLocalityBenefit=true` as a declared/self-attested input, but must return a warning telling the user to confirm the locality and domicile certificate with the territorial pension house.

Recommended warning:

`Reducerea pentru localitate poluata este estimata pe baza declaratiei introduse. Verificati lista oficiala actualizata si obtineti adeverinta de domiciliu de la Evidenta Populatiei.`

## Response Requirement

Include the scenario in `result.scenarios` alongside existing scenarios:

```json
{
  "type": "limita_varsta_localitate_poluata",
  "label": "Pensie limita de varsta - reducere localitate poluata",
  "retirementAge": { "years": 63, "months": 0 },
  "retirementDate": "2029-05",
  "eligible": true,
  "eligibleNow": false,
  "futureEligible": true,
  "notApplicable": false,
  "notApplicableReason": null,
  "eligibilityReasons": [
    "Domiciliu declarat de cel putin 30 de ani in Ploiesti si stagiu complet contributiv indeplinit."
  ],
  "ineligibilityReasons": [
  ],
  "legalReferences": [
    "Legea 263/2010 art. 65 alin. (5), modificata prin Legea 212/2023"
  ]
}
```

When `pollutedLocalityBenefit=false`, return either no scenario or a not-applicable scenario. The frontend supports both, but returning a not-applicable scenario is preferred for transparency.

## Email Requirement

The pension result email should render this scenario like the other Romanian scenarios, including:

- label
- retirement age
- estimated date
- status
- eligibility/ineligibility reason
- warning if locality validation is self-attested

Do not present this as a guaranteed legal entitlement unless the backend validates the exact locality against the official current list.

## Acceptance Criteria

- Existing calculator payloads without these fields continue to work unchanged.
- New payload fields are persisted with the calculator result where results are stored.
- If `pollutedLocalityBenefit=false`, existing result behavior is unchanged except for an optional not-applicable scenario.
- If `pollutedLocalityBenefit=true`, `pollutedLocalityResidenceYears>=30`, and full contributive stage is met, the response includes a separate 2-year reduction scenario.
- The 2-year polluted-locality reduction is not added on top of other reductions.
- The result/email warns the user to verify the official locality list and domicile proof unless the backend validates the locality definitively.
