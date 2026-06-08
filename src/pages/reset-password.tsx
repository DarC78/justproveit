import { resetPasswordRequest } from "@/lib/auth";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = readQueryValue(router.query.token);
  const email = readQueryValue(router.query.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReadyForReset = useMemo(() => router.isReady && Boolean(token), [router.isReady, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }

    if (password.length < 10) {
      setError("Use at least 10 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordRequest({ email, token, password });
      setSuccessMessage("Your password has been reset. You can now sign in.");
      setPassword("");
      setConfirmPassword("");
    } catch (resetError) {
      setError(readResetError(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Reset password | JustProveIt</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto flex w-full max-w-md flex-col">
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>

          <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-extrabold">Choose a new password</h1>
            <p className="mt-2 text-sm text-slate-600">
              Enter a new password for your JustProveIt account.
            </p>

            {router.isReady && !isReadyForReset ? (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                This reset link is invalid or incomplete. Request a new link from the sign in page.
              </p>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {email ? (
                  <div>
                    <label className="text-sm font-semibold" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      readOnly
                      className="mt-2 w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-base text-slate-700 outline-none"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="text-sm font-semibold" htmlFor="password">
                    New password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold" htmlFor="confirm-password">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                  />
                </div>

                {error ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                    {error}
                  </p>
                ) : null}

                {successMessage ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                    {successMessage}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(successMessage)}
                  className="flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmitting ? "Resetting password..." : "Reset password"}
                </button>

                {successMessage ? (
                  <Link
                    href="/login"
                    className="block w-full text-center text-sm font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    Back to sign in
                  </Link>
                ) : null}
              </form>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function readQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function readResetError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Invalid reset token") {
      return "This reset link is invalid or has expired. Request a new link from the sign in page.";
    }

    return error.message;
  }

  return "Password reset failed. Please try again.";
}
