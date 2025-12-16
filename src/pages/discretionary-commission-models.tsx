import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/discretionary-commission-models";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Discretionary Commission Models (DCM) Explained | Car Finance Mis-Selling UK";
const DESCRIPTION =
  "A clear explanation of Discretionary Commission Models (DCM) in UK car finance, how they worked, why they were banned by the FCA, and why they matter for mis-selling complaints.";

export default function DiscretionaryCommissionModels() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Discretionary Commission Models (DCM) Explained",
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
        name: "What is a Discretionary Commission Model (DCM)?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "A Discretionary Commission Model allows a car dealer to adjust the interest rate offered to a customer within a permitted range. The dealer’s commission can increase when the interest rate increases.",
        },
      },
      {
        "@type": "Question",
        name: "Why were Discretionary Commission Models banned?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "The FCA banned DCMs because they created a conflict of interest. Dealers could earn more commission by charging customers higher interest rates, often without clear disclosure.",
        },
      },
      {
        "@type": "Question",
        name: "Are Discretionary Commission Models illegal?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "DCMs themselves were not automatically illegal, but the FCA concluded they caused consumer harm. Their use raised serious concerns about fairness and transparency.",
        },
      },
      {
        "@type": "Question",
        name: "Do DCMs only affect PCP agreements?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. While PCP agreements are commonly involved, Hire Purchase and other car finance products could also be affected if discretionary interest rates were used.",
        },
      },
      {
        "@type": "Question",
        name: "Can agreements made before the ban still be reviewed?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Agreements entered into before the 2021 ban may still be reviewed depending on circumstances, time limits, and how the agreement was sold.",
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
        name: "Discretionary Commission Models",
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
            Discretionary Commission Models (DCM) Explained
          </h1>

          <p className="mt-4 text-lg">
            Discretionary Commission Models (DCMs) played a central role in many
            car finance mis-selling concerns in the UK. This page explains, in
            plain language, what DCMs are, how they worked, and why regulators
            intervened.
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
            <Section
              title="What is a Discretionary Commission Model?"
            >
              <p>
                A Discretionary Commission Model allows a car dealer to adjust
                the interest rate offered to a customer within limits set by the
                lender. The higher the interest rate, the more commission the
                dealer could earn.
              </p>
              <p>
                From the customer’s perspective, the rate often appeared fixed
                or non-negotiable, even though discretion existed behind the
                scenes.
              </p>
            </Section>

            <Section title="Why DCMs created a problem">
              <p>
                DCMs created a conflict of interest. Dealers were financially
                rewarded for increasing interest rates, while customers were
                rarely told this was happening.
              </p>
              <p>
                This undermined informed decision-making and transparency,
                which are core principles of UK consumer protection.
              </p>
            </Section>

            <Section title="The FCA’s intervention and the 2021 ban">
              <p>
                After investigating the car finance market, the FCA concluded
                that DCMs caused widespread consumer harm. As a result,
                Discretionary Commission Models were banned in January 2021.
              </p>
              <p>
                The ban did not mean that all past agreements were automatically
                mis-sold, but it confirmed that the model itself posed serious
                fairness risks.
              </p>

              <p className="mt-4 text-sm text-slate-600">
                Related:{" "}
                <Link
                  href="/fca-car-finance-investigation"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  FCA car finance investigation explained →
                </Link>
              </p>
            </Section>

            <Section title="Which agreements may be affected">
              <p>
                DCMs were most commonly used before 2021. Agreements taken out
                during that period may raise questions if:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>The interest rate was higher than expected</li>
                <li>No explanation was given about rate setting</li>
                <li>Commission arrangements were not disclosed</li>
                <li>Focus was placed on monthly payments only</li>
              </ul>
            </Section>

            <Section title="DCMs and mis-selling complaints">
              <p>
                The existence of a DCM does not automatically mean mis-selling
                occurred. Complaints usually focus on whether the customer was
                given clear, fair and transparent information at the point of
                sale.
              </p>
              <p>
                Understanding how DCMs worked helps explain why some agreements
                are now being reviewed.
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
                href="/hidden-commission-explained"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Hidden commission explained →
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