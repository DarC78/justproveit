import Head from "next/head";
import Link from "next/link";

/* ================= CONFIG ================= */

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling în UK – Ghid pentru români | JustProveIt";

const DESCRIPTION =
  "Explicație clară despre car finance mis-selling în Marea Britanie, dedicată românilor din UK. Află ce înseamnă, cine poate fi afectat și ce opțiuni există.";

/* ================= PAGE ================= */

export default function CarFinanceMisSellingRO() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Car Finance Mis-Selling în Marea Britanie – explicație pentru români",
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
    inLanguage: "ro-GB",
    isPartOf: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/car-finance-mis-selling`,
      name: "Car Finance Mis-Selling – Complete Guide",
    },
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
        name: "Română",
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

        {/* Language */}
        <meta httpEquiv="content-language" content="ro-GB" />

        {/* hreflang */}
        <link
          rel="alternate"
          hrefLang="en-GB"
          href={`${SITE_URL}/car-finance-mis-selling`}
        />
        <link rel="alternate" hrefLang="ro-GB" href={CANONICAL} />
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${SITE_URL}/car-finance-mis-selling`}
        />

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
          className="mx-auto w-full max-w-3xl px-4 py-10"
        >
          <article>
            <p className="text-sm font-semibold tracking-wide text-emerald-700">
              JustProveIt • Ghid informativ (RO)
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Car Finance Mis-Selling în Marea Britanie – explicație pentru români
            </h1>

            <p className="mt-4 text-lg">
              Mulți români din UK au cumpărat o mașină prin{" "}
              <strong>PCP</strong> sau <strong>Hire Purchase</strong> și au
              presupus că oferta primită la dealer a fost standard. În realitate,
              unele acorduri ridică întrebări legate de transparență, dobândă și
              comisioane.
            </p>

            <LanguageBox />

            <Section title="Ce înseamnă car finance mis-selling?">
              <p>
                „Mis-selling” înseamnă că un acord de finanțare ar fi putut fi
                vândut fără informații complete sau clare, mai ales în ceea ce
                privește dobânda, comisioanele și alternativele disponibile.
              </p>
              <p className="mt-3">
                Nu contează dacă ai plătit tot sau dacă nu ai avut probleme.
                Contează <strong>cum a fost prezentat acordul</strong>.
              </p>

              <RelatedLink href="/what-is-car-finance-mis-selling">
                Explicația completă (EN)
              </RelatedLink>
            </Section>

            <Section title="Cine poate fi afectat?">
              <ul className="list-disc space-y-2 pl-6">
                <li>acordul este deja închis</li>
                <li>nu mai deții mașina</li>
                <li>nu ai ratat plăți</li>
                <li>procesul a fost rapid, fără explicații</li>
              </ul>

              <RelatedLink href="/who-is-eligible-car-finance">
                Checklist complet (EN)
              </RelatedLink>
            </Section>

            <Section title="Ce tipuri de finanțare sunt cel mai des vizate?">
              <TwoCols>
                <InfoCard
                  title="PCP"
                  text="Accent pe rata lunară, mai puțină atenție pe costul total și dobândă."
                  href="/pcp-mis-selling"
                />
                <InfoCard
                  title="Hire Purchase"
                  text="Poate părea simplu, dar pot exista aceleași probleme de transparență."
                  href="/hire-purchase-mis-selling"
                />
              </TwoCols>
            </Section>

            <Section title="De ce a intervenit FCA?">
              <p>
                FCA (Financial Conduct Authority) a investigat modul în care
                anumite comisioane și modele de vânzare au creat conflicte de
                interes între dealer și client.
              </p>

              <RelatedLink href="/fca-car-finance-investigation">
                Investigația FCA (EN)
              </RelatedLink>
            </Section>

            <Section title="Ce opțiuni există?">
              <ul className="list-disc space-y-2 pl-6">
                <li>te informezi</li>
                <li>depui singur o plângere</li>
                <li>folosești suport specializat</li>
              </ul>

              <RelatedLink href="/how-to-complain-car-finance">
                Ghid pas-cu-pas (EN)
              </RelatedLink>
            </Section>

            <Section title="Întrebări frecvente (scurt)">
              <p>
                <strong>Îmi afectează credit score-ul?</strong>  
                Nu, simpla depunere a unei plângeri nu afectează scorul.
              </p>

              <p className="mt-3">
                <strong>Mai contează dacă acordul e plătit?</strong>  
                Uneori, da. Depinde de circumstanțe.
              </p>

              <RelatedLink href="/car-finance-mis-selling-faqs">
                FAQ complet (EN)
              </RelatedLink>
            </Section>

            <hr className="my-10" />

            <p className="text-sm text-slate-600">
              Acest ghid este informativ și nu reprezintă consultanță juridică.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Înapoi la ghidul complet (EN):{" "}
              <Link
                href="/car-finance-mis-selling"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Car finance mis-selling →
              </Link>
            </p>
          </article>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

/* ================= UI ================= */

function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white px-3 py-2 shadow"
    >
      Skip to content
    </a>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-extrabold">
          Just<span className="text-emerald-700">ProveIt</span>
        </Link>

        <nav className="hidden gap-4 text-sm font-semibold md:flex">
          <Link href="/car-finance-mis-selling">English guide</Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-xs text-slate-500">
        © {new Date().getFullYear()} JustProveIt
      </div>
    </footer>
  );
}

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
      <div className="prose prose-slate mt-4 max-w-none">{children}</div>
    </section>
  );
}

function RelatedLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <p className="mt-4 text-sm">
      <Link
        href={href}
        className="font-semibold text-emerald-700 hover:underline"
      >
        {children} →
      </Link>
    </p>
  );
}

function TwoCols({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>;
}

function InfoCard({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{text}</p>
      <RelatedLink href={href}>Citește mai mult</RelatedLink>
    </div>
  );
}

function LanguageBox() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-extrabold">Language</p>
      <p className="mt-2 text-sm">
        Preferi engleza?{" "}
        <Link
          href="/car-finance-mis-selling"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Complete English guide →
        </Link>
      </p>
    </div>
  );
}