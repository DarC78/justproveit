import type { NextApiRequest, NextApiResponse } from "next";

type ProxyConfig = {
  endpointEnvName: string;
  allowedQueryKeys: string[];
};

const LAUNCHINGSTACK_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  "https://launchingstack-func-dev.azurewebsites.net/api";

export async function handleStripeInstallmentsProxy(
  req: NextApiRequest,
  res: NextApiResponse,
  config: ProxyConfig,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).json({ error: "Admin session required." });
    return;
  }

  const adminCheck = await confirmAdminAccess(authorization);

  if (!adminCheck.ok) {
    res.status(adminCheck.status).json({ error: adminCheck.error });
    return;
  }

  const endpoint = process.env[config.endpointEnvName];

  if (!endpoint) {
    res.status(500).json({
      error: `${config.endpointEnvName} is not configured on this server.`,
    });
    return;
  }

  try {
    const azureUrl = buildAzureUrl(endpoint, req, config.allowedQueryKeys);
    const response = await fetch(azureUrl);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      res.status(response.status).json({
        error: readApiError(payload, "Azure installment endpoint failed."),
      });
      return;
    }

    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Could not load Stripe installment data.",
    });
  }
}

async function confirmAdminAccess(authorization: string) {
  try {
    const response = await fetch(
      `${LAUNCHINGSTACK_API_BASE_URL}/auth/me`,
      {
        headers: { authorization },
      },
    );
    const payload = await response.json().catch(() => null);

    if (!response.ok || !isAuthorizedAdminPayload(payload)) {
      return {
        ok: false,
        status: response.status === 401 ? 401 : 403,
        error: buildAdminAccessError(payload, response.status),
      };
    }

    return { ok: true, status: 200, error: "" };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error
          ? error.message
          : "Could not verify admin access.",
    };
  }
}

function isAuthorizedAdminPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const supportAdmin =
    "supportAdmin" in payload &&
    String(payload.supportAdmin).toLowerCase() === "true";
  const roles =
    "roles" in payload && Array.isArray(payload.roles)
      ? payload.roles.map(String)
      : [];
  const permissions =
    "permissions" in payload && Array.isArray(payload.permissions)
      ? payload.permissions.map(String)
      : [];

  return (
    supportAdmin ||
    roles.includes("tenant-admin") ||
    permissions.includes("admin:access")
  );
}

function buildAdminAccessError(payload: unknown, authStatus: number) {
  const fallback = readApiError(payload, "Admin access was not confirmed.");

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const supportAdmin =
    "supportAdmin" in payload ? String(payload.supportAdmin) : "false";
  const roles =
    "roles" in payload && Array.isArray(payload.roles)
      ? payload.roles.join(",")
      : "";
  const permissions =
    "permissions" in payload && Array.isArray(payload.permissions)
      ? payload.permissions.join(",")
      : "";

  return `${fallback} authStatus=${authStatus}; supportAdmin=${supportAdmin}; roles=${roles}; permissions=${permissions}`;
}

function buildAzureUrl(
  endpoint: string,
  req: NextApiRequest,
  allowedQueryKeys: string[],
) {
  const url = new URL(endpoint);

  for (const key of allowedQueryKeys) {
    const value = req.query[key];

    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  }

  return url.toString();
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const candidate =
      "error" in payload ? payload.error : "message" in payload ? payload.message : null;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}
