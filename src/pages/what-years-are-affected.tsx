import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/what-years-are-affected";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Which Years Are Affected by Car Finance Mis-Selling? | UK Guide";
const DESCRIPTION =
  "Learn which years of car finance agreements are commonly affected by mis-selling concerns in the UK, including the role of commission models and FCA regulation.";

export default function WhatYearsAreAffected() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Which Years Are Affected by Car Finance Mis-Selling?",
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
        name: "Is there a specific year when car finance mis-selling applies?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. There is no single year that automatically determines whether mis-selling occurred. Each agreement depends on how it was sold and what was disclosed at the time.",
        },
      },
      {
        "@type": "Question",
        name: "Why are agreements before 2021 often discussed?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Before 2021, some car finance agreements used Discretionary Commission Models (DCM), which allowed dealers to influence interest rates. These models were later banned due to fairness concerns.",
        },
      },
      {
        "@type": "Question",
        name: "Can newer agreements still raise issues?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Even agreements taken out after regulatory changes may raise concerns if key information was not properly disclosed.",
        },
      },
      {
        "@type": "Question",
        name: "Are older agreements still relevant?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "In some cases, yes. Older agreements may still be reviewed depending on time limits and when the issue became apparent.",
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
        name: "Which Years Are Affected?",
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
            Which Years Are Affected by Car Finance Mis-Selling?
          </h1>

          <p className="mt-4 text-lg">
            One of the most common questions is whether car finance mis-selling
            only applies to agreements from a specific period. In reality, there
            is no single cut-off year.
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

          <Section title="Why certain years receive more attention">
            <p>
              Regulatory scrutiny has focused on how car finance agreements were
              sold, particularly where commission and interest rate discretion
              existed. This has led to increased attention on agreements taken
              out before key regulatory changes.
            </p>
          </Section>

          <Section title="Agreements before 2021">
            <p>
              Many discussions focus on agreements made before 2021, when
              <strong> Discretionary Commission Models (DCM)</strong> were still
              permitted. Under these models, dealers could influence interest
              rates and earn higher commission when customers paid more.
            </p>
            <p>
              These arrangements were later banned due to concerns about fairness
              and transparency.
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

          <Section title="Agreements after 2021">
            <p>
              While DCMs were banned, later agreements are not automatically
              exempt. Issues can still arise if commission arrangements,
              interest rate setting, or alternatives were not clearly explained
              to the customer.
            </p>
          </Section>

          <Section title="Older agreements">
            <p>
              Older agreements may still be relevant, especially where the
              customer only became aware of potential issues following FCA
              findings or wider media coverage.
            </p>
            <p>
              Time limits can apply, but they are not always based solely on the
              agreement start or end date.
            </p>
          </Section>

          <Section title="Why years alone do not decide eligibility">
            <p>
              The key factor is not the calendar year, but how the agreement was
              sold. Two agreements from the same year can have very different
              outcomes depending on disclosure, incentives, and transparency.
            </p>
          </Section>

          <Section title="What to do next">
            <p>
              Understanding which years are commonly affected can help you
              decide whether further review is worthwhile.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Next step:{" "}
              <Link
                href="/who-is-eligible-car-finance"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Who may be eligible →
              </Link>
            </p>
          </Section>

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
                href="/hidden-commission-explained"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Hidden commission explained →
              </Link>
            </li>
          </ul>
        </article>
      </main>
    </>
  );
}

/* ---------- Small component ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="prose prose-slate mt-4 max-w-none">
        {children}
      </div>
    </section>
  );
}