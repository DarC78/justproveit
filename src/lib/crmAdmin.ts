import { API_BASE_URL, fetchJson } from "@/lib/auth";

const BASE_PATH = "/justproveit/admin/crm";
const CANONICAL_READ_API_BASE_URL =
  process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL ??
  process.env.VITE_JPI_CRM_READ_API_BASE_URL ??
  "https://launchingstack-func-dev.azurewebsites.net/api";

function resolveUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export type CrmLead = {
  id?: string | null;
  wixId?: string | null;
  _id?: string | null;
  leadDate?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  normalizedPhone?: string | null;
  leadid?: string | null;
  email?: string | null;
  secondaryemail?: string | null;
  isCustomer?: string | null;
  statusOriginal?: string | null;
  observation?: string | null;
  dataUrmatorContact?: string | null;
  financeCompany?: string | null;
  year?: string | null;
  nrInmatriculare?: string | null;
  language?: string | null;
  initialAgent?: string | null;
  lastAgent?: string | null;
  emailLeads?: string | null;
  emailAsap?: string | null;
  addToDialler?: number | null;
};

export type CrmActivity = {
  timestamp?: string | null;
  state?: string | null;
  param1?: string | null;
  param2?: string | null;
  param3?: string | null;
  param4?: string | null;
  param5?: string | null;
};

export type CrmMissedCall = {
  phone?: string | null;
  phoneNumber?: string | null;
  phonenumber?: string | null;
  lastMissed?: string | null;
  lastmissed?: string | null;
  lastConnected?: string | null;
  lastconnected?: string | null;
  lastConnectedCampaign?: string | null;
  lastconnectedcampaign?: string | null;
};

export type CrmSale = {
  id?: string | null;
  wixId?: string | null;
  _id?: string | null;
  wixCreatedDateUtc?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  amountTotal?: number | null;
  amountTotalMajor?: number | null;
  storeowner?: string | null;
  dialerowner?: string | null;
  dialerlast?: string | null;
};

export type CrmLeadIntentServiceOption = {
  serviceKey: string;
  displayName?: string | null;
};

export type CrmLeadIntentRow = {
  interestId?: string | null;
  leadId?: string | null;
  serviceId?: string | null;
  serviceKey?: string | null;
  serviceDisplayName?: string | null;
  interestType?: string | null;
  source?: string | null;
  campaignName?: string | null;
  adGroupName?: string | null;
  adName?: string | null;
  language?: string | null;
  contactTimeUtc?: string | null;
  intentStatus?: string | null;
  addToDialler?: number | null;
  notes?: string | null;
  lastCallAgentId?: number | null;
  lastCallAgentName?: string | null;
  lastCallTraceId?: number | null;
  lastCallTimeUtc?: string | null;
  lastCallCode?: number | null;
  lastCallCodeDetails?: string | null;
  createdAtUtc?: string | null;
  closedAtUtc?: string | null;
  updatedAtUtc?: string | null;
  lead?: CrmLead | null;
};

export type CrmPredictiveCampaignSummary = {
  queueId?: number | null;
  campaignName?: string | null;
  totalLeads?: number;
  finishedLeads?: number;
  toBeDialled?: number;
  toBeDialledLastCallCode5?: number;
  toBeDialledZeroTrials?: number;
  toBeDialledOneToThreeTrials?: number;
  toBeDialledFourToFiveTrials?: number;
  toBeDialledFivePlusTrials?: number;
  calledToday?: number;
  connectedToday?: number;
  calledYesterday?: number;
  connectedYesterday?: number;
  topCallCodes?: Array<{
    callCode?: number | null;
    label?: string | null;
    count?: number;
    yesterdayCount?: number;
  }>;
};

export type CrmLeadListResponse = {
  leads: CrmLead[];
  total: number;
  limit: number;
  offset: number;
};

export type CrmSalesResponse = {
  sales: CrmSale[];
  total: number;
  limit: number;
  offset: number;
};

export type CrmLeadIntentResponse = {
  rows?: CrmLeadIntentRow[];
  items?: CrmLeadIntentRow[];
  total: number;
  leadSummary?: {
    totalLeads?: number;
    asap?: number;
    calendly?: number;
    carFinance?: number;
    internationalPensions?: number;
  };
  limit: number;
  offset: number;
  filters?: Record<string, string | number | null>;
  options?: {
    intents?: string[];
    services?: CrmLeadIntentServiceOption[];
    languages?: string[];
    agents?: Array<{ agentId: number; agentName?: string | null }>;
  };
  predictiveCampaignSummary?: CrmPredictiveCampaignSummary[];
};

export type CrmLeadUpdatePayload = {
  observation?: string;
  newObservation?: string;
  financeCompany?: string;
  statusOriginal?: string;
  language?: string;
  year?: string;
  nrInmatriculare?: string;
  dataUrmatorContact?: string | null;
  email?: string;
  sentEmailDesc?: string;
  agent?: string;
};

export type CrmEmailSequencePayload = {
  sequence: string;
  cmcDomain?: string;
  cmcName?: string;
  agent?: string;
};

export type ManualCrmLeadPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  language: string;
  agent?: string;
};

export type ManualCrmEmailPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  emailtemplate: string;
  campaign?: string;
  leadid?: string;
  param1?: string;
  param2?: string;
  param3?: string;
  param4?: string;
  param5?: string;
  agent?: string;
};

export type ManualCrmSmsPayload = {
  phone: string;
  message: string;
  agent?: string;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    query.set(key, String(value));
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}

async function fetchCanonicalCrmReadJson<T>(path: string, options: RequestInit = {}) {
  if (CANONICAL_READ_API_BASE_URL === API_BASE_URL) {
    return fetchJson<T>(path, options);
  }

  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(resolveUrl(CANONICAL_READ_API_BASE_URL, path), {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = payload && typeof payload === "object" && "error" in payload ? payload.error : null;
    const message =
      typeof apiError === "string"
        ? apiError
        : apiError && typeof apiError === "object" && "message" in apiError
          ? String(apiError.message)
          : response.statusText;
    throw new Error(message || "CRM request failed.");
  }

  return payload as T;
}

export function listCrmLeads(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchCanonicalCrmReadJson<CrmLeadListResponse>(`${BASE_PATH}/leads${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function findCrmLeadByPhone(token: string, phone: string) {
  return fetchCanonicalCrmReadJson<{ phone: string; lead: CrmLead | null }>(
    `${BASE_PATH}/leads/by-phone${buildQuery({ phone })}`,
    {
      headers: authHeaders(token),
    },
  );
}

export function listCrmSales(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchJson<CrmSalesResponse>(`${BASE_PATH}/sales${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function listCrmLeadIntents(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchCanonicalCrmReadJson<CrmLeadIntentResponse>(`${BASE_PATH}/lead-intents${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function updateCrmLead(token: string, id: string, payload: CrmLeadUpdatePayload) {
  return fetchJson<{ success: boolean; lead: CrmLead; languageSync?: unknown }>(
    `${BASE_PATH}/leads/${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function queueCrmSmsSequence(
  token: string,
  id: string,
  payload: { type: "buy" | "skeptic"; agent?: string },
) {
  return fetchJson<{ success: boolean; queued: number; lead: CrmLead }>(
    `${BASE_PATH}/leads/${encodeURIComponent(id)}/sms-sequence`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function queueCrmEmailSequence(token: string, id: string, payload: CrmEmailSequencePayload) {
  return fetchJson<{ success: boolean; lead: CrmLead; message?: string }>(
    `${BASE_PATH}/leads/${encodeURIComponent(id)}/email-sequence`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function listCrmMissedCalls(token: string, limit = 10) {
  return fetchJson<{ calls?: CrmMissedCall[]; items?: CrmMissedCall[]; count?: number }>(
    `${BASE_PATH}/missed-calls${buildQuery({ limit })}`,
    {
      headers: authHeaders(token),
    },
  );
}

export function searchCrmActivity(token: string, email: string) {
  return fetchJson<{ activities?: CrmActivity[]; items?: CrmActivity[] }>(
    `${BASE_PATH}/activity${buildQuery({ email })}`,
    {
      headers: authHeaders(token),
    },
  );
}

export function sendManualCrmEmail(token: string, payload: ManualCrmEmailPayload) {
  return fetchJson<{ success: boolean; result?: string; message?: string }>(`${BASE_PATH}/manual-email`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function sendManualCrmSms(token: string, payload: ManualCrmSmsPayload) {
  return fetchJson<{ success: boolean; result?: string; message?: string }>(`${BASE_PATH}/manual-sms`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function insertManualCrmLead(token: string, payload: ManualCrmLeadPayload) {
  return fetchJson<{ success: boolean; lead: CrmLead }>(`${BASE_PATH}/leads`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function scheduleManualCrmEmail(token: string, payload: ManualCrmEmailPayload) {
  return fetchJson<{ success: boolean; campaign: unknown }>(`${BASE_PATH}/email-campaigns`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      status: "to_send",
      campaign: payload.campaign || "manual-crm",
      ...payload,
    }),
  });
}

export function queueManualCrmSms(token: string, payload: ManualCrmSmsPayload) {
  return fetchJson<{ success: boolean; sms: unknown }>(`${BASE_PATH}/sms-campaigns`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
