import { useAuth } from "@/context/AuthContext";
import {
  CrmDiallerConnectionStatus,
  CrmDiallerQueueOption,
  CrmDiallerRecord,
  listCrmDiallerQueues,
  listCrmDiallerRecords,
  updateCrmLead,
} from "@/lib/crmAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type LoadStatus = "idle" | "loading" | "ready" | "error";

const MAX_RECORDS = 100;
const STATUS_OPTIONS: Array<{ label: string; value: CrmDiallerConnectionStatus }> = [
  { label: "All statuses", value: "all" },
  { label: "To be dialled", value: "to_be_dialled" },
  { label: "Dialled", value: "dialled" },
  { label: "Connected to agent", value: "connected" },
  { label: "Not connected", value: "not_connected" },
];

export default function AdminDiallerPage() {
  const router = useRouter();
  const { status, token, isAdmin, requireAdmin, logout, user } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [queue, setQueue] = useState("");
  const [dateFrom, setDateFrom] = useState(defaultDateFrom());
  const [dateTo, setDateTo] = useState(defaultDateTo());
  const [connectionStatus, setConnectionStatus] =
    useState<CrmDiallerConnectionStatus>("all");
  const [records, setRecords] = useState<CrmDiallerRecord[]>([]);
  const [queueOptions, setQueueOptions] = useState<CrmDiallerQueueOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [queueStatus, setQueueStatus] = useState<LoadStatus>("idle");
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});

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
        setGateError("The logged-in user profile does not include admin access.");
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

  const loadQueues = useCallback(async () => {
    if (!token) {
      return;
    }

    setQueueStatus("loading");
    setError("");

    try {
      const response = await listCrmDiallerQueues(token);
      setQueueOptions(response.queues ?? response.records ?? response.rows ?? response.items ?? []);
      setQueueStatus("ready");
    } catch (loadError) {
      setQueueOptions([]);
      setQueueStatus("error");
      setError(loadError instanceof Error ? loadError.message : "Could not load predictive active queues.");
    }
  }, [token]);

  const loadRecords = useCallback(async () => {
    if (!token) {
      return;
    }

    setHasSearched(true);
    setLoadStatus("loading");
    setError("");
    setStatusMessage("");

    try {
      const response = await listCrmDiallerRecords(token, {
        queue: queue.trim(),
        queueId: queue.trim(),
        dateFrom: formatDateForApi(dateFrom),
        dateTo: formatExclusiveEndDateForApi(dateTo),
        status: connectionStatus,
        connectionStatus,
        limit: MAX_RECORDS,
        offset: 0,
      });
      const nextRecords = (response.records ?? response.rows ?? response.items ?? []).slice(0, MAX_RECORDS);
      setRecords(nextRecords);
      setTotal(response.total ?? nextRecords.length);
      setNoteDrafts(buildNoteDrafts(nextRecords));
      setLoadStatus("ready");
    } catch (loadError) {
      setRecords([]);
      setTotal(0);
      setLoadStatus("error");
      setError(loadError instanceof Error ? loadError.message : "Could not load dialler records.");
    }
  }, [connectionStatus, dateFrom, dateTo, queue, token]);

  useEffect(() => {
    if (gateStatus !== "allowed" || !token) {
      return;
    }

    void loadQueues();
  }, [gateStatus, loadQueues, token]);

  const metrics = useMemo(() => {
    return records.reduce(
      (summary, record) => {
        if (isToBeDialled(record)) {
          summary.toBeDialled += 1;
        } else {
          summary.dialled += 1;
        }

        if (isConnectedToAgent(record)) {
          summary.connected += 1;
        } else if (!isToBeDialled(record)) {
          summary.notConnected += 1;
        }

        return summary;
      },
      { shown: records.length, dialled: 0, toBeDialled: 0, connected: 0, notConnected: 0 },
    );
  }, [records]);

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRecords();
  }

  async function saveObservation(record: CrmDiallerRecord) {
    if (!token) {
      return;
    }

    const rowKey = getRecordKey(record);
    const leadId = getLeadUpdateId(record);
    const observation = noteDrafts[rowKey] ?? "";

    if (!leadId) {
      setError("This dialler row does not include a CRM lead id. Backend must return leadId, id, wixId, or lead.id so the observation can be saved.");
      setStatusMessage("");
      return;
    }

    setSavingNotes((current) => ({ ...current, [rowKey]: true }));
    setError("");
    setStatusMessage("");

    try {
      const response = await updateCrmLead(token, leadId, {
        observation,
        agent: user?.name || user?.email || "Admin dialler page",
        leadId: record.leadId || record.lead?.leadid || undefined,
        contactId: record.contactId || record.lead?.contactId || undefined,
        canonicalContactId: record.canonicalContactId || record.lead?.canonicalContactId || undefined,
        intentId: record.intentId || record.interestId || undefined,
      });
      setRecords((current) =>
        current.map((item) =>
          getRecordKey(item) === rowKey
            ? {
                ...item,
                observation: response.lead?.observation ?? observation,
                crmObservation: response.lead?.observation ?? observation,
                lead: response.lead ?? item.lead,
              }
            : item,
        ),
      );
      setStatusMessage("Observation saved to CRM.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the CRM observation.");
    } finally {
      setSavingNotes((current) => ({ ...current, [rowKey]: false }));
    }
  }

  return (
    <>
      <Head>
        <title>Dialler | JustProveIt Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
        <div className="mx-auto w-full max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold">
                Just<span className="text-emerald-700">ProveIt</span> Admin
              </Link>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Dialler</h1>
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

          {gateStatus === "checking" ? <StatusPanel tone="neutral" title="Checking admin access" /> : null}
          {gateStatus === "denied" ? (
            <StatusPanel
              tone="danger"
              title="Admin access required"
              detail={gateError || "JustProveIt did not confirm admin access for this account."}
            />
          ) : null}

          {gateStatus === "allowed" ? (
            <section className="mt-6">
              <form
                onSubmit={handleSearch}
                className="grid gap-3 border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <label className="text-sm font-bold text-slate-700">
                  Queue
                  <select
                    value={queue}
                    onChange={(event) => setQueue(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
                    disabled={queueStatus === "loading"}
                  >
                    <option value="">
                      {queueStatus === "loading" ? "Loading queues..." : "All predictive active queues"}
                    </option>
                    {queueOptions.map((option) => (
                      <option key={String(option.queueId)} value={String(option.queueId)}>
                        {formatQueueLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-bold text-slate-700">
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  To
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                  />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Status
                  <select
                    value={connectionStatus}
                    onChange={(event) => setConnectionStatus(event.target.value as CrmDiallerConnectionStatus)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className="self-end rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={loadStatus === "loading"}
                >
                  {loadStatus === "loading" ? "Loading" : "Refresh"}
                </button>
              </form>

              {error ? (
                <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                  {error}
                </div>
              ) : null}
              {statusMessage ? (
                <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
                  {statusMessage}
                </div>
              ) : null}

              {hasSearched ? (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-5">
                    <Metric label="Shown" value={metrics.shown} />
                    <Metric label="Total match" value={total} />
                    <Metric label="To dial" value={metrics.toBeDialled} />
                    <Metric label="Connected" value={metrics.connected} />
                    <Metric label="No agent" value={metrics.notConnected} />
                  </div>

                  <section className="mt-5 border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-base font-extrabold">Dialler records</h2>
                      <p className="text-sm font-semibold text-slate-500">
                        {loadStatus === "loading" ? "Loading..." : `${records.length} shown, max ${MAX_RECORDS}`}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                          <tr>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Trials</th>
                            <th className="px-4 py-3">Dialler time</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Agent</th>
                            <th className="px-4 py-3">Result</th>
                            <th className="px-4 py-3">CRM observation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record) => {
                            const key = getRecordKey(record);
                            const savedObservation = getObservation(record);
                            const draft = noteDrafts[key] ?? "";
                            const saving = savingNotes[key] === true;
                            const dirty = draft !== savedObservation;

                            return (
                              <tr key={key} className="border-t border-slate-100 align-top hover:bg-slate-50">
                                <td className="px-4 py-3">
                                  <p className="font-extrabold text-slate-950">{getClientName(record)}</p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">{getPhone(record)}</p>
                                  <p className="mt-1 break-all text-xs font-semibold text-slate-500">{record.email || "-"}</p>
                                </td>
                                <td className="px-4 py-3 font-semibold">{formatTrials(record.trials)}</td>
                                <td className="px-4 py-3 font-semibold">{formatDateTime(getDiallerDate(record))}</td>
                                <td className="px-4 py-3">
                                  <StatusBadge record={record} />
                                </td>
                                <td className="px-4 py-3 font-semibold">{record.agentName || "-"}</td>
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-950">{record.callCodeDetails || record.callResult || "-"}</p>
                                  {record.callCode ? (
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Code {record.callCode}</p>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3">
                                  <textarea
                                    value={draft}
                                    onChange={(event) =>
                                      setNoteDrafts((current) => ({ ...current, [key]: event.target.value }))
                                    }
                                    rows={3}
                                    className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-950"
                                    placeholder="Add CRM observation"
                                  />
                                  <div className="mt-2 flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-slate-500">
                                      {getLeadUpdateId(record) ? "Saves to CRM lead observation" : "Missing CRM lead id"}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => saveObservation(record)}
                                      disabled={saving || !dirty}
                                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    >
                                      {saving ? "Saving" : dirty ? "Save" : "Saved"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {loadStatus === "ready" && records.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                                No dialler records match these filters.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : null}
            </section>
          ) : null}
        </div>
      </main>
    </>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-extrabold text-slate-950">{value}</p>
    </div>
  );
}

function StatusBadge({ record }: { record: CrmDiallerRecord }) {
  const toDial = isToBeDialled(record);
  const connected = isConnectedToAgent(record);
  const label = toDial ? "To be dialled" : connected ? "Connected" : "Not connected";
  const styles = toDial
    ? "border-sky-200 bg-sky-50 text-sky-800"
    : connected
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-extrabold ${styles}`}>
      {label}
    </span>
  );
}

function formatQueueLabel(option: CrmDiallerQueueOption) {
  const name = option.label || option.queueName || option.campaignName || `Queue ${option.queueId}`;
  return `${name} (${option.queueId})`;
}

function buildNoteDrafts(records: CrmDiallerRecord[]) {
  return records.reduce<Record<string, string>>((drafts, record) => {
    drafts[getRecordKey(record)] = getObservation(record);
    return drafts;
  }, {});
}

function getRecordKey(record: CrmDiallerRecord) {
  return String(
    record.id ||
      record.diallerRecordId ||
      record.callTraceId ||
      [record.queueId, record.clientId, record.phone || record.phoneNumber, getDiallerDate(record)].join(":"),
  );
}

function getLeadUpdateId(record: CrmDiallerRecord) {
  return String(record.leadId || record.lead?.id || record.lead?.wixId || record.lead?.leadid || record.wixId || "").trim();
}

function getClientName(record: CrmDiallerRecord) {
  return record.fullName || record.leadName || record.lead?.fullName || "Unknown";
}

function getPhone(record: CrmDiallerRecord) {
  return record.phone || record.phoneNumber || record.normalizedPhone || record.lead?.phoneNumber || "-";
}

function formatTrials(value: CrmDiallerRecord["trials"]) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

function getObservation(record: CrmDiallerRecord) {
  return String(record.observation ?? record.crmObservation ?? record.lead?.observation ?? "");
}

function getDiallerDate(record: CrmDiallerRecord) {
  return record.dialledAtUtc || record.lastCallAtUtc || record.scheduledAtUtc || record.createdAtUtc || null;
}

function isToBeDialled(record: CrmDiallerRecord) {
  const status = String(record.status || record.diallerStatus || "").toLowerCase();
  return status.includes("to_be") || status.includes("to be") || status.includes("pending") || status.includes("new");
}

function isConnectedToAgent(record: CrmDiallerRecord) {
  if (typeof record.connectedToAgent === "boolean") {
    return record.connectedToAgent;
  }

  if (typeof record.connectedToAgent === "number") {
    return record.connectedToAgent > 0;
  }

  const explicit = String(record.connectedToAgent ?? "").toLowerCase();
  if (["true", "yes", "1", "connected"].includes(explicit)) {
    return true;
  }

  const status = `${record.status || ""} ${record.diallerStatus || ""} ${record.callCodeDetails || ""}`.toLowerCase();
  return status.includes("connected") || status.includes("talked") || status.includes("agent");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateForApi(value: string) {
  return value || undefined;
}

function formatExclusiveEndDateForApi(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  parsed.setDate(parsed.getDate() + 1);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function defaultDateFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return toDateInputValue(date);
}

function defaultDateTo() {
  return toDateInputValue(new Date());
}

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
