import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/it/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling nel Regno Unito – Guida per italiani | JustProveIt";

const DESCRIPTION =
  "Guida chiara sul car finance mis-selling nel Regno Unito per italiani che vivono in UK. Scopri cosa significa, chi può essere coinvolto e quali sono le opzioni.";

export default function CarFinanceMisSellingIT() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="it-GB" />

        {/* hreflang */}
        <link rel="alternate" hrefLang="en-GB" href={`${SITE_URL}/car-finance-mis-selling`} />
        <link rel="alternate" hrefLang="it-GB" href={CANONICAL} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/car-finance-mis-selling`} />

        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <h1 className="text-3xl font-extrabold">
            Car Finance Mis-Selling nel Regno Unito
          </h1>

          <p className="mt-4 text-lg">
            Molti italiani in UK hanno acquistato un’auto tramite finanziamenti
            come <strong>PCP</strong> o <strong>Hire Purchase</strong>, senza
            sapere che in alcuni casi la vendita potrebbe non essere stata
            completamente trasparente.
          </p>

          <Section title="Che cos’è il car finance mis-selling?">
            <p>
              Il car finance mis-selling si verifica quando un contratto di
              finanziamento viene venduto senza spiegare chiaramente interessi,
              commissioni o alternative disponibili.
            </p>
            <p className="mt-3">
              Non significa automaticamente che il contratto sia “sbagliato”,
              ma che potrebbero esserci stati problemi di trasparenza al momento
              della vendita.
            </p>
          </Section>

          <Section title="Chi può essere coinvolto?">
            <ul className="list-disc pl-6 space-y-2">
              <li>contratto già concluso</li>
              <li>auto non più posseduta</li>
              <li>pagamenti sempre regolari</li>
              <li>finanziamento ottenuto tramite concessionario</li>
            </ul>
          </Section>

          <Section title="Cosa puoi fare ora">
            <p>
              Il primo passo è capire meglio come funziona il sistema nel Regno
              Unito e quali sono i tuoi diritti come consumatore.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Approfondimenti disponibili in inglese:
            </p>

            <ul className="mt-2 list-disc pl-6 space-y-2 text-sm">
              <li>
                <Link href="/what-is-car-finance-mis-selling" className="font-semibold text-emerald-700 hover:underline">
                  Cos’è il mis-selling (EN)
                </Link>
              </li>
              <li>
                <Link href="/who-is-eligible-car-finance" className="font-semibold text-emerald-700 hover:underline">
                  Chi può essere idoneo (EN)
                </Link>
              </li>
              <li>
                <Link href="/how-to-complain-car-finance" className="font-semibold text-emerald-700 hover:underline">
                  Come presentare un reclamo (EN)
                </Link>
              </li>
            </ul>
          </Section>

          <hr className="my-10" />

          <p className="text-sm text-slate-600">
            Questa pagina è una guida informativa. Non fornisce consulenza legale.
          </p>

          <Link
            href="/car-finance-mis-selling"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Vai alla guida completa in inglese →
          </Link>
        </article>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="prose mt-4">{children}</div>
    </section>
  );
}