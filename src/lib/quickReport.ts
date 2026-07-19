import { API_BASE_URL, TENANT_KEY } from "@/lib/auth";

export type QuickReportFlag = "verde" | "galben" | "rosu";
export type QuickReportDisplayFlag = QuickReportFlag | "necompletat";
export type YesNo = "" | "yes" | "no";

export type QuickReportAnswers = {
  taxCode: string;
  multipleJobs: YesNo;
  electoralRoll: YesNo;
  creditReportChecked: YesNo;
  bankSwitchLast: "" | "within12" | "over12" | "never";
  insuranceRenewal: "" | "compared" | "autoNoCompare" | "notApplicable";
  transferMethod: "" | "bank" | "westernUnion" | "moneyGram" | "wise" | "revolut" | "other";
  transferCompared: YesNo;
  utilitiesUpToDate: YesNo;
  utilitiesCompared: YesNo;
};

export type QuickReportResult = {
  code: "MF01" | "CD01" | "CD07" | "FC02" | "FC05" | "FC07_plata" | "FC07_furnizor";
  title: string;
  flag: QuickReportDisplayFlag;
  output: string;
  rawAnswer: Record<string, string>;
};

export type QuickReportSubmitPayload = {
  fullName: string;
  email: string;
  phone: string;
  consentVerbalAt: string;
  answers: QuickReportAnswers;
  results: Array<QuickReportResult & { flag: QuickReportFlag }>;
  standardTaxCode: string;
  source?: string;
  domain?: string;
  pageUrl?: string;
  referrer?: string;
};

export type QuickReportSubmitResponse = {
  success: boolean;
  leadId?: string;
  reportId?: string;
  emailSent?: boolean;
  emailError?: string | null;
  message?: string;
};

const DEFAULT_STANDARD_TAX_CODE = "1257L";

export function getStandardTaxCode() {
  return process.env.NEXT_PUBLIC_STANDARD_TAX_CODE || DEFAULT_STANDARD_TAX_CODE;
}

export function evaluateQuickReport(
  answers: QuickReportAnswers,
  standardTaxCode = getStandardTaxCode(),
): QuickReportResult[] {
  return [
    evaluateTaxCode(answers, standardTaxCode),
    evaluateCreditReport(answers),
    evaluateBankSwitch(answers),
    evaluateInsurance(answers),
    evaluateTransferFees(answers),
    evaluateUtilityPayment(answers),
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

export async function submitQuickReport(payload: QuickReportSubmitPayload) {
  const response = await fetch(`${API_BASE_URL}/justproveit/quick-report/faza0`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      tenantKey: TENANT_KEY,
      source: "raport_gratuit_faza0",
      ...payload,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(body, response.statusText));
  }

  return body as QuickReportSubmitResponse;
}

function evaluateTaxCode(answers: QuickReportAnswers, standardTaxCode: string): QuickReportResult {
  const taxCode = normalizeTaxCode(answers.taxCode);
  const standard = normalizeTaxCode(standardTaxCode);
  const rawAnswer = {
    taxCode: answers.taxCode,
    multipleJobs: answers.multipleJobs,
    standardTaxCode,
  };

  if (!taxCode || !answers.multipleJobs) {
    return incomplete("MF01", "Cod fiscal (tax code) greșit", rawAnswer);
  }

  const emergency = isEmergencyTaxCode(taxCode);
  const hasKnownMultipleJobs = answers.multipleJobs === "yes";
  const nonStandardWithoutKnownReason = taxCode !== standard && !hasKnownMultipleJobs;

  if (emergency || nonStandardWithoutKnownReason) {
    return {
      code: "MF01",
      title: "Cod fiscal (tax code) greșit",
      flag: "rosu",
      output:
        "Codul tău fiscal pare greșit — poți fi impozitat în plus. Recomandăm verificare directă cu HMRC, posibilă rambursare pe ultimii 5 ani.",
      rawAnswer,
    };
  }

  return {
    code: "MF01",
    title: "Cod fiscal (tax code) greșit",
    flag: "verde",
    output: "Codul tău fiscal pare corect.",
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
        "Nu ești înscris pe electoral roll — asta îți poate limita accesul la credit și scorul de credit. Poți rezolva gratuit, online, în câteva minute.",
      rawAnswer,
    };
  }

  if (answers.creditReportChecked === "no") {
    return {
      code: "CD01",
      title: "Credit score / raport de credit",
      flag: "galben",
      output:
        "Recomandăm o verificare gratuită a raportului de credit — 1 din 3 oameni in UK au cel putin o eroare in raportul de scor de credit care poate duce la costuri mai mari la asigurari, la rate mai mari la imprumuturi bancare si carduri de credit, si chiar la limitarea accesului la carduri de credit / imprumuturi bancare",
      rawAnswer,
    };
  }

  return {
    code: "CD01",
    title: "Credit score / raport de credit",
    flag: "verde",
    output: "Ești înscris pe electoral roll și ai verificat raportul de credit.",
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
        "Poți accesa un bonus de schimbare a unui cont curent (nu cel principal) — de obicei £150-200, uneori mai mult combinând oferte. In general poti face aceasta schimbare de 4-5 ori pe an, astfel incat sa primesti aproximativ £1000. Daca sunteti 2 adulti, primiti £2000 impreuna. O vacanta de o saptamana total gratuita!",
      rawAnswer,
    };
  }

  return {
    code: "CD07",
    title: "Bank switching bonus neaccesat",
    flag: "verde",
    output: "Ai schimbat contul curent în ultimele 12 luni — ai folosit deja această oportunitate recent.",
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
        "Probabil plătești mai mult decât ai putea la reînnoirea automată — o comparație rapidă înainte de următoarea reînnoire poate economisi bani.",
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
        "Probabil plătești comisioane mari la transferul de bani — variante mai ieftine pot economisi bani la fiecare transfer.",
      rawAnswer,
    };
  }

  return {
    code: "FC05",
    title: "Comisioane mari remitere bani spre România",
    flag: "verde",
    output: "Metoda de trimitere bani pare deja comparată cu alternative mai ieftine.",
    rawAnswer,
  };
}

function evaluateUtilityPayment(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = { utilitiesUpToDate: answers.utilitiesUpToDate };

  if (!answers.utilitiesUpToDate) {
    return incomplete("FC07_plata", "Facturi de utilități — plată la zi", rawAnswer);
  }

  if (answers.utilitiesUpToDate === "no") {
    return {
      code: "FC07_plata",
      title: "Facturi de utilități — plată la zi",
      flag: "galben",
      output:
        "Dacă ai dificultăți cu plata facturilor, există suport disponibil înainte să ajungă la penalizări — putem recomanda unde să ceri ajutor.",
      rawAnswer,
    };
  }

  return {
    code: "FC07_plata",
    title: "Facturi de utilități — plată la zi",
    flag: "verde",
    output: "Ești la zi cu plata facturilor de utilități.",
    rawAnswer,
  };
}

function evaluateUtilitySwitch(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = { utilitiesCompared: answers.utilitiesCompared };

  if (!answers.utilitiesCompared) {
    return incomplete("FC07_furnizor", "Facturi de utilități — schimbare furnizor", rawAnswer);
  }

  if (answers.utilitiesCompared === "no") {
    return {
      code: "FC07_furnizor",
      title: "Facturi de utilități — schimbare furnizor",
      flag: "rosu",
      output:
        "Probabil plătești mai mult decât ai putea la utilități — o comparație rapidă de tarife poate economisi bani.",
      rawAnswer,
    };
  }

  return {
    code: "FC07_furnizor",
    title: "Facturi de utilități — schimbare furnizor",
    flag: "verde",
    output: "Ai comparat sau schimbat furnizorul în ultimele 12 luni.",
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

function normalizeTaxCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function isEmergencyTaxCode(taxCode: string) {
  return (
    taxCode === "BR" ||
    taxCode === "0T" ||
    taxCode === "D0" ||
    taxCode === "D1" ||
    taxCode.startsWith("BR") ||
    taxCode.endsWith("W1") ||
    taxCode.endsWith("M1")
  );
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
    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }
  }

  return fallback || "Raportul nu a putut fi trimis.";
}
