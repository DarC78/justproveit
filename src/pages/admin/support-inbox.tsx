import { useAuth } from "@/context/AuthContext";
import {
  addPhoneToAzureQueue,
  CustomerContextResponse,
  GenericReportsConfig,
  getCustomerContext,
  getGenericReportsConfig,
  getGmailProfile,
  getRecentMessages,
  getReplyTemplates,
  getThreadState,
  GmailProfile,
  markMessageRead,
  markThreadRead,
  markThreadState,
  recordStageOneClosed,
  ReplyTemplate,
  searchMessagesByEmail,
  sendGenericUpdateEmail,
  sendGmailReply,
  SupportMessage,
  trashMessage,
  trashThread,
} from "@/lib/genericReports";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type SourceMode = "cached" | "live" | "merged";
type LoadStatus = "idle" | "loading" | "ready" | "error";

const DEFAULT_LIMIT = 20;

export default function SupportInboxPage() {
  const router = useRouter();
  const { status, token, user, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<LoadStatus>("loading");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [actionStatus, setActionStatus] = useState("");
  const [error, setError] = useState("");
  const [config, setConfig] = useState<GenericReportsConfig | null>(null);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [source, setSource] = useState<SourceMode>("cached");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [customerContext, setCustomerContext] =
    useState<CustomerContextResponse | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [replyText, setReplyText] = useState("");
  const [repliedThreadKeys, setRepliedThreadKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [skippedThreadKeys, setSkippedThreadKeys] = useState<Set<string>>(
    () => new Set(),
  );

  const visibleMessages = useMemo(
    () =>
      messages.filter((message) => {
        const key = getThreadKey(message);
        return key && !repliedThreadKeys.has(key) && !skippedThreadKeys.has(key);
      }),
    [messages, repliedThreadKeys, skippedThreadKeys],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.key === selectedTemplateKey),
    [selectedTemplateKey, templates],
  );

  const selectedCustomer = customerContext?.customer ?? null;
  const selectedRecipient = selectedMessage ? getReplyRecipient(selectedMessage) : "";
  const selectedThreadKey = selectedMessage ? getThreadKey(selectedMessage) : "";

  async function loadRecent() {
    if (!token) {
      return;
    }

    setLoadStatus("loading");
    setError("");

    try {
      const response = await getRecentMessages(token, {
        source,
        limit: config?.emailPageSize ?? DEFAULT_LIMIT,
        afterDate: formatDateForApi(startDate),
        beforeDate: formatExclusiveEndDateForApi(endDate),
      });
      const nextMessages = response.messages ?? [];
      setMessages(nextMessages);
      setSelectedMessage(nextMessages[0] ?? null);
      setCustomerContext(null);
      setLoadStatus("ready");
      setActionStatus(`Loaded ${nextMessages.length} ${source} messages.`);
    } catch (loadError) {
      setLoadStatus("error");
      setError(readError(loadError));
    }
  }

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function verifyAccess() {
      if (!isAdmin) {
        setGateStatus("error");
        setError("Admin access required.");
        return;
      }

      const result = await requireAdmin();
      if (!cancelled) {
        setGateStatus(result.allowed ? "ready" : "error");
        setError(result.allowed ? "" : result.error ?? "Admin access required.");
      }
    }

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  useEffect(() => {
    if (gateStatus !== "ready" || !token) {
      return;
    }

    const accessToken = token;
    let cancelled = false;

    async function bootstrap() {
      setLoadStatus("loading");
      setError("");

      try {
        const [
          nextConfig,
          nextProfile,
          templateResponse,
          repliedState,
          skippedState,
        ] = await Promise.all([
          getGenericReportsConfig(accessToken),
          getGmailProfile(accessToken),
          getReplyTemplates(accessToken),
          getThreadState(accessToken, "replied"),
          getThreadState(accessToken, "skipped"),
        ]);

        if (cancelled) {
          return;
        }

        setConfig(nextConfig);
        setGmailProfile(nextProfile);
        setTemplates(
          (templateResponse.templates ?? [])
            .filter((template) => template.enabled !== false)
            .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)),
        );
        setRepliedThreadKeys(new Set(repliedState.threadKeys ?? []));
        setSkippedThreadKeys(new Set(skippedState.threadKeys ?? []));

        const recentResponse = await getRecentMessages(accessToken, {
          source: "cached",
          limit: nextConfig.emailPageSize ?? DEFAULT_LIMIT,
        });

        if (!cancelled) {
          const nextMessages = recentResponse.messages ?? [];
          setMessages(nextMessages);
          setSelectedMessage(nextMessages[0] ?? null);
          setCustomerContext(null);
          setLoadStatus("ready");
          setActionStatus(`Loaded ${nextMessages.length} cached messages.`);
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setLoadStatus("error");
          setError(readError(bootstrapError));
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [gateStatus, token]);

  useEffect(() => {
    if (!token || !selectedMessage) {
      return;
    }

    const accessToken = token;
    const email = buildContextEmail(selectedMessage);
    if (!email) {
      return;
    }

    let cancelled = false;

    async function loadContext() {
      try {
        const context = await getCustomerContext(accessToken, email);
        if (!cancelled) {
          setCustomerContext(context);
        }
      } catch (contextError) {
        if (!cancelled) {
          setCustomerContext(null);
          setActionStatus(`Customer context unavailable: ${readError(contextError)}`);
        }
      }
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [selectedMessage, token]);

  function handleSelectMessage(message: SupportMessage) {
    setSelectedMessage(message);
    setCustomerContext(null);
    setSelectedTemplateKey("");
    setReplyText("");
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !searchEmail.trim()) {
      return;
    }

    setLoadStatus("loading");
    setError("");

    try {
      const response = await searchMessagesByEmail(token, searchEmail.trim(), 100);
      const nextMessages = response.messages ?? [];
      setMessages(nextMessages);
      setSelectedMessage(nextMessages[0] ?? null);
      setCustomerContext(null);
      setLoadStatus("ready");
      setActionStatus(`Found ${nextMessages.length} messages for ${searchEmail.trim()}.`);
    } catch (searchError) {
      setLoadStatus("error");
      setError(readError(searchError));
    }
  }

  function handlePhoneSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionStatus(
      `Phone search is not available yet. LaunchingStack returns 501 for ${phoneSearch.trim() || "this phone number"}.`,
    );
  }

  function handleApplyTemplate(templateKey: string) {
    setSelectedTemplateKey(templateKey);
    const template = templates.find((item) => item.key === templateKey);
    setReplyText(renderTemplateText(template, selectedMessage, selectedCustomer));
  }

  async function handleSendReply() {
    if (!token || !selectedMessage) {
      return;
    }

    const recipient = getReplyRecipient(selectedMessage);
    const subject = buildReplySubject(selectedMessage);
    const trimmedReply = replyText.trim();

    if (!recipient || !trimmedReply) {
      setActionStatus("Select a message and write a reply before sending.");
      return;
    }

    if (!window.confirm(`Send this reply to ${recipient}?`)) {
      return;
    }

    await runAction("Sending reply...", async () => {
      const headers = buildReplyHeaders(selectedMessage);
      const templateKey = selectedTemplate?.key ?? "";
      const result = await sendGmailReply(token, {
        to: recipient,
        bcc:
          templateKey === config?.stageOneTemplateKey
            ? config?.felicitariBccEmail
            : "",
        subject,
        text: trimmedReply,
        html: plainTextToHtml(trimmedReply),
        threadId: selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "",
        inReplyTo: headers.inReplyTo,
        references: headers.references,
        metadata: {
          templateKey,
          source: "genericreports_admin",
        },
      });

      await markThreadState(token, "replied", {
        threadKey: selectedThreadKey,
        recipientEmail: recipient,
        subject,
      });

      if (
        templateKey === config?.stageOneTemplateKey &&
        getCustomerPhone(selectedCustomer)
      ) {
        await addPhoneToAzureQueue(token, {
          phone: getCustomerPhone(selectedCustomer),
          queueId: config.felicitariAzureQueueId,
          reason: "felicitari-template-sent",
        });
      }

      setRepliedThreadKeys((current) => new Set([...current, selectedThreadKey]));
      setReplyText("");
      return `Reply sent${result.id ? `: ${result.id}` : ""}.`;
    });
  }

  async function handleSkip() {
    if (!token || !selectedMessage || !selectedThreadKey) {
      return;
    }

    if (!window.confirm("Mark this thread as skipped and hide it from the inbox?")) {
      return;
    }

    await runAction("Marking thread skipped...", async () => {
      await markThreadState(token, "skipped", {
        threadKey: selectedThreadKey,
        senderEmail: getReplyRecipient(selectedMessage),
        subject: selectedMessage.subject ?? "",
      });
      setSkippedThreadKeys((current) => new Set([...current, selectedThreadKey]));
      return "Thread marked as skipped.";
    });
  }

  async function handleMarkRead() {
    if (!token || !selectedMessage) {
      return;
    }

    if (!window.confirm("Mark this Gmail message or thread as read?")) {
      return;
    }

    await runAction("Marking read...", async () => {
      if (selectedMessage.threadId || selectedMessage.externalThreadId) {
        await markThreadRead(
          token,
          selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "",
        );
      } else {
        await markMessageRead(
          token,
          selectedMessage.messageId ?? selectedMessage.externalMessageId ?? "",
        );
      }
      return "Marked as read.";
    });
  }

  async function handleTrash() {
    if (!token || !selectedMessage) {
      return;
    }

    if (!window.confirm("Move this Gmail message or thread to trash?")) {
      return;
    }

    await runAction("Moving to trash...", async () => {
      if (selectedMessage.threadId || selectedMessage.externalThreadId) {
        await trashThread(
          token,
          selectedMessage.threadId ?? selectedMessage.externalThreadId ?? "",
        );
      } else {
        await trashMessage(
          token,
          selectedMessage.messageId ?? selectedMessage.externalMessageId ?? "",
        );
      }

      if (selectedThreadKey) {
        await markThreadState(token, "skipped", {
          threadKey: selectedThreadKey,
          senderEmail: getReplyRecipient(selectedMessage),
          subject: selectedMessage.subject ?? "",
        });
        setSkippedThreadKeys((current) => new Set([...current, selectedThreadKey]));
      }

      return "Moved to Gmail trash.";
    });
  }

  async function handleGenericUpdate() {
    if (!token || !selectedMessage || !selectedCustomer) {
      return;
    }

    const recipient = getReplyRecipient(selectedMessage);
    if (!recipient) {
      setActionStatus("No recipient found for this customer.");
      return;
    }

    if (!window.confirm(`Send a generic update email to ${recipient}?`)) {
      return;
    }

    await runAction("Sending generic update...", async () => {
      await sendGenericUpdateEmail(token, {
        to: recipient,
        customerName: getCustomerName(selectedCustomer, recipient),
        customerSinceLabel: getCustomerString(selectedCustomer, [
          "customerSinceLabel",
          "customerSince",
        ]),
        statusLabel: getCustomerString(selectedCustomer, ["statusLabel", "status"]),
      });
      return "Generic update sent.";
    });
  }

  async function handlePositiveDecision() {
    if (!token || !selectedMessage || !selectedCustomer) {
      return;
    }

    const customerEmail = buildContextEmail(selectedMessage);
    if (!customerEmail) {
      setActionStatus("No customer email found for this message.");
      return;
    }

    if (!window.confirm("Record Decizie Pozitiva for this customer?")) {
      return;
    }

    await runAction("Recording Decizie Pozitiva...", async () => {
      const eventAt = new Date().toISOString();
      await recordStageOneClosed(token, {
        customerEmail,
        customerName: getCustomerName(selectedCustomer, customerEmail),
        eventAt,
        sourceRecordId: `manual-stage-one:${customerEmail}:${eventAt}`,
        sourceParentId: selectedThreadKey,
        sourceSystem: "genericreports_admin_manual",
        sourceRecordType: "positive_decision_button",
        templateKey: "buttonUpdateDeciziePoz",
        mailboxEmail: config?.mailboxEmail ?? "oz@proveitweb.co.uk",
        description: "Positive decision manually marked from GenericReports",
        matchedTemplateFrom: "genericreports_admin_manual_button",
        metadata: {
          threadKey: selectedThreadKey,
          selectedSubject: selectedMessage.subject ?? "",
        },
      });
      return "Decizie Pozitiva recorded.";
    });
  }

  async function runAction(
    loadingMessage: string,
    action: () => Promise<string>,
  ) {
    setActionStatus(loadingMessage);
    setError("");

    try {
      const message = await action();
      setActionStatus(message);
    } catch (actionError) {
      setActionStatus("");
      setError(readError(actionError));
    }
  }

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  return (
    <>
      <Head>
        <title>Support Inbox | JustProveIt Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold tracking-tight">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <h1 className="mt-1 text-2xl font-extrabold">Support Inbox</h1>
              <p className="text-sm text-slate-600">
                {user?.email ?? "Admin"} · {config?.mailboxEmail ?? "GenericReports"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Admin home
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-4 py-6">
          {gateStatus === "loading" ? (
            <StatusPanel message="Checking admin access..." />
          ) : null}

          {gateStatus === "error" ? (
            <StatusPanel tone="error" message={error || "Admin access required."} />
          ) : null}

          {gateStatus === "ready" ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
                    <form className="flex gap-2" onSubmit={handleSearch}>
                      <input
                        type="email"
                        value={searchEmail}
                        onChange={(event) => setSearchEmail(event.target.value)}
                        placeholder="Search by customer email"
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                      >
                        Search
                      </button>
                    </form>

                    <form className="flex gap-2" onSubmit={handlePhoneSearch}>
                      <input
                        type="tel"
                        value={phoneSearch}
                        onChange={(event) => setPhoneSearch(event.target.value)}
                        placeholder="Phone search unavailable"
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-100"
                      >
                        Check
                      </button>
                    </form>

                    <select
                      value={source}
                      onChange={(event) => setSource(event.target.value as SourceMode)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="cached">Cached</option>
                      <option value="live">Live</option>
                      <option value="merged">Merged</option>
                    </select>

                    <button
                      type="button"
                      onClick={loadRecent}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Start date
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      End date
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SummaryTile
                    title="Gmail"
                    value={
                      gmailProfile?.connected
                        ? gmailProfile.emailAddress
                        : "Not connected"
                    }
                  />
                  <SummaryTile
                    title="Messages"
                    value={`${visibleMessages.length} visible`}
                    detail={`${messages.length} loaded`}
                  />
                </div>
              </section>

              {error ? <StatusPanel tone="error" message={error} /> : null}
              {actionStatus ? <StatusPanel message={actionStatus} /> : null}

              <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr_380px]">
                <MessageList
                  messages={visibleMessages}
                  selectedMessage={selectedMessage}
                  loadStatus={loadStatus}
                  onSelect={handleSelectMessage}
                />

                <MessagePreview message={selectedMessage} />

                <CustomerPanel
                  customer={selectedCustomer}
                  context={customerContext}
                  selectedMessage={selectedMessage}
                />
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold">Reply</h2>
                      <p className="text-sm text-slate-600">
                        To: {selectedRecipient || "Select a message first"}
                      </p>
                    </div>
                    <select
                      value={selectedTemplateKey}
                      onChange={(event) => handleApplyTemplate(event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                    >
                      <option value="">Choose template</option>
                      {templates.map((template) => (
                        <option key={template.key} value={template.key}>
                          {getTemplateLabel(template)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    rows={12}
                    className="mt-4 w-full rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                    placeholder="Write a reply or choose a template."
                  />
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-lg font-extrabold">Actions</h2>
                  <div className="mt-4 grid gap-3">
                    <ActionButton onClick={handleSendReply} disabled={!selectedMessage}>
                      Send reply
                    </ActionButton>
                    <ActionButton onClick={handleSkip} disabled={!selectedMessage}>
                      No reply from here
                    </ActionButton>
                    <ActionButton onClick={handleMarkRead} disabled={!selectedMessage}>
                      Mark read
                    </ActionButton>
                    <ActionButton
                      onClick={handleTrash}
                      disabled={!selectedMessage}
                      tone="danger"
                    >
                      Delete / trash
                    </ActionButton>
                    <ActionButton
                      onClick={handleGenericUpdate}
                      disabled={!selectedMessage || !selectedCustomer}
                    >
                      Generic update
                    </ActionButton>
                    <ActionButton
                      onClick={handlePositiveDecision}
                      disabled={!selectedMessage || !selectedCustomer}
                    >
                      Update Decizie Pozitiva
                    </ActionButton>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}

function MessageList({
  messages,
  selectedMessage,
  loadStatus,
  onSelect,
}: {
  messages: SupportMessage[];
  selectedMessage: SupportMessage | null;
  loadStatus: LoadStatus;
  onSelect: (message: SupportMessage) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">Messages</h2>
        <p className="text-sm text-slate-600">
          {loadStatus === "loading" ? "Loading..." : `${messages.length} actionable`}
        </p>
      </div>
      <div className="max-h-[720px] overflow-y-auto">
        {messages.length ? (
          messages.map((message, index) => {
            const selected = getMessageId(message, index) === getMessageId(selectedMessage, 0);
            return (
              <button
                type="button"
                key={getMessageId(message, index)}
                onClick={() => onSelect(message)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-emerald-50 ${
                  selected ? "bg-emerald-50" : "bg-white"
                }`}
              >
                <p className="truncate text-sm font-extrabold">
                  {message.fromDisplayName || message.fromEmail || message.from || "Unknown sender"}
                </p>
                <p className="mt-1 truncate text-sm text-slate-800">
                  {message.subject || "(no subject)"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDisplayDate(message.sentAtUtc ?? message.date ?? message.createdAtUtc)}
                </p>
              </button>
            );
          })
        ) : (
          <p className="p-4 text-sm text-slate-600">No messages to show.</p>
        )}
      </div>
    </section>
  );
}

function MessagePreview({ message }: { message: SupportMessage | null }) {
  const html = message?.bodyHtml?.trim();
  const text = message?.body?.trim() || message?.snippet?.trim() || "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">
          {message?.subject || "Select a message"}
        </h2>
        {message ? (
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <MetaLine label="From" value={message.from ?? message.fromEmail ?? ""} />
            <MetaLine label="To" value={message.to ?? ""} />
            <MetaLine label="Date" value={formatDisplayDate(message.sentAtUtc ?? message.date)} />
          </dl>
        ) : null}
      </div>

      <div className="p-4">
        {message ? (
          <>
            {html ? (
              <iframe
                title="Email body"
                sandbox=""
                srcDoc={html}
                className="h-[520px] w-full rounded-md border border-slate-200 bg-white"
              />
            ) : (
              <pre className="max-h-[520px] whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                {text || "No email body available."}
              </pre>
            )}

            {message.attachments?.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-extrabold">Attachments</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {message.attachments.map((attachment) => (
                    <li key={`${attachment.attachmentId}-${attachment.filename}`}>
                      {attachment.filename || "Attachment"} · {attachment.mimeType || "file"}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-600">Choose an email from the list.</p>
        )}
      </div>
    </section>
  );
}

function CustomerPanel({
  customer,
  context,
  selectedMessage,
}: {
  customer: Record<string, unknown> | null;
  context: CustomerContextResponse | null;
  selectedMessage: SupportMessage | null;
}) {
  const email = selectedMessage ? buildContextEmail(selectedMessage) : "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-extrabold">Customer</h2>
        <p className="text-sm text-slate-600">{email || "No customer selected"}</p>
      </div>

      <div className="space-y-4 p-4">
        {customer ? (
          <>
            <CustomerMetric
              title="Name"
              value={getCustomerName(customer, email) || "Unknown"}
            />
            <CustomerMetric
              title="Status"
              value={getCustomerString(customer, ["statusLabel", "status"]) || "-"}
            />
            <CustomerMetric
              title="Customer since"
              value={
                getCustomerString(customer, ["customerSinceLabel", "customerSince"]) ||
                "-"
              }
            />
            <CustomerMetric
              title="Phone"
              value={getCustomerPhone(customer) || "-"}
            />
            <CustomerMetric
              title="Positive decision"
              value={hasPositiveDecision(customer) ? "Yes" : "No"}
            />
            <CustomerMetric
              title="Finance companies"
              value={joinCaseValues(customer, ["financeCompany", "company", "lender"])}
            />
            <CustomerMetric
              title="Car registrations"
              value={joinCaseValues(customer, ["carReg", "registration", "vrm"])}
            />
            <CustomerMetric
              title="Payments"
              value={summarizePayments(customer)}
            />
          </>
        ) : context ? (
          <p className="text-sm text-slate-600">No customer record was returned.</p>
        ) : (
          <p className="text-sm text-slate-600">
            Customer context loads when you select a message.
          </p>
        )}
      </div>
    </section>
  );
}

function SummaryTile({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-base font-extrabold">{value}</p>
      {detail ? <p className="mt-1 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}

function StatusPanel({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "info" | "error";
}) {
  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm font-semibold ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {message}
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-2">
      <dt className="font-bold">{label}</dt>
      <dd className="break-words">{value || "-"}</dd>
    </div>
  );
}

function CustomerMetric({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 ${
        tone === "danger"
          ? "bg-red-900 text-white hover:bg-red-950"
          : "bg-emerald-700 text-white hover:bg-emerald-800"
      }`}
    >
      {children}
    </button>
  );
}

function getMessageId(message: SupportMessage | null, index: number) {
  return (
    message?.id ??
    message?._id ??
    message?.messageId ??
    message?.externalMessageId ??
    `${message?.threadId ?? "message"}-${index}`
  );
}

function getThreadKey(message: SupportMessage) {
  const threadId = message.threadId ?? message.externalThreadId;
  if (threadId) {
    return `thread:${threadId}`;
  }

  const messageId =
    message.messageId ?? message.externalMessageId ?? message.id ?? message._id;
  return messageId ? `message:${messageId}` : "";
}

function getReplyRecipient(message: SupportMessage) {
  return (
    message.fromEmail ??
    parseEmailAddress(message.from ?? "") ??
    parseEmailAddress(message.replyTo ?? "") ??
    ""
  );
}

function buildContextEmail(message: SupportMessage) {
  return getReplyRecipient(message).toLowerCase();
}

function parseEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  const candidate = (match?.[1] ?? value).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : "";
}

function buildReplySubject(message: SupportMessage) {
  const subject = message.subject?.trim() || "(no subject)";
  return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function buildReplyHeaders(message: SupportMessage) {
  const headers = message.headers ?? {};
  const inReplyTo =
    headers["Message-ID"] ?? headers["Message-Id"] ?? message.messageId ?? "";
  const references = [headers.References, inReplyTo].filter(Boolean).join(" ");

  return { inReplyTo, references };
}

function renderTemplateText(
  template: ReplyTemplate | undefined,
  message: SupportMessage | null,
  customer: Record<string, unknown> | null,
) {
  if (!template) {
    return "";
  }

  const raw =
    template.plainText ?? template.text ?? template.body ?? stripHtml(template.html ?? "");
  const fallbackEmail = message ? buildContextEmail(message) : "";
  const firstName = getCustomerName(customer, fallbackEmail).split(" ")[0];

  return raw
    .replaceAll("{{firstName}}", firstName)
    .replaceAll("{firstName}", firstName)
    .replaceAll("{{customerName}}", getCustomerName(customer, firstName))
    .replaceAll("{{email}}", message ? buildContextEmail(message) : "");
}

function getTemplateLabel(template: ReplyTemplate) {
  return template.label ?? template.name ?? template.title ?? template.key;
}

function stripHtml(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").trim();
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDisplayDate(value?: string) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateForApi(value: string) {
  return value ? value.replaceAll("-", "/") : undefined;
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
  ].join("/");
}

function getCustomerString(
  customer: Record<string, unknown> | null,
  keys: string[],
) {
  if (!customer) {
    return "";
  }

  for (const key of keys) {
    const value = customer[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getCustomerName(customer: Record<string, unknown> | null, fallback = "") {
  return (
    getCustomerString(customer, [
      "customerName",
      "displayName",
      "fullName",
      "name",
      "firstName",
    ]) || fallback
  );
}

function getCustomerPhone(customer: Record<string, unknown> | null) {
  const direct = getCustomerString(customer, ["phoneNumber", "phone", "mobile"]);
  if (direct) {
    return direct;
  }

  const phones = customer?.phones;
  return Array.isArray(phones) && typeof phones[0] === "string" ? phones[0] : "";
}

function hasPositiveDecision(customer: Record<string, unknown>) {
  return Boolean(
    customer.hasPositiveDecision ||
      customer.positiveDecision ||
      customer.stageOneClosed ||
      getCustomerString(customer, ["statusLabel", "status"])
        .toLowerCase()
        .includes("decizie"),
  );
}

function joinCaseValues(customer: Record<string, unknown>, keys: string[]) {
  const cases = customer.carFinanceCases;
  if (!Array.isArray(cases)) {
    return "-";
  }

  const values = new Set<string>();
  cases.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    keys.forEach((key) => {
      const value = (item as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        values.add(value.trim());
      }
    });
  });

  return values.size ? Array.from(values).join(", ") : "-";
}

function summarizePayments(customer: Record<string, unknown>) {
  const payments = customer.successfulPayments;
  if (!Array.isArray(payments) || !payments.length) {
    return "-";
  }

  const total = payments.reduce((sum, payment) => {
    if (!payment || typeof payment !== "object") {
      return sum;
    }
    const amount = Number((payment as Record<string, unknown>).amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  return `${payments.length} payments${total ? ` · £${total.toFixed(2)}` : ""}`;
}

function readError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}
