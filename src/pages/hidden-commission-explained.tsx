import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/hidden-commission-explained";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Hidden Commission in Car Finance Explained | What Customers Were Not Told";
const DESCRIPTION =
  "A clear explanation of hidden commission in UK car finance, how it worked, why it caused concern, and why it matters in car finance mis-selling cases.";

export default function HiddenCommissionExplained() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Hidden Commission in Car Finance Explained",
    description: DESCRIPTION,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": CANONICAL,
    },
    author: {
      "@type": "Organization",
      name: "JustProveIt",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "JustProveIt",
      url: SITE_URL,
    },
    datePublished: published,
    dateModified: modified,
    inLanguage: "en-GB",
    isPartOf: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/car-finance-mis-selling`,
      name: "Car Finance Mis-Selling – Complete Guide",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is hidden commission in car finance?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Hidden commission refers to payments made by a lender to a car dealer for arranging finance, where the existence or impact of that commission was not clearly disclosed to the customer.",
        },
      },
      {
        "@type": "Question",
        name: "Is commission itself illegal?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. Commission itself is not automatically illegal. Problems arise when commission creates a conflict of interest and this is not clearly explained to the customer.",
        },
      },
      {
        "@type": "Question",
        name: "How did hidden commission affect interest rates?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "In some models, dealers could increase the interest rate offered to a customer and earn more commission as a result. Customers were often not told that this discretion existed.",
        },
      },
      {
        "@type": "Question",
        name: "Does hidden commission only affect PCP agreements?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. While PCP agreements are commonly involved, Hire Purchase and other car finance products can also be affected depending on how commission and interest rates were structured.",
        },
      },
      {
        "@type": "Question",
        name: "Does hidden commission mean an agreement was mis-sold?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Not automatically. Mis-selling depends on whether the customer was given clear, fair and transparent information at the point of sale.",
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Car Finance Mis-Selling",
        item: `${SITE_URL}/car-finance-mis-selling`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Hidden Commission",
        item: CANONICAL,
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />

        {/* Language */}
        <meta httpEquiv="content-language" content="en-GB" />

        {/* Robots */}
        <meta name="robots" content="index,follow,max-image-preview:large" />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="JustProveIt" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <h1 className="text-3xl font-extrabold">
            Hidden Commission in Car Finance Explained
          </h1>

          <p className="mt-4 text-lg">
            Hidden commission is one of the most misunderstood aspects of car
            finance mis-selling. This page explains what hidden commission is,
            how it worked in practice, and why it raised serious concerns about
            fairness and transparency.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Part of the complete guide:{" "}
            <Link
              href="/car-finance-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Car finance mis-selling explained →
            </Link>
          </p>

          <hr className="my-10" />

          <section className="space-y-10">
            <Section title="What is commission in car finance?">
              <p>
                Commission is a payment made by a lender to a car dealer for
                arranging a finance agreement. It is a common feature of many
                financial products and is not automatically a problem.
              </p>
              <p>
                Issues arise when commission influences the terms offered to the
                customer and this influence is not clearly disclosed.
              </p>
            </Section>

            <Section title="When commission becomes 'hidden'">
              <p>
                Commission becomes problematic when customers are not told that
                it exists, how it works, or how it may affect the interest rate
                they are offered.
              </p>
              <p>
                In many cases, customers were led to believe the interest rate
                was fixed or standard, when in reality the dealer had discretion.
              </p>
            </Section>

            <Section title="How hidden commission affected customers">
              <p>
                Hidden commission could lead to higher interest rates, even when
                customers were otherwise eligible for better terms. The impact
                was often not obvious because the focus was placed on monthly
                payments rather than total cost.
              </p>
              <p>
                This meant customers could pay significantly more over the life
                of the agreement without understanding why.
              </p>
            </Section>

            <Section title="Hidden commission and Discretionary Commission Models">
              <p>
                Hidden commission is closely linked to Discretionary Commission
                Models (DCMs), where dealers could increase interest rates and
                earn more commission as a result.
              </p>

              <p className="mt-4 text-sm text-slate-600">
                Related:{" "}
                <Link
                  href="/discretionary-commission-models"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Discretionary commission models explained →
                </Link>
              </p>
            </Section>

            <Section title="Why transparency matters">
              <p>
                Transparency allows consumers to make informed choices. When
                commission arrangements are hidden, customers cannot properly
                assess whether a deal is fair or competitive.
              </p>
              <p>
                This lack of transparency is why hidden commission has become a
                central issue in many car finance mis-selling complaints.
              </p>
            </Section>

            <Section title="Does hidden commission mean mis-selling occurred?">
              <p>
                Not necessarily. The key question is whether the customer was
                given clear, fair and transparent information at the point of
                sale.
              </p>
              <p>
                Understanding hidden commission helps explain why certain
                agreements are now being reviewed and challenged.
              </p>

              <p className="mt-4 text-sm text-slate-600">
                Next step:{" "}
                <Link
                  href="/how-to-complain-car-finance"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  How to complain about car finance mis-selling →
                </Link>
              </p>
            </Section>
          </section>

          <hr className="my-10" />

          <p className="text-sm text-slate-600">
            Related reading:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-sm">
            <li>
              <Link
                href="/fca-car-finance-investigation"
                className="font-semibold text-emerald-700 hover:underline"
              >
                FCA car finance investigation →
              </Link>
            </li>
            <li>
              <Link
                href="/who-is-eligible-car-finance"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Who may be eligible →
              </Link>
            </li>
          </ul>
        </article>
      </main>
    </>
  );
}

/* -------- Small component -------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="prose prose-slate mt-4 max-w-none">
        {children}
      </div>
    </section>
  );
}