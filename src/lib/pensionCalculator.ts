import { API_BASE_URL, TENANT_KEY } from "@/lib/auth";

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
  result: PensionCalculatorResult;
};

export type PensionCalculatorEmailResponse = {
  success: boolean;
  resultId: string;
  emailSent: boolean;
  emailError?: string | null;
};

export type PensionPurchaseEmailPayload = {
  fullName?: string;
  email: string;
  phone?: string;
  pageUrl?: string;
  referrer?: string;
};

export type PensionPurchaseEmailResponse = {
  success: boolean;
  emailSent: boolean;
  provider?: string;
  messageId?: string | null;
  emailError?: string | null;
};

export type PensionPurchaseSmsPayload = {
  fullName?: string;
  phone: string;
  email?: string;
  pageUrl?: string;
  referrer?: string;
};

export type PensionPurchaseSmsResponse = {
  success: boolean;
  smsSent: boolean;
  provider?: string;
  messageId?: string | null;
  smsError?: string | null;
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

export async function submitPensionCalculator(payload: PensionCalculatorPayload) {
  const response = await fetch(
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

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(body, response.statusText));
  }

  return body as PensionCalculatorResponse;
}

export async function sendPensionCalculatorEmail(
  resultId: string,
  contact: Pick<PensionCalculatorPayload, "fullName" | "email" | "phone">,
) {
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

export async function sendPensionPurchaseEmail(payload: PensionPurchaseEmailPayload) {
  const response = await fetch("/api/pension-calculator/purchase-email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      tenantKey: TENANT_KEY,
      source: "ro-pension-calculator-email-cumparare",
      ...payload,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(body, response.statusText));
  }

  return body as PensionPurchaseEmailResponse;
}

export async function sendPensionPurchaseSms(payload: PensionPurchaseSmsPayload) {
  const response = await fetch("/api/pension-calculator/purchase-sms", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      tenantKey: TENANT_KEY,
      source: "ro-pension-calculator-sms-cumparare",
      ...payload,
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readApiError(body, response.statusText));
  }

  return body as PensionPurchaseSmsResponse;
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
