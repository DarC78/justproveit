import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type GateStatus = "checking" | "allowed" | "denied";

export default function AdminPage() {
  const router = useRouter();
  const { status, user, isAdmin, requireAdmin, logout } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");

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
          "The logged-in user profile does not include admin access.",
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
                Your account is signed in, but JustProveIt did not confirm
                admin access for this user.
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
                  This account has JustProveIt admin access.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <AdminCard title="Signed in as" value={user?.name ?? "Unknown"} />
                <AdminCard title="Email" value={user?.email ?? "Unknown"} />
                <AdminCard title="Access" value={(user?.roles ?? []).join(", ") || "admin"} />
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-extrabold">Available now</h2>
                <p className="mt-2 text-sm text-slate-600">
                  JustProveIt admin tools are live for support, CRM, and payment follow-up work.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/admin/support-inbox"
                    className="inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                  >
                    Open support inbox
                  </Link>
                  <Link
                    href="/admin/crm"
                    className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Open CRM
                  </Link>
                  <Link
                    href="/admin/overdue-payments"
                    className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Open overdue payments
                  </Link>
                  <Link
                    href="/admin/role-play-feedback"
                    className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Role play feedback
                  </Link>
                </div>
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
