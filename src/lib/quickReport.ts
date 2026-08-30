export type QuickReportFlag = "verde" | "galben" | "rosu";
export type QuickReportDisplayFlag = QuickReportFlag | "necompletat";
export type YesNo = "" | "yes" | "no";
export type QuickReportFaza0Code = "MF01" | "CD01" | "CD07" | "FC02" | "FC05" | "FC07";
export type QuickReportEmailScope = "faza0" | "faza1" | "full";
export type UkEmploymentType = "" | "employee" | "selfEmployed" | "both" | "notWorked" | "unknown";
export type CreditScoreLevel = "" | "low" | "medium" | "high";

export type QuickReportAnswers = {
  multipleJobs: YesNo;
  taxRecoveredLast5Years: YesNo;
  electoralRoll: YesNo;
  creditReportChecked: YesNo;
  bankSwitchLast: "" | "within12" | "over12" | "never";
  insuranceRenewal: "" | "compared" | "autoNoCompare" | "notApplicable";
  transferMethod: "" | "bank" | "westernUnion" | "moneyGram" | "wise" | "revolut" | "other";
  transferCompared: YesNo;
  utilitiesCompared: YesNo;
};

export type QuickReportResult = {
  code: QuickReportFaza0Code;
  title: string;
  flag: QuickReportDisplayFlag;
  output: string;
  rawAnswer: Record<string, string>;
};

export type QuickReportFaza1Answers = {
  marriedOrCivilPartner?: boolean;
  lowerPartnerAnnualIncome?: number;
  higherPartnerBasicRateTaxpayer?: boolean;
  worksOvertimeOrVariableHours?: boolean;
  holidayPayChecked?: boolean;
  redundancyInLast3Years?: boolean;
  ageAtDismissal?: number;
  yearsService?: number;
  weeklyPay?: number;
  redundancyAmountReceived?: number;
  selfAssessmentIncome?: boolean;
  declaredUsualExpenses?: boolean;
  hasStudentLoan?: boolean;
  studentLoanPlan?: string;
  annualIncome?: number;
  repaymentsTaken?: boolean;
  hasRomanianIncomeWhileUkResident?: boolean;
  checkedStatePensionForecast?: boolean;
  knownContributionGaps?: boolean;
  ukEmployersCount?: number;
  checkedAllWorkplacePensions?: boolean;
  workedInRomania?: boolean;
  hadCarFinance2007To2024?: boolean;
  hadGapInsuranceOrAddOns?: boolean;
  hadPaydayLoans?: boolean;
  paysMonthlyCurrentAccountFee?: boolean;
  usesIncludedBenefits?: boolean;
  usesOverdraftRegularly?: boolean;
  overdraftApr?: number;
  checkedCouncilTaxBand?: boolean;
  hasActiveSubscriptionsList?: boolean;
  receivesLowIncomeBenefit?: boolean;
  hasSocialTariff?: boolean;
  hasMortgage?: boolean;
  fixedRateEndsInMonths?: number;
  fixedRateExpiryDate?: string;
  hasOldBankAccounts?: boolean;
  hasRomanianInheritanceOrProperty?: boolean;
};

export type QuickReportInternalAnswers = {
  ukEmploymentType: UkEmploymentType;
  knowsAllPrivatePensions: YesNo;
  hadCarFinanceBeforeNov2024: YesNo;
  hasCreditCardOverdraftOrPaydayLoansDebt: YesNo;
  checkedCouncilTaxBand: YesNo;
  creditScoreLevel: CreditScoreLevel;
  agentObservations: string;
};

export type QuickReportInternalAnswersPayload = Omit<QuickReportInternalAnswers, "agentObservations"> & {
  agentObservations?: string;
};

export type SubmitQuickReportPayload = {
  tenantKey: "justproveit";
  source: "raport_gratuit_faza0";
  fullName: string;
  email: string;
  phone: string;
  consentVerbalAt: string;
  standardTaxCode: string;
  domain: string;
  pageUrl: string;
  referrer: string;
  emailScope?: QuickReportEmailScope;
  answers: {
    existingFaza0Answers: QuickReportAnswers;
  };
  results: Array<QuickReportResult & { flag: QuickReportFlag }>;
  faza1Answers?: QuickReportFaza1Answers;
};

export type SaveQuickReportInternalAnswersPayload = {
  tenantKey: "justproveit";
  source: "raport_gratuit_crm_internal";
  reportId?: string;
  leadId?: string;
  fullName: string;
  email: string;
  phone: string;
  domain: string;
  pageUrl: string;
  referrer: string;
  answers: QuickReportInternalAnswersPayload;
  faza0Answers: QuickReportAnswers;
  faza0Results: Array<QuickReportResult & { flag: QuickReportFlag }>;
};

export type SubmitQuickReportResponse = {
  success: boolean;
  leadId?: string;
  reportId?: string;
  emailSent?: boolean;
  emailError?: string;
  message?: string;
};

export type SaveQuickReportInternalAnswersResponse = {
  success: boolean;
  leadId?: string | null;
  reportId?: string | null;
  message?: string;
  error?: string;
};

export type PublicQuickReportResult = {
  code: string;
  title: string;
  flag: QuickReportFlag;
  output: string;
};

export type PublicQuickReportResultsResponse = {
  success: boolean;
  tenantKey?: string;
  reportId?: string | null;
  leadId?: string | null;
  emailScope?: QuickReportEmailScope;
  fullName?: string;
  firstName?: string;
  results?: PublicQuickReportResult[];
  error?: string;
};

const QUICK_REPORT_API_BASE_URL =
  process.env.NEXT_PUBLIC_JPI_QUICK_REPORT_API_BASE_URL ??
  process.env.VITE_JPI_QUICK_REPORT_API_BASE_URL ??
  process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL ??
  process.env.VITE_JPI_CRM_READ_API_BASE_URL ??
  "https://launchingstack-func-dev.azurewebsites.net/api";

export function evaluateQuickReport(answers: QuickReportAnswers): QuickReportResult[] {
  return [
    evaluateTaxReclaim(answers),
    evaluateCreditReport(answers),
    evaluateBankSwitch(answers),
    evaluateInsurance(answers),
    evaluateTransferFees(answers),
    evaluateUtilitySwitch(answers),
  ];
}

export function getQuickReportCompletion(results: QuickReportResult[]) {
  const completed = results.filter((result) => result.flag !== "necompletat").length;
  return {
    completed,
    total: results.length,
    complete: completed === results.length,
  };
}

export function getQuickReportFlagCounts(results: QuickReportResult[]) {
  return results.reduce(
    (counts, result) => ({
      ...counts,
      [result.flag]: counts[result.flag] + 1,
    }),
    { verde: 0, galben: 0, rosu: 0, necompletat: 0 },
  );
}

function evaluateTaxReclaim(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = {
    multipleJobs: answers.multipleJobs,
    taxRecoveredLast5Years: answers.taxRecoveredLast5Years,
  };

  if (!answers.multipleJobs || !answers.taxRecoveredLast5Years) {
    return incomplete("MF01", "Cod fiscal (tax code) greșit", rawAnswer);
  }

  if (answers.multipleJobs === "yes" && answers.taxRecoveredLast5Years === "no") {
    return {
      code: "MF01",
      title: "Cod fiscal (tax code) greșit",
      flag: "rosu",
      output:
        "Ati avut mai multe joburi și nu ati recuperat taxele pe ultimii 5 ani. Este posibil să fi plătit taxe în plus; valoarea uzuala care poate fi recuperată este intre £1,250–£4,000. O sa primiti in raportul de pe email link catre gov.uk pentru a va recupera",
      rawAnswer,
    };
  }

  if (answers.multipleJobs === "no" && answers.taxRecoveredLast5Years === "no") {
    return {
      code: "MF01",
      title: "Cod fiscal (tax code) greșit",
      flag: "galben",
      output:
        "Există multe spețe pe care se pot recupera taxe, de la marriage allowance până la tax allowance. Se pot pierde sute și mii de lire, iar taxele se pot recupera pe ultimii 5 ani. O sa primiti mai multe detalii in emailul cu raportul de dupa aceasta convorbire",
      rawAnswer,
    };
  }

  return {
    code: "MF01",
    title: "Cod fiscal (tax code) greșit",
    flag: "verde",
    output: "Felicitari! Nu multi romani si-au recuperat taxele",
    rawAnswer,
  };
}

function evaluateCreditReport(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = {
    electoralRoll: answers.electoralRoll,
    creditReportChecked: answers.creditReportChecked,
  };

  if (!answers.electoralRoll || !answers.creditReportChecked) {
    return incomplete("CD01", "Credit score / raport de credit", rawAnswer);
  }

  if (answers.electoralRoll === "no") {
    return {
      code: "CD01",
      title: "Credit score / raport de credit",
      flag: "rosu",
      output:
        "Nu sunteti inscrisi pe electoral roll — asta va poate limita accesul la credit și scorul de credit. O eroare în raportul de credit vă poate costa între £1,000 și £5,000 în doar câțiva ani, prin dobânzi mai mari și acces limitat la finanțare. În cazurile grave, pierderile pot depăși £10,000.",
      rawAnswer,
    };
  }

  if (answers.creditReportChecked === "no") {
    return {
      code: "CD01",
      title: "Credit score / raport de credit",
      flag: "rosu",
      output:
        "Recomandăm o verificare gratuită a raportului de credit. O eroare în raportul de credit vă poate costa între £1,000 și £5,000 în doar câțiva ani, prin dobânzi mai mari și acces limitat la finanțare. În cazurile grave, pierderile pot depăși £10,000.",
      rawAnswer,
    };
  }

  return {
    code: "CD01",
    title: "Credit score / raport de credit",
    flag: "verde",
    output:
      "Felicitari ca sunteti inscrisi in rolul electoral si ca ati verificat raportul de credit! Nu multi romani au facut asta!",
    rawAnswer,
  };
}

function evaluateBankSwitch(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = { bankSwitchLast: answers.bankSwitchLast };

  if (!answers.bankSwitchLast) {
    return incomplete("CD07", "Bank switching bonus neaccesat", rawAnswer);
  }

  if (answers.bankSwitchLast === "never" || answers.bankSwitchLast === "over12") {
    return {
      code: "CD07",
      title: "Bank switching bonus neaccesat",
      flag: "rosu",
      output:
        "Puteti accesa un bonus de schimbare a unui cont curent (nu cel principal) — de obicei £150-200, uneori mai mult combinând oferte. In general puteti face aceasta schimbare de 4-5 ori pe an, astfel incat sa primiti aproximativ £1000. Daca sunteti 2 adulti, primiti £2000 impreuna. O vacanta de o saptamana total gratuita!",
      rawAnswer,
    };
  }

  return {
    code: "CD07",
    title: "Bank switching bonus neaccesat",
    flag: "verde",
    output:
      "Ati schimbat contul curent în ultimele 12 luni — daca nu ati primit un bonus de £150...£200 la schimbare, puteti sa va interesati de alte banci care ofera un astfel de bonus",
    rawAnswer,
  };
}

function evaluateInsurance(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = { insuranceRenewal: answers.insuranceRenewal };

  if (!answers.insuranceRenewal) {
    return incomplete("FC02", "Asigurări auto/casă — loyalty penalty", rawAnswer);
  }

  if (answers.insuranceRenewal === "autoNoCompare") {
    return {
      code: "FC02",
      title: "Asigurări auto/casă — loyalty penalty",
      flag: "rosu",
      output:
        "Gospodăria medie din UK pierde aproximativ £700 pe an rămânând fidelă acelorași furnizori. În 5 ani, asta înseamnă aproximativ £3,500 în costuri inutile.",
      rawAnswer,
    };
  }

  return {
    code: "FC02",
    title: "Asigurări auto/casă — loyalty penalty",
    flag: "verde",
    output: "Nu am identificat un risc rapid de loyalty penalty la asigurare.",
    rawAnswer,
  };
}

function evaluateTransferFees(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = {
    transferMethod: answers.transferMethod,
    transferCompared: answers.transferCompared,
  };
  const highFeeMethod = ["bank", "westernUnion", "moneyGram"].includes(answers.transferMethod);

  if (!answers.transferMethod || (highFeeMethod && !answers.transferCompared)) {
    return incomplete("FC05", "Comisioane mari remitere bani spre România", rawAnswer);
  }

  if (highFeeMethod && answers.transferCompared === "no") {
    return {
      code: "FC05",
      title: "Comisioane mari remitere bani spre România",
      flag: "rosu",
      output:
        "Un român care trimite bani familiei în România poate pierde între £1,000 și £3,000 în doar 5 ani doar din comisioane și cursuri de schimb nefavorabile. Cei care folosesc metode mai scumpe pot pierde și peste £5,000.",
      rawAnswer,
    };
  }

  return {
    code: "FC05",
    title: "Comisioane mari remitere bani spre România",
    flag: "verde",
    output: "Metoda pe care o folositi pentru trimitere bani pare deja comparată cu alternative mai ieftine.",
    rawAnswer,
  };
}

function evaluateUtilitySwitch(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = { utilitiesCompared: answers.utilitiesCompared };

  if (!answers.utilitiesCompared) {
    return incomplete("FC07", "Facturi de utilități — schimbare furnizor", rawAnswer);
  }

  if (answers.utilitiesCompared === "no") {
    return {
      code: "FC07",
      title: "Facturi de utilități — schimbare furnizor",
      flag: "rosu",
      output:
        "O gospodărie din Marea Britanie pierde în medie între £2,500 și £3,500 în 5 ani doar pentru că nu își schimbă sau renegociază furnizorii de utilități și telecomunicații.",
      rawAnswer,
    };
  }

  return {
    code: "FC07",
    title: "Facturi de utilități — schimbare furnizor",
    flag: "verde",
    output: "Ati comparat sau schimbat furnizorul în ultimele 12 luni.",
    rawAnswer,
  };
}

function incomplete(
  code: QuickReportResult["code"],
  title: string,
  rawAnswer: Record<string, string>,
): QuickReportResult {
  return {
    code,
    title,
    flag: "necompletat",
    output: "Completează răspunsurile pentru această verificare.",
    rawAnswer,
  };
}

export async function submitQuickReportFaza0(token: string, payload: SubmitQuickReportPayload) {
  const response = await fetch(resolveQuickReportUrl("/justproveit/quick-report/faza0"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readQuickReportApiError(responsePayload, response.statusText));
  }

  return responsePayload as SubmitQuickReportResponse;
}

export async function saveQuickReportInternalAnswers(
  token: string,
  payload: SaveQuickReportInternalAnswersPayload,
) {
  const response = await fetch(resolveQuickReportUrl("/justproveit/quick-report/internal-answers"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readQuickReportApiError(responsePayload, response.statusText));
  }

  return responsePayload as SaveQuickReportInternalAnswersResponse;
}

export async function fetchQuickReportPublicResults(token: string) {
  const response = await fetch(
    resolveQuickReportUrl(`/justproveit/quick-report/public-results?token=${encodeURIComponent(token)}`),
  );
  const responsePayload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readQuickReportApiError(responsePayload, "Nu am putut incarca rezultatele raportului."));
  }

  const payload = responsePayload as PublicQuickReportResultsResponse;

  if (!payload.success || !Array.isArray(payload.results)) {
    throw new Error(payload.error || "Linkul raportului este invalid sau expirat.");
  }

  return payload;
}

function resolveQuickReportUrl(path: string) {
  return `${QUICK_REPORT_API_BASE_URL.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function readQuickReportApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    if ("error" in payload && typeof payload.error === "string") {
      return payload.error;
    }

    if (
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message;
    }

    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  return fallback || "Raportul nu a putut fi trimis.";
}
