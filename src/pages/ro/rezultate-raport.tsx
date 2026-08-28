import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  fetchQuickReportPublicResults,
  type QuickReportDisplayFlag,
} from "@/lib/quickReport";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/rezultate-raport";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const CLUB_PATH = "/ro/hai-in-club";

type ReportFlag = QuickReportDisplayFlag;

type ReportResult = {
  code: string;
  title: string;
  flag: ReportFlag;
  output: string;
};

type FreeCheck = {
  code: string;
  title: string;
};

type CheckAction = {
  label: string;
  href: string;
};

type ReportDetails = {
  clientName: string;
  resultsByCode: Record<string, ReportResult>;
};

type PublicReportState =
  | {
      token: string;
      status: "success";
      clientName: string;
      resultsByCode: Record<string, ReportResult>;
    }
  | {
      token: string;
      status: "error";
      error: string;
    };

const FREE_CHECKS: FreeCheck[] = [
  { code: "MF01", title: "Cod fiscal (tax code) greșit" },
  { code: "CD01", title: "Credit score / raport de credit" },
  { code: "CD07", title: "Bank switching bonus neaccesat" },
  { code: "FC02", title: "Asigurări auto/casă" },
  { code: "FC05", title: "Comisioane remitere bani spre România" },
  { code: "FC07", title: "Facturi de utilități" },
];

const FREE_CHECK_ACTIONS: Record<string, CheckAction[]> = {
  MF01: [
    {
      label: "Verifica tax code pe gov.uk",
      href: "https://www.gov.uk/log-in-register-hmrc-online-services",
    },
  ],
  CD01: [
    {
      label: "Verifica gratuit pe ClearScore",
      href: "https://www.clearscore.com/",
    },
  ],
  CD07: [
    {
      label: "HSBC",
      href: "http://www.moneysavingexpert.com/redir/4b83e3d7",
    },
    {
      label: "NatWest",
      href: "http://www.moneysavingexpert.com/redir/209477a1",
    },
    {
      label: "firstDirect",
      href: "http://www.moneysavingexpert.com/redir/971055e7",
    },
    {
      label: "Coop",
      href: "http://www.moneysavingexpert.com/redir/b06f0944",
    },
    {
      label: "Nationwide",
      href: "http://www.moneysavingexpert.com/redir/cc846506",
    },
    {
      label: "Starling",
      href: "http://www.moneysavingexpert.com/redir/666bb0fa",
    },
  ],
  FC07: [
    {
      label: "Programeaza apel gratuit de revizuire a facturilor",
      href: "https://calendly.com/proveitweb/verificare-facturi-utilitati",
    },
  ],
};

const CLUB_CHECKS: FreeCheck[] = [
  { code: "MF02", title: "Marriage Allowance" },
  { code: "MF03", title: "Overtime / holiday pay" },
  { code: "MF04", title: "Redundancy pay" },
  { code: "MF05", title: "Self-assessment expenses" },
  { code: "MF06", title: "Student loan overpayment" },
  { code: "MF07", title: "Dublă impozitare RO-UK" },
  { code: "PE01", title: "NI record / State Pension forecast" },
  { code: "PE02", title: "Pensii ocupaționale uitate" },
  { code: "PE03", title: "Pensia internațională RO-UK" },
  { code: "CD02", title: "Car finance mis-selling" },
  { code: "CD03", title: "GAP insurance / add-ons" },
  { code: "CD04", title: "Payday loans" },
  { code: "CD05", title: "Packaged bank accounts" },
  { code: "CD06", title: "Overdraft" },
  { code: "FC01", title: "Council Tax band" },
  { code: "FC03", title: "Abonamente uitate" },
  { code: "FC04", title: "Tarife sociale apă/broadband" },
  { code: "FC06", title: "Remortgage check" },
  { code: "AA01", title: "Conturi uitate" },
  { code: "AA02", title: "Moșteniri sau proprietăți în România" },
];

export default function ReportResultsPage() {
  const router = useRouter();
  const embeddedDetails = useMemo(() => readEmbeddedReportDetails(router.asPath, router.isReady), [
    router.asPath,
    router.isReady,
  ]);
  const publicToken = useMemo(() => readQueryValue(router.asPath, router.isReady, "token"), [
    router.asPath,
    router.isReady,
  ]);
  const [publicReport, setPublicReport] = useState<PublicReportState | null>(null);
  const activePublicReport = publicReport?.token === publicToken ? publicReport : null;
  const isLoadingPublicReport = Boolean(publicToken && !activePublicReport);
  const publicReportError = activePublicReport?.status === "error" ? activePublicReport.error : "";
  const publicDetails =
    activePublicReport?.status === "success"
      ? {
          clientName: activePublicReport.clientName,
          resultsByCode: activePublicReport.resultsByCode,
        }
      : null;
  const { resultsByCode, clientName } = publicDetails || embeddedDetails;

  useEffect(() => {
    if (!publicToken) {
      return;
    }

    let cancelled = false;

    async function loadPublicReport() {
      try {
        const payload = await fetchQuickReportPublicResults(publicToken);
        if (cancelled) {
          return;
        }

        setPublicReport({
          token: publicToken,
          status: "success",
          clientName: cleanDisplayName(payload.fullName || payload.firstName || ""),
          resultsByCode: indexResults(payload.results ?? []),
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPublicReport({
          token: publicToken,
          status: "error",
          error: error instanceof Error ? error.message : "Nu am putut incarca rezultatele raportului.",
        });
      }
    }

    void loadPublicReport();

    return () => {
      cancelled = true;
    };
  }, [publicToken]);

  return (
    <>
      <Head>
        <title>Rezultatele raportului gratuit | JustProveIt</title>
        <meta
          name="description"
          content="Rezultatele celor 6 verificari rapide si lista verificarilor extinse din Clubul Aici Sunt Banii Dumneavoastra."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="ro-GB" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-white text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/ro" className="text-lg font-extrabold tracking-normal">
              Just<span className="text-emerald-700">ProveIt</span>
            </Link>
            <Link href={CLUB_PATH} className="text-sm font-bold text-emerald-700 hover:text-emerald-900">
              Hai in club
            </Link>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden bg-slate-950 text-white">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center opacity-45"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-slate-950/55" />
            <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-200">
                Raport gratuit
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal md:text-5xl">
                Rezultatele tale pentru banii pierduți în UK
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-100">
                {clientName
                  ? `${clientName}, ai mai jos verificările rapide completate și cele 20 de zone pe care le analizăm în club.`
                  : "Ai mai jos verificările rapide completate și cele 20 de zone pe care le analizăm în club."}
              </p>
              <Link
                href={CLUB_PATH}
                className="mt-7 inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500"
              >
                Hai in Clubul Aici Sunt Banii Dumneavoastra
              </Link>
            </div>
          </section>

          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
              <Metric value="6" label="verificări gratuite" />
              <Metric value="20" label="verificări în club" />
              <Metric value="RO" label="explicații în limba română" />
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                Faza zero
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
                Cele 6 verificări din raportul gratuit
              </h2>
              {isLoadingPublicReport ? (
                <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  Incarcam rezultatele raportului.
                </p>
              ) : null}
              {publicReportError ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  {publicReportError}
                </p>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {FREE_CHECKS.map((check) => {
                const result = resultsByCode[check.code];
                const actions = FREE_CHECK_ACTIONS[check.code] ?? [];

                return (
                  <article key={check.code} className="rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{check.code}</p>
                        <h3 className="mt-1 text-base font-extrabold text-slate-950">
                          {result?.title || check.title}
                        </h3>
                      </div>
                      <FlagBadge flag={result?.flag || "necompletat"} />
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {result?.output || "Rezultatul acestei verificări apare după completarea raportului gratuit."}
                    </p>
                    {actions.length > 0 ? <CheckActions actions={actions} /> : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="border-t border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <div className="max-w-3xl">
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-sky-700">
                  Club
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
                  Cele 20 de verificări extinse
                </h2>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {CLUB_CHECKS.map((check) => (
                  <article key={check.code} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{check.code}</p>
                    <h3 className="mt-1 min-h-12 text-base font-extrabold leading-6 text-slate-950">
                      {check.title}
                    </h3>
                    <Link
                      href={CLUB_PATH}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 text-center text-sm font-extrabold text-white shadow-sm hover:bg-emerald-600"
                    >
                      Hai in Clubul Aici Sunt Banii Dumneavoastra
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

function readEmbeddedReportDetails(path: string, isReady: boolean): ReportDetails {
  if (!isReady) {
    return { resultsByCode: {}, clientName: "" };
  }

  const query = path.split("?")[1]?.split("#")[0] ?? "";
  const params = new URLSearchParams(query);

  return {
    clientName: cleanDisplayName(params.get("name") ?? params.get("nume") ?? ""),
    resultsByCode: indexResults(readEncodedResults(params)),
  };
}

function readQueryValue(path: string, isReady: boolean, key: string) {
  if (!isReady) {
    return "";
  }

  const query = path.split("?")[1]?.split("#")[0] ?? "";
  return new URLSearchParams(query).get(key)?.trim() ?? "";
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-4 border-emerald-600 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function FlagBadge({ flag }: { flag: ReportFlag }) {
  return (
    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-extrabold uppercase ${flagToneClass(flag)}`}>
      {flag === "necompletat" ? "lipsa" : flag}
    </span>
  );
}

function CheckActions({ actions }: { actions: CheckAction[] }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {actions.map((action) => (
        <a
          key={`${action.label}-${action.href}`}
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-center text-sm font-extrabold text-white shadow-sm hover:bg-emerald-600"
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}

function flagToneClass(flag: ReportFlag) {
  switch (flag) {
    case "rosu":
      return "border-red-200 bg-red-50 text-red-800";
    case "galben":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "verde":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function readEncodedResults(params: URLSearchParams): ReportResult[] {
  const encoded = params.get("results") ?? params.get("r") ?? "";

  if (!encoded) {
    return [];
  }

  const parsed = parseResultsJson(encoded) ?? parseResultsJson(decodeBase64Url(encoded));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    const result = normalizeResult(entry);
    return result ? [result] : [];
  });
}

function parseResultsJson(value: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function normalizeResult(value: unknown): ReportResult | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ReportResult>;

  if (
    typeof candidate.code !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.output !== "string" ||
    !isReportFlag(candidate.flag)
  ) {
    return null;
  }

  return {
    code: candidate.code.trim().slice(0, 12),
    title: candidate.title.trim().slice(0, 120),
    flag: candidate.flag,
    output: candidate.output.trim().slice(0, 900),
  };
}

function isReportFlag(value: unknown): value is ReportFlag {
  return value === "verde" || value === "galben" || value === "rosu" || value === "necompletat";
}

function indexResults(results: ReportResult[]) {
  return Object.fromEntries(results.map((result) => [result.code, result]));
}

function cleanDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}
