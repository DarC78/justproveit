import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const CANONICAL = `${SITE_URL}/it`;

export default function ItalianIndex() {
  return (
    <>
      <Head>
        <title>Guida finanziaria UK per italiani | JustProveIt</title>
        <meta
          name="description"
          content="Guide indipendenti su car finance mis-selling nel Regno Unito, spiegate per italiani che vivono in UK."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="it-GB" />

        <link rel="alternate" hrefLang="en-GB" href={SITE_URL} />
        <link rel="alternate" hrefLang="it-GB" href={CANONICAL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">
          Informazioni finanziarie UK per italiani
        </h1>

        <p className="mt-4 text-lg">
          JustProveIt offre guide indipendenti su questioni finanziarie nel Regno
          Unito, spiegate in modo chiaro per chi vive in UK.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Guide disponibili</h2>

          <ul className="mt-4 list-disc pl-6 space-y-3">
            <li>
              <Link
                href="/it/car-finance-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Car finance mis-selling nel Regno Unito →
              </Link>
            </li>
          </ul>
        </section>

        <hr className="my-10" />

        <p className="text-sm text-slate-600">
          Contenuti completi disponibili in inglese.
        </p>
      </main>
    </>
  );
}