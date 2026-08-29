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

type ProveitService = {
  title: string;
  description: string;
};

type ProveitServiceCategory = {
  name: string;
  intro: string;
  services: ProveitService[];
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

const PROVEIT_SERVICE_CATEGORIES: ProveitServiceCategory[] = [
  {
    name: "Scor de credit",
    intro:
      "Instrumente pentru verificarea scorului si raportului de credit, utile inainte de carduri, imprumuturi, chirii sau finantari.",
    services: [
      {
        title: "ClearScore",
        description: "Verifica gratuit scorul de credit (Equifax) si primesti sfaturi generale de imbunatatire.",
      },
      {
        title: "Experian",
        description: "Raport si scor de credit propriu; una din cele 3 agentii oficiale de credit din UK.",
      },
      {
        title: "Equifax",
        description: "A doua agentie oficiala de credit; raport si scor propriu.",
      },
      {
        title: "TotallyMoney",
        description:
          "Scor de credit gratuit (TransUnion) + verificare eligibilitate pentru carduri/imprumuturi inainte de a aplica.",
      },
    ],
  },
  {
    name: "Comparatoare asigurari auto & casa",
    intro:
      "Comparatoare care te ajuta sa verifici rapid piata pentru polite auto, casa sau alte asigurari, fara sa ramai blocat la prima oferta.",
    services: [
      {
        title: "Compare the Market",
        description: "Cel mai cunoscut comparator general de asigurari din UK.",
      },
      {
        title: "Confused.com",
        description: "Unul din primele comparatoare de asigurari auto din UK.",
      },
      {
        title: "MoneySuperMarket",
        description: "Comparator general: asigurari, energie, carduri, credite.",
      },
    ],
  },
  {
    name: "Energie & utilitati",
    intro:
      "Instrumente pentru verificarea tarifelor la gaz, electricitate si utilitati, utile cand vrei sa reduci costurile lunare.",
    services: [
      {
        title: "uSwitch",
        description: "Comparator specializat pe energie, mobil, internet.",
      },
      {
        title: "MoneySuperMarket Energie",
        description: "Comparare facturi de gaz/electricitate.",
      },
    ],
  },
  {
    name: "Mobil & internet",
    intro:
      "Comparatoare pentru broadband, mobil si TV, bune pentru verificarea contractelor scumpe sau pentru schimbarea furnizorului.",
    services: [
      {
        title: "uSwitch Broadband",
        description: "Comparare abonamente internet/mobil.",
      },
      {
        title: "broadbandchoices",
        description: "Comparator specializat pe internet/TV.",
      },
    ],
  },
  {
    name: "Cont curent bancar",
    intro:
      "Resurse pentru schimbarea contului bancar si verificarea bonusurilor disponibile, cu accent pe mutarea simpla a contului curent.",
    services: [
      {
        title: "Current Account Switch Service",
        description:
          "Serviciul oficial si gratuit prin care schimbi banca fara batai de cap (totul se muta automat).",
      },
      {
        title: "MoneySuperMarket Conturi",
        description: "Comparare conturi curente si bonusuri de schimbare.",
      },
    ],
  },
  {
    name: "Carduri de credit",
    intro:
      "Comparatoare si ghiduri care te ajuta sa verifici eligibilitatea, transferurile de sold si perioadele cu dobanda redusa.",
    services: [
      {
        title: "MoneySavingExpert Carduri",
        description: "Ghiduri si comparator de carduri de credit (transfer sold, 0% dobanda etc.).",
      },
      {
        title: "MoneySuperMarket Carduri",
        description: "Comparare carduri de credit cu verificare eligibilitate.",
      },
      {
        title: "Compare the Market Carduri",
        description: "Comparare carduri de credit.",
      },
      {
        title: "TotallyMoney Eligibilitate",
        description: "Verifici sansele de aprobare inainte de a aplica, fara impact asupra scorului.",
      },
    ],
  },
  {
    name: "Imprumuturi personale",
    intro:
      "Comparatoare pentru imprumuturi personale, utile ca sa verifici costuri, eligibilitate si alternative inainte de o aplicatie.",
    services: [
      {
        title: "MoneySuperMarket Imprumuturi",
        description: "Comparare imprumuturi personale.",
      },
      {
        title: "Compare the Market Imprumuturi",
        description: "Comparare imprumuturi personale.",
      },
    ],
  },
  {
    name: "Finantare auto (masina in rate)",
    intro:
      "Instrumente pentru compararea finantarii auto si intelegerea optiunilor cand cumperi sau verifici o masina cu plata in rate.",
    services: [
      {
        title: "Zuto",
        description: "Broker de finantare auto; compara oferte de la mai multi creditori.",
      },
      {
        title: "CarFinance247",
        description: "Broker de finantare auto.",
      },
      {
        title: "Carwow",
        description: "Cumperi masina noua/second-hand si compari oferte de finantare.",
      },
      {
        title: "Confused.com Car Finance",
        description: "Comparare oferte de finantare auto.",
      },
      {
        title: "MoneySuperMarket Car Finance",
        description: "Comparare oferte de finantare auto.",
      },
    ],
  },
  {
    name: "Cumparare/vanzare masina",
    intro:
      "Platforme utile pentru orientare de pret, cumparare sau vanzare de masina, mai ales cand vrei sa compari piata din UK.",
    services: [
      {
        title: "AutoTrader",
        description: "Cel mai mare marketplace auto din UK.",
      },
      {
        title: "Cinch",
        description: "Cumperi masina second-hand online, cu garantie inclusa.",
      },
    ],
  },
  {
    name: "Pensii pierdute & pensie de stat",
    intro:
      "Servicii pentru verificarea pensiei de stat, gasirea pensiilor private vechi si intelegerea optiunilor disponibile in UK.",
    services: [
      {
        title: "Pension Tracing Service (gov.uk)",
        description:
          "Serviciul oficial si gratuit al guvernului pentru gasirea datelor de contact ale unei pensii vechi.",
      },
      {
        title: "MoneyHelper - Pensii pierdute",
        description: "Ghid gratuit, sustinut de guvern, despre cum gasesti pensii vechi.",
      },
      {
        title: "Check your State Pension",
        description: "Verifici gratuit cat va fi pensia de stat si de la ce varsta o poti lua.",
      },
      {
        title: "Pension Wise",
        description:
          "Programare gratuita de consiliere guvernamentala pentru cei peste 50 de ani cu pensie privata.",
      },
    ],
  },
  {
    name: "Bani/conturi uitate",
    intro:
      "Resurse care ajuta la cautarea conturilor, pensiilor, economiilor sau produselor financiare pierdute din vedere.",
    services: [
      {
        title: "My Lost Account",
        description: "Serviciul oficial pentru gasirea conturilor bancare/de economii uitate.",
      },
      {
        title: "Gretel",
        description: "Serviciu gratuit care cauta simultan pensii, conturi si investitii uitate.",
      },
      {
        title: "NS&I",
        description: "Verifici Premium Bonds sau economii uitate la National Savings & Investments.",
      },
    ],
  },
  {
    name: "Beneficii guvernamentale",
    intro:
      "Calculatoare si ghiduri pentru verificarea beneficiilor la care poti avea dreptul si a ajutoarelor disponibile.",
    services: [
      {
        title: "gov.uk Benefits Calculators",
        description: "Pagina oficiala cu calculatoarele de beneficii recunoscute de guvern.",
      },
      {
        title: "entitledto",
        description: "Calculator independent de beneficii, foarte folosit.",
      },
      {
        title: "Turn2us",
        description: "Calculator de beneficii + cautare de granturi caritabile.",
      },
    ],
  },
  {
    name: "Cashback & vouchere",
    intro:
      "Platforme pentru bani inapoi, coduri de reducere si oferte, utile pentru cumparaturi recurente sau achizitii mai mari.",
    services: [
      {
        title: "TopCashback",
        description: "Primesti bani inapoi pentru cumparaturi online.",
      },
      {
        title: "Quidco",
        description: "Al doilea mare site de cashback din UK.",
      },
      {
        title: "VoucherCodes",
        description: "Coduri de reducere pentru magazine online.",
      },
      {
        title: "HotUKDeals",
        description: "Comunitate care distribuie cele mai bune oferte gasite de utilizatori.",
      },
    ],
  },
  {
    name: "Ajutor gratuit cu datorii",
    intro:
      "Organizatii gratuite care pot ajuta cand datoriile devin greu de gestionat si ai nevoie de un plan realist.",
    services: [
      {
        title: "StepChange",
        description: "Cea mai mare caritate de consiliere pentru datorii din UK, complet gratuita.",
      },
      {
        title: "National Debtline",
        description: "Linie telefonica si ghiduri gratuite pentru probleme de datorii.",
      },
    ],
  },
  {
    name: "Verificare firme & protectie consumator",
    intro:
      "Servicii pentru reclamatii, verificari si intelegerea protectiei consumatorului cand o firma financiara nu a procedat corect.",
    services: [
      {
        title: "Financial Ombudsman Service",
        description: "Unde depui gratuit o plangere impotriva unei firme financiare autorizate.",
      },
      {
        title: "MoneyHelper",
        description: "Serviciu gratuit, sustinut de guvern, cu ghiduri impartiale pe orice tema financiara.",
      },
    ],
  },
  {
    name: "Cont fiscal & asigurari sociale",
    intro:
      "Instrumente oficiale pentru verificarea taxelor, contributiilor National Insurance si a obligatiilor personale din UK.",
    services: [
      {
        title: "HMRC Personal Tax Account",
        description: "Contul oficial unde vezi taxele, codul fiscal, rambursarile.",
      },
      {
        title: "Check National Insurance record",
        description: "Verifici anii de contributie la asigurari sociale (afecteaza pensia de stat).",
      },
      {
        title: "Student Loan Repayment",
        description: "Verifici si gestionezi rambursarea imprumutului de studii.",
      },
    ],
  },
  {
    name: "Prevenire frauda & protectie identitate",
    intro:
      "Protectie suplimentara cand exista risc de furt de identitate sau cand vrei sa reduci sansele unei fraude financiare.",
    services: [
      {
        title: "Cifas",
        description: "Inregistrare de protectie daca ti-a fost furata identitatea.",
      },
    ],
  },
];

const PROVEIT_SERVICE_COUNT = PROVEIT_SERVICE_CATEGORIES.reduce(
  (total, category) => total + category.services.length,
  0,
);

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
          content="Rezultatele celor 6 verificari rapide si serviciile prin care Proveit te poate ghida in UK."
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
                  ? `${clientName}, ai mai jos verificările rapide completate și cateva zone importante unde Proveit te poate ghida mai departe.`
                  : "Ai mai jos verificările rapide completate și cateva zone importante unde Proveit te poate ghida mai departe."}
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
              <Metric value={String(PROVEIT_SERVICE_COUNT)} label="servicii utile" />
              <Metric value={String(PROVEIT_SERVICE_CATEGORIES.length)} label="categorii de ajutor" />
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
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  Ghid practic in UK
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
                  Hai In Clubul Aici Sunt Banii Dumneavoastra
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-700">
                  In club primiti ajutor cu aproate toate aspectele ale vietii financiare in UK. Va explicam cum sa
                  folositi fiecare din aceste website-uri si aplicatii asa cum le foloseste un nativ!
                </p>
              </div>
              <div className="mt-8 space-y-8">
                {PROVEIT_SERVICE_CATEGORIES.map((category) => (
                  <section key={category.name} className="border-t border-slate-200 pt-8">
                    <div className="max-w-4xl">
                      <h3 className="text-2xl font-extrabold tracking-normal text-slate-950">{category.name}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-700">{category.intro}</p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {category.services.map((service) => (
                        <ServiceBiscuit
                          key={`${category.name}-${service.title}`}
                          title={service.title}
                          description={service.description}
                        />
                      ))}
                    </div>
                  </section>
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

function ServiceBiscuit({ title, description }: ProveitService) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="aspect-video bg-slate-900 p-4 text-white">
        <div className="flex h-full items-center justify-center rounded-md border border-white/20 bg-white/5">
          <div className="text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-base font-extrabold text-white">
              <span aria-hidden="true" className="ml-1 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
            </span>
            <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-100">
              Video explicativ
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-300">In curand</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h4 className="text-base font-extrabold leading-6 tracking-normal text-slate-950">{title}</h4>
        <p className="mt-3 text-sm leading-7 text-slate-700">{description}</p>
      </div>
    </article>
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
