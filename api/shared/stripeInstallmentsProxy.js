const DEFAULT_LAUNCHINGSTACK_API_BASE_URL =
  "https://launchingstack-func-dev.azurewebsites.net/api";

async function handleProxy(context, req, config) {
  const authorization = getAuthorization(req);

  if (!authorization) {
    context.res = json(401, { error: "Admin session required." });
    return;
  }

  const adminCheck = await confirmAdminAccess(authorization);

  if (!adminCheck.ok) {
    context.res = json(adminCheck.status, { error: adminCheck.error });
    return;
  }

  const endpoint = process.env[config.endpointEnvName];

  if (!endpoint) {
    context.res = json(500, {
      error: `${config.endpointEnvName} is not configured on this server.`,
    });
    return;
  }

  try {
    const azureUrl = buildAzureUrl(endpoint, req, config.allowedQueryKeys);
    const response = await fetch(azureUrl);
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      context.res = json(response.status, {
        error: readApiError(payload, "Azure installment endpoint failed."),
      });
      return;
    }

    context.res = json(200, payload);
  } catch (error) {
    context.res = json(502, {
      error:
        error instanceof Error
          ? error.message
          : "Could not load Stripe installment data.",
    });
  }
}

async function confirmAdminAccess(authorization) {
  const baseUrl =
    process.env.LAUNCHINGSTACK_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_LAUNCHINGSTACK_API_BASE_URL;

  try {
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { authorization },
    });
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

function isAuthorizedAdminPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const roles = Array.isArray(payload.roles) ? payload.roles.map(String) : [];
  const permissions = Array.isArray(payload.permissions) ? payload.permissions.map(String) : [];
  const isSupportAdmin = String(payload.supportAdmin).toLowerCase() === "true";

  return (
    isSupportAdmin ||
    roles.includes("tenant-admin") ||
    permissions.includes("admin:access")
  );
}

function buildAdminAccessError(payload, authStatus) {
  const fallback = readApiError(payload, "Admin access was not confirmed.");

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return `${fallback} authStatus=${authStatus}; supportAdmin=${String(
    payload.supportAdmin ?? false
  )}; roles=${Array.isArray(payload.roles) ? payload.roles.join(",") : ""}; permissions=${
    Array.isArray(payload.permissions) ? payload.permissions.join(",") : ""
  }`;
}

function buildAzureUrl(endpoint, req, allowedQueryKeys) {
  const url = new URL(endpoint);

  for (const key of allowedQueryKeys) {
    const value = req.query[key];

    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  }

  return url.toString();
}

function getAuthorization(req) {
  return (
    req.headers["x-jpi-authorization"] ||
    req.headers["X-Jpi-Authorization"] ||
    req.headers.authorization ||
    req.headers.Authorization ||
    ""
  );
}

function json(status, body) {
  return {
    status,
    headers: {
      "content-type": "application/json",
    },
    body,
  };
}

function readApiError(payload, fallback) {
  if (payload && typeof payload === "object") {
    const candidate =
      "error" in payload ? payload.error : "message" in payload ? payload.message : null;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}

module.exports = {
  handleProxy,
};
