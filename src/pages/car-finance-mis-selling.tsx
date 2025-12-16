import Head from "next/head";
import Link from "next/link";

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
    headline:
      "Car Finance Mis-Selling in the UK – The Complete Independent Guide (Part 1)",
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

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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

              {/* Minimal “Part navigation” placeholder */}
              <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-extrabold">Continue this guide</p>
                <p className="mt-2 text-sm text-slate-700">
                  Part 2 and Part 3 will be added here (eligibility, process,
                  compensation examples, FAQs & cases).
                </p>
              </div>
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
                  <SidebarLink href="/pcp-mis-selling">PCP mis-selling</SidebarLink>
                  <SidebarLink href="/hire-purchase-mis-selling">
                    Hire Purchase mis-selling
                  </SidebarLink>
                  <SidebarLink href="/how-to-complain-car-finance">
                    How to complain
                  </SidebarLink>
                  <SidebarLink href="/car-finance-mis-selling-faqs">
                    FAQs
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
        <div>
          <Link href="/" className="text-lg font-extrabold tracking-tight">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>
          <p className="text-xs text-slate-600">
            Car Finance Mis-Selling Explained Clearly
          </p>
        </div>

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
      </div>
    </header>
  );
}

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