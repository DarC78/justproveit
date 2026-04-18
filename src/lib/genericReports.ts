import { fetchJson } from "@/lib/auth";

const BASE_PATH = "/justproveit/admin/generic-reports";

export type GenericReportsConfig = {
  mailboxEmail: string;
  emailPageSize: number;
  felicitariBccEmail: string;
  felicitariAzureQueueId: number;
  stageOneTemplateKey: string;
};

export type GmailProfile = {
  connected: boolean;
  emailAddress: string;
  expectedMailboxEmail: string;
};

export type ReplyTemplate = {
  key: string;
  label?: string;
  name?: string;
  title?: string;
  plainText?: string;
  text?: string;
  body?: string;
  html?: string;
  enabled?: boolean;
  sortOrder?: number;
};

export type SupportMessage = {
  id?: string;
  _id?: string;
  messageId?: string;
  internetMessageId?: string;
  threadId?: string;
  externalMessageId?: string;
  externalThreadId?: string;
  direction?: string;
  from?: string;
  fromEmail?: string;
  fromDisplayName?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  subject?: string;
  date?: string;
  sentAtUtc?: string;
  createdAtUtc?: string;
  internalDate?: string | number;
  snippet?: string;
  body?: string;
  bodyText?: string;
  bodyHtml?: string;
  headers?: Record<string, string>;
  rawJson?: Record<string, unknown>;
  attachments?: MessageAttachment[];
};

export type MessageAttachment = {
  filename?: string;
  mimeType?: string;
  attachmentId?: string;
  size?: number;
  contentId?: string;
};

export type MessagesResponse = {
  mailboxEmail?: string;
  connectedMailboxEmail?: string;
  source?: string;
  query?: string;
  messageCount?: number;
  resultSizeEstimate?: number;
  nextPageToken?: string;
  messages?: SupportMessage[];
};

export type ThreadStateResponse = {
  mailboxEmail?: string;
  threadKeys?: string[];
};

export type CustomerContextResponse = {
  email?: string;
  customer?: Record<string, unknown>;
  support?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SendReplyRequest = {
  to: string;
  bcc?: string;
  subject: string;
  text: string;
  html?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  metadata?: Record<string, unknown>;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  });

  const text = query.toString();
  return text ? `?${text}` : "";
}

export function getGenericReportsConfig(token: string) {
  return fetchJson<GenericReportsConfig>(`${BASE_PATH}/config`, {
    headers: authHeaders(token),
  });
}

export function getGmailProfile(token: string) {
  return fetchJson<GmailProfile>(`${BASE_PATH}/gmail/profile`, {
    headers: authHeaders(token),
  });
}

export function getReplyTemplates(token: string) {
  return fetchJson<{ templates?: ReplyTemplate[] }>(`${BASE_PATH}/reply-templates`, {
    headers: authHeaders(token),
  });
}

export function getThreadState(token: string, state: "replied" | "skipped") {
  return fetchJson<ThreadStateResponse>(`${BASE_PATH}/thread-state/${state}`, {
    headers: authHeaders(token),
  });
}

export function getRecentMessages(
  token: string,
  options: {
    source: "cached" | "live" | "merged";
    limit: number;
    afterDate?: string;
    beforeDate?: string;
  },
) {
  return fetchJson<MessagesResponse>(
    `${BASE_PATH}/messages/recent${buildQuery(options)}`,
    { headers: authHeaders(token) },
  );
}

export function searchMessagesByEmail(token: string, email: string, limit = 100) {
  return fetchJson<MessagesResponse>(
    `${BASE_PATH}/messages/search${buildQuery({ email, limit })}`,
    { headers: authHeaders(token) },
  );
}

export function getCustomerContext(token: string, email: string) {
  return fetchJson<CustomerContextResponse>(
    `${BASE_PATH}/customers/context${buildQuery({ email })}`,
    { headers: authHeaders(token) },
  );
}

export function addCustomerEmail(
  token: string,
  payload: {
    customerEmail: string;
    newEmail: string;
    source?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return fetchJson<
    | CustomerContextResponse
    | {
        success?: boolean;
        customerEmail?: string;
        newEmail?: string;
        customerEmails?: string[];
      }
  >(
    `${BASE_PATH}/customers/emails`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function getMessage(token: string, messageId: string) {
  return fetchJson<SupportMessage>(
    `${BASE_PATH}/messages/${encodeURIComponent(messageId)}`,
    { headers: authHeaders(token) },
  );
}

export function searchGmail(
  token: string,
  payload: { query: string; maxResults: number; pageToken?: string },
) {
  return fetchJson<MessagesResponse>(`${BASE_PATH}/gmail/search`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ pageToken: "", ...payload }),
  });
}

export function sendGmailReply(token: string, payload: SendReplyRequest) {
  return fetchJson<{ id?: string; threadId?: string; labelIds?: string[] }>(
    `${BASE_PATH}/gmail/send`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function markThreadRead(token: string, threadId: string) {
  return fetchJson<{ success?: boolean }>(
    `${BASE_PATH}/gmail/threads/${encodeURIComponent(threadId)}/read`,
    { method: "POST", headers: authHeaders(token) },
  );
}

export function markMessageRead(token: string, messageId: string) {
  return fetchJson<{ success?: boolean }>(
    `${BASE_PATH}/gmail/messages/${encodeURIComponent(messageId)}/read`,
    { method: "POST", headers: authHeaders(token) },
  );
}

export function trashThread(token: string, threadId: string) {
  return fetchJson<{ success?: boolean }>(
    `${BASE_PATH}/gmail/threads/${encodeURIComponent(threadId)}/trash`,
    { method: "POST", headers: authHeaders(token) },
  );
}

export function trashMessage(token: string, messageId: string) {
  return fetchJson<{ success?: boolean }>(
    `${BASE_PATH}/gmail/messages/${encodeURIComponent(messageId)}/trash`,
    { method: "POST", headers: authHeaders(token) },
  );
}

export function markThreadState(
  token: string,
  state: "replied" | "skipped",
  payload: Record<string, string>,
) {
  return fetchJson<ThreadStateResponse>(`${BASE_PATH}/thread-state/${state}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function recordStageOneClosed(
  token: string,
  payload: Record<string, unknown>,
) {
  return fetchJson<{ success?: boolean }>(`${BASE_PATH}/customers/stage-one-closed`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function addPhoneToAzureQueue(
  token: string,
  payload: { phone: string; queueId: number; reason: string },
) {
  return fetchJson<{ queued?: boolean; phone?: string; queueId?: number }>(
    `${BASE_PATH}/azure-queue`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}

export function sendGenericUpdateEmail(
  token: string,
  payload: {
    to: string;
    customerName: string;
    customerSinceLabel: string;
    statusLabel: string;
  },
) {
  return fetchJson<{ success?: boolean; provider?: string; messageId?: string }>(
    `${BASE_PATH}/emails/generic-update`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    },
  );
}
