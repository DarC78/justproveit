import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/hai-in-club";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const CALENDLY_URL = "https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani";
const CLUB_CHECKOUT_API_URL =
  "https://launchingstack-func-dev.azurewebsites.net/api/justproveit/money-check/club/checkout-session";
const CONTACT_EMAIL = "adriandefta@proveitweb.co.uk";
const FULL_PRICE = "£297";
const MONTHLY_PRICE = "£99";
const INSTALLMENTS_API_PLAN = "installments";

const CLUB_CHECKS = [
  "MF02 - Marriage Allowance",
  "MF03 - Overtime / holiday pay",
  "MF04 - Redundancy pay",
  "MF05 - Self-assessment expenses",
  "MF06 - Student loan overpayment",
  "MF07 - Dubla impozitare RO-UK",
  "PE01 - NI record / State Pension forecast",
  "PE02 - Pensii ocupationale uitate",
  "PE03 - Pensia internationala RO-UK",
  "CD02 - Car finance mis-selling",
  "CD03 - GAP insurance / add-ons",
  "CD04 - Payday loans",
  "CD05 - Packaged bank accounts",
  "CD06 - Overdraft",
  "FC01 - Council Tax band",
  "FC03 - Abonamente uitate",
  "FC04 - Tarife sociale apa/broadband",
  "FC06 - Remortgage check",
  "AA01 - Conturi uitate",
  "AA02 - Mosteniri sau proprietati in Romania",
];

const FOCUS_AREAS = [
  {
    title: "Bank account switching",
    text:
      "Plan practic pentru bonusurile de la banci, cu tinta de pana la aproximativ £1,000 in cateva luni, in functie de ofertele active si eligibilitate.",
  },
  {
    title: "Pensii private pierdute",
    text:
      "Verifici pensiile ramase la fosti angajatori si inveti cum sa pornesti cautarea lor fara sa te pierzi in formulare.",
  },
  {
    title: "Council Tax band",
    text:
      "Intelegi daca merita verificata banda de council tax si ce pasi trebuie urmati ca sa ceri revizuirea.",
  },
  {
    title: "Masina cu plata in rate",
    text:
      "Primul pas pentru verificarea unui posibil caz de car finance mis-selling si demararea procesului de recuperare.",
  },
];

export default function JoinClubPage() {
  return (
    <>
      <Head>
        <title>Clubul Aici Sunt Banii Dumneavoastra | JustProveIt</title>
        <meta
          name="description"
          content="Clubul JustProveIt pentru romanii din UK: 26 de verificari, explicatii video pas cu pas, intalniri saptamanale si suport WhatsApp/email."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="ro-GB" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
      </Head>

      <div className="min-h-screen bg-white text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/ro" className="text-lg font-extrabold tracking-normal">
              Just<span className="text-emerald-700">ProveIt</span>
            </Link>
            <Link href="/ro/raport-gratuit" className="text-sm font-bold text-emerald-700 hover:text-emerald-900">
              Raport gratuit
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
                  "url('https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1800&q=80')",
              }}
            />
            <div className="absolute inset-0 bg-slate-950/55" />
            <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-20">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-200">
                JustProveIt
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">
                Clubul Aici Sunt Banii Dumneavoastra
              </h1>
              <div className="mt-5 max-w-3xl space-y-4 text-lg leading-8 text-slate-100">
                <p>
                  Intră într-un program în care verificam sa nu pierzi bani si iti aratam cum sa accesezi banii tai.
                  Primesti 26 de verificari, explicatii clare si video-uri in care vezi pas cu pas cum sa rezolvi
                  problema respectiva, nu doar cum sa afli ca exista.
                </p>
                <p>
                  Ai intalniri saptamanale in care poti intreba orice, grup special de suport pe WhatsApp si email la
                  care poti cere raspunsuri despre bani, acte, servicii si viata de zi cu zi in UK.
                </p>
              </div>
              <ClubCtas className="mt-7" />
            </div>
          </section>

          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-4">
              <Metric value="26" label="verificari + solutii pas cu pas" />
              <Metric value="Video" label="ghiduri clare pentru fiecare problema" />
              <Metric value="Saptamanal" label="intalniri unde poti intreba orice" />
              <Metric value="Suport" label="WhatsApp si email pentru viata in UK" />
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12">
            <SectionTitle
              eyebrow="Ce primesti"
              title="26 de verificari, explicatii si ajutor practic ca sa treci la actiune"
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Feature title="26 de verificari complete">
                Verificam zonele unde poti pierde bani in UK: taxe, credit, pensii private, council tax, facturi,
                conturi uitate, beneficii neaccesate si posibile recuperari din car finance.
              </Feature>
              <Feature title="Video-uri pas cu pas">
                Pentru fiecare verificare nu ramai doar cu un diagnostic. Primesti explicatii si video-uri care iti
                arata ce pagina sa deschizi, ce date sa cauti si ce urmator pas sa faci.
              </Feature>
              <Feature title="Focus pe bani care se pot misca repede">
                Punem accent pe bank account switching, unde multe persoane pot strange bonusuri de pana la aproximativ
                £1,000 in cateva luni daca indeplinesc conditiile bancilor.
              </Feature>
              <Feature title="Pensii private pierdute">
                Iti aratam cum sa cauti pensiile de la fosti angajatori, ce informatii iti trebuie si cum sa nu lasi
                bani uitati in sisteme pe care nu le-ai mai verificat de ani de zile.
              </Feature>
              <Feature title="Council Tax si car finance">
                Ai ghidaj pentru verificarea benzii de council tax si pentru primul pas in demararea verificarii unei
                masini luate cu plata in rate, daca exista risc de recuperare.
              </Feature>
              <Feature title="Suport pentru viata in UK">
                Ai intalniri saptamanale, grup WhatsApp si email unde poti intreba despre facturi, banci, formulare,
                institutii, scrisori primite, pasi urmatori si lucruri pe care altfel le-ai amana sau le-ai face gresit.
              </Feature>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-xl font-extrabold tracking-normal text-slate-950">Unde punem accentul la inceput</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {FOCUS_AREAS.map((area) => (
                  <article key={area.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-base font-extrabold text-slate-950">{area.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{area.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-slate-950 text-white">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-200">Pret</p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-normal">Intri in club cu {FULL_PRICE}</h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
                  Plata se poate face integral sau in 3 rate lunare fara dobanda. Varianta in rate este {MONTHLY_PRICE}
                  /luna timp de 3 luni, ca sa poti incepe verificarea fara sa blochezi tot bugetul din prima zi.
                </p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-200">Oferta completa</p>
                <p className="mt-3 text-5xl font-extrabold tracking-normal">{FULL_PRICE}</p>
                <p className="mt-2 text-sm font-semibold text-slate-200">sau {MONTHLY_PRICE}/luna timp de 3 luni</p>
                <ClubCtas className="mt-6" stacked />
              </div>
            </div>
          </section>

          <section id="verificari" className="border-y border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <SectionTitle eyebrow="Lista completa" title="Cele 20 de verificari din club" />
              <div className="mt-4 max-w-4xl space-y-3 text-base leading-8 text-slate-700">
                <p>
                  Acestea vin peste cele 6 verificari din raportul gratuit. Pentru fiecare zona primesti nu doar lista
                  de verificat, ci si explicatii clare si video-uri pas cu pas despre cum accesezi beneficiul sau cum
                  pornesti procesul.
                </p>
                <p>
                  Daca te blochezi, intrebi in intalnirile saptamanale, in grupul special de WhatsApp sau pe email.
                  Scopul este sa nu ramai singur cu formulare, termene, scrisori, conturi online sau decizii pe care nu
                  stii cum sa le interpretezi.
                </p>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {CLUB_CHECKS.map((check) => (
                  <div key={check} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-extrabold leading-6 text-slate-950">{check}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
            <div>
              <SectionTitle eyebrow="Pentru cine este" title="Pentru romanii din UK care vor sprijin real, nu doar informatii" />
              <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                <p>
                  Clubul este pentru oameni care au muncit in UK, au schimbat joburi, au avut credite, au trimis bani
                  in Romania, au platit facturi ani la rand sau au contributii de pensie pe care nu le-au mai verificat.
                </p>
                <p>
                  Sprijinul conteaza mai ales cand nu stii ce inseamna o scrisoare, ce formular trebuie completat, ce
                  institutie trebuie contactata sau ce termen nu trebuie ratat. Cu un ghid langa tine, eviti amanari,
                  greseli costisitoare, plati lunare inutile si situatii in care renunti doar pentru ca procesul pare
                  complicat.
                </p>
              </div>
            </div>

            <aside id="inscriere" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-2xl font-extrabold tracking-normal">Hai in club</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Alege plata integrala, plata in 3 rate fara dobanda sau programeaza un apel daca vrei sa iti explice
                cineva ce include clubul si cum poti incepe.
              </p>
              <ClubCtas className="mt-5" stacked />
            </aside>
          </section>
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <strong className="text-lg text-slate-950">
                Just<span className="text-emerald-700">ProveIt</span>
              </strong>
              <p className="mt-2">Verificări financiare explicate pe limba comunității românești din UK.</p>
            </div>
            <div>
              <strong className="text-slate-950">Contact</strong>
              <p className="mt-2">+44 7447 707829</p>
              <p>{CONTACT_EMAIL}</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function ClubCtas({ className = "", stacked = false }: { className?: string; stacked?: boolean }) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const containerClass = stacked
    ? "flex flex-col gap-3"
    : "flex flex-col gap-3 sm:flex-row sm:flex-wrap";
  const isLoading = Boolean(loadingPlan);

  async function startCheckout(apiPlan: "full" | typeof INSTALLMENTS_API_PLAN, displayPlan: "full" | "installments") {
    setCheckoutError("");
    setLoadingPlan(apiPlan);

    try {
      const pageUrl = typeof window !== "undefined" ? `${window.location.origin}${PAGE_PATH}` : CANONICAL;
      const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const response = await fetch(CLUB_CHECKOUT_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          tenantKey: "justproveit",
          plan: apiPlan,
          source: "ro-hai-in-club",
          pageUrl,
          successUrl: `${pageUrl}?checkout=success&plan=${displayPlan}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${pageUrl}?checkout=cancelled&plan=${displayPlan}`,
          leadId: query.get("leadId") || "",
          reportId: query.get("reportId") || "",
          reportToken: query.get("reportToken") || query.get("token") || "",
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || typeof payload.url !== "string") {
        throw new Error(readCheckoutError(payload, response.statusText));
      }

      window.location.assign(payload.url);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Nu am putut deschide plata prin Stripe. Incearca din nou.",
      );
      setLoadingPlan("");
    }
  }

  return (
    <div className={className}>
      <div className={containerClass}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => startCheckout("full", "full")}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-emerald-600 px-5 text-center text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loadingPlan === "full" ? "Se deschide Stripe..." : `Hai in Club : ${FULL_PRICE}`}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => startCheckout(INSTALLMENTS_API_PLAN, "installments")}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-emerald-200 bg-white px-5 text-center text-sm font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {loadingPlan === INSTALLMENTS_API_PLAN ? "Se deschide Stripe..." : `Hai in Club: ${MONTHLY_PRICE} * 3 luni`}
        </button>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-center text-sm font-extrabold text-slate-950 shadow-sm hover:bg-slate-100"
        >
          Programeaza un apel
        </a>
      </div>
      {checkoutError ? (
        <p className="mt-3 max-w-xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold leading-6 text-red-800">
          {checkoutError}
        </p>
      ) : null}
    </div>
  );
}

function readCheckoutError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const error = "error" in payload ? payload.error : "message" in payload ? payload.message : null;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }

  return fallback || "Nu am putut deschide plata prin Stripe. Incearca din nou.";
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-normal text-slate-950">{title}</h2>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l-4 border-emerald-600 bg-slate-50 px-4 py-3">
      <p className="text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-extrabold tracking-normal text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-700">{children}</p>
    </article>
  );
}
