import { API_BASE_URL, TENANT_KEY } from "@/lib/auth";
import anexa5Men from "../../Specs/anexa5_men.json";
import anexa5Women from "../../Specs/anexa5_women.json";

export type AgeYM = {
  years: number;
  months: number;
};

export type PensionScenario = {
  type: string;
  label: string;
  retirementAge: AgeYM;
  retirementDate: string;
  eligible: boolean;
  eligibleNow: boolean;
  futureEligible?: boolean;
  notApplicable?: boolean;
  notApplicableReason?: string | null;
  eligibilityReasons: string[];
  ineligibilityReasons: string[];
  legalReferences: string[];
};

export type PensionCalculatorResult = {
  calculatorVersion: string;
  lawVersion: string;
  anexa: {
    standardAge: AgeYM;
    fullStagiu: AgeYM;
    minimumStagiu: AgeYM;
  };
  currentAge: AgeYM;
  stagiu: {
    ro: AgeYM;
    roContributiv: AgeYM;
    foreign: AgeYM;
    asimilat: AgeYM;
    total: AgeYM;
    totalContributiv: AgeYM;
    grupaI_plus_speciale: AgeYM;
    grupaII_plus_deosebite: AgeYM;
    additionalBreakdown?: Record<
      string,
      AgeYM & {
        classification?: string;
        label?: string;
        note?: string | null;
      }
    >;
  };
  ukStatePension?: {
    label: string;
    retirementAge: AgeYM;
    retirementDate: string;
    eligibleNow: boolean;
    legalReference?: string;
    sourceUrl?: string;
    note?: string;
  } | null;
  foreignPensionSections?: Array<{
    countryCode?: string;
    countryName: string;
    workedPeriod: AgeYM;
    retirementAge?: AgeYM | null;
    retirementDate?: string | null;
    eligibleNow?: boolean | null;
    legalReference?: string | null;
    sourceUrl?: string | null;
    note?: string | null;
  }>;
  scenarios: PensionScenario[];
  recommended: PensionScenario | null;
  warnings: string[];
  disclaimer: string;
};

export type PensionCalculatorResponse = {
  success: boolean;
  resultId: string;
  leadId: string;
  emailSent: boolean;
  emailError?: string | null;
  localOnly?: boolean;
  result: PensionCalculatorResult;
};

export type PensionCalculatorEmailResponse = {
  success: boolean;
  resultId: string;
  emailSent: boolean;
  emailError?: string | null;
};

export type PensionCalculatorPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  birthYearMonth: string;
  gender: "M" | "F";
  applicationDate?: string;
  periods: Record<string, number>;
  foreignPeriods?: Array<{
    country: string;
    years: number;
    months: number;
    monthsTotal?: number;
  }>;
  childrenRaised?: number;
  handicapType?: string;
  handicapYears?: number;
  handicapMonths?: number;
  tenantKey?: string;
  domain?: string;
  source?: string;
  pageUrl?: string;
  referrer?: string;
};

type Anexa5Row = {
  birth: string;
  retire: string;
  age: [number, number];
  stagiu_complet: [number, number];
  stagiu_min: [number, number] | null;
};

type LocalAggregateResult = {
  stagiu: PensionCalculatorResult["stagiu"];
  foreignPeriods: Array<{ country: string; months: number }>;
};

const ANEXA5_MEN = anexa5Men as unknown as Anexa5Row[];
const ANEXA5_WOMEN = anexa5Women as unknown as Anexa5Row[];
const ZERO_AGE: AgeYM = { years: 0, months: 0 };
const FULL_REDUCTION_CAP_MONTHS = 11 * 12;
const MIN_REDUCED_AGE_MONTHS = {
  M: 54 * 12,
  F: 52 * 12,
};

const TABEL_1: Array<{ stagiuAniIntegri: number; reducere: AgeYM }> = [
  { stagiuAniIntegri: 1, reducere: { years: 0, months: 4 } },
  { stagiuAniIntegri: 2, reducere: { years: 0, months: 8 } },
  { stagiuAniIntegri: 3, reducere: { years: 1, months: 0 } },
  { stagiuAniIntegri: 4, reducere: { years: 1, months: 4 } },
  { stagiuAniIntegri: 5, reducere: { years: 1, months: 8 } },
  { stagiuAniIntegri: 6, reducere: { years: 2, months: 0 } },
  { stagiuAniIntegri: 7, reducere: { years: 2, months: 4 } },
  { stagiuAniIntegri: 8, reducere: { years: 2, months: 8 } },
  { stagiuAniIntegri: 9, reducere: { years: 3, months: 0 } },
  { stagiuAniIntegri: 10, reducere: { years: 3, months: 4 } },
  { stagiuAniIntegri: 11, reducere: { years: 3, months: 8 } },
  { stagiuAniIntegri: 12, reducere: { years: 4, months: 0 } },
  { stagiuAniIntegri: 13, reducere: { years: 4, months: 4 } },
  { stagiuAniIntegri: 14, reducere: { years: 4, months: 8 } },
  { stagiuAniIntegri: 15, reducere: { years: 5, months: 0 } },
  { stagiuAniIntegri: 16, reducere: { years: 5, months: 4 } },
  { stagiuAniIntegri: 17, reducere: { years: 5, months: 8 } },
  { stagiuAniIntegri: 18, reducere: { years: 6, months: 0 } },
  { stagiuAniIntegri: 19, reducere: { years: 6, months: 4 } },
  { stagiuAniIntegri: 20, reducere: { years: 6, months: 8 } },
  { stagiuAniIntegri: 21, reducere: { years: 7, months: 0 } },
];

const TABEL_2: Array<{ stagiuAniIntegri: number; reducere: AgeYM }> = [
  { stagiuAniIntegri: 1, reducere: { years: 0, months: 6 } },
  { stagiuAniIntegri: 2, reducere: { years: 1, months: 0 } },
  { stagiuAniIntegri: 3, reducere: { years: 1, months: 6 } },
  { stagiuAniIntegri: 4, reducere: { years: 2, months: 0 } },
  { stagiuAniIntegri: 5, reducere: { years: 2, months: 6 } },
  { stagiuAniIntegri: 6, reducere: { years: 3, months: 0 } },
  { stagiuAniIntegri: 7, reducere: { years: 3, months: 6 } },
  { stagiuAniIntegri: 8, reducere: { years: 4, months: 0 } },
  { stagiuAniIntegri: 9, reducere: { years: 4, months: 6 } },
  { stagiuAniIntegri: 10, reducere: { years: 5, months: 0 } },
  { stagiuAniIntegri: 11, reducere: { years: 5, months: 6 } },
  { stagiuAniIntegri: 12, reducere: { years: 6, months: 0 } },
  { stagiuAniIntegri: 13, reducere: { years: 6, months: 6 } },
  { stagiuAniIntegri: 14, reducere: { years: 7, months: 0 } },
  { stagiuAniIntegri: 15, reducere: { years: 7, months: 6 } },
  { stagiuAniIntegri: 16, reducere: { years: 8, months: 0 } },
  { stagiuAniIntegri: 17, reducere: { years: 8, months: 6 } },
  { stagiuAniIntegri: 18, reducere: { years: 9, months: 0 } },
  { stagiuAniIntegri: 19, reducere: { years: 9, months: 6 } },
  { stagiuAniIntegri: 20, reducere: { years: 10, months: 0 } },
];

const TABEL_3: Array<{ copii: number; reducere: AgeYM }> = [
  { copii: 1, reducere: { years: 0, months: 6 } },
  { copii: 2, reducere: { years: 1, months: 0 } },
  { copii: 3, reducere: { years: 1, months: 6 } },
  { copii: 4, reducere: { years: 2, months: 0 } },
  { copii: 5, reducere: { years: 2, months: 6 } },
  { copii: 6, reducere: { years: 3, months: 0 } },
  { copii: 7, reducere: { years: 3, months: 6 } },
];

const SPECIAL_SITUATION_KEYS = [
  "removedFromServicePoliticalRacialPre1945",
  "recognizedAntifascistRevolutionaryActivity",
  "illegalSuspensionOrDismissalAnnulled",
  "professionalOrPoliticalTrainingWhileEmployed",
  "wifeFollowingHusbandPermanentMissionAbroad",
  "compensatoryPaymentsOug98_1999",
  "unemploymentLaw1_1991IntegrationAid",
] as const;

const SPECIAL_SITUATION_LABELS: Record<(typeof SPECIAL_SITUATION_KEYS)[number], string> = {
  removedFromServicePoliticalRacialPre1945:
    "Perioada indepartare din serviciu / persecutii politice sau rasiale",
  recognizedAntifascistRevolutionaryActivity:
    "Activitate revolutionara antifascista recunoscuta ca vechime",
  illegalSuspensionOrDismissalAnnulled:
    "Suspendare sau concediere anulata ca ilegala",
  professionalOrPoliticalTrainingWhileEmployed:
    "Cursuri de pregatire profesionala sau politica in timpul incadrarii",
  wifeFollowingHusbandPermanentMissionAbroad:
    "Sotie salariata care si-a urmat sotul in misiune permanenta in strainatate",
  compensatoryPaymentsOug98_1999:
    "Plati compensatorii conform OUG 98/1999",
  unemploymentLaw1_1991IntegrationAid:
    "Somaj / ajutor integrare profesionala conform Legii 1/1991",
};

const COUNTRY_LABELS: Record<string, string> = {
  AT: "Austria",
  BE: "Belgia",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cipru",
  CZ: "Cehia",
  DK: "Danemarca",
  EE: "Estonia",
  FI: "Finlanda",
  FR: "Franta",
  DE: "Germania",
  GR: "Grecia",
  HU: "Ungaria",
  IE: "Irlanda",
  IT: "Italia",
  LV: "Letonia",
  LT: "Lituania",
  LU: "Luxemburg",
  MT: "Malta",
  NL: "Olanda",
  PL: "Polonia",
  PT: "Portugalia",
  SK: "Slovacia",
  SI: "Slovenia",
  ES: "Spania",
  SE: "Suedia",
  UK: "UK",
};

export async function submitPensionCalculator(payload: PensionCalculatorPayload) {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/justproveit/pension-calculator/calculate`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          tenantKey: TENANT_KEY,
          source: "ro-pension-calculator",
          ...payload,
        }),
      },
    );
  } catch {
    return calculatePensionLocally(payload, "endpoint-ul LS nu a putut fi apelat din browser");
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404) {
      return calculatePensionLocally(payload, "endpoint-ul LS /justproveit/pension-calculator/calculate a raspuns Not Found");
    }

    throw new Error(readApiError(body, response.statusText));
  }

  return body as PensionCalculatorResponse;
}

export async function sendPensionCalculatorEmail(
  resultId: string,
  contact: Pick<PensionCalculatorPayload, "fullName" | "email" | "phone">,
) {
  if (resultId.startsWith("local-")) {
    throw new Error(
      "Calculul a fost facut local deoarece endpoint-ul LS pentru calculator nu este disponibil. Emailul automat va functiona dupa ce LS implementeaza ruta pension-calculator.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/justproveit/pension-calculator/results/${encodeURIComponent(resultId)}/email`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ tenantKey: TENANT_KEY, ...contact }),
    },
  );

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(body, response.statusText));
  }

  return body as PensionCalculatorEmailResponse;
}

function calculatePensionLocally(
  payload: PensionCalculatorPayload,
  fallbackReason: string,
): PensionCalculatorResponse {
  const birthYearMonth = normalizeYearMonth(payload.birthYearMonth, "Data nasterii");
  const applicationDate = normalizeYearMonth(payload.applicationDate ?? getCurrentYearMonth(), "Data aplicarii");

  if (payload.gender !== "M" && payload.gender !== "F") {
    throw new Error("Sexul trebuie sa fie M sau F.");
  }

  if (compareYearMonth(applicationDate, birthYearMonth) < 0) {
    throw new Error("Data aplicarii nu poate fi inainte de data nasterii.");
  }

  const warnings = [
    `Calcul local folosit temporar: ${fallbackReason}, deci rezultatul nu a fost salvat automat.`,
  ];
  const anexaLookup = lookupAnexa5(birthYearMonth, payload.gender, warnings);
  const currentAge = calculateCurrentAge(birthYearMonth, applicationDate);
  const aggregate = aggregateLocalPeriods(payload, warnings);
  const totalContributivMonths = ageYMToMonths(aggregate.stagiu.totalContributiv);
  const minimumStageMonths = ageYMToMonths(anexaLookup.minimumStagiu);
  const fullStageMonths = ageYMToMonths(anexaLookup.fullStagiu);

  if (totalContributivMonths < minimumStageMonths) {
    warnings.push(
      `Stagiul minim nu este indeplinit: ai introdus ${formatAgeYM(
        aggregate.stagiu.totalContributiv,
      )}, iar pragul minim este ${formatAgeYM(anexaLookup.minimumStagiu)}.`,
    );
  }

  if (
    ageYMToMonths(aggregate.stagiu.foreign) > 0 &&
    ageYMToMonths(aggregate.stagiu.roContributiv) < minimumStageMonths &&
    totalContributivMonths >= minimumStageMonths
  ) {
    warnings.push(
      "Totalizarea perioadelor din strainatate pare necesara pentru indeplinirea stagiului minim.",
    );
  }

  if (payload.gender === "M" && (payload.childrenRaised ?? 0) > 0) {
    warnings.push("Reducerea pentru copii se aplica doar femeilor, conform art. 51.");
  }

  const totalReductionMonths = calculateReductionMonths(
    payload,
    aggregate.stagiu,
    fullStageMonths,
  );
  const scenarios = buildLocalScenarios({
    anexa: anexaLookup,
    birthYearMonth,
    currentAge,
    gender: payload.gender,
    handicapMonths: normalizeDurationParts(payload.handicapYears ?? 0, payload.handicapMonths ?? 0, "Handicap"),
    handicapType: payload.handicapType ?? "none",
    totalContributivMonths,
    totalReductionMonths,
  });
  const recommended = recommendScenario(scenarios);
  const foreignPensionSections = buildForeignPensionSections(
    aggregate.foreignPeriods,
    birthYearMonth,
    currentAge,
  );
  const ukStatePension = foreignPensionSections.find((section) => section.countryCode === "UK") ?? null;

  return {
    success: true,
    resultId: `local-${Date.now()}`,
    leadId: "local",
    emailSent: false,
    emailError:
      "Rezultatul a fost calculat local si nu a fost salvat in backend; trimiterea automata pe email necesita endpoint-ul LS.",
    localOnly: true,
    result: {
      calculatorVersion: "frontend-fallback-1",
      lawVersion: "Legea 360/2023",
      anexa: {
        standardAge: anexaLookup.standardAge,
        fullStagiu: anexaLookup.fullStagiu,
        minimumStagiu: anexaLookup.minimumStagiu,
      },
      currentAge,
      stagiu: aggregate.stagiu,
      ukStatePension: ukStatePension
        ? {
            label: ukStatePension.countryName,
            retirementAge: ukStatePension.retirementAge ?? { years: 67, months: 0 },
            retirementDate: ukStatePension.retirementDate ?? addAgeToYearMonth(birthYearMonth, { years: 67, months: 0 }),
            eligibleNow: ukStatePension.eligibleNow ?? false,
            sourceUrl: ukStatePension.sourceUrl ?? undefined,
            note: ukStatePension.note,
          }
        : null,
      foreignPensionSections,
      scenarios,
      recommended,
      warnings,
      disclaimer:
        "Rezultatele sunt informative si nu calculeaza cuantumul pensiei. Verificati intotdeauna documentele si regulile aplicabile cu casa de pensii sau cu un consilier specializat.",
    },
  };
}

function lookupAnexa5(
  birthYearMonth: string,
  gender: "M" | "F",
  warnings: string[],
) {
  const table = gender === "F" ? ANEXA5_WOMEN : ANEXA5_MEN;
  const first = table[0];
  const last = table[table.length - 1];
  const exact = table.find((row) => row.birth === birthYearMonth);
  const row = exact ?? (compareYearMonth(birthYearMonth, first.birth) < 0 ? first : null);

  if (row) {
    if (!exact) {
      warnings.push("Data nasterii este inainte de primul rand disponibil in Anexa 5; am folosit regula pentru cohorta cea mai veche.");
    }

    return {
      standardAge: tupleToAgeYM(row.age),
      fullStagiu: tupleToAgeYM(row.stagiu_complet),
      minimumStagiu: row.stagiu_min ? tupleToAgeYM(row.stagiu_min) : { years: 15, months: 0 },
      standardRetirementDate: row.retire,
    };
  }

  if (compareYearMonth(birthYearMonth, last.birth) > 0) {
    warnings.push("Data nasterii este dupa intervalul tabelar Anexa 5; am folosit regula post-esalonare.");
    return {
      standardAge: { years: 65, months: 0 },
      fullStagiu: { years: 35, months: 0 },
      minimumStagiu: { years: 15, months: 0 },
      standardRetirementDate: addAgeToYearMonth(birthYearMonth, { years: 65, months: 0 }),
    };
  }

  throw new Error("Nu am gasit data nasterii in Anexa 5.");
}

function aggregateLocalPeriods(
  payload: PensionCalculatorPayload,
  warnings: string[],
): LocalAggregateResult {
  const periods = payload.periods ?? {};
  const normalRo = readDurationMonths(periods, "normalRo");
  const deosebite = readDurationMonths(periods, "deosebite");
  const speciale = readDurationMonths(periods, "speciale");
  const grupaI = readDurationMonths(periods, "grupaI");
  const grupaII = readDurationMonths(periods, "grupaII");
  const armyNormal = readDurationMonths(periods, "armyNormal");
  const armyReduced = readDurationMonths(periods, "armyReduced");
  const paidUnemployment = readDurationMonths(periods, "paidUnemployment");
  const maternityLeave = readDurationMonths(periods, "maternityLeave");
  const university = readDurationMonths(periods, "university");
  const additionalBreakdown: NonNullable<PensionCalculatorResult["stagiu"]["additionalBreakdown"]> = {};

  addBreakdown(additionalBreakdown, "armyNormal", armyNormal, "asimilat");
  addBreakdown(additionalBreakdown, "armyReduced", armyReduced, "excluded");
  addBreakdown(additionalBreakdown, "paidUnemployment", paidUnemployment, "contributiv");
  addBreakdown(additionalBreakdown, "maternityLeave", maternityLeave, "contributiv");
  addBreakdown(additionalBreakdown, "university", university, "asimilat");

  if (armyNormal > 0) {
    warnings.push("Armata la termen normal a fost inclusa ca perioada asimilata, nu contributiva.");
  }
  if (armyReduced > 0) {
    warnings.push("Armata la termen redus a fost introdusa, dar nu a fost inclusa in calcul conform regulii configurate.");
  }
  if (maternityLeave > 0) {
    warnings.push("Concediul de maternitate a fost tratat ca perioada contributiva doar daca indemnizatia a fost declarata/contributiva.");
  }
  if (university > 0) {
    warnings.push("Anii de facultate au fost inclusi ca perioada asimilata doar daca nu se suprapun cu ani lucrati si exista diploma.");
  }

  let recognizedMonths = 0;
  SPECIAL_SITUATION_KEYS.forEach((key) => {
    const months = readDurationMonths(periods, key);
    if (months <= 0) {
      return;
    }

    recognizedMonths += months;
    addBreakdown(additionalBreakdown, key, months, "recunoscut", SPECIAL_SITUATION_LABELS[key]);
    warnings.push(
      `${SPECIAL_SITUATION_LABELS[key]} a fost inclusa ca perioada recunoscuta pe baza duratei introduse; verificati documentele justificative.`,
    );
  });

  const foreignPeriods = normalizeForeignPeriods(payload.foreignPeriods ?? []);
  const foreignMonths = foreignPeriods.reduce((total, period) => total + period.months, 0);
  const roContributivMonths =
    normalRo + deosebite + speciale + grupaI + grupaII + paidUnemployment + maternityLeave;
  const asimilatMonths = armyNormal + university;
  const roMonths = roContributivMonths + asimilatMonths + recognizedMonths;
  const totalMonths = roMonths + foreignMonths;
  const totalContributivMonths = roContributivMonths + foreignMonths;
  const breakdown = Object.keys(additionalBreakdown).length > 0 ? additionalBreakdown : undefined;

  return {
    foreignPeriods,
    stagiu: {
      ro: monthsToAgeYM(roMonths),
      roContributiv: monthsToAgeYM(roContributivMonths),
      foreign: monthsToAgeYM(foreignMonths),
      asimilat: monthsToAgeYM(asimilatMonths),
      total: monthsToAgeYM(totalMonths),
      totalContributiv: monthsToAgeYM(totalContributivMonths),
      grupaI_plus_speciale: monthsToAgeYM(grupaI + speciale),
      grupaII_plus_deosebite: monthsToAgeYM(grupaII + deosebite),
      additionalBreakdown: breakdown,
    },
  };
}

function calculateReductionMonths(
  payload: PensionCalculatorPayload,
  stagiu: PensionCalculatorResult["stagiu"],
  fullStageMonths: number,
) {
  const specialMonths = ageYMToMonths(stagiu.grupaI_plus_speciale);
  const deosebiteMonths = ageYMToMonths(stagiu.grupaII_plus_deosebite);
  const specialFullYears = Math.floor(specialMonths / 12);
  const carriedSpecialFractionMonths = specialMonths % 12;
  const table2Months = ageYMToMonths(lookupReduction(TABEL_2, specialFullYears));
  const table1Months = ageYMToMonths(
    lookupReduction(TABEL_1, Math.floor((deosebiteMonths + carriedSpecialFractionMonths) / 12)),
  );
  const childrenRaised = Math.max(0, Math.floor(payload.childrenRaised ?? 0));
  const childReductionMonths =
    payload.gender === "F" && childrenRaised > 0 && ageYMToMonths(stagiu.totalContributiv) >= fullStageMonths
      ? ageYMToMonths(lookupChildReduction(childrenRaised))
      : 0;

  return Math.min(table1Months + table2Months + childReductionMonths, FULL_REDUCTION_CAP_MONTHS);
}

function buildLocalScenarios({
  anexa,
  birthYearMonth,
  currentAge,
  gender,
  handicapMonths,
  handicapType,
  totalContributivMonths,
  totalReductionMonths,
}: {
  anexa: ReturnType<typeof lookupAnexa5>;
  birthYearMonth: string;
  currentAge: AgeYM;
  gender: "M" | "F";
  handicapMonths: number;
  handicapType: string;
  totalContributivMonths: number;
  totalReductionMonths: number;
}): PensionScenario[] {
  const standardAge = anexa.standardAge;
  const standardDate = anexa.standardRetirementDate;
  const fullStageMonths = ageYMToMonths(anexa.fullStagiu);
  const minimumStageMonths = ageYMToMonths(anexa.minimumStagiu);
  const minReducedAgeMonths = MIN_REDUCED_AGE_MONTHS[gender];
  const reducedAge = monthsToAgeYM(
    Math.max(ageYMToMonths(standardAge) - totalReductionMonths, minReducedAgeMonths),
  );
  const earlyAge = subAgeYM(standardAge, { years: 5, months: 0 });
  const scenarios: PensionScenario[] = [
    makeScenario({
      type: "limita_varsta_standard",
      label: "Pensie limita de varsta - varsta standard",
      retirementAge: standardAge,
      retirementDate: standardDate,
      currentAge,
      stageOk: totalContributivMonths >= minimumStageMonths,
      eligibilityReason: `Stagiu minim indeplinit (${formatAgeYM(anexa.minimumStagiu)}).`,
      stageFailureReason: `Stagiul minim necesar este ${formatAgeYM(anexa.minimumStagiu)}.`,
      legalReferences: ["Legea 360/2023 art. 46-47", "Anexa nr. 5"],
    }),
    makeScenario({
      type: "limita_varsta_redusa",
      label: "Pensie limita de varsta cu reducere",
      retirementAge: reducedAge,
      currentAge,
      stageOk: totalReductionMonths > 0 && totalContributivMonths >= fullStageMonths,
      eligibilityReason: `Stagiu complet indeplinit si reducere estimata ${formatAgeYM(monthsToAgeYM(totalReductionMonths))}.`,
      stageFailureReason: `Pentru reducere este necesar stagiul complet de ${formatAgeYM(anexa.fullStagiu)}.`,
      legalReferences: ["Legea 360/2023 art. 48", "Legea 360/2023 art. 51", "Legea 360/2023 art. 54"],
      notApplicableReason:
        totalReductionMonths > 0
          ? undefined
          : "Nu ai introdus conditii deosebite/speciale, Grupa I/II sau copii care sa genereze reducere.",
    }),
    buildHandicapScenario({
      anexa,
      birthYearMonth,
      currentAge,
      handicapMonths,
      handicapType,
      totalContributivMonths,
    }),
    buildVisualImpairmentScenario({
      anexa,
      birthYearMonth,
      currentAge,
      handicapMonths,
      handicapType,
    }),
    makeScenario({
      type: "limita_varsta_stagiu_depasit",
      label: "Pensie limita de varsta - stagiu depasit cu 5 ani",
      retirementAge: earlyAge,
      currentAge,
      stageOk: totalContributivMonths >= fullStageMonths + 5 * 12,
      eligibilityReason: `Stagiu complet depasit cu cel putin 5 ani.`,
      stageFailureReason: `Este necesar stagiul complet (${formatAgeYM(anexa.fullStagiu)}) plus inca 5 ani.`,
      legalReferences: ["Legea 360/2023 art. 56-57"],
    }),
    makeScenario({
      type: "anticipata",
      label: "Pensie anticipata",
      retirementAge: earlyAge,
      currentAge,
      stageOk: totalContributivMonths >= fullStageMonths,
      eligibilityReason: `Stagiu complet indeplinit (${formatAgeYM(anexa.fullStagiu)}).`,
      stageFailureReason: `Pentru pensie anticipata este necesar stagiul complet de ${formatAgeYM(anexa.fullStagiu)}.`,
      legalReferences: ["Legea 360/2023 art. 58-60"],
    }),
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    retirementDate:
      scenario.type === "limita_varsta_standard"
        ? standardDate
        : addAgeToYearMonth(birthYearMonth, scenario.retirementAge),
  }));
}

function buildHandicapScenario({
  anexa,
  currentAge,
  handicapMonths,
  handicapType,
  totalContributivMonths,
}: {
  anexa: ReturnType<typeof lookupAnexa5>;
  birthYearMonth: string;
  currentAge: AgeYM;
  handicapMonths: number;
  handicapType: string;
  totalContributivMonths: number;
}) {
  const fullStageMonths = ageYMToMonths(anexa.fullStagiu);
  const handicapRules: Record<string, { threshold: number; reduction: AgeYM; label: string }> = {
    grav: { threshold: Math.ceil(fullStageMonths / 3), reduction: { years: 15, months: 0 }, label: "handicap grav" },
    accentuat: {
      threshold: Math.ceil((fullStageMonths * 2) / 3),
      reduction: { years: 10, months: 0 },
      label: "handicap accentuat",
    },
    mediu: { threshold: fullStageMonths, reduction: { years: 10, months: 0 }, label: "handicap mediu" },
  };
  const rule = handicapRules[handicapType];

  if (!rule) {
    return makeScenario({
      type: "limita_varsta_handicap",
      label: "Pensie limita de varsta cu reducere pentru handicap",
      retirementAge: anexa.standardAge,
      currentAge,
      stageOk: false,
      eligibilityReason: "",
      stageFailureReason: "",
      legalReferences: ["Legea 360/2023 art. 52"],
      notApplicableReason: "Nu ai selectat un tip de handicap aplicabil pentru art. 52.",
    });
  }

  return makeScenario({
    type: "limita_varsta_handicap",
    label: `Pensie limita de varsta cu reducere pentru ${rule.label}`,
    retirementAge: subAgeYM(anexa.standardAge, rule.reduction),
    currentAge,
    stageOk: handicapMonths >= rule.threshold && totalContributivMonths >= rule.threshold,
    eligibilityReason: `Stagiul in conditii de handicap indeplineste pragul estimat.`,
    stageFailureReason: `Pentru ${rule.label} este necesar un stagiu in conditii de handicap de aproximativ ${formatAgeYM(
      monthsToAgeYM(rule.threshold),
    )}.`,
    legalReferences: ["Legea 360/2023 art. 52"],
  });
}

function buildVisualImpairmentScenario({
  anexa,
  currentAge,
  handicapMonths,
  handicapType,
}: {
  anexa: ReturnType<typeof lookupAnexa5>;
  birthYearMonth: string;
  currentAge: AgeYM;
  handicapMonths: number;
  handicapType: string;
}) {
  const threshold = Math.ceil(ageYMToMonths(anexa.fullStagiu) / 3);

  if (handicapType !== "deficienta_vizuala_grava") {
    return makeScenario({
      type: "limita_varsta_deficienta_vizuala",
      label: "Pensie limita de varsta - deficienta vizuala grava",
      retirementAge: anexa.standardAge,
      currentAge,
      stageOk: false,
      eligibilityReason: "",
      stageFailureReason: "",
      legalReferences: ["Legea 360/2023 art. 53"],
      notApplicableReason: "Nu ai selectat deficienta vizuala grava.",
    });
  }

  return makeScenario({
    type: "limita_varsta_deficienta_vizuala",
    label: "Pensie limita de varsta - deficienta vizuala grava",
    retirementAge: currentAge,
    currentAge,
    stageOk: handicapMonths >= threshold,
    eligibilityReason: "Pragul minim de stagiu in conditii de deficienta vizuala grava pare indeplinit.",
    stageFailureReason: `Este necesar cel putin o treime din stagiul complet: aproximativ ${formatAgeYM(
      monthsToAgeYM(threshold),
    )}.`,
    legalReferences: ["Legea 360/2023 art. 53"],
  });
}

function makeScenario({
  type,
  label,
  retirementAge,
  retirementDate,
  currentAge,
  stageOk,
  eligibilityReason,
  stageFailureReason,
  legalReferences,
  notApplicableReason,
}: {
  type: string;
  label: string;
  retirementAge: AgeYM;
  retirementDate?: string;
  currentAge: AgeYM;
  stageOk: boolean;
  eligibilityReason: string;
  stageFailureReason: string;
  legalReferences: string[];
  notApplicableReason?: string;
}): PensionScenario {
  const notApplicable = Boolean(notApplicableReason);
  const eligibleNow = !notApplicable && stageOk && compareAgeYM(currentAge, retirementAge) >= 0;
  const date = retirementDate ?? "";
  const ineligibilityReasons: string[] = [];

  if (!notApplicable && !stageOk && stageFailureReason) {
    ineligibilityReasons.push(stageFailureReason);
  }
  if (!notApplicable && stageOk && !eligibleNow) {
    ineligibilityReasons.push("Varsta necesara se implineste la data indicata.");
  }

  return {
    type,
    label,
    retirementAge,
    retirementDate: date,
    eligible: !notApplicable && stageOk,
    eligibleNow,
    futureEligible: !notApplicable && stageOk && !eligibleNow,
    notApplicable,
    notApplicableReason: notApplicableReason ?? null,
    eligibilityReasons: !notApplicable && stageOk && eligibilityReason ? [eligibilityReason] : [],
    ineligibilityReasons,
    legalReferences,
  };
}

function recommendScenario(scenarios: PensionScenario[]) {
  const candidates = scenarios.filter((scenario) => !scenario.notApplicable && (scenario.eligible || scenario.futureEligible));

  return candidates.sort((a, b) => ageYMToMonths(a.retirementAge) - ageYMToMonths(b.retirementAge))[0] ?? null;
}

function buildForeignPensionSections(
  foreignPeriods: Array<{ country: string; months: number }>,
  birthYearMonth: string,
  currentAge: AgeYM,
) {
  const totals = new Map<string, number>();
  foreignPeriods.forEach((period) => {
    const country = period.country.toUpperCase();
    totals.set(country, (totals.get(country) ?? 0) + period.months);
  });

  return Array.from(totals.entries()).map(([countryCode, months]) => {
    const countryName = COUNTRY_LABELS[countryCode] ?? countryCode;
    const isUk = countryCode === "UK" || countryCode === "GB";
    const retirementAge = isUk ? { years: 67, months: 0 } : null;
    const retirementDate = retirementAge ? addAgeToYearMonth(birthYearMonth, retirementAge) : null;

    return {
      countryCode,
      countryName,
      workedPeriod: monthsToAgeYM(months),
      retirementAge,
      retirementDate,
      eligibleNow: retirementAge ? compareAgeYM(currentAge, retirementAge) >= 0 : null,
      sourceUrl: isUk ? "https://www.gov.uk/state-pension-age" : null,
      note: isUk
        ? "Estimare informativa pentru UK State Pension. Verificarea oficiala se face pe gov.uk."
        : "Calculatorul local afiseaza stagiul declarat; varsta de pensie pentru aceasta tara trebuie verificata la autoritatea locala.",
    };
  });
}

function normalizeForeignPeriods(
  periods: NonNullable<PensionCalculatorPayload["foreignPeriods"]>,
) {
  return periods
    .map((period, index) => ({
      country: String(period.country || "").trim().toUpperCase(),
      months: normalizeDurationParts(
        period.years ?? 0,
        period.monthsTotal !== undefined ? period.monthsTotal : period.months ?? 0,
        `Perioada straina ${index + 1}`,
        period.monthsTotal !== undefined,
      ),
    }))
    .filter((period) => period.country && period.months > 0);
}

function addBreakdown(
  breakdown: NonNullable<PensionCalculatorResult["stagiu"]["additionalBreakdown"]>,
  key: string,
  months: number,
  classification: string,
  label?: string,
) {
  if (months <= 0) {
    return;
  }

  breakdown[key] = {
    ...monthsToAgeYM(months),
    classification,
    label,
  };
}

function readDurationMonths(periods: Record<string, number>, prefix: string) {
  return normalizeDurationParts(periods[`${prefix}Years`] ?? 0, periods[`${prefix}Months`] ?? 0, prefix);
}

function normalizeDurationParts(
  yearsValue: number,
  monthsValue: number,
  label: string,
  monthsAreTotal = false,
) {
  const years = readNonNegativeInteger(yearsValue, `${label} ani`);
  const months = readNonNegativeInteger(monthsValue, `${label} luni`);

  return monthsAreTotal ? months : years * 12 + months;
}

function readNonNegativeInteger(value: number, label: string) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) {
    throw new Error(`${label} trebuie sa fie un numar valid.`);
  }
  if (number < 0) {
    throw new Error(`${label} nu poate fi negativ.`);
  }

  return Math.floor(number);
}

function lookupReduction(
  table: Array<{ stagiuAniIntegri: number; reducere: AgeYM }>,
  fullYears: number,
) {
  return [...table]
    .reverse()
    .find((row) => fullYears >= row.stagiuAniIntegri)?.reducere ?? ZERO_AGE;
}

function lookupChildReduction(childrenRaised: number) {
  return [...TABEL_3]
    .reverse()
    .find((row) => childrenRaised >= row.copii)?.reducere ?? ZERO_AGE;
}

function normalizeYearMonth(value: string, label: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new Error(`${label} trebuie sa fie in format YYYY-MM.`);
  }

  return value;
}

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function compareYearMonth(left: string, right: string) {
  return yearMonthToIndex(left) - yearMonthToIndex(right);
}

function yearMonthToIndex(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + (month - 1);
}

function calculateCurrentAge(birthYearMonth: string, applicationDate: string) {
  return monthsToAgeYM(Math.max(0, yearMonthToIndex(applicationDate) - yearMonthToIndex(birthYearMonth)));
}

function addAgeToYearMonth(birthYearMonth: string, age: AgeYM) {
  const total = yearMonthToIndex(birthYearMonth) + ageYMToMonths(age);
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function tupleToAgeYM(tuple: [number, number]) {
  return { years: tuple[0], months: tuple[1] };
}

function ageYMToMonths(age: AgeYM) {
  return age.years * 12 + age.months;
}

function monthsToAgeYM(months: number) {
  const normalized = Math.max(0, Math.floor(months));
  return { years: Math.floor(normalized / 12), months: normalized % 12 };
}

function subAgeYM(age: AgeYM, reduction: AgeYM) {
  return monthsToAgeYM(Math.max(0, ageYMToMonths(age) - ageYMToMonths(reduction)));
}

function compareAgeYM(left: AgeYM, right: AgeYM) {
  return ageYMToMonths(left) - ageYMToMonths(right);
}

function formatAgeYM(age: AgeYM) {
  if (age.months === 0) {
    return `${age.years} ani`;
  }

  return `${age.years} ani si ${age.months} luni`;
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const error = "error" in payload ? payload.error : null;
    if (typeof error === "string") {
      return error;
    }
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
  }

  return fallback || "Cererea nu a putut fi procesata.";
}
