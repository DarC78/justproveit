import { useAuth } from "@/context/AuthContext";
import {
  connectFacebookMarketingPage,
  FacebookDashboard,
  FacebookOAuthPage,
  FacebookOAuthPayload,
  getApiOrigin,
  getFacebookMarketingAuthUrl,
  getFacebookMarketingDashboard,
  PublishedFacebookPost,
  ScheduledFacebookPost,
} from "@/lib/marketingAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type LoadStatus = "idle" | "loading" | "ready" | "error";

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
                loadStatus={loadStatus}
                onRefresh={loadDashboard}
              />
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

function DashboardContent({
  dashboard,
  loadStatus,
  onRefresh,
}: {
  dashboard: FacebookDashboard | null;
  loadStatus: LoadStatus;
  onRefresh: () => void;
}) {
  const summary = dashboard?.summary ?? {};
  const connections = dashboard?.connections ?? [];
  const scheduledPosts = dashboard?.scheduledPosts ?? [];
  const publishedPosts = dashboard?.publishedPosts ?? [];

  if (loadStatus === "loading") {
    return <StatusPanel message="Loading marketing dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Pages" value={summary.connectedPages ?? 0} />
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

      <section className="grid gap-6 xl:grid-cols-2">
        <PostList title="Scheduled posts" posts={scheduledPosts} mode="scheduled" />
        <PostList title="Published performance" posts={publishedPosts} mode="published" />
      </section>
    </div>
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
