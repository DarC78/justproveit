import { useAuth } from "@/context/AuthContext";
import {
  connectFacebookMarketingPage,
  connectFacebookMarketingAdAccount,
  FacebookComment,
  FacebookAdAccountOption,
  FacebookDashboard,
  FacebookLiveConnection,
  FacebookLivePagePost,
  FacebookOAuthPage,
  FacebookOAuthPayload,
  getApiOrigin,
  getFacebookMarketingAuthUrl,
  getFacebookMarketingComments,
  getFacebookMarketingDashboard,
  generateFacebookDrafts,
  generateManualFacebookDrafts,
  PublishedFacebookPost,
  queueManualFacebookDrafts,
  saveFacebookContentSettings,
  ScheduledFacebookPost,
  syncFacebookAdPosts,
  syncFacebookComments,
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
  const [draftCount, setDraftCount] = useState(1);
  const [manualDraftCount, setManualDraftCount] = useState(1);
  const [manualPostSpecs, setManualPostSpecs] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("all");
  const [showConnectPanel, setShowConnectPanel] = useState(false);
  const [showConnectionsSection, setShowConnectionsSection] = useState(false);
  const [showPageStatsSection, setShowPageStatsSection] = useState(false);
  const [showPublishingSection, setShowPublishingSection] = useState(false);
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [syncAction, setSyncAction] = useState("");
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [selectedManualDraftIds, setSelectedManualDraftIds] = useState<string[]>([]);
  const [contentSettings, setContentSettings] = useState<
    Record<string, { postingBriefDocument: string; generationCommand: string }>
  >({});

  const oauthPages = useMemo(
    () => (Array.isArray(oauthPayload?.pages) ? oauthPayload.pages : []),
    [oauthPayload],
  );
  const oauthAdAccounts = useMemo(
    () => (Array.isArray(oauthPayload?.adAccounts) ? oauthPayload.adAccounts : []),
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
    if (gateStatus !== "allowed" || !token) {
      return;
    }

    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateStatus, token, selectedConnectionId]);

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
    setSelectedManualDraftIds([]);
  }, [selectedConnectionId, dashboard]);

  useEffect(() => {
    const connections = dashboard?.connections ?? [];
    if (!connections.length) {
      setSelectedConnectionId("all");
      return;
    }

    setSelectedConnectionId((current) =>
      current === "all" || connections.some((connection) => connection.Id === current)
        ? current
        : connections[0]?.Id ?? "all",
    );
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
      setActionStatus("Facebook account connected. Select the pages and ad accounts you want to link.");
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

  async function loadComments() {
    if (!token) {
      return;
    }

    try {
      const response = await getFacebookMarketingComments(token, {
        socialConnectionId: selectedConnectionId === "all" ? undefined : selectedConnectionId,
        limit: 150,
      });
      setComments(response.comments ?? []);
    } catch {
      setComments([]);
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
      setShowConnectPanel(false);
      await loadDashboard();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Could not link this Facebook Page.");
      setActionStatus("");
    }
  }

  async function connectAdAccount(adAccount: FacebookAdAccountOption) {
    if (!token || !oauthPayload?.userAccessToken) {
      return;
    }

    setActionStatus(`Linking ad account ${adAccount.name}...`);
    setError("");
    try {
      await connectFacebookMarketingAdAccount(token, {
        accountId: adAccount.id,
        accountName: adAccount.name,
        userAccessToken: oauthPayload.userAccessToken,
        currency: adAccount.currency ?? undefined,
        timeZoneName: adAccount.timeZoneName ?? undefined,
      });
      setActionStatus(`${adAccount.name} ad account linked.`);
      await loadDashboard();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Could not link this Facebook Ads account.");
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
      setShowConnectPanel(false);
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

  async function handleGenerateDrafts() {
    if (!token || selectedConnectionId === "all") {
      return;
    }

    const selectedConnection = (dashboard?.connections ?? []).find(
      (connection) => connection.Id === selectedConnectionId,
    );
    const pageId = selectedConnection?.PageId;
    const pageName =
      selectedConnection?.ProfileName ?? selectedConnection?.PageName ?? "selected page";

    if (!pageId) {
      setActionStatus("");
      setError("Select a connected page before generating drafts.");
      return;
    }

    setActionStatus(`Generating ${draftCount} post draft${draftCount === 1 ? "" : "s"} for ${pageName}...`);
    setError("");

    try {
      const result = await generateFacebookDrafts(token, {
        pageId,
        draftCount,
      });
      setActionStatus(
        `Created ${result.drafted ?? 0} post draft${result.drafted === 1 ? "" : "s"} for ${pageName}.`,
      );
      await loadDashboard();
    } catch (generationError) {
      setActionStatus("");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate Facebook drafts.",
      );
    }
  }

  async function handleGenerateManualDrafts() {
    if (!token || selectedConnectionId === "all") {
      return;
    }

    const selectedConnection = (dashboard?.connections ?? []).find(
      (connection) => connection.Id === selectedConnectionId,
    );
    const pageId = selectedConnection?.PageId;
    const pageName =
      selectedConnection?.ProfileName ?? selectedConnection?.PageName ?? "selected page";

    if (!pageId) {
      setActionStatus("");
      setError("Select a connected page before generating manual posts.");
      return;
    }

    if (!manualPostSpecs.trim()) {
      setActionStatus("");
      setError("Add operator specs before generating manual posts.");
      return;
    }

    setActionStatus(`Generating ${manualDraftCount} manual post draft${manualDraftCount === 1 ? "" : "s"} for ${pageName}...`);
    setError("");

    try {
      const result = await generateManualFacebookDrafts(token, {
        pageId,
        draftCount: manualDraftCount,
        operatorSpecs: manualPostSpecs.trim(),
      });
      setActionStatus(
        `Created ${result.drafted ?? 0} manual post draft${result.drafted === 1 ? "" : "s"} for ${pageName}.`,
      );
      await loadDashboard();
    } catch (generationError) {
      setActionStatus("");
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate manual Facebook posts.",
      );
    }
  }

  async function handleQueueManualDrafts() {
    if (!token || selectedConnectionId === "all") {
      return;
    }

    const selectedConnection = (dashboard?.connections ?? []).find(
      (connection) => connection.Id === selectedConnectionId,
    );
    const pageId = selectedConnection?.PageId;
    const pageName =
      selectedConnection?.ProfileName ?? selectedConnection?.PageName ?? "selected page";

    if (!pageId) {
      setActionStatus("");
      setError("Select a connected page before queueing posts.");
      return;
    }

    if (!selectedManualDraftIds.length) {
      setActionStatus("");
      setError("Select at least one manual post draft to queue.");
      return;
    }

    setActionStatus(`Queueing ${selectedManualDraftIds.length} post${selectedManualDraftIds.length === 1 ? "" : "s"} for ${pageName}...`);
    setError("");

    try {
      const result = await queueManualFacebookDrafts(token, {
        pageId,
        draftIds: selectedManualDraftIds,
      });
      setActionStatus(
        `Queued ${result.queued ?? 0} post${result.queued === 1 ? "" : "s"} for ${pageName} with randomized spacing.`,
      );
      setSelectedManualDraftIds([]);
      await loadDashboard();
    } catch (queueError) {
      setActionStatus("");
      setError(
        queueError instanceof Error ? queueError.message : "Could not queue manual Facebook posts.",
      );
    }
  }

  function handleToggleManualDraftSelection(draftId: string) {
    setSelectedManualDraftIds((current) =>
      current.includes(draftId) ? current.filter((item) => item !== draftId) : [...current, draftId],
    );
  }

  async function handleImportAdPosts() {
    if (!token) {
      return;
    }

    setSyncAction("importing-ad-posts");
    setActionStatus("Importing Facebook ad-linked posts...");
    setError("");

    try {
      const result = await syncFacebookAdPosts(token);
      setActionStatus(
        `Imported ${result.importedPosts ?? 0} ad-linked post${result.importedPosts === 1 ? "" : "s"} across ${result.processedAccounts ?? 0} ad account${result.processedAccounts === 1 ? "" : "s"}.`,
      );
      await loadDashboard();
      await loadComments();
    } catch (syncError) {
      setActionStatus("");
      setError(
        syncError instanceof Error ? syncError.message : "Could not import Facebook ad-linked posts.",
      );
    } finally {
      setSyncAction("");
    }
  }

  async function handleSyncComments() {
    if (!token) {
      return;
    }

    setSyncAction("syncing-comments");
    setActionStatus("Syncing Facebook comments...");
    setError("");

    try {
      const result = await syncFacebookComments(token);
      const syncedComments = (result.items ?? []).reduce(
        (sum, item) => sum + Number(item.syncedComments ?? 0),
        0,
      );
      setActionStatus(
        `Synced ${syncedComments} comment${syncedComments === 1 ? "" : "s"} across ${result.processedPosts ?? 0} tracked post${result.processedPosts === 1 ? "" : "s"}.`,
      );
      await loadDashboard();
      await loadComments();
    } catch (syncError) {
      setActionStatus("");
      setError(syncError instanceof Error ? syncError.message : "Could not sync Facebook comments.");
    } finally {
      setSyncAction("");
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
                      Keep page connections, live stats, post scheduling, and comment work in separate focused sections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Refresh dashboard
                  </button>
                </div>
              </div>

              {actionStatus ? <StatusPanel tone="success" message={actionStatus} compact /> : null}
              {error ? <StatusPanel tone="error" message={error} compact /> : null}

              <DashboardContent
                dashboard={dashboard}
                contentSettings={contentSettings}
                loadStatus={loadStatus}
                selectedConnectionId={selectedConnectionId}
                onSelectedConnectionIdChange={setSelectedConnectionId}
                showConnectionsSection={showConnectionsSection}
                showPageStatsSection={showPageStatsSection}
                showPublishingSection={showPublishingSection}
                showCommentsSection={showCommentsSection}
                showConnectPanel={showConnectPanel}
                oauthPages={oauthPages}
                oauthAdAccounts={oauthAdAccounts}
                onContentSettingsChange={setContentSettings}
                onRefresh={loadDashboard}
                onStartFacebookConnect={startFacebookConnect}
                onConnectPage={connectPage}
                onConnectAdAccount={connectAdAccount}
                onManualConnect={handleManualConnect}
                onSaveContentSettings={handleSaveContentSettings}
                manualPageId={manualPageId}
                manualPageName={manualPageName}
                manualProfileName={manualProfileName}
                manualAccessToken={manualAccessToken}
                manualUserAccessToken={manualUserAccessToken}
                onManualPageIdChange={setManualPageId}
                onManualPageNameChange={setManualPageName}
                onManualProfileNameChange={setManualProfileName}
                onManualAccessTokenChange={setManualAccessToken}
                onManualUserAccessTokenChange={setManualUserAccessToken}
                draftCount={draftCount}
                onDraftCountChange={setDraftCount}
                onGenerateDrafts={handleGenerateDrafts}
                manualDraftCount={manualDraftCount}
                manualPostSpecs={manualPostSpecs}
                onManualDraftCountChange={setManualDraftCount}
                onManualPostSpecsChange={setManualPostSpecs}
                onGenerateManualDrafts={handleGenerateManualDrafts}
                selectedManualDraftIds={selectedManualDraftIds}
                onToggleManualDraftSelection={handleToggleManualDraftSelection}
                onQueueManualDrafts={handleQueueManualDrafts}
                onImportAdPosts={handleImportAdPosts}
                onSyncComments={handleSyncComments}
                comments={comments}
                onToggleConnectionsSection={() => setShowConnectionsSection((current) => !current)}
                onTogglePageStatsSection={() => setShowPageStatsSection((current) => !current)}
                onToggleConnectPanel={() => setShowConnectPanel((current) => !current)}
                onTogglePublishingSection={() => setShowPublishingSection((current) => !current)}
                onToggleCommentsSection={() => setShowCommentsSection((current) => !current)}
                syncAction={syncAction}
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
  selectedConnectionId,
  onSelectedConnectionIdChange,
  showConnectionsSection,
  showPageStatsSection,
  showPublishingSection,
  showCommentsSection,
  showConnectPanel,
  oauthPages,
  oauthAdAccounts,
  onContentSettingsChange,
  onRefresh,
  onStartFacebookConnect,
  onConnectPage,
  onConnectAdAccount,
  onManualConnect,
  onSaveContentSettings,
  manualPageId,
  manualPageName,
  manualProfileName,
  manualAccessToken,
  manualUserAccessToken,
  onManualPageIdChange,
  onManualPageNameChange,
  onManualProfileNameChange,
  onManualAccessTokenChange,
  onManualUserAccessTokenChange,
  draftCount,
  onDraftCountChange,
  onGenerateDrafts,
  manualDraftCount,
  manualPostSpecs,
  onManualDraftCountChange,
  onManualPostSpecsChange,
  onGenerateManualDrafts,
  selectedManualDraftIds,
  onToggleManualDraftSelection,
  onQueueManualDrafts,
  onImportAdPosts,
  onSyncComments,
  comments,
  onToggleConnectionsSection,
  onTogglePageStatsSection,
  onToggleConnectPanel,
  onTogglePublishingSection,
  onToggleCommentsSection,
  syncAction,
}: {
  contentSettings: Record<string, { postingBriefDocument: string; generationCommand: string }>;
  dashboard: FacebookDashboard | null;
  loadStatus: LoadStatus;
  selectedConnectionId: string;
  onSelectedConnectionIdChange: React.Dispatch<React.SetStateAction<string>>;
  showConnectionsSection: boolean;
  showPageStatsSection: boolean;
  showPublishingSection: boolean;
  showCommentsSection: boolean;
  showConnectPanel: boolean;
  oauthPages: FacebookOAuthPage[];
  oauthAdAccounts: FacebookAdAccountOption[];
  onContentSettingsChange: React.Dispatch<
    React.SetStateAction<Record<string, { postingBriefDocument: string; generationCommand: string }>>
  >;
  onRefresh: () => void;
  onStartFacebookConnect: () => Promise<void>;
  onConnectPage: (page: FacebookOAuthPage) => Promise<void>;
  onConnectAdAccount: (adAccount: FacebookAdAccountOption) => Promise<void>;
  onManualConnect: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSaveContentSettings: (
    event: FormEvent<HTMLFormElement>,
    connectionId: string,
    pageId: string,
    pageName: string,
  ) => Promise<void>;
  manualPageId: string;
  manualPageName: string;
  manualProfileName: string;
  manualAccessToken: string;
  manualUserAccessToken: string;
  onManualPageIdChange: React.Dispatch<React.SetStateAction<string>>;
  onManualPageNameChange: React.Dispatch<React.SetStateAction<string>>;
  onManualProfileNameChange: React.Dispatch<React.SetStateAction<string>>;
  onManualAccessTokenChange: React.Dispatch<React.SetStateAction<string>>;
  onManualUserAccessTokenChange: React.Dispatch<React.SetStateAction<string>>;
  draftCount: number;
  onDraftCountChange: React.Dispatch<React.SetStateAction<number>>;
  onGenerateDrafts: () => Promise<void>;
  manualDraftCount: number;
  manualPostSpecs: string;
  onManualDraftCountChange: React.Dispatch<React.SetStateAction<number>>;
  onManualPostSpecsChange: React.Dispatch<React.SetStateAction<string>>;
  onGenerateManualDrafts: () => Promise<void>;
  selectedManualDraftIds: string[];
  onToggleManualDraftSelection: (draftId: string) => void;
  onQueueManualDrafts: () => Promise<void>;
  onImportAdPosts: () => Promise<void>;
  onSyncComments: () => Promise<void>;
  comments: FacebookComment[];
  onToggleConnectionsSection: () => void;
  onTogglePageStatsSection: () => void;
  onToggleConnectPanel: () => void;
  onTogglePublishingSection: () => void;
  onToggleCommentsSection: () => void;
  syncAction: string;
}) {
  const summary = dashboard?.summary ?? {};
  const allConnections = dashboard?.connections ?? [];
  const connections =
    selectedConnectionId === "all"
      ? allConnections
      : allConnections.filter((connection) => connection.Id === selectedConnectionId);
  const liveConnections =
    (dashboard?.liveConnections ?? []).filter(
      (connection) => selectedConnectionId === "all" || connection.connectionId === selectedConnectionId,
    );
  const recentPagePosts =
    (dashboard?.recentPagePosts ?? []).filter(
      (post) => selectedConnectionId === "all" || post.connectionId === selectedConnectionId,
    );
  const createdPosts =
    (dashboard?.createdPosts ?? []).filter(
      (post) => selectedConnectionId === "all" || post.SocialConnectionId === selectedConnectionId,
    );
  const scheduledPosts =
    (dashboard?.scheduledPosts ?? []).filter(
      (post) => selectedConnectionId === "all" || post.SocialConnectionId === selectedConnectionId,
    );
  const publishedPosts =
    (dashboard?.publishedPosts ?? []).filter(
      (post) => selectedConnectionId === "all" || post.SocialConnectionId === selectedConnectionId,
    );
  const manualCreatedPosts = createdPosts.filter((post) =>
    (post.SourceTitle ?? "").toLowerCase().includes("manual prompt draft"),
  );
  const metricSummary =
    selectedConnectionId === "all"
      ? summary
      : {
          connectedPages: connections.length,
          createdPosts: createdPosts.length,
          followers: liveConnections.reduce((sum, item) => sum + Number(item.followersCount ?? 0), 0),
          fans: liveConnections.reduce((sum, item) => sum + Number(item.fanCount ?? 0), 0),
          livePosts: recentPagePosts.length,
          scheduledPosts: scheduledPosts.length,
          publishedPosts: publishedPosts.length,
          likes: publishedPosts.reduce((sum, item) => sum + Number(item.LikesCount ?? 0), 0),
          reactions: publishedPosts.reduce((sum, item) => sum + Number(item.ReactionsCount ?? 0), 0),
          comments: publishedPosts.reduce((sum, item) => sum + Number(item.CommentsCount ?? 0), 0),
          shares: publishedPosts.reduce((sum, item) => sum + Number(item.SharesCount ?? 0), 0),
          engagedUsers: publishedPosts.reduce((sum, item) => sum + Number(item.EngagedUsersCount ?? 0), 0),
        };

  if (loadStatus === "loading") {
    return <StatusPanel message="Loading marketing dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <CollapsibleSection
        title="Connected Pages"
        description="See linked Facebook pages and ad accounts, and open the connect flow only when you need to add another one."
        isOpen={showConnectionsSection}
        onToggle={onToggleConnectionsSection}
      >
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Connected Pages</h2>
              <p className="mt-2 text-sm text-slate-600">
                Review linked pages, refresh the dashboard, or open the connection tools to add a new page or ad account.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-100"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={onToggleConnectPanel}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                {showConnectPanel ? "Hide connect options" : "Connect Facebook Page"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allConnections.length ? (
              allConnections.map((connection) => (
                <article key={connection.Id} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-extrabold">
                    {connection.ProfileName ?? connection.PageName ?? "Facebook Page"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{connection.PageId}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <StatItem label="Created" value={connection.CreatedCount ?? 0} />
                    <StatItem label="Scheduled" value={connection.ScheduledCount ?? 0} />
                    <StatItem label="Live" value={connection.PublishedCount ?? 0} />
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

        {showConnectPanel ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold">Connect a Facebook Page</h2>
              <p className="text-sm text-slate-600">
                Use the Facebook popup when it works for your app setup, or paste a long-lived user access token as the fallback path.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStartFacebookConnect}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Continue with Facebook
              </button>
              <p className="text-sm text-slate-500">
                The manual form below can also refresh tokens for pages that are already connected.
              </p>
            </div>

            <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={onManualConnect}>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Page ID
                </span>
                <input
                  type="text"
                  value={manualPageId}
                  onChange={(event) => onManualPageIdChange(event.target.value)}
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
                  onChange={(event) => onManualPageNameChange(event.target.value)}
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
                  onChange={(event) => onManualProfileNameChange(event.target.value)}
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
                  onChange={(event) => onManualUserAccessTokenChange(event.target.value)}
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
                  onChange={(event) => onManualAccessTokenChange(event.target.value)}
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
        ) : null}

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
                    onClick={() => onConnectPage(page)}
                    className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Link page
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {oauthAdAccounts.length ? (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold">Ad Accounts from Meta</h2>
            <p className="mt-2 text-sm text-slate-600">
              Link the Business Manager ad account that is running the campaigns for these pages so ad posts and comments can be imported into the workspace.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {oauthAdAccounts.map((adAccount) => (
                <article key={adAccount.id} className="rounded-lg border border-slate-200 p-4">
                  <h3 className="font-extrabold">{adAccount.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{adAccount.id}</p>
                  <p className="mt-3 min-h-10 text-sm text-slate-600">
                    {[adAccount.currency, adAccount.timeZoneName].filter(Boolean).join(" | ") ||
                      "No account metadata returned."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onConnectAdAccount(adAccount)}
                    className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Link ad account
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        title="Pages Stats"
        description="Review the live summary numbers and page-by-page stats without mixing them into scheduling work."
        isOpen={showPageStatsSection}
        onToggle={onTogglePageStatsSection}
      >
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            <MetricCard title="Pages" value={metricSummary.connectedPages ?? 0} />
            <MetricCard title="Created" value={metricSummary.createdPosts ?? 0} />
            <MetricCard title="Followers" value={metricSummary.followers ?? 0} />
            <MetricCard title="Fans" value={metricSummary.fans ?? 0} />
            <MetricCard title="Live posts" value={metricSummary.livePosts ?? 0} />
            <MetricCard title="Scheduled" value={metricSummary.scheduledPosts ?? 0} />
            <MetricCard title="Live" value={metricSummary.publishedPosts ?? 0} />
            <MetricCard title="Likes" value={metricSummary.likes ?? 0} />
            <MetricCard title="Reactions" value={metricSummary.reactions ?? 0} />
            <MetricCard title="Comments" value={metricSummary.comments ?? 0} />
            <MetricCard title="Shares" value={metricSummary.shares ?? 0} />
            <MetricCard title="Engaged" value={metricSummary.engagedUsers ?? 0} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold">Per-Page Stats</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {liveConnections.length ? (
              liveConnections.map((connection) => (
                <LiveConnectionCard key={connection.connectionId} connection={connection} />
              ))
            ) : (
              <p className="text-sm text-slate-600">
                Connect a Facebook Page to load live follower and recent post data.
              </p>
            )}
          </div>
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        title="Post Scheduling"
        description="Create drafts, refine page instructions, and work through the created, scheduled, and live post lifecycle."
        isOpen={showPublishingSection}
        onToggle={onTogglePublishingSection}
      >
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Selected Page</h2>
              <p className="mt-2 text-sm text-slate-600">
                Pick the page you want to work on, then generate or review created, scheduled, and live posts for that page.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Page selector
              </span>
              <select
                value={selectedConnectionId}
                onChange={(event) => onSelectedConnectionIdChange(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 sm:min-w-64"
              >
                <option value="all">All connected pages</option>
                {allConnections.map((connection) => (
                  <option key={connection.Id} value={connection.Id}>
                    {connection.ProfileName ?? connection.PageName ?? connection.PageId}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Draft count
                </span>
                <select
                  value={String(draftCount)}
                  onChange={(event) => onDraftCountChange(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 sm:min-w-28"
                  disabled={selectedConnectionId === "all"}
                >
                  <option value="1">Create 1</option>
                  <option value="2">Create 2</option>
                  <option value="3">Create 3</option>
                  <option value="4">Create 4</option>
                  <option value="5">Create 5</option>
                </select>
              </label>
              <button
                type="button"
                onClick={onGenerateDrafts}
                disabled={selectedConnectionId === "all"}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate drafts now
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold">Manual Post Studio</h2>
            <p className="text-sm text-slate-600">
              Work with Codex inline: describe the campaign angle, audience, CTA, exclusions, or any one-off brief here, and generate posts straight into the draft table for the selected page.
            </p>
          </div>
          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Operator specs
              </span>
              <textarea
                value={manualPostSpecs}
                onChange={(event) => onManualPostSpecsChange(event.target.value)}
                className="mt-1 min-h-40 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-600"
                placeholder="Example: Create 3 posts for drivers who are unsure whether PCP hidden commission applies to them. Keep the tone calm and practical. One myth-busting post, one trust-building post, one short CTA-led post. Avoid legal jargon and avoid mentioning refunds or guaranteed outcomes."
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="block">
                  <span className="sr-only">Manual draft count</span>
                  <select
                    value={String(manualDraftCount)}
                    onChange={(event) => onManualDraftCountChange(Number(event.target.value))}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-600 sm:min-w-28"
                    disabled={selectedConnectionId === "all"}
                  >
                    <option value="1">Create 1</option>
                    <option value="2">Create 2</option>
                    <option value="3">Create 3</option>
                    <option value="4">Create 4</option>
                    <option value="5">Create 5</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={onGenerateManualDrafts}
                  disabled={selectedConnectionId === "all"}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate manual posts
                </button>
              </div>
              <p className="text-sm text-slate-500">
                These posts go directly into the draft DB state first, so your teammate can review and choose exactly which ones to queue.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Manual Generated Posts</h2>
              <p className="mt-2 text-sm text-slate-600">
                Select the drafts you want to place into the page queue. They will be scheduled with randomized spacing between 30 and 90 minutes apart.
              </p>
            </div>
            <button
              type="button"
              onClick={onQueueManualDrafts}
              disabled={!selectedManualDraftIds.length || selectedConnectionId === "all"}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Queue selected posts
            </button>
          </div>
          <div className="mt-4">
            <SelectableDraftList
              posts={manualCreatedPosts}
              selectedDraftIds={selectedManualDraftIds}
              onToggleDraft={onToggleManualDraftSelection}
            />
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

        <section className="grid gap-6 xl:grid-cols-2">
          <PostList title="Created posts" posts={createdPosts} mode="created" />
          <PostList title="Scheduled posts" posts={scheduledPosts} mode="scheduled" />
        </section>

        <section className="grid gap-6 xl:grid-cols-1">
          <PostList title="Live posts" posts={publishedPosts} mode="published" />
        </section>
      </CollapsibleSection>

      <CollapsibleSection
        title="Comments & Engagement"
        description="Keep the post context visible while you review comment activity. This is where the comment-reply inbox will live."
        isOpen={showCommentsSection}
        onToggle={onToggleCommentsSection}
      >
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Comment Sync Tools</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Pull in Facebook ad-linked posts first, then sync comments so the upcoming reply inbox has fresh material to work with.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onImportAdPosts}
                disabled={syncAction !== ""}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncAction === "importing-ad-posts" ? "Importing ad posts..." : "Import ad posts"}
              </button>
              <button
                type="button"
                onClick={onSyncComments}
                disabled={syncAction !== ""}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncAction === "syncing-comments" ? "Syncing comments..." : "Sync comments"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <TrackedPostMessagesList posts={publishedPosts} />
          <CommentInboxList comments={comments} />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <LivePagePostList posts={recentPagePosts} />
        </section>
      </CollapsibleSection>
    </div>
  );
}

function SelectableDraftList({
  posts,
  selectedDraftIds,
  onToggleDraft,
}: {
  posts: ScheduledFacebookPost[];
  selectedDraftIds: string[];
  onToggleDraft: (draftId: string) => void;
}) {
  if (!posts.length) {
    return <p className="text-sm text-slate-600">No manual post drafts yet.</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const checked = selectedDraftIds.includes(post.Id);
        return (
          <article key={post.Id} className="rounded-lg border border-slate-200 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleDraft(post.Id)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-extrabold">
                      {post.CustomTitle || post.SocialProfileName || post.PageName || "Facebook draft"}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Created {formatDate(post.CreatedAtUtc)}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                      Post ID: {post.Id}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {post.PageName ?? post.SocialProfileName ?? "Facebook"}
                  </span>
                </div>
                {post.ImageUrl ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={post.ImageUrl}
                      alt={post.CustomTitle || post.SocialProfileName || post.PageName || "Facebook draft image"}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : null}
                {post.ImageUrl ? (
                  <a
                    href={post.ImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block break-all text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    Open image in new tab
                  </a>
                ) : (
                  <p className="text-xs font-semibold text-amber-700">No image attached to this draft.</p>
                )}
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                  {post.PostText}
                </p>
              </div>
            </label>
          </article>
        );
      })}
    </div>
  );
}

function CommentInboxList({ comments }: { comments: FacebookComment[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold">Comments</h2>
      <div className="mt-4 space-y-4">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment.Id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold">
                    {comment.CommenterName?.trim() || "Facebook user"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {(comment.SocialProfileName ?? "Facebook Page") + " | " + formatDate(comment.CreatedAtProviderUtc)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {comment.ReplyStatus ?? "Unreplied"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {comment.CommentText?.trim() || "No comment text returned."}
              </p>
              {comment.PublishedPostExcerpt ? (
                <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On post</p>
                  <p className="mt-2 whitespace-pre-line">{comment.PublishedPostExcerpt}</p>
                </div>
              ) : null}
              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <StatItem label="Likes" value={comment.LikeCount ?? 0} />
                <StatItem label="Replies" value={comment.ReplyCount ?? 0} />
                <StatItem label="Hidden" value={comment.IsHidden ? "Yes" : "No"} />
              </dl>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">No synced comments yet.</p>
        )}
      </div>
    </section>
  );
}

function TrackedPostMessagesList({ posts }: { posts: PublishedFacebookPost[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold">Tracked Post Messages</h2>
      <div className="mt-4 space-y-4">
        {posts.length ? (
          posts.map((post) => (
            <article key={post.Id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-extrabold">{post.SocialProfileName ?? post.PageName ?? "Facebook post"}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatDate(post.PublishedAtUtc)}{post.ProviderPostId ? ` | ${post.ProviderPostId}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {post.CommentsCount ?? 0} comments
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {post.PublishedText?.trim() || "No post text returned."}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">No tracked post messages yet.</p>
        )}
      </div>
    </section>
  );
}

function CollapsibleSection({
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50"
      >
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="rounded-md border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">
          {isOpen ? "Collapse" : "Expand"}
        </span>
      </button>
      {isOpen ? <div className="space-y-6 border-t border-slate-200 p-6">{children}</div> : null}
    </section>
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
  mode: "created" | "scheduled" | "published";
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
                    {mode === "created"
                      ? `Created ${formatDate((post as ScheduledFacebookPost).CreatedAtUtc)}`
                      : mode === "scheduled"
                        ? `Scheduled ${formatDate((post as ScheduledFacebookPost).ScheduledForUtc)}`
                        : `Live ${formatDate((post as PublishedFacebookPost).PublishedAtUtc)}`}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {post.PageName ?? post.SocialProfileName ?? "Facebook"}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
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
