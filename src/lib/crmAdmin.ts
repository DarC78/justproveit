import { fetchJson } from "@/lib/auth";

const BASE_PATH = "/justproveit/admin/crm";

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

export type ManualCrmLeadPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  language: string;
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

export function listCrmLeads(
  token: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  return fetchJson<CrmLeadListResponse>(`${BASE_PATH}/leads${buildQuery(params)}`, {
    headers: authHeaders(token),
  });
}

export function findCrmLeadByPhone(token: string, phone: string) {
  return fetchJson<{ phone: string; lead: CrmLead | null }>(
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

export function insertManualCrmLead(token: string, payload: ManualCrmLeadPayload) {
  return fetchJson<{ success: boolean; lead: CrmLead }>(`${BASE_PATH}/leads`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
