import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/es/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling en Reino Unido – Guía para españoles | JustProveIt";

const DESCRIPTION =
  "Guía clara sobre car finance mis-selling en el Reino Unido para españoles que viven en UK. Qué es, a quién afecta y qué opciones existen.";

export default function CarFinanceMisSellingES() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="es-GB" />

        {/* hreflang */}
        <link rel="alternate" hrefLang="en-GB" href={`${SITE_URL}/car-finance-mis-selling`} />
        <link rel="alternate" hrefLang="es-GB" href={CANONICAL} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/car-finance-mis-selling`} />

        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <h1 className="text-3xl font-extrabold">
            Car Finance Mis-Selling en el Reino Unido
          </h1>

          <p className="mt-4 text-lg">
            Muchos españoles en UK compraron su coche mediante financiación
            como <strong>PCP</strong> o <strong>Hire Purchase</strong>, confiando
            en que la oferta del concesionario era estándar.
          </p>

          <Section title="¿Qué significa car finance mis-selling?">
            <p>
              El término se refiere a contratos de financiación vendidos sin una
              explicación clara sobre intereses, comisiones o alternativas
              disponibles.
            </p>
          </Section>

          <Section title="¿A quién puede afectar?">
            <ul className="list-disc pl-6 space-y-2">
              <li>contratos ya finalizados</li>
              <li>coches que ya no posees</li>
              <li>pagos realizados sin problemas</li>
              <li>financiación ofrecida por concesionarios</li>
            </ul>
          </Section>

          <Section title="¿Cuáles son los siguientes pasos?">
            <p>
              El objetivo de esta página es ayudarte a entender el problema
              antes de decidir qué hacer.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Guías detalladas disponibles en inglés:
            </p>

            <ul className="mt-2 list-disc pl-6 space-y-2 text-sm">
              <li>
                <Link href="/what-is-car-finance-mis-selling" className="font-semibold text-emerald-700 hover:underline">
                  Qué es el mis-selling (EN)
                </Link>
              </li>
              <li>
                <Link href="/who-is-eligible-car-finance" className="font-semibold text-emerald-700 hover:underline">
                  Quién puede ser elegible (EN)
                </Link>
              </li>
              <li>
                <Link href="/how-to-complain-car-finance" className="font-semibold text-emerald-700 hover:underline">
                  Cómo presentar una reclamación (EN)
                </Link>
              </li>
            </ul>
          </Section>

          <hr className="my-10" />

          <p className="text-sm text-slate-600">
            Esta página es informativa y no constituye asesoramiento legal.
          </p>

          <Link
            href="/car-finance-mis-selling"
            className="mt-4 inline-block font-semibold text-emerald-700 hover:underline"
          >
            Ir a la guía completa en inglés →
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
