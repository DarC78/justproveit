import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const CANONICAL = `${SITE_URL}/pl`;

export default function PolishIndex() {
  return (
    <>
      <Head>
        <title>Przewodniki finansowe UK dla Polaków | JustProveIt</title>
        <meta
          name="description"
          content="Niezależne przewodniki finansowe w UK, wyjaśnione dla Polaków mieszkających w Wielkiej Brytanii."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="pl-GB" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">
          Informacje finansowe UK dla Polaków
        </h1>

        <p className="mt-4 text-lg">
          JustProveIt wyjaśnia złożone zagadnienia finansowe w UK w prosty i
          zrozumiały sposób.
        </p>

        <ul className="mt-10 list-disc pl-6">
          <li>
            <Link
              href="/pl/car-finance-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Car finance mis-selling w UK →
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
