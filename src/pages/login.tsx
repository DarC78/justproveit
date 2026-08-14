import { useAuth } from "@/context/AuthContext";
import { AuthUser, isAdminUser, isCrmUser } from "@/lib/auth";
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";

const FORGOT_PASSWORD_BASE_URL =
  "https://launchingstack-func-dev.azurewebsites.net/api/auth/forgot-password";
const DEFAULT_FORGOT_PASSWORD_URL =
  `${FORGOT_PASSWORD_BASE_URL}` +
  `?tenantKey=justproveit` +
  `&domain=www.justproveit.co.uk` +
  `&next=https%3A%2F%2Fwww.justproveit.co.uk%2Fadmin%2Fcrm%2F%3Ftab%3Dmanual`;

export default function LoginPage() {
  const router = useRouter();
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotPasswordUrl, setForgotPasswordUrl] = useState(DEFAULT_FORGOT_PASSWORD_URL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    router.replace(getPostLoginPath(user, router.query.next));
  }, [router, status, user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setForgotPasswordUrl(
      `${FORGOT_PASSWORD_BASE_URL}` +
        `?tenantKey=justproveit` +
        `&domain=${encodeURIComponent(window.location.hostname)}` +
        `&next=${encodeURIComponent(window.location.href)}`,
    );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      await router.push(getPostLoginPath(loggedInUser, router.query.next));
    } catch (loginError) {
      setError(readLoginError(loginError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | JustProveIt</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto flex w-full max-w-md flex-col">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold">Sign in</h1>
            <p className="mt-2 text-sm text-slate-600">
              Use your JustProveIt account to continue.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                />
                <div className="mt-2 text-right">
                  <a
                    href={forgotPasswordUrl}
                    className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || status === "loading"}
                className="flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

function getPostLoginPath(
  user: AuthUser | null | undefined,
  next?: string | string[],
) {
  const safeNext = readSafeNextPath(next);

  if (safeNext) {
    return safeNext;
  }

  if (isAdminUser(user)) {
    return "/admin";
  }

  if (isCrmUser(user)) {
    return "/admin/crm";
  }

  return "/";
}

function readSafeNextPath(value?: string | string[]) {
  const next = Array.isArray(value) ? value[0] : value;

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "";
  }

  return next;
}

function readLoginError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Email not verified") {
      return "Please verify your email address before signing in.";
    }

    if (error.message === "Invalid credentials") {
      return "The email or password is incorrect.";
    }

    return error.message;
  }

  return "Login failed. Please try again.";
}
