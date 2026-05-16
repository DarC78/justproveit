export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  tenantKey: string;
  roles: string[];
  permissions: string[];
  createdAt?: string;
  supportAdmin?: boolean;
};

export type AdminProfile = {
  user: Pick<AuthUser, "id" | "email" | "name">;
  tenant: {
    key: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
};

type SessionPayload = {
  user?: AuthUser;
  token?: string;
  refreshToken?: string;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  "https://apiprocess.azurewebsites.net/api";

export const TENANT_KEY = "justproveit";

export const STORAGE_KEYS = {
  accessToken: "jpi-access-token",
  refreshToken: "jpi-refresh-token",
  user: "jpi-user-profile",
} as const;

export function isAdminUser(user: AuthUser | null | undefined) {
  return (
    user?.supportAdmin === true ||
    user?.roles?.includes("tenant-admin") ||
    user?.permissions?.includes("admin:access") ||
    false
  );
}

export function isCrmUser(user: AuthUser | null | undefined) {
  return (
    isAdminUser(user) ||
    user?.roles?.includes("crm-admin") ||
    user?.permissions?.includes("crm:access") ||
    false
  );
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return { token: null, refreshToken: null, user: null };
  }

  return {
    token: window.localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: window.localStorage.getItem(STORAGE_KEYS.refreshToken),
    user: parseStoredUser(window.localStorage.getItem(STORAGE_KEYS.user)),
  };
}

export function saveStoredSession(payload: Required<SessionPayload>) {
  window.localStorage.setItem(STORAGE_KEYS.accessToken, payload.token);
  window.localStorage.setItem(STORAGE_KEYS.refreshToken, payload.refreshToken);
  window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(payload.user));
}

export function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
  window.localStorage.removeItem(STORAGE_KEYS.user);
}

export async function loginRequest(email: string, password: string) {
  const payload = await fetchJson<SessionPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      tenantKey: TENANT_KEY,
      domain: getCurrentDomain(),
    }),
  });

  if (!payload.user || !payload.token || !payload.refreshToken) {
    throw new Error("Login response was missing session data.");
  }

  return {
    user: normalizeUser(payload.user),
    token: payload.token,
    refreshToken: payload.refreshToken,
  };
}

export async function meRequest(token: string) {
  const user = await fetchJson<AuthUser>("/auth/me", {
    headers: authHeaders(token),
  });

  return normalizeUser(user);
}

export async function refreshRequest(refreshToken: string) {
  return fetchJson<SessionPayload>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutRequest(token: string) {
  await fetchJson<{ success: boolean }>("/auth/logout", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({}),
  });
}

export async function adminMeRequest(token: string) {
  return fetchJson<AdminProfile>("/justproveit/admin/me", {
    headers: authHeaders(token),
  });
}

export async function fetchJson<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readApiError(payload, response.statusText));
  }

  return payload as T;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function getCurrentDomain() {
  if (typeof window === "undefined") {
    return "justproveit.co.uk";
  }

  return window.location.hostname || "justproveit.co.uk";
}

function parseStoredUser(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return normalizeUser(JSON.parse(value) as AuthUser);
  } catch {
    return null;
  }
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const candidate =
      "error" in payload ? payload.error : "message" in payload ? payload.message : null;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      "message" in candidate &&
      typeof candidate.message === "string" &&
      candidate.message.trim()
    ) {
      return candidate.message;
    }
  }

  return fallback || "Request failed.";
}
