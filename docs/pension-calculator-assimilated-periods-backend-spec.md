# Pension Calculator Additional Periods Backend Spec

## Context

The Romanian pension calculator is available at:

`https://www.justproveit.co.uk/ro/calculator-varsta-pensionare`

The frontend currently submits to:

`POST /justproveit/pension-calculator/calculate`

Current payload includes:

- contact details
- birth year/month
- gender
- `periods.normalRoYears/months`
- foreign work periods
- special/deosebite/grupa periods
- children/handicap inputs

We need to extend the calculator to support additional Romanian periods:

- army service
- paid unemployment
- maternity leave
- university studies that did not overlap with worked years
- special historical/legal situations entered as years/months

## Legal References Checked

Checked on 2026-08-08.

- Legea nr. 360/2023, art. 3, art. 6, art. 13, art. 14, art. 47, art. 56, art. 58:
  `https://legislatie.just.ro/Public/FormaPrintabila/00000G3GAYFHBWLFXEL15YMH0EMXPTEC`
- CNPP clarification on assimilated/non-contributive periods:
  `https://www.cnpp.ro/noutati/-/asset_publisher/4IYjNHH6tg1O/content/precizari-referitoare-la-perioadele-asimilate-si-perioadele-necontributive`
- CNPP clarification on child-raising leave, useful because it explains the special contributive-stage exception:
  `https://www.cnpp.ro/noutati/-/asset_publisher/4IYjNHH6tg1O/content/precizari-referitoare-la-valorificarea-perioadelor-in-care-o-persoana-a-beneficiat-de-concediu-pentru-cresterea-copilului`
- Codul fiscal, art. 137, for contribution-bearing categories such as unemployment and health/social insurance indemnities:
  `https://legislatie.just.ro/Public/DetaliiDocument/184770`
- OUG nr. 158/2005, for medical leave/maternity indemnity contribution handling:
  `https://legislatie.just.ro/Public/DetaliiDocument/169563`

## Important Legal Notes

The backend must distinguish:

- `stagiu total de cotizare`
- `stagiu de cotizare contributiv`
- `perioade asimilate`
- periods that are input/display only but excluded from calculation

Do not add every extra period to `totalContributiv`.

Per Legea 360/2023 art. 14, university studies and military service are generally assimilated periods, not contributive periods. They are only valorified when they do not overlap with contribution periods.

Paid unemployment is different: persons receiving monthly unemployment rights are obligatorily insured, and those rights are contribution-bearing. Treat paid unemployment as Romanian contributive stage, assuming the period is confirmed as paid unemployment and does not overlap with work.

Maternity leave needs careful wording. For the frontend/business label use `Concediu de maternitate`, but backend should model the legal category as paid maternity/medical indemnity where contributions were owed/declared. Do not confuse it with `concediu pentru cresterea copilului`, which is already a separate legal category and has special rules after 2006.

Army warning: the requested business wording says:

- army at normal term counts toward seniority
- army at reduced term does not count

However, Legea 360/2023 art. 14 mentions both `militar in termen` and `militar cu termen redus` as assimilated periods. LaunchingStack should confirm this rule with the owner/legal reviewer before excluding reduced-term army. Until confirmed, backend should support both a strict legal mode and a business-rule mode.

Recommended default for production:

- count normal army service as assimilated
- count reduced-term army as assimilated only if `rules.armyReducedCounts = true`
- return a warning when reduced-term army is submitted and excluded

## Required Payload Extension

Keep backward compatibility with the current flat `periods` object.

Add these optional period fields:

```json
{
  "periods": {
    "normalRoYears": 20,
    "normalRoMonths": 0,

    "armyNormalYears": 1,
    "armyNormalMonths": 4,
    "armyReducedYears": 0,
    "armyReducedMonths": 6,

    "paidUnemploymentYears": 1,
    "paidUnemploymentMonths": 0,

    "maternityLeaveYears": 0,
    "maternityLeaveMonths": 4,

    "universityYears": 4,
    "universityMonths": 0
  }
}
```

The frontend will collect years/months only for the first implementation. The labels should instruct agents/users to enter only periods that do not overlap with worked years.

Optional future structured format, if LaunchingStack prefers stronger validation:

```json
{
  "additionalRomanianPeriods": {
    "army": [
      { "type": "normal_term", "years": 1, "months": 4 },
      { "type": "reduced_term", "years": 0, "months": 6 }
    ],
    "paidUnemployment": [{ "years": 1, "months": 0 }],
    "maternityLeave": [{ "years": 0, "months": 4 }],
    "universityStudies": [
      {
        "years": 4,
        "months": 0,
        "fullTime": true,
        "graduatedWithDiploma": true,
        "nonOverlappingWithWork": true
      }
    ]
  }
}
```

Backend should accept the flat fields first because this matches the existing calculator contract.

## Special Situation Duration Payload

The frontend also sends optional years/months for special historical/legal situations inside the same flat `periods` object:

```json
{
  "periods": {
    "removedFromServicePoliticalRacialPre1945Years": 1,
    "removedFromServicePoliticalRacialPre1945Months": 0,
    "recognizedAntifascistRevolutionaryActivityYears": 0,
    "recognizedAntifascistRevolutionaryActivityMonths": 6,
    "illegalSuspensionOrDismissalAnnulledYears": 0,
    "illegalSuspensionOrDismissalAnnulledMonths": 0,
    "professionalOrPoliticalTrainingWhileEmployedYears": 0,
    "professionalOrPoliticalTrainingWhileEmployedMonths": 0,
    "formerSocialInsuranceContributionsYears": 0,
    "formerSocialInsuranceContributionsMonths": 0,
    "womanReducedScheduleChildcareUnder6Years": 0,
    "womanReducedScheduleChildcareUnder6Months": 0,
    "decreeLaw118RecognizedPeriodsYears": 0,
    "decreeLaw118RecognizedPeriodsMonths": 0,
    "wifeFollowingHusbandPermanentMissionAbroadYears": 0,
    "wifeFollowingHusbandPermanentMissionAbroadMonths": 0,
    "compensatoryPaymentsOug98_1999Years": 0,
    "compensatoryPaymentsOug98_1999Months": 0,
    "unemploymentLaw1_1991IntegrationAidYears": 0,
    "unemploymentLaw1_1991IntegrationAidMonths": 0
  }
}
```

Special situation period definitions:

| Key | Frontend label |
| --- | --- |
| `removedFromServicePoliticalRacialPre1945` | Perioada in care a fost indepartata din serviciu pentru activitate politica revolutionara, antifascista sau democratica, inainte de 23 August 1944, ori ca urmare a persecutiilor rasiale sau nationale, in perioada ianuarie 1938 - decembrie 1945 |
| `recognizedAntifascistRevolutionaryActivity` | Perioada in care a desfasurat o activitate revolutionara antifascista, recunoscuta de organele in drept ca vechime in munca |
| `illegalSuspensionOrDismissalAnnulled` | Perioada in care a fost suspendata din functie ori i s-a desfacut contractul de munca, daca aceste masuri au fost anulate ulterior ca fiind ilegale |
| `professionalOrPoliticalTrainingWhileEmployed` | Perioada in care o persoana incadrata in munca urmeaza cursuri de pregatire profesionala sau politica |
| `formerSocialInsuranceContributions` | Perioadele pentru care s-a cotizat la fostele asigurari sociale ori la casele de pensii preluate de stat |
| `womanReducedScheduleChildcareUnder6` | Perioada in care o femeie a fost incadrata, cu program redus, potrivit legii, pentru ingrijirea copiilor in varsta de pana la 6 ani, se socoteste ca timp integral |
| `decreeLaw118RecognizedPeriods` | Perioadele recunoscute ca atare in baza Decretului-lege nr. 118/1990 |
| `wifeFollowingHusbandPermanentMissionAbroad` | Timpul cat sotia salariata lipseste din tara pentru a-si urma sotul trimis in misiune permanenta in strainatate |
| `compensatoryPaymentsOug98_1999` | Perioadele pentru care se primesc plati compensatorii in baza Ordonantei de Urgenta nr. 98/1999 |
| `unemploymentLaw1_1991IntegrationAid` | Perioadele in care a beneficiat de somaj si de ajutor de integrare profesionala prevazute de Legea nr. 1/1991 |

Important implementation note:

- These are duration fields entered by the agent/user.
- Backend should treat missing/empty/null values as zero.
- Backend should persist non-zero special situation periods with the calculator result/lead.
- Backend should classify each period according to the legal rule it implements: contributive, assimilated, non-contributive/recognized, or excluded.
- Include each non-zero period in `stagiu.additionalBreakdown` with `classification` and a clear label.
- If a special situation period needs extra documents or exact date validation before it can be safely counted, return a warning and either exclude it or classify it according to the configured legal rule.

## Calculation Rules

### Army - Normal Term

Input:

- `periods.armyNormalYears`
- `periods.armyNormalMonths`

Rule:

- add to `stagiu.asimilat`
- add to `stagiu.total`
- do not add to `stagiu.roContributiv`
- do not add to `stagiu.totalContributiv`
- do not use for contributive-stage thresholds for:
  - full contributive stage
  - minimum contributive stage
  - age reductions that require contributive stage
  - pension anticipation scenarios that require contributive stage

### Army - Reduced Term

Input:

- `periods.armyReducedYears`
- `periods.armyReducedMonths`

Default business rule requested:

- do not add to stage
- include in breakdown as `excluded`
- add warning: `Armata la termen redus a fost introdusa, dar nu a fost inclusa in calcul conform regulii configurate. Verificati actele cu casa de pensii.`

Config option:

- `rules.armyReducedCounts = true`

If enabled:

- treat as assimilated, same as normal army service

### Paid Unemployment

Input:

- `periods.paidUnemploymentYears`
- `periods.paidUnemploymentMonths`

Rule:

- add to `stagiu.roContributiv`
- add to `stagiu.totalContributiv`
- add to `stagiu.total`
- include in `stagiu.additionalBreakdown.paidUnemployment`
- assume normal working conditions
- do not add to deosebite/speciale/grupa buckets

Validation:

- user must submit only paid unemployment periods
- unpaid/unregistered unemployment must not be included
- periods must not overlap with work or other contribution periods

### Maternity Leave

Input:

- `periods.maternityLeaveYears`
- `periods.maternityLeaveMonths`

Rule for first version:

- treat as Romanian contributive stage when it was paid maternity leave / maternity medical indemnity for which pension contribution was owed or declared
- add to `stagiu.roContributiv`
- add to `stagiu.totalContributiv`
- add to `stagiu.total`
- include in `stagiu.additionalBreakdown.maternityLeave`
- assume normal working conditions

Warnings:

- return a warning that this field is for `concediu de maternitate/sarcina si lauzie`, not `concediu crestere copil`
- if backend later supports dates, apply date-specific rules for older periods and social insurance indemnities

### University Studies

Input:

- `periods.universityYears`
- `periods.universityMonths`

Rule:

- add to `stagiu.asimilat`
- add to `stagiu.total`
- do not add to `stagiu.roContributiv`
- do not add to `stagiu.totalContributiv`

Validation/assumptions:

- studies must be full-time or frequency university studies
- user must have graduated with diploma/licence/master/doctor diploma as applicable
- include only normal study duration
- include only years/months that did not overlap with worked/contributive years
- if multiple same-level studies exist, only one period of the same level can be used

Warning:

- if the user enters university studies, return a warning summarizing these assumptions.

### Special Historical/Legal Situations

Input:

- `periods.removedFromServicePoliticalRacialPre1945Years`
- `periods.removedFromServicePoliticalRacialPre1945Months`
- `periods.recognizedAntifascistRevolutionaryActivityYears`
- `periods.recognizedAntifascistRevolutionaryActivityMonths`
- `periods.illegalSuspensionOrDismissalAnnulledYears`
- `periods.illegalSuspensionOrDismissalAnnulledMonths`
- `periods.professionalOrPoliticalTrainingWhileEmployedYears`
- `periods.professionalOrPoliticalTrainingWhileEmployedMonths`
- `periods.formerSocialInsuranceContributionsYears`
- `periods.formerSocialInsuranceContributionsMonths`
- `periods.womanReducedScheduleChildcareUnder6Years`
- `periods.womanReducedScheduleChildcareUnder6Months`
- `periods.decreeLaw118RecognizedPeriodsYears`
- `periods.decreeLaw118RecognizedPeriodsMonths`
- `periods.wifeFollowingHusbandPermanentMissionAbroadYears`
- `periods.wifeFollowingHusbandPermanentMissionAbroadMonths`
- `periods.compensatoryPaymentsOug98_1999Years`
- `periods.compensatoryPaymentsOug98_1999Months`
- `periods.unemploymentLaw1_1991IntegrationAidYears`
- `periods.unemploymentLaw1_1991IntegrationAidMonths`

Rule:

- include each non-zero duration in the calculation according to LaunchingStack's implemented legal classification
- add each counted duration to the appropriate `stagiu` buckets
- include each non-zero duration in `stagiu.additionalBreakdown`
- do not count the same calendar period twice if it overlaps with work, unemployment, army, university, maternity, foreign periods, handicap periods or another special situation period

Recommended classification contract:

- `classification: "contributiv"` when the period is treated as contribution-bearing
- `classification: "asimilat"` when the period is assimilated but not contributive
- `classification: "necontributiv"` or `"recunoscut"` when the period is legally recognized as stage/seniority but should not satisfy contributive thresholds
- `classification: "excluded"` when the backend receives the duration but cannot legally count it under the configured rule

Warnings:

- return a warning for every non-zero special period that depends on supporting documents or exact dates
- return a warning if backend accepts the duration but applies it as non-contributive/recognized stage rather than contributive stage

## Non-Overlap

Because the current UI captures only totals, not exact dates, backend cannot fully prove overlap.

For first implementation:

- trust the frontend/user-entered non-overlap totals
- return warnings for assimilated periods requiring non-overlap
- do not attempt to infer overlap from totals

Future version:

- capture start/end dates for each period
- backend should merge intervals and reject/deduct overlaps

## Response Extension

Extend `result.stagiu` with optional breakdown fields while preserving current fields:

```json
{
  "stagiu": {
    "ro": { "years": 25, "months": 0 },
    "roContributiv": { "years": 21, "months": 4 },
    "foreign": { "years": 4, "months": 0 },
    "asimilat": { "years": 5, "months": 4 },
    "total": { "years": 30, "months": 4 },
    "totalContributiv": { "years": 25, "months": 4 },
    "grupaI_plus_speciale": { "years": 0, "months": 0 },
    "grupaII_plus_deosebite": { "years": 0, "months": 0 },
    "additionalBreakdown": {
      "armyNormal": { "years": 1, "months": 4, "classification": "asimilat" },
      "armyReduced": { "years": 0, "months": 6, "classification": "excluded" },
      "paidUnemployment": { "years": 1, "months": 0, "classification": "contributiv" },
      "maternityLeave": { "years": 0, "months": 4, "classification": "contributiv" },
      "university": { "years": 4, "months": 0, "classification": "asimilat" }
    }
  },
  "warnings": [
    "Anii de facultate au fost inclusi ca perioada asimilata doar pe baza declaratiei ca nu se suprapun cu ani lucrati.",
    "Concediul de maternitate nu este acelasi lucru cu concediul pentru cresterea copilului."
  ]
}
```

`additionalBreakdown` is optional for backward compatibility but strongly recommended so the frontend can explain results clearly.

## Scenario Impact

Backend must recalculate all existing scenarios using the updated staged totals:

- standard retirement age scenario
- child reduction scenario
- handicap scenario
- deosebite/speciale/grupa scenarios
- age reduction for exceeding full contributive stage by at least 5 years
- pension anticipation scenario

Important:

- Assimilated university/army periods should not make someone eligible for scenarios requiring `stagiu complet de cotizare contributiv`.
- Paid unemployment and contributive maternity leave can contribute to contributive thresholds.
- Existing foreign-period behavior should remain unchanged.

## Frontend Implementation After Backend Is Ready

Add rows in the `Stagii de cotizare` fieldset:

- `Armata - termen normal`
- `Armata - termen redus`
- `Somaj platit`
- `Concediu de maternitate`
- `Facultate fara suprapunere cu ani lucrati`

Add rows in the `Situatii speciale pentru vechime` fieldset for each special situation, also using years/months inputs.

Submit all new duration values as flat `periods.*Years/months` fields.

Update `Ce acopera versiunea simplificata` to mention:

- armata
- somaj platit
- concediu de maternitate
- facultate fara suprapunere
- situatii speciale introduse cu ani si luni

Update result display to show `additionalBreakdown` if returned.

## Acceptance Criteria

- Existing calculator requests without new fields behave exactly as before.
- New fields accept empty strings/missing/null as zero.
- Special situation duration fields are accepted, persisted and included in the calculation/result context.
- Months are normalized so `12 months = 1 year`.
- Negative values are rejected or treated as validation errors.
- Paid unemployment increases contributive Romanian stage.
- Maternity leave increases contributive Romanian stage for first version, with warning wording.
- University studies increase assimilated/total stage but not contributive stage.
- Army normal increases assimilated/total stage but not contributive stage.
- Army reduced follows the configured rule and returns a warning if excluded.
- The response includes warnings for user-entered non-overlap assumptions.
- The response includes warnings for selected special situation durations when backend needs exact dates or documents before applying a numeric stage change.
- Result emails continue to render without breaking if `additionalBreakdown` is present or absent.
