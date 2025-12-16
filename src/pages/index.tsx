import Head from "next/head";
import Link from "next/link";

const SITE_URL = "https://www.justproveit.co.uk"; // ajustează dacă vrei fără www

export default function HomePage() {
  const title =
    "Car Finance Mis-Selling UK – Explained Clearly | JustProveIt";
  const description =
    "Independent guide to car finance mis-selling in the UK: hidden commissions, inflated interest rates, FCA investigation, eligibility and how to complain.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JustProveIt",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/guides?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Canonical */}
        <link rel="canonical" href={`${SITE_URL}/`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta property="og:site_name" content="JustProveIt" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-white text-slate-900">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Sari la conținut
        </a>

        <Header />

        <main id="content" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
          {/* HERO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <p className="text-sm font-semibold tracking-wide text-emerald-700">
              JustProveIt • UK Car Finance Mis-Selling
            </p>

            <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-5xl">
              Car Finance Mis-Selling in the UK – Explained Clearly
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 md:text-lg">
              Independent guidance on hidden commissions, inflated interest rates and your rights
              under UK car finance agreements. We explain first — you decide what to do next.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/car-finance-mis-selling"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
              >
                Start with the basics
              </Link>

              <Link
                href="/how-to-complain-car-finance"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                How to complain (step-by-step)
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <InfoBadge title="No sales pressure">
                Clear explanations before any recommendation.
              </InfoBadge>
              <InfoBadge title="UK-focused">
                FCA context + Consumer Credit Act explained.
              </InfoBadge>
              <InfoBadge title="Built for clarity">
                Simple structure, practical examples, real FAQs.
              </InfoBadge>
            </div>
          </section>

          {/* CONTENT GRID: main + sidebar (MSE feel) */}
          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            {/* MAIN COLUMN */}
            <div className="lg:col-span-8">
              {/* START HERE */}
              <section aria-labelledby="start-here" className="mt-2">
                <div className="flex items-baseline justify-between">
                  <h2 id="start-here" className="text-2xl font-bold">
                    New to car finance mis-selling? Start here
                  </h2>
                  <Link
                    href="/car-finance-mis-selling"
                    className="text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    View the complete guide →
                  </Link>
                </div>

                <p className="mt-2 text-slate-700">
                  If you’re not sure what “mis-selling” means or why car finance is under scrutiny,
                  these guides explain everything step by step.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <GuideCard
                    href="/what-is-car-finance-mis-selling"
                    title="What is car finance mis-selling?"
                    desc="A clear definition, examples, and what counts (and what doesn’t)."
                  />
                  <GuideCard
                    href="/fca-car-finance-investigation"
                    title="Why the FCA is investigating car finance"
                    desc="What the regulator looked at and what it could mean for consumers."
                  />
                  <GuideCard
                    href="/hidden-commission-explained"
                    title="Hidden commissions explained"
                    desc="How commission incentives may have pushed interest rates higher."
                  />
                  <GuideCard
                    href="/discretionary-commission-models"
                    title="Discretionary Commission Models (DCM)"
                    desc="What DCM is, why it matters, and how it can affect your agreement."
                  />
                </div>
              </section>

              {/* WHAT WENT WRONG */}
              <section aria-labelledby="what-went-wrong" className="mt-10">
                <h2 id="what-went-wrong" className="text-2xl font-bold">
                  What went wrong with car finance
                </h2>
                <p className="mt-2 text-slate-700">
                  Most issues relate to how interest rates and commissions were set — often without
                  customers being properly informed.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <GuideCard
                    href="/inflated-interest-rates"
                    title="Inflated interest rates"
                    desc="When your APR may have been higher than it should have been."
                  />
                  <GuideCard
                    href="/car-finance-add-ons-mis-selling"
                    title="Undisclosed add-ons (GAP, warranties)"
                    desc="Extras that may have been unclear, bundled, or poorly explained."
                  />
                  <GuideCard
                    href="/pcp-mis-selling"
                    title="PCP mis-selling"
                    desc="How PCP deals work and where problems commonly occur."
                  />
                  <GuideCard
                    href="/hire-purchase-mis-selling"
                    title="Hire Purchase mis-selling"
                    desc="Key differences vs PCP and what to watch for."
                  />
                </div>
              </section>

              {/* WHO IS AFFECTED */}
              <section aria-labelledby="who-affected" className="mt-10">
                <h2 id="who-affected" className="text-2xl font-bold">
                  Who may be affected
                </h2>
                <p className="mt-2 text-slate-700">
                  You may be affected even if your agreement is closed or your car is sold. It
                  depends on how your agreement was set up, and what you were told at the time.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <GuideCard
                    href="/who-is-eligible-car-finance"
                    title="Who is eligible?"
                    desc="A practical checklist to understand whether this may apply to you."
                  />
                  <GuideCard
                    href="/what-years-are-affected"
                    title="Which years are affected?"
                    desc="How time periods and complaint windows can matter."
                  />
                  <GuideCard
                    href="/which-lenders-are-affected"
                    title="Which lenders may be involved?"
                    desc="How to identify the lender and what to check in your paperwork."
                  />
                  <GuideCard
                    href="/diy-complaint-vs-claims-company"
                    title="DIY vs using a specialist service"
                    desc="Pros, cons, and the questions to ask before choosing."
                  />
                </div>
              </section>

              {/* WHAT YOU CAN DO */}
              <section aria-labelledby="what-next" className="mt-10">
                <h2 id="what-next" className="text-2xl font-bold">
                  What you can do next
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <ActionCard
                    title="Complain yourself"
                    bullets={[
                      "What to write to the lender",
                      "What evidence helps",
                      "What timelines to expect",
                    ]}
                    href="/how-to-complain-car-finance"
                    cta="See the step-by-step process →"
                  />

                  <ActionCard
                    title="Use a specialist service"
                    bullets={[
                      "When it’s useful",
                      "What a service actually does",
                      "Red flags to avoid",
                    ]}
                    href="/diy-complaint-vs-claims-company"
                    cta="Compare options →"
                  />

                  <ActionCard
                    title="Understand compensation"
                    bullets={[
                      "What outcomes look like",
                      "Examples & scenarios",
                      "Common misconceptions",
                    ]}
                    href="/car-finance-compensation-examples"
                    cta="See examples →"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-sm font-semibold text-emerald-900">
                    Quick check (no pressure)
                  </p>
                  <p className="mt-1 text-sm text-emerald-900/80">
                    If you want, you can start by gathering your agreement details and checking the
                    basics first.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/who-is-eligible-car-finance"
                      className="inline-flex items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                      Check if this may apply to you →
                    </Link>
                  </div>
                </div>
              </section>

              {/* TRUST / DISCLAIMER */}
              <section aria-labelledby="trust" className="mt-10">
                <h2 id="trust" className="text-2xl font-bold">
                  Why JustProveIt
                </h2>
                <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
                  <li>Focused exclusively on car finance mis-selling guidance.</li>
                  <li>Built for clarity: simple structure, checklists, and practical examples.</li>
                  <li>We explain first. You decide what to do next.</li>
                </ul>

                <p className="mt-6 text-xs leading-relaxed text-slate-500">
                  This site provides independent information and is not a law firm. Legal rights and
                  outcomes depend on individual circumstances. If you need legal advice, consider
                  speaking to a qualified professional.
                </p>
              </section>
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <SidebarBox title="Quick links">
                  <SidebarLink href="/car-finance-mis-selling">
                    The complete guide (start here)
                  </SidebarLink>
                  <SidebarLink href="/how-to-complain-car-finance">
                    How to complain (step-by-step)
                  </SidebarLink>
                  <SidebarLink href="/car-finance-mis-selling-faqs">
                    FAQs
                  </SidebarLink>
                  <SidebarLink href="/real-car-finance-cases">
                    Real cases (anonymised)
                  </SidebarLink>
                </SidebarBox>

                <SidebarBox title="Most read guides">
                  <SidebarLink href="/hidden-commission-explained">
                    Hidden commissions explained
                  </SidebarLink>
                  <SidebarLink href="/discretionary-commission-models">
                    Discretionary commission (DCM)
                  </SidebarLink>
                  <SidebarLink href="/pcp-mis-selling">
                    PCP mis-selling
                  </SidebarLink>
                  <SidebarLink href="/inflated-interest-rates">
                    Inflated interest rates
                  </SidebarLink>
                </SidebarBox>

                <SidebarBox title="Good to know">
                  <p className="text-sm text-slate-700">
                    We keep CTAs minimal on purpose. If a page doesn’t apply to you, it will say so.
                  </p>
                </SidebarBox>
              </div>
            </aside>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

/* ---------- Components (simple, inline) ---------- */

function Header() {
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
          <Link className="hover:text-emerald-700" href="/guides">
            Guides
          </Link>
          <Link className="hover:text-emerald-700" href="/car-finance-mis-selling-faqs">
            FAQs & Cases
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
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
            <p className="font-bold">Site</p>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li><Link className="hover:underline" href="/car-finance-mis-selling">Complete guide</Link></li>
              <li><Link className="hover:underline" href="/how-to-complain-car-finance">How to complain</Link></li>
              <li><Link className="hover:underline" href="/car-finance-mis-selling-faqs">FAQs</Link></li>
              <li><Link className="hover:underline" href="/real-car-finance-cases">Cases</Link></li>
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

function GuideCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow"
    >
      <h3 className="text-base font-bold group-hover:text-emerald-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{desc}</p>
      <p className="mt-3 text-sm font-semibold text-emerald-700">
        Read more →
      </p>
    </Link>
  );
}

function ActionCard({
  title,
  bullets,
  href,
  cta,
}: {
  title: string;
  bullets: string[];
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className="mt-4">
        <Link href={href} className="text-sm font-semibold text-emerald-700 hover:underline">
          {cta}
        </Link>
      </div>
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
    <Link href={href} className="block text-sm font-semibold text-slate-800 hover:text-emerald-700 hover:underline">
      {children}
    </Link>
  );
}

function InfoBadge({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-sm text-slate-700">{children}</p>
    </div>
  );
}