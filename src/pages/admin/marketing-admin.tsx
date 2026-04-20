import { useAuth } from "@/context/AuthContext";
import {
  connectFacebookMarketingPage,
  FacebookDashboard,
  FacebookLiveConnection,
  FacebookLivePagePost,
  FacebookOAuthPage,
  FacebookOAuthPayload,
  getApiOrigin,
  getFacebookMarketingAuthUrl,
  getFacebookMarketingDashboard,
  PublishedFacebookPost,
  saveFacebookContentSettings,
  ScheduledFacebookPost,
} from "@/lib/marketingAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type LoadStatus = "idle" | "loading" | "ready" | "error";

const PROVEIT_CONTEXT_BRIEF = `You are creating Facebook content for the ProveIt page.

Business summary:
ProveIt helps people in the UK understand and pursue potential car finance mis-selling claims. The page should make a complex topic feel clear, credible, and actionable for ordinary consumers.

Audience:
Adults in the UK who used PCP or HP car finance and may have been affected by hidden commissions, unfair finance structures, or unclear lender-dealer relationships. Many are not legally confident and need plain-English guidance.

Objectives:
Build trust, educate readers, explain eligibility clearly, keep the audience informed about FCA developments, and encourage qualified users to check whether they may have a valid claim.

Core subjects:
Car finance mis-selling, discretionary commission arrangements, hidden commissions, PCP and HP agreements, consumer rights, FCA updates, complaint process, and practical next steps.

Secondary subjects:
Common misconceptions, supporting documents people may need, timelines, what lenders may say, and what customers should do next.

Offer / CTA:
Encourage users to learn more, understand whether they may be eligible, and take the next step with ProveIt.

Tone of voice:
Clear, trustworthy, practical, calm, and supportive.

Style rules:
- Write for Facebook, not for a legal memo.
- Make the content useful first and promotional second.
- Prefer short paragraphs, strong hooks, and direct explanations.
- Avoid hype, legal overpromises, and jargon without explanation.`;

const PROVEIT_GENERATION_COMMAND = `Using the page context above, generate Facebook posts for ProveIt.

Requirements:
- Mix educational, myth-busting, trust-building, news-reaction, engagement, and soft-conversion posts.
- Explain concepts in simple language for non-experts.
- Avoid repeating the same hook or CTA pattern.
- Keep each post concise, readable, and natural for Facebook.
- Use a soft CTA only when it fits naturally.

For each post, provide:
1. Post goal
2. Hook
3. Final post text
4. Suggested image idea
5. Suggested CTA`;

function getDefaultContentSettings(pageName?: string | null) {
  if ((pageName ?? "").trim().toLowerCase() === "proveit") {
    return {
      postingBriefDocument: PROVEIT_CONTEXT_BRIEF,
      generationCommand: PROVEIT_GENERATION_COMMAND,
    };
  }

  return {
    postingBriefDocument: "",
    generationCommand: "",
  };
}

export default function MarketingAdminPage() {
  const router = useRouter();
  const { status, token, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
  const [actionStatus, setActionStatus] = useState("");
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<FacebookDashboard | null>(null);
  const [oauthPayload, setOauthPayload] = useState<FacebookOAuthPayload | null>(null);
  const [manualPageId, setManualPageId] = useState("");
  const [manualPageName, setManualPageName] = useState("");
  const [manualProfileName, setManualProfileName] = useState("");
  const [manualAccessToken, setManualAccessToken] = useState("");
  const [manualUserAccessToken, setManualUserAccessToken] = useState("");
  const [contentSettings, setContentSettings] = useState<
    Record<string, { postingBriefDocument: string; generationCommand: string }>
  >({});

  const oauthPages = useMemo(
    () => (Array.isArray(oauthPayload?.pages) ? oauthPayload.pages : []),
    [oauthPayload],
  );

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
        setGateError("Admin access required.");
        return;
      }

      const result = await requireAdmin();
      if (!cancelled) {
        setGateStatus(result.allowed ? "allowed" : "denied");
        setGateError(result.allowed ? "" : result.error ?? "Admin access required.");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  useEffect(() => {
    if (gateStatus !== "allowed" || !token) {
      return;
    }

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateStatus, token]);

  useEffect(() => {
    const connections = dashboard?.connections ?? [];
    if (!connections.length) {
      return;
    }

    setContentSettings((current) => {
      const next = { ...current };

      for (const connection of connections) {
        if (next[connection.Id]) {
          continue;
        }

        const fallback = getDefaultContentSettings(connection.ProfileName ?? connection.PageName);
        next[connection.Id] = {
          postingBriefDocument: connection.PostingBriefDocument ?? fallback.postingBriefDocument,
          generationCommand: connection.GenerationCommand ?? fallback.generationCommand,
        };
      }

      return next;
    });
  }, [dashboard]);

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (event.origin !== getApiOrigin()) {
        return;
      }

      if (event.data?.source !== "launchingstack-facebook-oauth") {
        return;
      }

      setOauthPayload(event.data.payload ?? null);
      setActionStatus("Facebook account connected. Select one or more pages to link.");
    }

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoadStatus("loading");
    setError("");
    try {
      setDashboard(await getFacebookMarketingDashboard(token));
      setLoadStatus("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load marketing dashboard.");
      setLoadStatus("error");
    }
  }

  async function startFacebookConnect() {
    if (!token) {
      return;
    }

    setActionStatus("Opening Meta connection...");
    setError("");
    try {
      const response = await getFacebookMarketingAuthUrl(token);
      if (!response.authUrl) {
        throw new Error("The Facebook auth URL was not returned.");
      }

      const popup = window.open(
        response.authUrl,
        "justproveit-facebook-oauth",
        "popup=yes,width=680,height=780",
      );
      if (!popup) {
        throw new Error("Popup blocked. Allow popups and try again.");
      }
      setActionStatus("Complete Meta sign-in in the popup window.");
    } catch (connectError) {
      setActionStatus("");
      setError(connectError instanceof Error ? connectError.message : "Could not start Facebook connection.");
    }
  }

  async function connectPage(page: FacebookOAuthPage) {
    if (!token || !oauthPayload?.userAccessToken) {
      return;
    }

    setActionStatus(`Linking ${page.name}...`);
    setError("");
    try {
      await connectFacebookMarketingPage(token, {
        pageId: page.id,
        pageName: page.name,
        userAccessToken: oauthPayload.userAccessToken,
        profileName: page.name,
      });
      setActionStatus(`${page.name} linked.`);
      await loadDashboard();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Could not link this Facebook Page.");
      setActionStatus("");
    }
  }

  async function handleManualConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (!manualAccessToken.trim() && !manualUserAccessToken.trim()) {
      setActionStatus("");
      setError("Provide either a long-lived user access token or a page access token.");
      return;
    }

    setActionStatus("Saving Facebook Page connection...");
    setError("");

    try {
      await connectFacebookMarketingPage(token, {
        pageId: manualPageId.trim(),
        pageName: manualPageName.trim(),
        accessToken: manualAccessToken.trim() || undefined,
        userAccessToken: manualUserAccessToken.trim() || undefined,
        profileName: manualProfileName.trim() || manualPageName.trim(),
      });

      setActionStatus(`${manualPageName.trim() || "Facebook Page"} connected.`);
      setManualAccessToken("");
      setManualUserAccessToken("");
      await loadDashboard();
    } catch (connectError) {
      setActionStatus("");
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Could not save the Facebook Page connection.",
      );
    }
  }

  async function handleSaveContentSettings(
    event: FormEvent<HTMLFormElement>,
    connectionId: string,
    pageId: string,
    pageName: string,
  ) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const nextSettings = contentSettings[connectionId];
    if (!nextSettings) {
      return;
    }

    setActionStatus(`Saving content settings for ${pageName}...`);
    setError("");

    try {
      await saveFacebookContentSettings(token, {
        pageId,
        postingBriefDocument: nextSettings.postingBriefDocument,
        generationCommand: nextSettings.generationCommand,
      });
      setActionStatus(`Saved content settings for ${pageName}.`);
      await loadDashboard();
    } catch (saveError) {
      setActionStatus("");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save Facebook content settings.",
      );
    }
  }

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  return (
    <>
      <Head>
        <title>Marketing Admin | JustProveIt</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
        <div className="mx-auto w-full max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold tracking-tight">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <p className="mt-1 text-sm text-slate-600">Marketing admin</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin/support-inbox"
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Support inbox
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
            <StatusPanel message="Checking admin access..." />
          ) : null}

          {gateStatus === "denied" ? (
            <StatusPanel tone="error" message={gateError || "Admin access required."} />
          ) : null}

          {gateStatus === "allowed" ? (
            <section className="mt-8 space-y-6">
              <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                  Facebook pages
                </p>
                <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold">Marketing Admin</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      Link Facebook Pages, review the publishing queue, and monitor published post performance.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={startFacebookConnect}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                  >
                    Connect Facebook Page
                  </button>
                </div>
              </div>

              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-extrabold">Manual Page Connect</h2>
                  <p className="text-sm text-slate-600">
                    Paste the Facebook Page ID, page name, and either a long-lived user access token or a page access token to connect or refresh a page without using the popup flow.
                  </p>
                </div>

                <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={handleManualConnect}>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Page ID
                    </span>
                    <input
                      type="text"
                      value={manualPageId}
                      onChange={(event) => setManualPageId(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      placeholder="355430748880129"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Page name
                    </span>
                    <input
                      type="text"
                      value={manualPageName}
                      onChange={(event) => setManualPageName(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      placeholder="ProveIt"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Profile name
                    </span>
                    <input
                      type="text"
                      value={manualProfileName}
                      onChange={(event) => setManualProfileName(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      placeholder="ProveIt"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Long-lived user access token
                    </span>
                    <textarea
                      value={manualUserAccessToken}
                      onChange={(event) => setManualUserAccessToken(event.target.value)}
                      className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      placeholder="EAAB... preferred when available"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Page access token
                    </span>
                    <textarea
                      value={manualAccessToken}
                      onChange={(event) => setManualAccessToken(event.target.value)}
                      className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      placeholder="EAAB... optional if you use the user token above"
                    />
                  </label>

                  <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Saving the same page again updates the stored token and refreshes live reads. Prefer the long-lived user token when possible.
                    </p>
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Save page token
                    </button>
                  </div>
                </form>
              </section>

              {actionStatus ? <StatusPanel tone="success" message={actionStatus} compact /> : null}
              {error ? <StatusPanel tone="error" message={error} compact /> : null}

              {oauthPages.length ? (
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-extrabold">Pages from Meta</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {oauthPages.map((page) => (
                      <article key={page.id} className="rounded-lg border border-slate-200 p-4">
                        <h3 className="font-extrabold">{page.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{page.category ?? page.id}</p>
                        <p className="mt-3 min-h-10 text-sm text-slate-600">
                          {(page.tasks ?? []).join(", ") || "No task metadata returned."}
                        </p>
                        <button
                          type="button"
                          onClick={() => connectPage(page)}
                          className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
                        >
                          Link page
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <DashboardContent
                dashboard={dashboard}
                contentSettings={contentSettings}
                loadStatus={loadStatus}
                onContentSettingsChange={setContentSettings}
                onRefresh={loadDashboard}
                onSaveContentSettings={handleSaveContentSettings}
              />
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

function DashboardContent({
  contentSettings,
  dashboard,
  loadStatus,
  onContentSettingsChange,
  onRefresh,
  onSaveContentSettings,
}: {
  contentSettings: Record<string, { postingBriefDocument: string; generationCommand: string }>;
  dashboard: FacebookDashboard | null;
  loadStatus: LoadStatus;
  onContentSettingsChange: React.Dispatch<
    React.SetStateAction<Record<string, { postingBriefDocument: string; generationCommand: string }>>
  >;
  onRefresh: () => void;
  onSaveContentSettings: (
    event: FormEvent<HTMLFormElement>,
    connectionId: string,
    pageId: string,
    pageName: string,
  ) => Promise<void>;
}) {
  const summary = dashboard?.summary ?? {};
  const connections = dashboard?.connections ?? [];
  const liveConnections = dashboard?.liveConnections ?? [];
  const recentPagePosts = dashboard?.recentPagePosts ?? [];
  const scheduledPosts = dashboard?.scheduledPosts ?? [];
  const publishedPosts = dashboard?.publishedPosts ?? [];

  if (loadStatus === "loading") {
    return <StatusPanel message="Loading marketing dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <MetricCard title="Pages" value={summary.connectedPages ?? 0} />
        <MetricCard title="Followers" value={summary.followers ?? 0} />
        <MetricCard title="Fans" value={summary.fans ?? 0} />
        <MetricCard title="Live posts" value={summary.livePosts ?? 0} />
        <MetricCard title="Scheduled" value={summary.scheduledPosts ?? 0} />
        <MetricCard title="Published" value={summary.publishedPosts ?? 0} />
        <MetricCard title="Likes" value={summary.likes ?? 0} />
        <MetricCard title="Reactions" value={summary.reactions ?? 0} />
        <MetricCard title="Comments" value={summary.comments ?? 0} />
        <MetricCard title="Shares" value={summary.shares ?? 0} />
        <MetricCard title="Engaged" value={summary.engagedUsers ?? 0} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-extrabold">Connected Pages</h2>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-100"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connections.length ? (
            connections.map((connection) => (
              <article key={connection.Id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="font-extrabold">{connection.ProfileName ?? connection.PageName ?? "Facebook Page"}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{connection.PageId}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <StatItem label="Scheduled" value={connection.ScheduledCount ?? 0} />
                  <StatItem label="Published" value={connection.PublishedCount ?? 0} />
                  <StatItem label="Status" value={connection.IsEnabled ? "Enabled" : "Disabled"} />
                  <StatItem label="Updated" value={formatDate(connection.UpdatedAtUtc)} />
                </dl>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No Facebook Pages are linked yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold">Page Content Settings</h2>
        <div className="mt-4 space-y-6">
          {connections.length ? (
            connections.map((connection) => {
              const pageId = connection.PageId ?? "";
              const pageName = connection.ProfileName ?? connection.PageName ?? "Facebook Page";
              const settings =
                contentSettings[connection.Id] ??
                getDefaultContentSettings(connection.ProfileName ?? connection.PageName);

              return (
                <form
                  key={connection.Id}
                  className="rounded-lg border border-slate-200 p-4"
                  onSubmit={(event) =>
                    onSaveContentSettings(event, connection.Id, pageId, pageName)
                  }
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-extrabold">{pageName}</h3>
                    <p className="text-xs font-semibold text-slate-500">{pageId || "-"}</p>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Broader context brief
                      </span>
                      <textarea
                        value={settings.postingBriefDocument}
                        onChange={(event) =>
                          onContentSettingsChange((current) => ({
                            ...current,
                            [connection.Id]: {
                              ...settings,
                              postingBriefDocument: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 min-h-56 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Post generation command
                      </span>
                      <textarea
                        value={settings.generationCommand}
                        onChange={(event) =>
                          onContentSettingsChange((current) => ({
                            ...current,
                            [connection.Id]: {
                              ...settings,
                              generationCommand: event.target.value,
                            },
                          }))
                        }
                        className="mt-1 min-h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      These texts are stored per page. The broader context already plugs into the existing social profile storage, and the generation command is now saved alongside the page configuration for later use.
                    </p>
                    <button
                      type="submit"
                      className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      Save content settings
                    </button>
                  </div>
                </form>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">Connect a Facebook Page to configure its content brief and generation command.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold">Live Page Insights</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {liveConnections.length ? (
            liveConnections.map((connection) => (
              <LiveConnectionCard key={connection.connectionId} connection={connection} />
            ))
          ) : (
            <p className="text-sm text-slate-600">Connect a Facebook Page to load live follower and recent post data.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <LivePagePostList posts={recentPagePosts} />
        <PostList title="Scheduled posts" posts={scheduledPosts} mode="scheduled" />
      </section>

      <section className="grid gap-6 xl:grid-cols-1">
        <PostList title="Published performance" posts={publishedPosts} mode="published" />
      </section>
    </div>
  );
}

function LiveConnectionCard({ connection }: { connection: FacebookLiveConnection }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        {connection.pictureUrl ? (
          <img
            src={connection.pictureUrl}
            alt={connection.profileName ?? connection.pageName ?? "Facebook page"}
            className="h-12 w-12 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-sm font-bold text-slate-500">
            FB
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-extrabold">
            {connection.profileName ?? connection.pageName ?? "Facebook Page"}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{connection.pageId ?? "-"}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <StatItem label="Followers" value={connection.followersCount ?? 0} />
        <StatItem label="Fans" value={connection.fanCount ?? 0} />
        <StatItem label="Latest post" value={formatDate(connection.latestPostAtUtc)} />
        <StatItem label="Status" value={connection.error ? "Attention" : "Live"} />
      </dl>
      {connection.error ? (
        <p className="mt-3 text-sm text-amber-700">{connection.error}</p>
      ) : connection.pageLink ? (
        <a
          href={connection.pageLink}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          Open page
        </a>
      ) : null}
    </article>
  );
}

function LivePagePostList({ posts }: { posts: FacebookLivePagePost[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold">Recent Live Posts</h2>
      <div className="mt-4 space-y-4">
        {posts.length ? (
          posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold">
                    {post.profileName ?? post.pageName ?? "Facebook post"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDate(post.createdTimeUtc)}
                  </p>
                </div>
                {post.permalinkUrl ? (
                  <a
                    href={post.permalinkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    View post
                  </a>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                {post.message?.trim() || "This post does not include message text."}
              </p>
              <dl className="mt-4 grid grid-cols-4 gap-3 text-sm">
                <StatItem label="Likes" value={post.likesCount ?? 0} />
                <StatItem label="Reactions" value={post.reactionsCount ?? 0} />
                <StatItem label="Comments" value={post.commentsCount ?? 0} />
                <StatItem label="Shares" value={post.sharesCount ?? 0} />
              </dl>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">No recent live Facebook posts yet.</p>
        )}
      </div>
    </section>
  );
}

function PostList({
  title,
  posts,
  mode,
}: {
  title: string;
  posts: ScheduledFacebookPost[] | PublishedFacebookPost[];
  mode: "scheduled" | "published";
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <div className="mt-4 space-y-4">
        {posts.length ? (
          posts.map((post) => (
            <article key={post.Id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold">
                    {"CustomTitle" in post && post.CustomTitle
                      ? post.CustomTitle
                      : post.SocialProfileName ?? post.PageName ?? "Facebook post"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {mode === "scheduled"
                      ? `Scheduled ${formatDate((post as ScheduledFacebookPost).ScheduledForUtc)}`
                      : `Published ${formatDate((post as PublishedFacebookPost).PublishedAtUtc)}`}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {post.PageName ?? post.SocialProfileName ?? "Facebook"}
                </span>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-700">
                {"PostText" in post ? post.PostText : (post as PublishedFacebookPost).PublishedText}
              </p>
              {mode === "published" ? (
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <StatItem label="Reactions" value={(post as PublishedFacebookPost).ReactionsCount ?? 0} />
                  <StatItem label="Comments" value={(post as PublishedFacebookPost).CommentsCount ?? 0} />
                  <StatItem label="Shares" value={(post as PublishedFacebookPost).SharesCount ?? 0} />
                </dl>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">No posts to show yet.</p>
        )}
      </div>
    </section>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-extrabold">{value.toLocaleString()}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-extrabold text-slate-900">{value}</dd>
    </div>
  );
}

function StatusPanel({
  message,
  tone = "neutral",
  compact = false,
}: {
  message: string;
  tone?: "neutral" | "success" | "error";
  compact?: boolean;
}) {
  const toneClass =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-950"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <section className={`mt-6 rounded-lg border p-4 shadow-sm ${toneClass} ${compact ? "mt-0" : ""}`}>
      <p className="text-sm font-semibold">{message}</p>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
