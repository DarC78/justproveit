import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/hire-purchase-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Hire Purchase Mis-Selling Explained | Car Finance Mis-Selling UK";
const DESCRIPTION =
  "A clear explanation of Hire Purchase mis-selling in the UK, how HP agreements are sold, where problems arise, and why some Hire Purchase agreements are now being reviewed.";

export default function HirePurchaseMisSelling() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Hire Purchase Mis-Selling Explained",
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
        name: "What is Hire Purchase mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Hire Purchase mis-selling occurs when an HP agreement is sold without clear, fair and transparent information. This may involve undisclosed commission, discretionary interest rates, or inadequate explanation of costs.",
        },
      },
      {
        "@type": "Question",
        name: "Is Hire Purchase safer than PCP?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Not necessarily. While Hire Purchase agreements can appear simpler than PCP, they can still involve discretionary interest rates and commission arrangements that raise fairness concerns.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hire Purchase involve commission?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Many Hire Purchase agreements involve commission paid by the lender to the dealer. Issues arise when this commission is not clearly disclosed or influences the interest rate offered.",
        },
      },
      {
        "@type": "Question",
        name: "Can closed Hire Purchase agreements be reviewed?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Hire Purchase agreements do not need to be active to be reviewed. Closed agreements may still be considered depending on time limits and when the issue became apparent.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hire Purchase mis-selling guarantee compensation?",
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
        name: "Hire Purchase Mis-Selling",
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
            Hire Purchase Mis-Selling Explained
          </h1>

          <p className="mt-4 text-lg">
            Hire Purchase (HP) agreements are often viewed as simple and
            straightforward. However, many Hire Purchase agreements were sold
            in ways that raise concerns about transparency and fairness.
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
            <Section title="What is Hire Purchase?">
              <p>
                Hire Purchase is a form of car finance where you pay an initial
                deposit followed by fixed monthly payments. Ownership of the
                vehicle transfers to you only after the final payment is made.
              </p>
              <p>
                Because the structure appears simple, customers often assume
                the agreement is automatically fair and fully transparent.
              </p>
            </Section>

            <Section title="How Hire Purchase agreements are typically sold">
              <p>
                HP agreements are usually arranged at the dealership. The focus
                is often on affordability and monthly payments rather than APR
                comparison or total cost of credit.
              </p>
              <p>
                In some cases, customers are presented with the agreement as
                standard or non-negotiable.
              </p>
            </Section>

            <Section title="Where Hire Purchase mis-selling concerns arise">
              <p>
                Hire Purchase mis-selling concerns commonly arise where:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>The interest rate was higher than expected</li>
                <li>Commission arrangements were not disclosed</li>
                <li>It was not explained that the rate could be discretionary</li>
                <li>Alternatives were not discussed</li>
              </ul>
            </Section>

            <Section title="Hire Purchase and hidden commission">
              <p>
                Many Hire Purchase agreements involved commission paid by the
                lender to the dealer. Problems arise when customers were not
                told that commission existed or that it could influence the
                interest rate.
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

            <Section title="Hire Purchase and Discretionary Commission Models">
              <p>
                In some cases, Hire Purchase agreements were linked to
                Discretionary Commission Models (DCMs), allowing dealers to
                increase interest rates and earn more commission.
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

            <Section title="Does Hire Purchase mis-selling mean something went wrong?">
              <p>
                Not necessarily. Mis-selling depends on how the agreement was
                sold and what information was provided at the time.
              </p>
              <p>
                Understanding Hire Purchase mis-selling helps explain why some
                agreements are now being reviewed.
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
                href="/pcp-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                PCP mis-selling explained →
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