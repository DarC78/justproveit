import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const CANONICAL = `${SITE_URL}/ro`;

export default function RomanianIndex() {
  return (
    <>
      <Head>
        <title>Ghiduri financiare UK pentru români | JustProveIt</title>
        <meta
          name="description"
          content="Ghiduri independente despre probleme financiare din UK, explicate clar pentru românii care locuiesc în Marea Britanie."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="ro-GB" />

        {/* hreflang */}
        <link rel="alternate" hrefLang="en-GB" href={SITE_URL} />
        <link rel="alternate" hrefLang="ro-GB" href={CANONICAL} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

        <meta name="robots" content="index,follow" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">
          Informații financiare din UK pentru români
        </h1>

        <p className="mt-4 text-lg">
          JustProveIt oferă ghiduri independente despre situații financiare
          frecvente din Marea Britanie, explicate clar pentru românii care
          trăiesc și muncesc în UK.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Ghiduri disponibile</h2>

          <ul className="mt-4 list-disc pl-6 space-y-3">
            <li>
              <Link
                href="/ro/car-finance-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Car finance mis-selling în UK →
              </Link>
            </li>
          </ul>
        </section>

        <hr className="my-10" />

        <p className="text-sm text-slate-600">
          Ghidurile complete și explicațiile detaliate sunt disponibile în
          limba engleză.
        </p>
      </main>
    </>
  );
}