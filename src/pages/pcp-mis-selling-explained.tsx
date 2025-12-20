import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/example-slug";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE = "Example Title";
const DESCRIPTION = "Example description for the page.";

export default function ExampleComponent() {
  const published = "2023-10-01";
  const modified = "2023-10-02";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Example Headline",
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
      "@id": `${SITE_URL}/parent-slug`,
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
          text: "Car finance mis-selling refers to the practice of selling car finance products without proper disclosure of terms.",
        },
      },
      {
        "@type": "Question",
        name: "How can I identify mis-selling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Look for discrepancies in the terms and conditions provided at the time of sale.",
        },
      },
      {
        "@type": "Question",
        name: "What are my rights?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You have the right to seek redress if you believe you were mis-sold a product.",
        },
      },
      {
        "@type": "Question",
        name: "How to file a complaint?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Contact the financial ombudsman or a legal advisor.",
        },
      },
      {
        "@type": "Question",
        name: "Can I get compensation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, if mis-selling is proven, you may be entitled to compensation.",
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
        item: `${SITE_URL}/parent-slug`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Example Breadcrumb",
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
            Example Heading
          </h1>

          <p className="mt-4 text-lg">
            This is an introductory paragraph for the example page.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Part of the complete guide:{" "}
            <Link
              href="/parent-slug"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Car finance mis-selling explained →
            </Link>
          </p>

          <hr className="my-10" />

          <section className="space-y-10">

            <Section title="Section 1 Title">
              <p>This is the first paragraph of section 1.</p>
              <p>This is the second paragraph of section 1.</p>
            </Section>

            <Section title="Section 2 Title">
              <p>This is the first paragraph of section 2.</p>
              <p>This is the second paragraph of section 2.</p>
            </Section>

            <Section title="Section 3 Title">
              <p>This is the first paragraph of section 3.</p>
              <p>This is the second paragraph of section 3.</p>
            </Section>

            <Section title="Section 4 Title">
              <p>This is the first paragraph of section 4.</p>
            </Section>

            <Section title="Section 5 Title">
              <p>This is the first paragraph of section 5.</p>
              <p>This is the second paragraph of section 5.</p>
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