import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/car-finance-mis-selling-faqs";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling FAQs | Common Questions Answered Clearly (UK)";
const DESCRIPTION =
  "Clear answers to the most common car finance mis-selling questions in the UK. Eligibility, complaints, compensation, PCP, Hire Purchase, time limits and more.";

export default function CarFinanceMisSellingFAQs() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Car Finance Mis-Selling – Frequently Asked Questions",
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
        name: "What is car finance mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Car finance mis-selling occurs when a finance agreement is sold without full transparency or fairness. This can include undisclosed commission, discretionary interest rates, or a lack of clear explanation at the point of sale.",
        },
      },
      {
        "@type": "Question",
        name: "Is every car finance agreement mis-sold?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. Many agreements were sold fairly. Mis-selling depends on how the agreement was sold, what information was disclosed, and whether incentives influenced the outcome.",
        },
      },
      {
        "@type": "Question",
        name: "Can I complain if my agreement is paid off?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. An agreement does not need to be active to be reviewed. Closed or settled agreements may still be considered depending on time limits and when the issue became apparent.",
        },
      },
      {
        "@type": "Question",
        name: "Will complaining affect my credit score?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. Making a complaint about a car finance agreement does not, by itself, affect your credit score.",
        },
      },
      {
        "@type": "Question",
        name: "How long does a car finance complaint take?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Lenders typically have up to eight weeks to investigate and issue a final response, although complex cases can take longer.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need paperwork to complain?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Documents can help, but lenders usually hold copies of finance agreements and can often locate them using basic details such as name, address history, and vehicle registration.",
        },
      },
      {
        "@type": "Question",
        name: "Does mis-selling only affect PCP agreements?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. While PCP agreements are commonly involved, Hire Purchase and other car finance products can also be affected depending on how they were sold.",
        },
      },
      {
        "@type": "Question",
        name: "Is compensation guaranteed?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "No. Compensation is not guaranteed. Outcomes depend on individual circumstances, including how the agreement was sold and whether unfairness can be established.",
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
        name: "FAQs",
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
            Car Finance Mis-Selling – Frequently Asked Questions
          </h1>

          <p className="mt-4 text-lg">
            This page answers the most common questions about car finance
            mis-selling in the UK. It is designed to clarify misconceptions and
            help you understand how the issue works before deciding what to do.
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

          {/* FAQ CONTENT */}

          <section className="space-y-8">
            <FAQ
              q="What is car finance mis-selling?"
              a="Car finance mis-selling happens when a finance agreement is sold without clear, fair and transparent information. This may involve undisclosed commission, discretionary interest rates, or a lack of explanation about how the deal was structured."
            />

            <FAQ
              q="Is every car finance agreement mis-sold?"
              a="No. Many agreements were sold fairly. Mis-selling depends on how the agreement was sold, what information was disclosed, and whether financial incentives influenced the deal."
            />

            <FAQ
              q="Can I complain if my agreement is paid off or closed?"
              a="Yes. An agreement does not need to be active. Closed or settled agreements may still be reviewed depending on time limits and when the issue became apparent."
            />

            <FAQ
              q="Will making a complaint affect my credit score?"
              a="No. Making a complaint alone does not affect your credit score."
            />

            <FAQ
              q="How long does a car finance complaint take?"
              a="Lenders typically have up to eight weeks to issue a final response, although some cases take longer depending on complexity."
            />

            <FAQ
              q="Do I need paperwork to complain?"
              a="Documents can help, but lenders usually hold copies of finance agreements and can often locate them using basic details such as name, address history and vehicle registration."
            />

            <FAQ
              q="Does mis-selling only affect PCP agreements?"
              a="No. PCP agreements are commonly involved, but Hire Purchase and other car finance products can also be affected."
            />

            <FAQ
              q="Is compensation guaranteed?"
              a="No. Compensation is not guaranteed. Outcomes depend on individual circumstances and how the agreement was sold."
            />
          </section>

          <hr className="my-10" />

          <p className="text-sm text-slate-600">
            Next steps:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-sm">
            <li>
              <Link
                href="/who-is-eligible-car-finance"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Who may be eligible →
              </Link>
            </li>
            <li>
              <Link
                href="/how-to-complain-car-finance"
                className="font-semibold text-emerald-700 hover:underline"
              >
                How to complain step by step →
              </Link>
            </li>
          </ul>
        </article>
      </main>
    </>
  );
}

/* -------- Small component -------- */

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{q}</h2>
      <p className="mt-2 text-slate-700">{a}</p>
    </div>
  );
}