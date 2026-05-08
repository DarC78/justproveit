export type StripeAccountFilter = "JustProveit" | "Proveit" | "all";

export type OverdueCustomersFilters = {
  accountName: StripeAccountFilter;
  daysLate: number;
  email: string;
  limit: number;
};

export type OverdueCustomer = {
  email: string;
  customerName: string | null;
  stripeCustomerId: string | null;
  stripeAccountName: string | null;
  failedPaymentCount: number;
  paidPaymentCount: number;
  lastFailedAt: string | null;
  lastPaidAt: string | null;
  oldestFailedAt: string | null;
  maxDaysOverdue: number;
  totalAmountRemaining: number;
};

export type OverdueCustomersResponse = {
  filters?: Record<string, unknown>;
  count: number;
  rows: OverdueCustomer[];
};

export type OverduePayment = {
  id: number;
  stripeAccountName: string | null;
  customerEmail: string;
  customerName: string | null;
  stripeCustomerId: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  status: string;
  amount: number;
  amountRefunded: number;
  amountRemaining: number;
  currency: string;
  transactionDate: string | null;
  createdDate: string | null;
  daysOverdue: number;
  description: string | null;
};

export type OverduePaymentsResponse = {
  filters?: Record<string, unknown>;
  count: number;
  rows: OverduePayment[];
};

export async function getOverdueCustomers(
  token: string,
  filters: OverdueCustomersFilters,
) {
  return getAdminJson<OverdueCustomersResponse>(
    `/api/stripe-installments/overdue-customers?${toQuery(filters)}`,
    token,
  );
}

export async function getOverduePayments(
  token: string,
  filters: OverdueCustomersFilters,
) {
  return getAdminJson<OverduePaymentsResponse>(
    `/api/stripe-installments/overdue?${toQuery(filters)}`,
    token,
  );
}

function toQuery(filters: OverdueCustomersFilters) {
  const params = new URLSearchParams({
    daysLate: String(filters.daysLate),
    limit: String(filters.limit),
  });

  if (filters.accountName !== "all") {
    params.set("accountName", filters.accountName);
  }

  if (filters.email.trim()) {
    params.set("email", filters.email.trim());
  }

  return params.toString();
}

async function getAdminJson<T>(path: string, token: string) {
  const response = await fetch(path, {
    headers: {
      "x-jpi-authorization": `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readApiError(payload, response.statusText));
  }

  return payload as T;
}

function readApiError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const candidate =
      "error" in payload ? payload.error : "message" in payload ? payload.message : null;

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return fallback || "Request failed.";
}
