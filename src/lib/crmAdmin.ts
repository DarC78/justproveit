import { API_BASE_URL, fetchJson } from "@/lib/auth";

const BASE_PATH = "/justproveit/admin/crm";
const CANONICAL_READ_API_BASE_URL =
  process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL ??
  process.env.VITE_JPI_CRM_READ_API_BASE_URL ??
  "https://launchingstack-func-dev.azurewebsites.net/api";
const ASAP_LEAD_API_URL = "https://launchingstack-func-dev.azurewebsites.net/api/justproveit/leads/asap";

function resolveUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export type CrmLead = {
  id?: string | null;
  wixId?: string | null;
  _id?: string | null;
  contactId?: string | null;
  canonicalContactId?: string | null;
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
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
  canonical?: {
    contactId?: string | null;
    emailCount?: number;
    phoneCount?: number;
    intentCount?: number;
    legacyLeadCount?: number;
  };
  phones?: CrmContactPhone[];
};

export type CrmContactPhone = {
  id?: string | null;
  contactId?: string | null;
  phone?: string | null;
  normalizedPhone?: string | null;
  phoneLast6?: string | null;
  isPrimary?: boolean;
  source?: string | null;
  legacyCrmLeadId?: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

export type CrmActivity = {
  timestamp?: string | null;
  occurredAtUtc?: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
  eventId?: string | number | null;
  action?: string | null;
  state?: string | null;
  agent?: string | null;
  agentId?: string | number | null;
  agentName?: string | null;
  direction?: string | null;
  type?: string | null;
  eventType?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  normalizedPhone?: string | null;
  message?: string | null;
  body?: string | null;
  smsBody?: string | null;
  text?: string | null;
  content?: string | null;
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

export type CrmInboundSmsStatus = "answered" | "to_be_answered" | "past_due" | string;

export type CrmInboundSms = {
  id?: string | number | null;
  inboundSmsId?: string | number | null;
  smsId?: string | number | null;
  receivedAtUtc?: string | null;
  receivedAt?: string | null;
  createdAtUtc?: string | null;
  lastMessageAtUtc?: string | null;
  lastSmsAtUtc?: string | null;
  direction?: string | null;
  lastDirection?: string | null;
  fromPhone?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  normalizedPhone?: string | null;
  message?: string | null;
  body?: string | null;
  smsBody?: string | null;
  status?: CrmInboundSmsStatus | null;
  answered?: boolean | number | string | null;
  answeredAtUtc?: string | null;
  lastReplyAtUtc?: string | null;
  replyAgent?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  fullName?: string | null;
  source?: string | null;
  providerMessageId?: string | null;
  messageCount?: number | null;
  inboundCount?: number | null;
  outboundCount?: number | null;
};

export type CrmSale = {
  id?: string | null;
  wixId?: string | null;
  _id?: string | null;
  contactId?: string | null;
  canonicalContactId?: string | null;
  wixCreatedDateUtc?: string | null;
  createdAtUtc?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  normalizedPhone?: string | null;
  amountTotal?: number | null;
  amountTotalMajor?: number | null;
  serviceKey?: string | null;
  sourceSystem?: string | null;
  sourceRecordId?: string | null;
  storeowner?: string | null;
  dialerowner?: string | null;
  dialerlast?: string | null;
  dialerownerCallDateUtc?: string | null;
  dialerOwnerCallDateUtc?: string | null;
  dialerownerAtUtc?: string | null;
  dialerFirstCallDateUtc?: string | null;
  dialerfirstCallDateUtc?: string | null;
  dialerfirstAtUtc?: string | null;
  firstDialerCallAtUtc?: string | null;
  dialerlastCallDateUtc?: string | null;
  dialerLastCallDateUtc?: string | null;
  dialerlastAtUtc?: string | null;
  lastDialerCallAtUtc?: string | null;
};

export type CrmSaleHistoryEvent = {
  eventId?: string | number | null;
  eventType?: "lead_created" | "lead_intent" | "contact_service" | "sale" | "dialler_call" | string | null;
  occurredAtUtc?: string | null;
  title?: string | null;
  description?: string | null;
  metadata?: {
    serviceKey?: string | null;
    serviceDisplayName?: string | null;
    amountTotalMajor?: number | null;
    agentId?: number | string | null;
    agentName?: string | null;
    callTraceId?: number | string | null;
    callCode?: number | string | null;
    callCodeDetails?: string | null;
    campaignName?: string | null;
    sourceSystem?: string | null;
    sourceRecordId?: string | null;
  } | null;
};

export type CrmSaleHistoryResponse = {
  sale?: CrmSale | null;
  contact?: {
    id?: string | null;
    displayName?: string | null;
    status?: string | null;
    source?: string | null;
    sourceSummary?: string | null;
    email?: string | null;
    phone?: string | null;
    normalizedPhone?: string | null;
    createdAtUtc?: string | null;
    updatedAtUtc?: string | null;
  } | null;
  events?: CrmSaleHistoryEvent[];
  total?: number;
  limit?: number;
};

export type CrmLeadIntentServiceOption = {
  serviceKey: string;
  displayName?: string | null;
};

export type CrmLeadIntentRow = {
  interestId?: string | null;
  leadId?: string | null;
  contactId?: string | null;
  canonicalContactId?: string | null;
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
  totalPreviousCalls?: number | string | null;
  totalPreviousTalkedCalls?: number | string | null;
  totalPreviousConnectedCalls?: number | string | null;
  postIntentLastCallAgentId?: number | null;
  postIntentLastCallAgentName?: string | null;
  postIntentLastCallTraceId?: number | null;
  postIntentLastCallTimeUtc?: string | null;
  postIntentLastCallCode?: number | string | null;
  postIntentLastCallCodeDetails?: string | null;
  postIntentLastCallCodeName?: string | null;
  postIntentLastCallCodeDescription?: string | null;
  lastPostIntentCallAgentId?: number | null;
  lastPostIntentCallAgentName?: string | null;
  lastPostIntentCallTimeUtc?: string | null;
  lastPostIntentCallCode?: number | string | null;
  lastPostIntentCallCodeDetails?: string | null;
  lastPostIntentCallCodeName?: string | null;
  lastPostIntentCallCodeDescription?: string | null;
  createdAtUtc?: string | null;
  closedAtUtc?: string | null;
  updatedAtUtc?: string | null;
  reservedByAgent?: string | null;
  reservedAtUtc?: string | null;
  reservationExpiresAtUtc?: string | null;
  lead?: CrmLead | null;
};

export type CrmPredictiveCampaignSummary = {
  queueId?: number | null;
  campaignName?: string | null;
  predictiveTrialLimit?: number;
  totalLeads?: number;
  finishedLeads?: number;
  finishedLeadsToAg?: number;
  finishedToAg?: number;
  leadsToAg?: number;
  finishedNotAg?: number;
  noAgLeads?: number;
  toBeDialled?: number;
  toBeDialledLastCallCode5?: number;
  toBeDialledZeroTrials?: number;
  toBeDialledOneToThreeTrials?: number;
  toBeDialledFourToFiveTrials?: number;
  toBeDialledFivePlusTrials?: number;
  notDialled?: number;
  dialled?: number;
  completed?: number;
  completedLeads?: number;
  completedLeadCount?: number;
  completedCount?: number;
  completedNoAgent?: number;
  completedNoAgentCount?: number;
  completedWithoutAgent?: number;
  completedNotConnected?: number;
  completedTalkedToAgent?: number;
  completedTalkedToAgentCount?: number;
  completedWithAgent?: number;
  completedToAgent?: number;
  available?: number;
  availableLeads?: number;
  availableLeadCount?: number;
  availableCount?: number;
  dialledButNoAgent?: number;
  dialledToAgent?: number;
  dialledZeroTimes?: number;
  dialledOneTime?: number;
  dialledTwoTimes?: number;
  dialledThreeTimes?: number;
  dialledFourTimes?: number;
  dialledFiveTimes?: number;
  dialledSixTimes?: number;
  dialledSevenTimes?: number;
  dialledEightTimes?: number;
  dialledNineTimes?: number;
  dialledTenPlusTimes?: number;
  calledToday?: number;
  connectedToday?: number;
  calledYesterday?: number;
  connectedYesterday?: number;
  topDiallerResults?: Array<{
    diallerResult?: number | null;
    label?: string | null;
    count?: number;
  }>;
  topCallCodes?: Array<{
    callCode?: number | null;
    label?: string | null;
    count?: number;
    yesterdayCount?: number;
  }>;
};

export type CrmHighLevelFunnelRow = {
  leadSource?: string | null;
  source?: string | null;
  numberOfLeads?: number | null;
  leadCount?: number | null;
  calendlyBooked?: boolean | string | number | null;
  talkToAnAgent?: number | null;
  talkedToAgent?: number | null;
  sales?: number | null;
  revenue?: number | null;
};

export type CrmHighLevelFunnelResponse = {
  rows?: CrmHighLevelFunnelRow[];
  items?: CrmHighLevelFunnelRow[];
  total?: number;
  filters?: Record<string, string | number | null>;
  options?: {
    agents?: Array<{ agentId: number; agentName?: string | null }>;
  };
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

export type CrmInboundSmsResponse = {
  items?: CrmInboundSms[];
  rows?: CrmInboundSms[];
  messages?: CrmInboundSms[];
  total?: number;
  limit?: number;
  offset?: number;
  filters?: Record<string, string | number | null>;
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
  leadId?: string;
  contactId?: string;
  canonicalContactId?: string;
  intentId?: string;
  interestId?: string;
  leadIntentId?: string;
  interestType?: string;
};

export type CrmEmailSequencePayload = {
  sequence: string;
  cmcDomain?: string;
  cmcName?: string;
  intentId?: string;
  serviceKey?: string;
  agent?: string;
};

export type CrmLeadIntentReservationPayload = {
  agent?: string;
  reservationTtlMinutes?: number;
  reason?: string;
};

export type CrmLeadIntentReservationResponse = {
  success?: boolean;
  reservation?: {
    interestId?: string | null;
    reservedByAgent?: string | null;
    reservedAtUtc?: string | null;
    reservationExpiresAtUtc?: string | null;
  } | null;
  intent?: CrmLeadIntentRow | null;
  message?: string | null;
};

export type CreateCrmAsapIntentPayload = {
  leadId?: string;
  contactId?: string;
  email?: string;
  phone?: string;
  interestType: "ASAP";
  serviceKey: string;
  source?: string;
  agent?: string;
};

export type CreateCrmAsapIntentResponse = {
  success?: boolean;
  message?: string | null;
  intent?: CrmLeadIntentRow | null;
  leadIntent?: CrmLeadIntentRow | null;
  lead?: CrmLead | null;
};

export type ManualCrmLeadPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  language: string;
  service: "simulator pensie" | "FreeMoneyCheck" | "other";
  interestType?: "ASAP";
  agent?: string;
};

export type ManualCrmLeadCreateResponse = {
  success?: boolean;
  lead?: CrmLead | null;
  accepted?: boolean;
  queued?: boolean;
  jobId?: string | null;
  requestId?: string | null;
  operationId?: string | null;
  statusUrl?: string | null;
  message?: string | null;
};

export type ManualCrmEmailPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  emailtemplate: string;
  templateKey?: string;
  campaign?: string;
  leadid?: string;
  param1?: string;
  param2?: string;
  param3?: string;
  param4?: string;
  param5?: string;
  pageUrl?: string;
  agent?: string;
};

export type ManualCrmSmsPayload = {
  phone: string;
  message: string;
  agent?: string;
};

export type PublicManualCrmSmsPayload = {
  phone: string;
  template: string;
  templateKey?: string;
  pageUrl?: string;
  message?: string;
  agent?: string;
};

export type CloseCrmInboundSmsCasePayload = {
  inboundSmsId?: string | number | null;
  smsId?: string | number | null;
  phone?: string | null;
  status?: "answered";
  agent?: string;
};

export type StopCrmLeadDiallerPayload = {
  phone?: string;
  intentId?: string;
  queueId?: number;
  clientId?: number;
  reason?: string;
  agent?: string;
};

export type StopCrmLeadDiallerResponse = {
  success?: boolean;
  message?: string | null;
  stopped?: number | null;
  removed?: number | null;
  updated?: number | null;
  affectedRows?: number | null;
  matched?: number | null;
  intent?: CrmLeadIntentRow | null;
  leadIntent?: CrmLeadIntentRow | null;
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

async function fetchDirectJson<T>(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readCrmApiError(payload, response.statusText));
  }

  return payload as T;
}

function readCrmApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const error = "error" in payload ? payload.error : "message" in payload ? payload.message : null;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      const message = error.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }

  return fallback || "CRM request failed.";
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
  return fetchCanonicalCrmReadJson<CrmSalesResponse>(`${BASE_PATH}/sales${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export async function getCrmSaleHistory(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);

  try {
    return await fetchCanonicalCrmReadJson<CrmSaleHistoryResponse>(`${BASE_PATH}/sales/history${buildQuery(params)}`, {
      headers: authHeaders(token),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

export function listCrmLeadIntents(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchCanonicalCrmReadJson<CrmLeadIntentResponse>(`${BASE_PATH}/lead-intents${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function reserveCrmLeadIntent(
  token: string,
  interestId: string,
  payload: CrmLeadIntentReservationPayload,
) {
  return fetchCanonicalCrmReadJson<CrmLeadIntentReservationResponse>(
    `${BASE_PATH}/lead-intents/${encodeURIComponent(interestId)}/reservation`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function createCrmAsapIntent(token: string, payload: CreateCrmAsapIntentPayload) {
  return fetchCanonicalCrmReadJson<CreateCrmAsapIntentResponse>(`${BASE_PATH}/lead-intents`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function listCrmHighLevelFunnels(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchCanonicalCrmReadJson<CrmHighLevelFunnelResponse>(
    `${BASE_PATH}/high-level-funnels${buildQuery(params)}`,
    {
      headers: authHeaders(token),
    },
  );
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

export function addCrmLeadPhone(token: string, id: string, payload: { phone: string; agent?: string }) {
  return fetchCanonicalCrmReadJson<{
    success: boolean;
    phone?: CrmContactPhone | null;
    normalizedPhone?: string | null;
    contact?: { phones?: CrmContactPhone[] };
    lead?: CrmLead | null;
  }>(`${BASE_PATH}/leads/${encodeURIComponent(id)}/phones`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
export function queueCrmSmsSequence(
  token: string,
  id: string,
  payload: { type: "buy" | "skeptic"; intentId?: string; serviceKey?: string; agent?: string },
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

export function listCrmInboundSms(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchCanonicalCrmReadJson<CrmInboundSmsResponse>(`${BASE_PATH}/inbound-sms${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function closeCrmInboundSmsCase(token: string, payload: CloseCrmInboundSmsCasePayload) {
  return fetchCanonicalCrmReadJson<{ success?: boolean; sms?: CrmInboundSms; item?: CrmInboundSms; message?: string }>(
    `${BASE_PATH}/inbound-sms/close-case`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        status: "answered",
        ...payload,
      }),
    },
  );
}

export function searchCrmActivity(
  token: string,
  params: { contactId?: string | null; email?: string | null; phone?: string | null; limit?: number } | string,
) {
  const query = typeof params === "string" ? { email: params } : params;
  return fetchCanonicalCrmReadJson<{ activities?: CrmActivity[]; items?: CrmActivity[] }>(
    `${BASE_PATH}/activity${buildQuery(query)}`,
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

export function sendPublicManualCrmEmail(payload: ManualCrmEmailPayload) {
  return fetchCanonicalCrmReadJson<{ success: boolean; result?: string; message?: string }>(`${BASE_PATH}/manual-email`, {
    method: "POST",
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

export function sendPublicManualCrmSms(payload: PublicManualCrmSmsPayload) {
  return fetchCanonicalCrmReadJson<{ success: boolean; result?: string; message?: string }>(`${BASE_PATH}/manual-sms`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function insertManualCrmLead(token: string, payload: ManualCrmLeadPayload) {
  return fetchDirectJson<ManualCrmLeadCreateResponse | null>(ASAP_LEAD_API_URL, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function stopCrmLeadDialler(token: string, payload: StopCrmLeadDiallerPayload) {
  return fetchCanonicalCrmReadJson<StopCrmLeadDiallerResponse>(`${BASE_PATH}/dialler/stop`, {
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
