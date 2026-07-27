import { API_BASE_URL, TENANT_KEY } from "@/lib/auth";

export type QuickReportFlag = "verde" | "galben" | "rosu";
export type QuickReportDisplayFlag = QuickReportFlag | "necompletat";
export type YesNo = "" | "yes" | "no";

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
  code: "MF01" | "MF02" | "CD07" | "FC02" | "FC05" | "FC07";
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
const QUICK_REPORT_API_URL =
  process.env.NEXT_PUBLIC_QUICK_REPORT_API_URL || "/api/justproveit/quick-report/faza0";

export function getStandardTaxCode() {
  return process.env.NEXT_PUBLIC_STANDARD_TAX_CODE || DEFAULT_STANDARD_TAX_CODE;
}

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

export async function submitQuickReport(payload: QuickReportSubmitPayload) {
  const response = await fetch(resolveQuickReportApiUrl(), {
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
        "Ai avut mai multe joburi și nu ai recuperat taxele pe ultimii 5 ani. Este posibil să fi plătit taxe în plus; valoarea medie care poate fi recuperată este £1,250–£4,000. Recomandăm verificare directă cu HMRC.",
      rawAnswer,
    };
  }

  if (answers.multipleJobs === "no" && answers.taxRecoveredLast5Years === "no") {
    return {
      code: "MF01",
      title: "Cod fiscal (tax code) greșit",
      flag: "galben",
      output:
        "Există multe spețe pe care se pot recupera taxe, de la marriage allowance până la tax allowance. Se pot pierde sute și mii de lire, iar taxele se pot recupera pe ultimii 5 ani.",
      rawAnswer,
    };
  }

  return {
    code: "MF01",
    title: "Cod fiscal (tax code) greșit",
    flag: "verde",
    output: "Nu am identificat un risc rapid de taxe nerecuperate pe baza răspunsurilor.",
    rawAnswer,
  };
}

function evaluateCreditReport(answers: QuickReportAnswers): QuickReportResult {
  const rawAnswer = {
    electoralRoll: answers.electoralRoll,
    creditReportChecked: answers.creditReportChecked,
  };

  if (!answers.electoralRoll || !answers.creditReportChecked) {
    return incomplete("MF02", "Credit score / raport de credit", rawAnswer);
  }

  if (answers.electoralRoll === "no") {
    return {
      code: "MF02",
      title: "Credit score / raport de credit",
      flag: "rosu",
      output:
        "Nu ești înscris pe electoral roll — asta îți poate limita accesul la credit și scorul de credit. O eroare în raportul de credit vă poate costa între £1,000 și £5,000 în doar câțiva ani, prin dobânzi mai mari și acces limitat la finanțare. În cazurile grave, pierderile pot depăși £10,000.",
      rawAnswer,
    };
  }

  if (answers.creditReportChecked === "no") {
    return {
      code: "MF02",
      title: "Credit score / raport de credit",
      flag: "rosu",
      output:
        "Recomandăm o verificare gratuită a raportului de credit. O eroare în raportul de credit vă poate costa între £1,000 și £5,000 în doar câțiva ani, prin dobânzi mai mari și acces limitat la finanțare. În cazurile grave, pierderile pot depăși £10,000.",
      rawAnswer,
    };
  }

  return {
    code: "MF02",
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
    output: "Metoda de trimitere bani pare deja comparată cu alternative mai ieftine.",
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

  if (fallback === "Not Found") {
    return "Endpoint-ul pentru trimiterea raportului nu este disponibil inca.";
  }

  return fallback || "Raportul nu a putut fi trimis.";
}

function resolveQuickReportApiUrl() {
  if (/^https?:\/\//i.test(QUICK_REPORT_API_URL) || QUICK_REPORT_API_URL.startsWith("/")) {
    return QUICK_REPORT_API_URL;
  }

  return `${API_BASE_URL}/${QUICK_REPORT_API_URL.replace(/^\/+/, "")}`;
}
