import Head from "next/head";
import Link from "next/link";
import LanguageSwitcher from "../components/LanguageSwitcher";
import LanguageSwitcherFlags from "../components/LanguageSwitcherFlags";


const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling UK – The Complete Independent Guide (Part 1) | JustProveIt";

const DESCRIPTION =
  "Learn what car finance mis-selling means in the UK, why the FCA investigated car finance, how hidden commission and DCMs worked, and the key legal concepts (Part 1).";

export default function CarFinanceMisSellingPart1() {
  const published = "2025-12-16"; // update when you publish
  const modified = "2025-12-16"; // update when you edit

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    hasPart: [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/what-is-car-finance-mis-selling`,
        "name": "What is car finance mis-selling?"
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/who-is-eligible-car-finance`,
        "name": "Who is eligible for car finance mis-selling?"
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/how-to-complain-car-finance`,
        "name": "How to complain about car finance mis-selling"
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/car-finance-mis-selling-faqs`,
        "name": "Car finance mis-selling FAQs"
      }
    ],
    headline:
      "Car Finance Mis-Selling UK – The Complete Independent Guide | JustProveIt",
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
        item: CANONICAL,
      },
    ],
  };

  const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Car Finance Mis-Selling – Complete Guide",
  "description":
    "A structured set of independent guides explaining car finance mis-selling in the UK, including causes, regulation, eligibility and complaint process.",
  "itemListOrder": "https://schema.org/ItemListOrderAscending",
  "numberOfItems": 9,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "What Is Car Finance Mis-Selling?",
      "url": "https://www.justproveit.co.uk/what-is-car-finance-mis-selling",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "FCA Car Finance Investigation Explained",
      "url": "https://www.justproveit.co.uk/fca-car-finance-investigation",
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Hidden Commission Explained",
      "url": "https://www.justproveit.co.uk/hidden-commission-explained",
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Discretionary Commission Models (DCM)",
      "url": "https://www.justproveit.co.uk/discretionary-commission-models",
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "PCP Mis-Selling Explained",
      "url": "https://www.justproveit.co.uk/pcp-mis-selling",
    },
    {
      "@type": "ListItem",
      "position": 6,
      "name": "Hire Purchase Mis-Selling Explained",
      "url": "https://www.justproveit.co.uk/hire-purchase-mis-selling",
    },
    {
      "@type": "ListItem",
      "position": 7,
      "name": "Who Is Eligible for Car Finance Mis-Selling?",
      "url": "https://www.justproveit.co.uk/who-is-eligible-car-finance",
    },
    {
      "@type": "ListItem",
      "position": 8,
      "name": "How to Complain About Car Finance Mis-Selling",
      "url": "https://www.justproveit.co.uk/how-to-complain-car-finance",
    },
    {
      "@type": "ListItem",
      "position": 9,
      "name": "Car Finance Mis-Selling FAQs",
      "url": "https://www.justproveit.co.uk/car-finance-mis-selling-faqs",
    },
  ],
};

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />

        {/* Canonical */}
        <link rel="canonical" href={CANONICAL} />

        {/* Robots */}
        <meta name="robots" content="index,follow,max-image-preview:large" />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="JustProveIt" />
        <meta httpEquiv="content-language" content="en-GB" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is car finance mis-selling?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Car finance mis-selling occurs when a car finance agreement is sold without full transparency or fairness. This may involve undisclosed commission, inflated interest rates, or a lack of clear explanation about how the agreement was structured."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is every car finance agreement mis-sold?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Many car finance agreements were sold fairly. Whether mis-selling occurred depends on how the agreement was sold, what information was disclosed, and whether financial incentives influenced the deal without the customer being informed."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who may be affected by car finance mis-selling?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "People who took out car finance in the UK may be affected if they were not clearly informed about commission arrangements, interest rate setting, or available alternatives. This can apply even if the agreement is paid off or the car is no longer owned."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does car finance mis-selling apply to PCP agreements?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Personal Contract Purchase (PCP) agreements are commonly associated with car finance mis-selling concerns, particularly where interest rates or commission arrangements were not clearly disclosed at the point of sale."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does it also apply to Hire Purchase agreements?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Hire Purchase agreements can also be affected, especially where the interest rate was discretionary or commission was not disclosed to the customer."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can closed or settled car finance agreements still be reviewed?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In some cases, yes. A car finance agreement does not always need to be active to be reviewed. Closed agreements may still be considered depending on time limits and when the issue became apparent."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Will making a complaint affect my credit score?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Making a complaint about a car finance agreement does not, by itself, affect your credit score."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does a car finance complaint take?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Lenders typically have up to eight weeks to investigate and respond to a car finance complaint, although some cases may take longer depending on complexity."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need all my paperwork to complain?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Having documents can help, but lenders usually hold copies of finance agreements and may be able to retrieve them even if you no longer have the paperwork."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is compensation guaranteed in car finance mis-selling cases?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Compensation is not guaranteed. Outcomes depend on individual circumstances, including how the agreement was sold and whether mis-selling can be established."
                  }
                }
              ]
            }),
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListJsonLd),
          }}
        />
      </Head>

      <div className="min-h-screen bg-white text-slate-900">
        <SkipLink />
        <SiteHeader />

        <main
          id="content"
          className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6"
        >
          <div className="grid gap-10 lg:grid-cols-12">
            {/* MAIN */}
            <article className="lg:col-span-8">
              {/* Intro block */}
              <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm font-semibold tracking-wide text-emerald-700">
                  JustProveIt • Independent UK Guide
                </p>

                <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-4xl">
                  Car Finance Mis-Selling in the UK – The Complete Independent
                  Guide
                </h1>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Part 1: Basics, FCA context, hidden commission, DCMs, and the
                  legal concepts
                </p>

                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700">
                  Car finance is one of the most common ways people in the UK buy
                  vehicles. Over the past decade, millions of consumers entered
                  agreements such as PCP and Hire Purchase, often trusting the
                  deal was fair, competitive and transparent.
                </p>

                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-700">
                  Growing regulatory scrutiny has highlighted that many
                  agreements may not have been sold fairly. This guide explains,
                  clearly and without sales pressure, what car finance mis-selling
                  means, why it matters, who may be affected, and what options
                  exist if something went wrong.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    ← Back to homepage
                  </Link>
                  <Link
                    href="/what-is-car-finance-mis-selling"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    Start with definitions →
                  </Link>
                </div>
              </header>

              {/* TOC */}
              <nav
                aria-label="Table of contents"
                className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="text-sm font-extrabold">On this page (Part 1)</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-700">
                  <li>
                    <a className="hover:underline" href="#introduction">
                      Introduction
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#what-is">
                      What is car finance mis-selling?
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#why-matters">
                      Why it matters
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#fca">
                      The role of the FCA
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#how-sold">
                      How car finance is typically sold
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#hidden-commission">
                      Hidden commission explained
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#dcm">
                      Discretionary Commission Models (DCM)
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#inflated-rates">
                      Inflated interest rates
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#transparency">
                      Lack of transparency
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#legal-framework">
                      The legal framework (high-level)
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#clarification">
                      Important clarification
                    </a>
                  </li>
                  <li>
                    <a className="hover:underline" href="#next">
                      What this guide covers next
                    </a>
                  </li>
                  <li>
  <a className="hover:underline" href="#who-may-be-affected">
    Who may be affected?
  </a>
</li>
<li>
  <a className="hover:underline" href="#eligibility-questions">
    Key eligibility questions
  </a>
</li>
<li>
  <a className="hover:underline" href="#products">
    Which car finance products are affected?
  </a>
</li>
<li>
  <a className="hover:underline" href="#pcp">
    PCP (Personal Contract Purchase)
  </a>
</li>
<li>
  <a className="hover:underline" href="#hire-purchase">
    Hire Purchase (HP)
  </a>
</li>
<li>
  <a className="hover:underline" href="#add-ons">
    Add-ons & extras
  </a>
</li>
<li>
  <a className="hover:underline" href="#years">
    Which years are commonly affected?
  </a>
</li>
<li>
  <a className="hover:underline" href="#lenders">
    Which lenders may be involved?
  </a>
</li>
<li>
  <a className="hover:underline" href="#dealer-vs-lender">
    Dealer vs lender: who is responsible?
  </a>
</li>
<li>
  <a className="hover:underline" href="#closed-agreements">
    Closed agreements
  </a>
</li>
                </ol>
              </nav>

              {/* CONTENT */}
              <Section id="introduction" title="Introduction">
                <p>
                  Car finance is one of the most common ways people in the UK buy
                  vehicles. Over the past decade, millions of consumers entered
                  into agreements such as <strong>PCP</strong> and{" "}
                  <strong>Hire Purchase</strong>, often trusting that the deal
                  offered was fair, competitive, and transparent.
                </p>
                <p>
                  However, growing regulatory scrutiny has revealed that many car
                  finance agreements may not have been sold fairly. This guide
                  exists to explain, <strong>clearly</strong> and without sales
                  pressure, what car finance mis-selling means, why it matters,
                  who may be affected, and what options exist if something went
                  wrong.
                </p>
                <Callout>
                  We focus on understanding first. Decisions come later.
                </Callout>
              </Section>

              <Section id="what-is" title="What is car finance mis-selling?">
                <p>
                  Car finance mis-selling occurs when a finance agreement is
                  sold in a way that is <strong>misleading</strong>,{" "}
                  <strong>unfair</strong>, or lacks proper transparency —
                  particularly around <strong>interest rates</strong>,{" "}
                  <strong>commissions</strong>, and incentives.
                </p>
                <p>
                  Mis-selling does not require fraud. It often happens through{" "}
                  <strong>structure, incentives, and omission</strong>, rather
                  than outright lies.
                </p>

                <h3 className="mt-6 text-lg font-bold">
                  In simple terms, an agreement may have been mis-sold if:
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>Important information was not disclosed</li>
                  <li>The customer was not given a real choice</li>
                  <li>
                    Financial incentives influenced the deal without the customer
                    knowing
                  </li>
                  <li>
                    The agreement created an unfair relationship under UK law
                  </li>
                </ul>

                <p className="mt-4">
                  Not every car finance agreement is mis-sold. But many were sold
                  in a way that raises serious questions.
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  Related:{" "}
                  <Link
                    className="font-semibold text-emerald-700 hover:underline"
                    href="/what-is-car-finance-mis-selling"
                  >
                    What is car finance mis-selling? (short version)
                  </Link>
                </p>
              </Section>

              <Section id="why-matters" title="Why car finance mis-selling matters">
                <p>
                  Mis-selling matters because it affects how much interest you
                  paid, whether your deal was genuinely competitive, and whether
                  you were treated fairly as a consumer.
                </p>
                <p>
                  In many cases, consumers paid significantly more than they
                  might otherwise have paid — not because of their credit
                  profile, but because of how the agreement was structured and
                  incentivised.
                </p>
                <p className="mt-4 text-sm text-slate-600">
                  Next step if this sounds relevant:{" "}
                  <Link
                    className="font-semibold text-emerald-700 hover:underline"
                    href="/how-to-complain-car-finance"
                  >
                    How to complain about car finance mis-selling →
                  </Link>
                </p>
              </Section>

              <Section id="fca" title="The role of the FCA">
                <p>
                  The <strong>Financial Conduct Authority (FCA)</strong>{" "}
                  regulates consumer credit in the UK. Its role is to ensure that
                  firms treat customers fairly, act transparently, and avoid
                  conflicts of interest.
                </p>

                <h3 className="mt-6 text-lg font-bold">What the FCA found</h3>
                <p>
                  The FCA identified that certain commission models in car
                  finance created a clear conflict of interest. In some setups,
                  dealers could increase the interest rate and earn more
                  commission when the customer paid more.
                </p>
                <p>
                  Customers were often not told that the interest rate could be
                  discretionary, that the dealer benefited financially from a
                  higher rate, or that alternative rates may have been available.
                </p>

                <h3 className="mt-6 text-lg font-bold">Regulatory action</h3>
                <p>
                  Discretionary Commission Models (DCM) were banned in 2021 due
                  to concerns about consumer harm. Past agreements have come
                  under scrutiny, and complaints have increased significantly.
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  Related:{" "}
                  <Link
                    className="font-semibold text-emerald-700 hover:underline"
                    href="/fca-car-finance-investigation"
                  >
                    FCA car finance investigation (explained)
                  </Link>
                </p>
              </Section>

              <Section id="how-sold" title="How car finance is typically sold">
                <p>
                  To understand mis-selling, it helps to understand how car
                  finance is often sold in practice.
                </p>

                <h3 className="mt-6 text-lg font-bold">Step 1: Choosing the car</h3>
                <p>
                  Most people focus on monthly payments, deposit, and PCP mileage
                  limits — very few focus on APR comparisons or the total cost of
                  credit.
                </p>

                <h3 className="mt-6 text-lg font-bold">
                  Step 2: Finance offered at the dealership
                </h3>
                <p>
                  The dealership introduces finance as the standard option,
                  presents a monthly figure, and often frames it as
                  non-negotiable.
                </p>

                <h3 className="mt-6 text-lg font-bold">Step 3: Agreement signed quickly</h3>
                <p>
                  Paperwork is lengthy and technical and presented as standard.
                  This environment makes truly informed consent difficult,
                  especially when incentives are hidden.
                </p>
              </Section>

              <Section id="hidden-commission" title="Hidden commission explained">
                <p>
                  One of the most significant issues is{" "}
                  <strong>hidden commission</strong>.
                </p>

                <h3 className="mt-6 text-lg font-bold">What is commission?</h3>
                <p>
                  Commission is a payment made by the lender to the dealer for
                  arranging finance. Commission itself is not automatically
                  illegal.
                </p>

                <h3 className="mt-6 text-lg font-bold">Where problems arise</h3>
                <p>
                  The problem arises when commission influences the interest rate
                  and the customer is not told or cannot meaningfully negotiate.
                </p>

                <h3 className="mt-6 text-lg font-bold">How it worked</h3>
                <p>
                  In many agreements, dealers could increase APR and earn more
                  commission. Customers were not told the relationship between
                  the APR and the dealer’s commission.
                </p>

                <Callout>
                  When the seller benefits financially from a higher interest
                  rate and the buyer is not told, that’s a textbook conflict of
                  interest.
                </Callout>

                <p className="mt-4 text-sm text-slate-600">
                  Related:{" "}
                  <Link
                    className="font-semibold text-emerald-700 hover:underline"
                    href="/hidden-commission-explained"
                  >
                    Hidden commission explained (dedicated page)
                  </Link>
                </p>
              </Section>

              <Section id="dcm" title="Discretionary Commission Models (DCM)">
                <p>
                  A Discretionary Commission Model allows the dealer to set or
                  adjust the interest rate within a permitted range. The dealer’s
                  commission can increase as the interest rate increases.
                </p>
                <p>
                  This creates a situation where the customer’s best interest
                  conflicts with the dealer’s financial incentive.
                </p>

                <p className="mt-4 text-sm text-slate-600">
                  Related:{" "}
                  <Link
                    className="font-semibold text-emerald-700 hover:underline"
                    href="/discretionary-commission-models"
                  >
                    Discretionary commission models (DCM)
                  </Link>
                </p>
              </Section>

              <Section id="inflated-rates" title="Inflated interest rates">
                <p>
                  Many consumers focus on monthly payments, not APR. This made it
                  easier for interest rates to be increased subtly, while the
                  true cost differences remained hidden.
                </p>
                <p>
                  Even a small APR increase can result in hundreds or thousands
                  of pounds of extra interest, with no obvious warning to the
                  customer.
                </p>
              </Section>

              <Section id="transparency" title="Lack of transparency">
                <p>
                  Transparency is central to UK consumer protection. In many car
                  finance cases, commission was not mentioned, interest rate
                  discretion was not explained, and alternatives were not offered.
                </p>
                <p>
                  That undermines the customer’s ability to make an informed
                  decision.
                </p>
              </Section>

              <Section id="legal-framework" title="The legal framework (high-level)">
                <p>
                  Several UK legal principles may be relevant. This is a
                  high-level explanation (not legal advice).
                </p>

                <h3 className="mt-6 text-lg font-bold">
                  Consumer Credit Act – Section 140A (unfair relationship)
                </h3>
                <p>
                  UK law allows courts to intervene if a credit agreement creates
                  an <strong>unfair relationship</strong> between lender and
                  borrower. Factors include how the agreement was sold, what the
                  customer was told, and whether incentives distorted fairness.
                </p>

                <h3 className="mt-6 text-lg font-bold">FCA principles</h3>
                <p>
                  Firms are expected to treat customers fairly, avoid conflicts
                  of interest, and communicate in a clear, fair and not
                  misleading way.
                </p>
              </Section>

              <Section id="clarification" title="Important clarification">
                <p>
                  Not all car finance agreements are mis-sold. Eligibility depends
                  on how the agreement was structured, what was disclosed, and
                  whether incentives influenced outcomes.
                </p>
                <p>
                  Each case should be assessed on its own facts.
                </p>
              </Section>

              <Section id="next" title="What this guide covers next">
                <p>
                  In the next parts of this guide we’ll cover:
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>Who may be affected (PCP, Hire Purchase, years, lenders)</li>
                  <li>How complaints work (DIY vs specialist support)</li>
                  <li>What compensation can look like (examples)</li>
                  <li>Common myths and real FAQs</li>
                </ul>

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-900">
                    Next steps
                  </p>
                  <p className="mt-1 text-sm text-emerald-900/80">
                    If you’re new, start with the definitions and then the FCA
                    context.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/what-is-car-finance-mis-selling"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                      Definitions →
                    </Link>
                    <Link
                      href="/fca-car-finance-investigation"
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/40"
                    >
                      FCA investigation →
                    </Link>
                  </div>
                </div>
              </Section>

              {/* =========================
    PART 2 — Eligibility + Products + Lenders
   ========================= */}

<Section id="who-may-be-affected" title="Who may be affected by car finance mis-selling">
  <p>
    One of the most common misconceptions is that car finance mis-selling only affects a small
    group of people or only applies to “extreme” cases. In reality, eligibility is often broader
    than people expect.
  </p>

  <h3 className="mt-6 text-lg font-bold">You may be affected even if:</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Your agreement is fully paid off</li>
    <li>You no longer own the car</li>
    <li>You never missed a payment</li>
    <li>The dealership seemed “helpful”</li>
    <li>The agreement felt standard at the time</li>
  </ul>

  <Callout>
    Mis-selling is not about whether you struggled financially. It’s about how the agreement was
    sold.
  </Callout>

  <p className="mt-4 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/who-is-eligible-car-finance">
      Who is eligible? (practical checklist)
    </Link>
  </p>
</Section>

<Section id="eligibility-questions" title="Key eligibility questions">
  <p>
    Eligibility is about the sale, not the outcome. You don’t need to answer “yes” to every point
    below — but these are strong indicators that further review may be justified.
  </p>

  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Were you told the dealer could influence the interest rate?</li>
    <li>Were you told the dealer earned commission linked to your interest rate?</li>
    <li>Were alternative rates discussed?</li>
    <li>Was the focus mainly on monthly payments rather than the total cost of credit?</li>
    <li>Did the agreement feel rushed or presented as non-negotiable?</li>
  </ul>

  <p className="mt-4">
    If your answer to several of these is “no” or “I don’t remember”, it doesn’t automatically
    mean mis-selling occurred — but it can be a signal that the sale may not have been fully
    transparent.
  </p>
</Section>

<Section id="products" title="Which car finance products are affected?">
  <p>
    Car finance mis-selling is not limited to one product. However, some products are more commonly
    involved because of how they are structured and sold through dealerships.
  </p>

  <div className="mt-4 grid gap-4 md:grid-cols-2">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">PCP</h3>
      <p className="mt-2 text-sm text-slate-700">
        Often linked to mis-selling concerns because customers focus on monthly payments, while APR and
        commission incentives can be less visible.
      </p>
      <p className="mt-3 text-sm">
        <Link className="font-semibold text-emerald-700 hover:underline" href="/pcp-mis-selling">
          PCP mis-selling explained →
        </Link>
      </p>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Hire Purchase (HP)</h3>
      <p className="mt-2 text-sm text-slate-700">
        Can also be affected — especially where APR was discretionary or commission was not disclosed.
      </p>
      <p className="mt-3 text-sm">
        <Link className="font-semibold text-emerald-700 hover:underline" href="/hire-purchase-mis-selling">
          Hire Purchase mis-selling explained →
        </Link>
      </p>
    </div>
  </div>
</Section>

<Section id="pcp" title="PCP (Personal Contract Purchase)">
  <p>
    PCP is one of the most common product types linked to car finance mis-selling. PCP agreements
    emphasise affordability (monthly payment) and can de-emphasise total cost of credit — which can
    make it easier for interest rate increases and commission-linked incentives to go unnoticed.
  </p>

  <h3 className="mt-6 text-lg font-bold">Why PCP is particularly affected</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Customers focus on monthly payments rather than APR comparisons</li>
    <li>Total cost of credit can be less obvious at point of sale</li>
    <li>Dealership incentives can influence the rate offered</li>
  </ul>

  <h3 className="mt-6 text-lg font-bold">Common PCP-related issues</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Inflated APR compared with what may have been available</li>
    <li>No clear explanation of how the interest rate was set</li>
    <li>No disclosure of commission arrangements</li>
    <li>Add-ons bundled into finance without clear consent</li>
  </ul>

  <p className="mt-4">
    PCP mis-selling does not mean PCP itself is wrong. It means the way the agreement was sold may
    have been unfair or insufficiently transparent.
  </p>
</Section>

<Section id="hire-purchase" title="Hire Purchase (HP)">
  <p>
    Hire Purchase agreements are also commonly affected. Because HP can feel more straightforward
    than PCP, customers are often less likely to question APR setting or whether the rate was
    negotiable.
  </p>

  <h3 className="mt-6 text-lg font-bold">Common HP-related issues</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Lack of transparency around APR</li>
    <li>Commission not disclosed</li>
    <li>No explanation of whether the rate was negotiable</li>
  </ul>
</Section>

<Section id="add-ons" title="Add-ons and extras (often overlooked)">
  <p>
    Mis-selling is not always limited to the core finance agreement. Add-ons can strengthen the
    overall picture where costs were bundled or consent was unclear.
  </p>

  <h3 className="mt-6 text-lg font-bold">Common add-ons include:</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>GAP insurance</li>
    <li>Extended warranties</li>
    <li>Service plans</li>
    <li>Paint and fabric protection</li>
  </ul>

  <h3 className="mt-6 text-lg font-bold">Issues can arise when:</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Add-ons were bundled without clear explanation</li>
    <li>Costs were financed without explicit consent</li>
    <li>Alternatives were not discussed</li>
  </ul>

  <p className="mt-4 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/car-finance-add-ons-mis-selling">
      Add-ons mis-selling explained →
    </Link>
  </p>
</Section>

<Section id="years" title="Which years are commonly affected?">
  <p>
    There is no single year that automatically decides eligibility. However, much scrutiny focuses
    on agreements taken out before 2021, when Discretionary Commission Models (DCM) were banned.
  </p>
  <p>
    That said, earlier agreements can still be relevant, and later agreements may still raise issues
    depending on disclosure and incentives.
  </p>

  <p className="mt-4 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/what-years-are-affected">
      Which years are affected? →
    </Link>
  </p>
</Section>

<Section id="lenders" title="Which lenders may be involved?">
  <p>
    Car finance mis-selling is not limited to small lenders or specific brands. Many major UK car
    finance providers use dealership distribution models, where incentives and commissions can exist.
  </p>
  <p>
    The key point is not a lender’s name, but whether the dealer had discretion, whether incentives
    influenced the outcome, and whether the customer was informed.
  </p>

  <p className="mt-4 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/which-lenders-are-affected">
      Which lenders are affected? →
    </Link>
  </p>
</Section>

<Section id="dealer-vs-lender" title="Dealer vs lender: who is responsible?">
  <p>
    In car finance, the dealer sells the finance, but the lender provides the credit. Both can be
    relevant: the dealer’s actions during the sale matter, and the lender’s oversight and agreement
    structure matter.
  </p>
  <p>
    This is why complaints are usually directed to the lender, even if the problem arose at the
    dealership.
  </p>
</Section>

<Section id="closed-agreements" title="Closed agreements">
  <p>
    An agreement does not need to be active to be relevant. Closed agreements may still be reviewed
    if they fall within applicable time limits, or if the issue only became apparent later due to
    regulatory findings.
  </p>

  <Callout>
    Many people assume: “If it’s paid off, nothing can be done.” That is often not true.
  </Callout>
</Section>

{/* =========================
    PART 3 — Process, Compensation, FAQs
   ========================= */}

<Section
  id="complaint-process"
  title="How the car finance complaint process works (step-by-step)"
>
  <p>
    This section explains the complaint process at a high level.
    If you want a detailed, practical walkthrough with templates and
    examples, see our dedicated guide below.
  </p>
  <p className="mt-2 text-sm">
    <Link
      className="font-semibold text-emerald-700 hover:underline"
      href="/how-to-complain-car-finance"
    >
      Full step-by-step complaint guide →
    </Link>
  </p>

  <h3 className="mt-6 text-lg font-bold">Step 1: Identify the lender</h3>
  <p>
    Complaints are normally made to the <strong>lender</strong>, not the
    dealership. The lender is responsible for how the finance agreement was
    arranged and administered.
  </p>

  <h3 className="mt-6 text-lg font-bold">Step 2: Raise a formal complaint</h3>
  <p>
    You can submit a complaint directly to the lender, explaining why you believe
    the agreement may have been mis-sold. This usually involves:
  </p>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Providing agreement details</li>
    <li>Explaining what you were (or were not) told</li>
    <li>Requesting a review of commission and interest rate setting</li>
  </ul>

  <h3 className="mt-6 text-lg font-bold">Step 3: Lender review period</h3>
  <p>
    The lender normally has up to <strong>8 weeks</strong> to investigate and
    respond. They may request further information during this time.
  </p>

  <h3 className="mt-6 text-lg font-bold">Step 4: Outcome or escalation</h3>
  <p>
    If you disagree with the lender’s response, you may be able to escalate the
    matter further, depending on circumstances and time limits.
  </p>

  <p className="mt-4 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/how-to-complain-car-finance">
      Step-by-step complaint guide →
    </Link>
  </p>
</Section>

<Section id="diy-vs-specialist" title="Complaining yourself vs using a specialist service">
  <p>
    There is no single “right” approach. Some people prefer to complain
    themselves, while others use specialist support.
  </p>

  <div className="mt-6 grid gap-4 md:grid-cols-2">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Complaining yourself</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
        <li>No fees</li>
        <li>Full control over communication</li>
        <li>Requires time and confidence</li>
        <li>You handle responses and follow-ups</li>
      </ul>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">Using a specialist service</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
        <li>Support with wording and process</li>
        <li>Experience with lenders’ responses</li>
        <li>Usually involves a fee if successful</li>
        <li>Less hands-on for the consumer</li>
      </ul>
    </div>
  </div>

  <Callout>
    Using a specialist does not guarantee a better outcome — and complaining
    yourself does not reduce your rights.
  </Callout>
</Section>

<Section id="compensation" title="What compensation may look like">
  <p>
    Compensation in car finance mis-selling cases varies widely. There is no
    fixed amount and no guaranteed outcome.
  </p>

  <h3 className="mt-6 text-lg font-bold">Compensation may include:</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Refund of excess interest paid</li>
    <li>Interest on refunded amounts</li>
    <li>Adjustment of the agreement balance</li>
  </ul>

  <h3 className="mt-6 text-lg font-bold">What affects the amount?</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Size of the agreement</li>
    <li>Interest rate difference</li>
    <li>Length of the term</li>
    <li>Commission structure involved</li>
  </ul>

  <Callout>
    Headlines often mention large figures, but real outcomes depend entirely on
    individual circumstances.
  </Callout>
</Section>

<Section id="common-myths" title="Common myths and misunderstandings">
  <ul className="list-disc space-y-3 pl-6">
    <li>
      <strong>“If I paid everything on time, nothing is wrong.”</strong>  
      Payment history does not determine whether mis-selling occurred.
    </li>
    <li>
      <strong>“If the agreement is closed, it’s too late.”</strong>  
      Closed agreements may still be reviewed in some cases.
    </li>
    <li>
      <strong>“Everyone is entitled to compensation.”</strong>  
      Eligibility depends on how the agreement was sold.
    </li>
    <li>
      <strong>“The dealer alone is responsible.”</strong>  
      Lenders also have regulatory responsibilities.
    </li>
  </ul>
</Section>

<Section id="faqs" title="Frequently asked questions">
  <h3 className="mt-4 text-lg font-bold">Is every car finance agreement mis-sold?</h3>
  <p>
    No. Many agreements were sold fairly. Mis-selling depends on disclosure,
    incentives and the sales process.
  </p>

  <h3 className="mt-4 text-lg font-bold">Do I need paperwork?</h3>
  <p>
    Having documents helps, but lenders often hold copies of agreements and can
    retrieve them.
  </p>

  <h3 className="mt-4 text-lg font-bold">Will making a complaint affect my credit score?</h3>
  <p>
    Making a complaint alone does not affect your credit score.
  </p>

  <h3 className="mt-4 text-lg font-bold">How long does the process take?</h3>
  <p>
    Initial lender reviews typically take up to 8 weeks, though some cases take
    longer.
  </p>

  <p className="mt-6 text-sm text-slate-600">
    Related:{" "}
    <Link className="font-semibold text-emerald-700 hover:underline" href="/car-finance-mis-selling-faqs">
      Full FAQs →
    </Link>
  </p>
</Section>

<Section id="conclusion" title="Final thoughts">
  <p>
    Car finance mis-selling is not about blame — it is about understanding
    whether a financial agreement was fair, transparent and properly explained.
  </p>

  <p>
    This guide is designed to help you understand the issue clearly, without
    pressure, before deciding what to do next.
  </p>

  <Callout>
    Being informed is the first step. Any next step should be your choice.
  </Callout>
</Section>


            </article>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <SidebarBox title="Quick links">
                  <SidebarLink href="/what-is-car-finance-mis-selling">
                    What is mis-selling?
                  </SidebarLink>
                  <SidebarLink href="/hidden-commission-explained">
                    Hidden commission
                  </SidebarLink>
                  <SidebarLink href="/discretionary-commission-models">
                    Discretionary commission (DCM)
                  </SidebarLink>
                  <SidebarLink href="/fca-car-finance-investigation">
                    FCA investigation
                  </SidebarLink>
                </SidebarBox>

                <SidebarBox title="Related guides">
                  <SidebarLink href="/how-to-complain-car-finance">
                    How to complain
                  </SidebarLink>
                  <SidebarLink href="/who-is-eligible-car-finance">
                    Who is eligible?
                  </SidebarLink>
                  <SidebarLink href="/pcp-mis-selling">
                    PCP mis-selling
                  </SidebarLink>
                  <SidebarLink href="/hire-purchase-mis-selling">
                    Hire Purchase mis-selling
                  </SidebarLink>
                </SidebarBox>

                <SidebarBox title="Disclaimer">
                  <p className="text-sm text-slate-700">
                    This site provides independent information and is not a law
                    firm. Outcomes depend on individual circumstances.
                  </p>
                </SidebarBox>
              </div>
            </aside>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

/* ---------------- Small UI components ---------------- */

function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
    >
      Skip to content
    </a>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* LOGO */}
        <div>
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>
          <p className="text-xs text-slate-600">
            Car Finance Mis-Selling Explained Clearly
          </p>
        </div>

        {/* NAV + LANGUAGE */}
        <div className="flex items-center gap-4">
          <nav className="hidden gap-4 text-sm font-semibold text-slate-700 md:flex">
            <Link className="hover:text-emerald-700" href="/car-finance-mis-selling">
              Start Here
            </Link>
            <Link className="hover:text-emerald-700" href="/hidden-commission-explained">
              What Went Wrong
            </Link>
            <Link className="hover:text-emerald-700" href="/who-is-eligible-car-finance">
              Who Is Affected
            </Link>
            <Link className="hover:text-emerald-700" href="/how-to-complain-car-finance">
              How To Complain
            </Link>
            <Link className="hover:text-emerald-700" href="/car-finance-mis-selling-faqs">
              FAQs
            </Link>
          </nav>

          <LanguageSwitcherFlags />
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold">JustProveIt</p>
            <p className="mt-2 text-sm text-slate-600">
              Independent guidance on car finance mis-selling in the UK.
            </p>
          </div>

          <div className="text-sm">
            <p className="font-bold">Guides</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li>
                <Link className="hover:underline" href="/car-finance-mis-selling">
                  Complete guide
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/what-is-car-finance-mis-selling">
                  What is mis-selling?
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/fca-car-finance-investigation">
                  FCA investigation
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/how-to-complain-car-finance">
                  How to complain
                </Link>
              </li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="font-bold">Legal</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li><Link className="hover:underline" href="/privacy">Privacy</Link></li>
              <li><Link className="hover:underline" href="/cookies">Cookies</Link></li>
              <li><Link className="hover:underline" href="/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} JustProveIt. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="prose prose-slate mt-4 max-w-none">
        {children}
      </div>
      <div className="mt-4">
        <a className="text-sm font-semibold text-emerald-700 hover:underline" href="#content">
          Back to top ↑
        </a>
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-900">Key point</p>
      <div className="mt-2 text-sm text-amber-900/90">{children}</div>
    </div>
  );
}

function SidebarBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-extrabold">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-sm font-semibold text-slate-800 hover:text-emerald-700 hover:underline"
    >
      {children}
    </Link>
  );
}