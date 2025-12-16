import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/fca-car-finance-investigation";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "FCA Car Finance Investigation Explained | What Happened and Why It Matters";
const DESCRIPTION =
  "A clear explanation of the FCA car finance investigation: what the FCA found, why commission models were banned, what it means for consumers, and how it links to car finance mis-selling.";

export default function FCACarFinanceInvestigation() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "FCA Car Finance Investigation Explained",
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
        name: "What is the FCA car finance investigation?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "The FCA car finance investigation examined how car finance agreements were sold in the UK, focusing on commission models, interest rate discretion, and whether consumers were treated fairly.",
        },
      },
      {
        "@type": "Question",
        name: "Why did the FCA investigate car finance?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "The FCA identified concerns that certain commission models created conflicts of interest, allowing dealers to earn more by charging higher interest rates without clear disclosure to customers.",
        },
      },
      {
        "@type": "Question",
        name: "Did the FCA say all car finance agreements were mis-sold?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. The FCA did not state that all agreements were mis-sold. The investigation highlighted structural risks and consumer harm, but each agreement must be assessed on its own facts.",
        },
      },
      {
        "@type": "Question",
        name: "When were Discretionary Commission Models banned?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Discretionary Commission Models were banned by the FCA from January 2021 due to concerns about fairness and transparency.",
        },
      },
      {
        "@type": "Question",
        name: "Does the FCA investigation mean I am entitled to compensation?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. The investigation does not guarantee compensation. It provides regulatory context, but outcomes depend on how an individual agreement was sold.",
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
        name: "FCA Investigation",
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
            FCA Car Finance Investigation Explained
          </h1>

          <p className="mt-4 text-lg">
            The Financial Conduct Authority (FCA) investigated the UK car finance
            market after identifying concerns about how some agreements were
            sold. This page explains what the investigation was about, what the
            FCA found, and why it matters for consumers.
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
            <Section title="Who is the FCA and why it matters">
              <p>
                The Financial Conduct Authority (FCA) is the UK regulator for
                consumer credit. Its role is to ensure firms treat customers
                fairly, communicate transparently, and avoid conflicts of
                interest.
              </p>
              <p>
                When the FCA identifies a market-wide risk of consumer harm, it
                can investigate, issue guidance, or impose regulatory changes.
              </p>
            </Section>

            <Section title="What triggered the car finance investigation">
              <p>
                The FCA became concerned that certain commission arrangements in
                car finance created conflicts of interest. In some cases,
                dealers could earn more by increasing the interest rate charged
                to customers.
              </p>
              <p>
                Customers were often unaware that interest rates were
                discretionary or that commission incentives existed.
              </p>
            </Section>

            <Section title="What the FCA found">
              <p>
                The investigation found that Discretionary Commission Models
                (DCMs) posed a significant risk of consumer harm. They
                incentivised dealers to prioritise commission over customer
                outcomes.
              </p>
              <p>
                The FCA concluded that these models undermined transparency and
                informed consent.
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

            <Section title="The 2021 ban on Discretionary Commission Models">
              <p>
                As a result of the investigation, the FCA banned Discretionary
                Commission Models from January 2021. This removed dealers’
                ability to earn more by increasing interest rates.
              </p>
              <p>
                The ban addressed future sales but did not automatically resolve
                concerns about agreements sold before 2021.
              </p>
            </Section>

            <Section title="What the investigation does and does not mean">
              <p>
                The FCA investigation does not mean that all car finance
                agreements were mis-sold. It highlights structural issues and
                explains why certain sales practices are now under scrutiny.
              </p>
              <p>
                Each agreement must be assessed individually, based on what the
                customer was told and how the agreement was presented.
              </p>
            </Section>

            <Section title="Why the FCA investigation matters to consumers">
              <p>
                The investigation provides important context for understanding
                why complaints have increased and why lenders are now reviewing
                past agreements.
              </p>
              <p>
                It also explains why transparency, commission disclosure and
                interest rate setting are central to many car finance
                mis-selling cases.
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