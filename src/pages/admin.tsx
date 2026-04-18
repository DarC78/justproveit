import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";
type GateSource = "admin-endpoint" | "token-claims" | null;

export default function AdminPage() {
  const router = useRouter();
  const { status, user, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [gateSource, setGateSource] = useState<GateSource>(null);

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
      setGateSource(null);

      if (!isAdmin) {
        setGateStatus("denied");
        setGateError(
          "The logged-in user profile does not include tenant-admin or admin:access.",
        );
        return;
      }

      const result = await requireAdmin();

      if (!cancelled) {
        const endpointMissing = result.error === "Not Found";
        setGateStatus(result.allowed || endpointMissing ? "allowed" : "denied");
        setGateError(result.error ?? "");
        setGateSource(result.allowed ? "admin-endpoint" : "token-claims");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  return (
    <>
      <Head>
        <title>Admin | JustProveIt</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
        <div className="mx-auto w-full max-w-6xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="text-lg font-extrabold tracking-tight">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <p className="mt-1 text-sm text-slate-600">Admin area</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 sm:w-auto"
            >
              Sign out
            </button>
          </header>

          {gateStatus === "checking" ? (
            <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">
                Checking admin access...
              </p>
            </section>
          ) : null}

          {gateStatus === "denied" ? (
            <section className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6">
              <h1 className="text-2xl font-extrabold text-red-950">
                Admin access required
              </h1>
              <p className="mt-2 text-sm text-red-900">
                Your account is signed in, but LaunchingStack did not confirm
                tenant admin access for JustProveIt.
              </p>
              {gateError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-950">
                  {gateError}
                </p>
              ) : null}
              <dl className="mt-4 grid gap-3 text-sm text-red-950 sm:grid-cols-2">
                <div>
                  <dt className="font-bold">Roles</dt>
                  <dd className="mt-1 break-words">
                    {user?.roles?.length ? user.roles.join(", ") : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold">Permissions</dt>
                  <dd className="mt-1 break-words">
                    {user?.permissions?.length
                      ? user.permissions.join(", ")
                      : "None"}
                  </dd>
                </div>
              </dl>
              <Link
                href="/"
                className="mt-5 inline-flex rounded-md bg-red-900 px-4 py-2 text-sm font-bold text-white hover:bg-red-950"
              >
                Return to site
              </Link>
            </section>
          ) : null}

          {gateStatus === "allowed" ? (
            <section className="mt-8">
              <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Access confirmed
                </p>
                <h1 className="mt-2 text-3xl font-extrabold">
                  JustProveIt Admin
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {gateSource === "admin-endpoint"
                    ? "LaunchingStack confirmed this account has tenant admin access. This dashboard shell is ready for the next admin tools."
                    : "Your token includes tenant admin access. The LaunchingStack admin capability endpoint still needs to return 200 for a complete backend gate."}
                </p>
              </div>

              {gateSource === "token-claims" ? (
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
                  <p className="font-extrabold">Backend admin gate not found</p>
                  <p className="mt-1">
                    `GET /api/admin/me` returned {gateError}. The frontend is
                    allowing this shell because the signed-in user has
                    `tenant-admin` and `admin:access`, but LaunchingStack should
                    still add or fix the admin capability endpoint.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <AdminCard title="Signed in as" value={user?.name ?? "Unknown"} />
                <AdminCard title="Email" value={user?.email ?? "Unknown"} />
                <AdminCard title="Tenant" value={user?.tenantKey ?? "justproveit"} />
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-extrabold">Available now</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Admin authentication and authorization are wired. Add the
                  first operational admin endpoint when LaunchingStack exposes
                  the data workflow you want managed here.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}

function AdminCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 break-words text-base font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}
