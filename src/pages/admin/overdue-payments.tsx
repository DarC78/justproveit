import { useAuth } from "@/context/AuthContext";
import {
  getOverdueCustomers,
  getOverduePayments,
  OverdueCustomer,
  OverduePayment,
  StripeAccountFilter,
} from "@/lib/stripeInstallmentsAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type LoadStatus = "idle" | "loading" | "error" | "ready";

const accountOptions: Array<{ label: string; value: StripeAccountFilter }> = [
  { label: "JustProveit", value: "JustProveit" },
  { label: "Proveit", value: "Proveit" },
  { label: "All accounts", value: "all" },
];

export default function OverduePaymentsPage() {
  const router = useRouter();
  const { status, token, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [accountName, setAccountName] =
    useState<StripeAccountFilter>("JustProveit");
  const [daysLate, setDaysLate] = useState(0);
  const [limit, setLimit] = useState(100);
  const [email, setEmail] = useState("");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [customers, setCustomers] = useState<OverdueCustomer[]>([]);
  const [payments, setPayments] = useState<OverduePayment[]>([]);
  const [customersStatus, setCustomersStatus] = useState<LoadStatus>("idle");
  const [paymentsStatus, setPaymentsStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function checkAdminAccess() {
      setGateStatus("checking");
      setGateError("");

      if (!isAdmin) {
        setGateStatus("denied");
        setGateError(
          "The logged-in user profile does not include tenant-admin or admin:access.",
        );
        return;
      }

      const result = await requireAdmin();

      if (!cancelled) {
        setGateStatus(result.allowed ? "allowed" : "denied");
        setGateError(result.error ?? "");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  const loadCustomers = useCallback(async (nextEmail = email) => {
    if (!token) {
      return;
    }

    setCustomersStatus("loading");
    setPayments([]);
    setSelectedEmail("");
    setError("");

    try {
      const result = await getOverdueCustomers(token, {
        accountName,
        daysLate,
        email: nextEmail,
        limit,
      });
      setCustomers(result.rows ?? result.records ?? []);
      setCustomersStatus("ready");
    } catch (loadError) {
      setCustomers([]);
      setCustomersStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
        : "Could not load overdue customers.",
      );
    }
  }, [accountName, daysLate, email, limit, token]);

  useEffect(() => {
    if (gateStatus !== "allowed" || !token) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadCustomers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [gateStatus, loadCustomers, token]);

  const summary = useMemo(() => {
    return customers.reduce(
      (totals, customer) => ({
        amount: totals.amount + customer.totalAmountRemaining,
        failed: totals.failed + customer.failedPaymentCount,
        worstDays: Math.max(totals.worstDays, customer.maxDaysOverdue),
      }),
      { amount: 0, failed: 0, worstDays: 0 },
    );
  }, [customers]);

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  async function loadPayments(customerEmail: string) {
    if (!token || !customerEmail) {
      return;
    }

    setSelectedEmail(customerEmail);
    setPaymentsStatus("loading");
    setError("");

    try {
      const result = await getOverduePayments(token, {
        accountName,
        daysLate,
        email: customerEmail,
        limit: 250,
        status: "all",
      });
      setPayments(result.rows ?? result.records ?? []);
      setPaymentsStatus("ready");
    } catch (loadError) {
      setPayments([]);
      setPaymentsStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load payment events.",
      );
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadCustomers(email);
  }

  return (
    <>
      <Head>
        <title>Overdue payments | JustProveIt Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
        <div className="mx-auto w-full max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold">
                Just<span className="text-emerald-700">ProveIt</span> Admin
              </Link>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-950">
                Overdue payments
              </h1>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Back to admin
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </header>

          {gateStatus === "checking" ? (
            <StatusPanel tone="neutral" title="Checking admin access" />
          ) : null}

          {gateStatus === "denied" ? (
            <StatusPanel
              tone="danger"
              title="Admin access required"
              detail={
                gateError ||
                "LaunchingStack did not confirm admin access for this account."
              }
            />
          ) : null}

          {gateStatus === "allowed" ? (
            <section className="mt-6">
              <form
                onSubmit={handleSearch}
                className="grid gap-3 border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <label className="text-sm font-bold text-slate-700">
                  Account
                  <select
                    value={accountName}
                    onChange={(event) =>
                      setAccountName(event.target.value as StripeAccountFilter)
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    {accountOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Minimum days late
                  <input
                    type="number"
                    min="0"
                    value={daysLate}
                    onChange={(event) =>
                      setDaysLate(Number(event.target.value || 0))
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Result limit
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={limit}
                    onChange={(event) => setLimit(Number(event.target.value || 100))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Customer email
                  <input
                    type="search"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Filter by email"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  />
                </label>

                <button
                  type="submit"
                  className="self-end rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  Refresh
                </button>
              </form>

              {error ? (
                <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Metric label="Overdue customers" value={customers.length} />
                <Metric label="Open amount" value={formatMoney(summary.amount)} />
                <Metric label="Failed attempts" value={summary.failed} />
                <Metric label="Worst delay" value={`${summary.worstDays} days`} />
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
                <section className="border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-extrabold">
                      Customers missing installments
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">
                      {customersStatus === "loading"
                        ? "Loading..."
                        : `${customers.length} shown`}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                        <tr>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Account</th>
                          <th className="px-4 py-3 text-right">Open</th>
                          <th className="px-4 py-3 text-right">Failed</th>
                          <th className="px-4 py-3 text-right">Days</th>
                          <th className="px-4 py-3">Last failed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr
                            key={`${customer.stripeAccountName}-${getCustomerEmail(customer)}`}
                            className={`cursor-pointer border-t border-slate-100 hover:bg-emerald-50 ${
                              selectedEmail === getCustomerEmail(customer) ? "bg-emerald-50" : ""
                            }`}
                            onClick={() => loadPayments(getCustomerEmail(customer))}
                          >
                            <td className="px-4 py-3">
                              <p className="font-extrabold text-slate-950">
                                {customer.customerName || "Unknown"}
                              </p>
                              <p className="break-all text-xs font-semibold text-slate-500">
                                {getCustomerEmail(customer)}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {customer.stripeAccountName || "-"}
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold">
                              {formatMoney(customer.totalAmountRemaining)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {customer.failedPaymentCount}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {customer.maxDaysOverdue}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {formatDate(customer.lastFailedAt || customer.latestFailedAtUtc)}
                            </td>
                          </tr>
                        ))}
                        {customersStatus === "ready" && customers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                            >
                              No overdue customers match these filters.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <h2 className="text-base font-extrabold">
                      Payment events
                    </h2>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-500">
                      {selectedEmail || "Select a customer"}
                    </p>
                  </div>

                  <div className="max-h-[640px] overflow-auto">
                    {paymentsStatus === "loading" ? (
                      <p className="px-4 py-6 text-sm font-semibold text-slate-500">
                        Loading payment events...
                      </p>
                    ) : null}

                    {paymentsStatus !== "loading" && !selectedEmail ? (
                      <p className="px-4 py-6 text-sm font-semibold text-slate-500">
                        Choose a customer row to see the failed installment
                        attempts and related Stripe records.
                      </p>
                    ) : null}

                    {payments.map((payment) => (
                      <div
                        key={payment.id ?? payment.stripeEventId}
                        className="border-b border-slate-100 px-4 py-4 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-extrabold text-slate-950">
                              {payment.status}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatDate(
                                payment.transactionDate ||
                                  payment.failedAtUtc ||
                                  payment.dueAtUtc ||
                                  payment.eventCreatedAtUtc ||
                                  payment.createdDate ||
                                  payment.createdAtUtc ||
                                  null,
                              )}
                            </p>
                          </div>
                          <p className="text-right text-sm font-extrabold text-slate-950">
                            {formatMoney(
                              payment.amountRemaining ||
                                payment.amount ||
                                payment.amountDue ||
                                0,
                            )}
                          </p>
                        </div>
                        {payment.description ? (
                          <p className="mt-2 text-sm leading-5 text-slate-700">
                            {payment.description}
                          </p>
                        ) : null}
                        <dl className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
                          <div>
                            <dt>Payment intent</dt>
                            <dd className="mt-1 break-all text-slate-800">
                              {payment.paymentIntentId || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt>Charge</dt>
                            <dd className="mt-1 break-all text-slate-800">
                              {payment.chargeId || "-"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}

                    {paymentsStatus === "ready" && payments.length === 0 ? (
                      <p className="px-4 py-6 text-sm font-semibold text-slate-500">
                        No payment events found for this customer.
                      </p>
                    ) : null}
                  </div>
                </section>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPanel({
  title,
  detail,
  tone,
}: {
  title: string;
  detail?: string;
  tone: "neutral" | "danger";
}) {
  const styles =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-950"
      : "border-slate-200 bg-white text-slate-800";

  return (
    <section className={`mt-6 border p-5 shadow-sm ${styles}`}>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {detail ? <p className="mt-2 text-sm font-semibold">{detail}</p> : null}
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((value || 0) / 100);
}

function getCustomerEmail(customer: OverdueCustomer) {
  return customer.email || customer.customerEmail || customer.customerKey || "";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
