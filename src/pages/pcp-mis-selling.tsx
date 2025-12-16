import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/pcp-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "PCP Mis-Selling Explained | Personal Contract Purchase Car Finance UK";
const DESCRIPTION =
  "A clear explanation of PCP mis-selling in the UK, how Personal Contract Purchase agreements are sold, where problems arise, and why some PCP agreements are now being reviewed.";

export default function PCPMisSelling() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "PCP Mis-Selling Explained",
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
        name: "What is PCP mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "PCP mis-selling occurs when a Personal Contract Purchase agreement is sold without clear, fair and transparent information. This can involve undisclosed commission, discretionary interest rates, or an overemphasis on monthly payments.",
        },
      },
      {
        "@type": "Question",
        name: "Is PCP more likely to be mis-sold than other finance types?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "PCP agreements are commonly associated with mis-selling concerns because customers often focus on monthly payments rather than the total cost of credit, making pricing and commission less visible.",
        },
      },
      {
        "@type": "Question",
        name: "Does PCP involve commission?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Many PCP agreements involve commission paid by the lender to the dealer. Problems arise when this commission is not clearly disclosed or influences the interest rate offered.",
        },
      },
      {
        "@type": "Question",
        name: "Can closed or settled PCP agreements be reviewed?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. PCP agreements do not need to be active. Closed or settled agreements may still be reviewed depending on time limits and when the issue became apparent.",
        },
      },
      {
        "@type": "Question",
        name: "Does PCP mis-selling guarantee compensation?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. Compensation is not guaranteed. Outcomes depend on individual circumstances and how the agreement was sold.",
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
        name: "PCP Mis-Selling",
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
            PCP Mis-Selling Explained
          </h1>

          <p className="mt-4 text-lg">
            Personal Contract Purchase (PCP) is one of the most popular forms of
            car finance in the UK. It is also one of the most commonly linked to
            car finance mis-selling concerns.
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
            <Section title="What is PCP (Personal Contract Purchase)?">
              <p>
                PCP is a type of car finance where you pay a deposit followed by
                monthly payments over a fixed term. At the end of the agreement,
                you usually have three options: return the car, pay a final
                balloon payment to own it, or replace it with another vehicle.
              </p>
              <p>
                Because PCP emphasises monthly affordability, the total cost of
                credit can be less obvious at the point of sale.
              </p>
            </Section>

            <Section title="How PCP agreements are typically sold">
              <p>
                PCP agreements are often sold at dealerships with a strong focus
                on monthly payments rather than APR or total repayable amount.
              </p>
              <p>
                Customers may be told the deal is “standard” or “the best
                available”, without being informed that the interest rate could
                be influenced.
              </p>
            </Section>

            <Section title="Why PCP is commonly linked to mis-selling">
              <p>
                PCP agreements are commonly linked to mis-selling concerns
                because:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Customers focus on monthly payments</li>
                <li>Total cost of credit is less prominent</li>
                <li>Interest rates can be discretionary</li>
                <li>Commission incentives may exist</li>
              </ul>
            </Section>

            <Section title="PCP and hidden commission">
              <p>
                Many PCP agreements involved commission paid by the lender to
                the dealer. Problems arise when customers were not told that
                commission existed or that it could influence the interest rate.
              </p>

              <p className="mt-4 text-sm text-slate-600">
                Related:{" "}
                <Link
                  href="/hidden-commission-explained"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Hidden commission explained →
                </Link>
              </p>
            </Section>

            <Section title="PCP and Discretionary Commission Models">
              <p>
                Some PCP agreements were linked to Discretionary Commission
                Models (DCMs), allowing dealers to increase interest rates and
                earn more commission.
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

            <Section title="Does PCP mis-selling mean something went wrong?">
              <p>
                Not necessarily. Mis-selling depends on how the agreement was
                sold and what information was provided at the time.
              </p>
              <p>
                Understanding PCP mis-selling helps explain why some agreements
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
                href="/hire-purchase-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Hire Purchase mis-selling explained →
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