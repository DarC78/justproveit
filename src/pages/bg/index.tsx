import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const CANONICAL = `${SITE_URL}/bg`;

export default function BulgarianIndex() {
  return (
    <>
      <Head>
        <title>Финансови ръководства UK за българи | JustProveIt</title>
        <meta
          name="description"
          content="Независими финансови ръководства за Великобритания, обяснени за българи, живеещи в UK."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="bg-GB" />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold">
          Финансова информация за UK за българи
        </h1>

        <p className="mt-4 text-lg">
          JustProveIt предоставя ясни и независими обяснения по важни финансови
          въпроси във Великобритания.
        </p>

        <ul className="mt-10 list-disc pl-6">
          <li>
            <Link
              href="/bg/car-finance-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Car finance mis-selling във Великобритания →
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}