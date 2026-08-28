import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/hai-in-club";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const CALENDLY_URL = "https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani";

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

export default function JoinClubPage() {
  return (
    <>
      <Head>
        <title>Clubul Aici Sunt Banii Dumneavoastra | JustProveIt</title>
        <meta
          name="description"
          content="Serviciul complet JustProveIt pentru romanii din UK care vor sa verifice taxele, creditul, pensiile, facturile si banii neaccesati."
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
                  Intalniri saptamanale in care poti intreba orice. Grup de suport whatsapp si email in care iti
                  raspundem la orice intrebare ai avea!
                </p>
                <p>
                  Apasa butonul &quot;programeaza discutie&quot; si unul din operatori te va suna sa iti spuna mai multe
                  detalii.
                </p>
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={CALENDLY_URL}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-500"
                >
                  Programeaza discutie
                </a>
                <a
                  href="#verificari"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/50 px-5 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  Vezi cele 20 de verificari
                </a>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
              <Metric value="20" label="verificări financiare extinse" />
              <Metric value="90 de zile" label="întrebări și clarificări" />
              <Metric value="RO" label="explicații simple, în română" />
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-12">
            <SectionTitle eyebrow="Ce primesti" title="Un plan clar pentru banii pe care ii poti recupera sau opri din pierdere" />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Feature title="Verificări ghidate">
                Luăm fiecare zonă pe rând și îți arătăm unde merită să verifici mai departe, fără să îți cerem parole
                sau date bancare.
              </Feature>
              <Feature title="Pași concreți">
                Primești explicații simple despre ce conturi, instituții sau documente trebuie verificate pentru cazul
                tău.
              </Feature>
              <Feature title="Follow-up în română">
                După verificarea inițială, poți reveni cu întrebări ca să nu rămâi blocat la jumătatea drumului.
              </Feature>
            </div>
          </section>

          <section id="verificari" className="border-y border-slate-200 bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <SectionTitle eyebrow="Lista completa" title="Cele 20 de verificari din club" />
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
              <SectionTitle eyebrow="Pentru cine este" title="Pentru romanii din UK care vor sa nu lase bani pe masa" />
              <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                <p>
                  Clubul este pentru oameni care au muncit în UK, au schimbat joburi, au avut credite, au trimis bani
                  în România, au plătit facturi ani la rând sau au contribuții de pensie pe care nu le-au mai verificat.
                </p>
                <p>
                  Unele verificări pot duce la recuperări directe. Altele te ajută să oprești pierderi lunare sau să
                  găsești bani și drepturi care există deja, dar nu sunt accesate.
                </p>
              </div>
            </div>

            <aside id="inscriere" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
              <h2 className="text-2xl font-extrabold tracking-normal">Hai in club</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Începem cu situația ta, identificăm verificările relevante și stabilim ce pași merită făcuți imediat.
                Textul și oferta vor fi ajustate, dar pagina este pregătită pentru serviciul complet.
              </p>
              <a
                href={CALENDLY_URL}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Programeaza discutie
              </a>
              <a
                href="mailto:adriandefta@proveitweb.co.uk?subject=Clubul%20Aici%20Sunt%20Banii%20Dumneavoastra"
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
              >
                Trimite email
              </a>
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
              <p>adriandefta@proveitweb.co.uk</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
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
