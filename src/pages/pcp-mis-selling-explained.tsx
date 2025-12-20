import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/pcp-mis-selling-explained";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE = "PCP Mis-Selling Explained";
const DESCRIPTION = "Understand what PCP mis-selling is, how it affects you, and what steps you can take if you believe you've been mis-sold a PCP car finance deal.";

export default function PcpMisSellingExplained() {
  const published = "2023-10-01";
  const modified = "2023-10-01";

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
      "@id": `${SITE_URL}/car-finance-mis-selling-guide`,
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
          text: "PCP mis-selling occurs when a Personal Contract Purchase (PCP) car finance deal is sold without proper disclosure of terms, costs, or suitability for the buyer.",
        },
      },
      {
        "@type": "Question",
        name: "How can I identify if I was mis-sold a PCP deal?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You may have been mis-sold if the terms were not clearly explained, if you were not informed about the total cost, or if the deal was unsuitable for your financial situation.",
        },
      },
      {
        "@type": "Question",
        name: "What are the consequences of PCP mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Consequences can include financial loss, unexpected costs, or being locked into an unsuitable contract.",
        },
      },
      {
        "@type": "Question",
        name: "What steps can I take if I believe I was mis-sold a PCP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can contact the Financial Ombudsman Service, seek legal advice, or contact the lender to discuss your concerns.",
        },
      },
      {
        "@type": "Question",
        name: "Can I claim compensation for PCP mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, if you can prove mis-selling, you may be entitled to compensation for any financial losses incurred.",
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
        item: `${SITE_URL}/car-finance-mis-selling-guide`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "PCP Mis-Selling Explained",
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

        <meta httpEquiv="content-language" content="en-GB" />
        <meta name="robots" content="index,follow,max-image-preview:large" />

        <meta property="og:type" content="article" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="JustProveIt" />

        <meta name="twitter:card" content="summary_large_image" />

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
            Personal Contract Purchase (PCP) mis-selling involves the improper sale of car finance deals, often without full disclosure of terms or suitability for the buyer.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Part of the complete guide:{" "}
            <Link
              href="/car-finance-mis-selling-guide"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Car finance mis-selling explained →
            </Link>
          </p>

          <hr className="my-10" />

          <section className="space-y-10">

            <Section title="Understanding PCP Mis-Selling">
              <p>PCP mis-selling occurs when a car finance deal is sold without proper explanation of the terms, costs, or suitability for the buyer.</p>
              <p>This can lead to financial difficulties and unexpected costs for the consumer.</p>
            </Section>

            <Section title="Signs of PCP Mis-Selling">
              <p>Common signs include lack of clarity on terms, undisclosed costs, and deals that do not match the buyer's financial situation.</p>
              <p>If you feel pressured into a deal or were not given full information, you might have been mis-sold.</p>
            </Section>

            <Section title="Consequences of Mis-Selling">
              <p>Mis-selling can result in financial loss, unexpected expenses, and being tied to an unsuitable contract.</p>
              <p>It is important to understand your rights and options if you suspect mis-selling.</p>
            </Section>

            <Section title="Steps to Take if Mis-Sold">
              <p>If you believe you were mis-sold, contact the Financial Ombudsman Service, seek legal advice, or discuss with the lender.</p>
            </Section>

            <Section title="Claiming Compensation">
              <p>You may be entitled to compensation if you can prove that you were mis-sold a PCP deal.</p>
              <p>Gather all relevant documents and seek professional advice to pursue a claim.</p>
            </Section>

          </section>
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