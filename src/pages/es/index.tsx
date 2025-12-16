import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const CANONICAL = `${SITE_URL}/es`;

export default function SpanishIndex() {
  return (
    <>
      <Head>
        <title>Guías financieras UK para españoles | JustProveIt</title>
        <meta
          name="description"
          content="Guías independientes sobre temas financieros en Reino Unido, explicadas para españoles que viven en UK."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="es-GB" />

        <link rel="alternate" hrefLang="en-GB" href={SITE_URL} />
        <link rel="alternate" hrefLang="es-GB" href={CANONICAL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">
          Información financiera del Reino Unido para españoles
        </h1>

        <p className="mt-4 text-lg">
          JustProveIt ofrece guías independientes sobre problemas financieros
          comunes en el Reino Unido, explicadas de forma clara.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Guías disponibles</h2>

          <ul className="mt-4 list-disc pl-6 space-y-3">
            <li>
              <Link
                href="/es/car-finance-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Car finance mis-selling en Reino Unido →
              </Link>
            </li>
          </ul>
        </section>

        <hr className="my-10" />

        <p className="text-sm text-slate-600">
          Contenido completo disponible en inglés.
        </p>
      </main>
    </>
  );
}