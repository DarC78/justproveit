import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/pcp-mis-selling-explained";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE = "PCP Mis-Selling Explained";
const DESCRIPTION = "Learn about PCP mis-selling, how it affects consumers, and what you can do if you've been mis-sold a PCP car finance deal.";

export default function PcpMisSellingExplained() {
  const published = "2023-10-05";
  const modified = "2023-10-05";

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
          text: "PCP mis-selling occurs when consumers are not given full information about the terms and conditions of their Personal Contract Purchase agreements.",
        },
      },
      {
        "@type": "Question",
        name: "How can I identify if I've been mis-sold a PCP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Signs of PCP mis-selling include not being informed about mileage limits, balloon payments, or the total cost of the agreement.",
        },
      },
      {
        "@type": "Question",
        name: "What should I do if I've been mis-sold a PCP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If you suspect mis-selling, gather all relevant documents and contact a legal advisor or consumer rights organization for guidance.",
        },
      },
      {
        "@type": "Question",
        name: "Can I claim compensation for PCP mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, if you have been mis-sold a PCP, you may be entitled to compensation. Consult with a legal expert to explore your options.",
        },
      },
      {
        "@type": "Question",
        name: "What are the common issues with PCP agreements?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Common issues include lack of transparency about costs, misunderstanding of terms, and pressure sales tactics.",
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
            Personal Contract Purchase (PCP) mis-selling is a significant issue affecting many consumers who finance their cars. This article explains what PCP mis-selling is, how to identify it, and what steps to take if you believe you've been affected.
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
              <p>PCP mis-selling occurs when consumers are not fully informed about the terms of their car finance agreements. This can include hidden fees, unclear terms, or misleading information about the total cost.</p>
              <p>Many consumers find themselves in financial difficulty due to unexpected costs or terms they were not aware of at the time of signing the agreement.</p>
            </Section>

            <Section title="Common Signs of Mis-Selling">
              <p>Common signs of PCP mis-selling include not being informed about mileage limits, balloon payments, or the total cost of the agreement. Consumers may also be pressured into agreements without adequate explanation.</p>
              <p>It's crucial to thoroughly review all terms and conditions and ask questions if anything is unclear before signing a PCP agreement.</p>
            </Section>

            <Section title="Steps to Take if You Suspect Mis-Selling">
              <p>If you suspect you've been mis-sold a PCP, gather all relevant documents and contact a legal advisor or consumer rights organization for guidance. They can help you understand your rights and the potential for compensation.</p>
              <p>Acting quickly can help protect your financial interests and ensure you receive any compensation you may be entitled to.</p>
            </Section>

            <Section title="Legal Rights and Compensation">
              <p>Consumers who have been mis-sold a PCP may be entitled to compensation. Legal experts can provide advice on how to proceed with a claim and what evidence is needed to support your case.</p>
            </Section>

            <Section title="Preventing Future Mis-Selling">
              <p>To prevent future mis-selling, consumers should always read the fine print, ask questions, and ensure they fully understand the terms of any finance agreement before signing.</p>
              <p>Being informed and vigilant can help protect against mis-selling and ensure a fair deal.</p>
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