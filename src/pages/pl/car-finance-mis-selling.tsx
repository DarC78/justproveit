import Head from "next/head";
import Link from "next/link";

/* ================= CONFIG ================= */

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/pl/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling w UK – Przewodnik dla Polaków | JustProveIt";

const DESCRIPTION =
  "Jasne wyjaśnienie car finance mis-selling w Wielkiej Brytanii, przygotowane dla Polaków w UK. Sprawdź, co to oznacza, kogo może dotyczyć i jakie są opcje.";

/* ================= PAGE ================= */

export default function CarFinanceMisSellingPL() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Car Finance Mis-Selling w Wielkiej Brytanii – wyjaśnienie dla Polaków",
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
    inLanguage: "pl-GB",
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
        name: "Polski",
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
        <meta httpEquiv="content-language" content="pl-GB" />

        {/* hreflang */}
        <link
          rel="alternate"
          hrefLang="en-GB"
          href={`${SITE_URL}/car-finance-mis-selling`}
        />
        <link rel="alternate" hrefLang="pl-GB" href={CANONICAL} />
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

        <main id="content" className="mx-auto max-w-3xl px-4 py-10">
          <article>
            <p className="text-sm font-semibold tracking-wide text-emerald-700">
              JustProveIt • Przewodnik informacyjny (PL)
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Car Finance Mis-Selling w Wielkiej Brytanii – wyjaśnienie dla Polaków
            </h1>

            <p className="mt-4 text-lg">
              Wielu Polaków w UK kupiło samochód przez{" "}
              <strong>PCP</strong> lub <strong>Hire Purchase</strong>, zakładając,
              że oferta dealera była standardowa. W praktyce niektóre umowy mogą
              budzić pytania dotyczące przejrzystości, oprocentowania i prowizji.
            </p>

            <LanguageBox />

            <Section title="Co oznacza car finance mis-selling?">
              <p>
                „Mis-selling” oznacza sytuację, w której umowa finansowania mogła
                zostać sprzedana bez pełnej przejrzystości – np. bez jasnego
                wyjaśnienia, jak ustalono oprocentowanie, czy istniały prowizje
                lub alternatywne oferty.
              </p>
              <p className="mt-3">
                Nie chodzi o to, czy spłacałeś raty na czas, ale o{" "}
                <strong>sposób sprzedaży umowy</strong>.
              </p>

              <RelatedLink href="/what-is-car-finance-mis-selling">
                Pełne wyjaśnienie (EN)
              </RelatedLink>
            </Section>

            <Section title="Kogo to może dotyczyć?">
              <ul className="list-disc space-y-2 pl-6">
                <li>umowa została już spłacona</li>
                <li>nie posiadasz już samochodu</li>
                <li>nie miałeś zaległości w płatnościach</li>
                <li>proces był szybki i mało wyjaśniony</li>
              </ul>

              <RelatedLink href="/who-is-eligible-car-finance">
                Lista kryteriów (EN)
              </RelatedLink>
            </Section>

            <Section title="Jakie rodzaje finansowania są najczęściej omawiane?">
              <TwoCols>
                <InfoCard
                  title="PCP"
                  text="Nacisk na miesięczną ratę, mniejsza uwaga na całkowity koszt i oprocentowanie."
                  href="/pcp-mis-selling"
                />
                <InfoCard
                  title="Hire Purchase"
                  text="Może wyglądać prosto, ale mogą występować te same problemy z przejrzystością."
                  href="/hire-purchase-mis-selling"
                />
              </TwoCols>
            </Section>

            <Section title="Dlaczego pojawia się FCA?">
              <p>
                FCA (Financial Conduct Authority) badała modele sprzedaży i
                prowizji, które mogły tworzyć konflikt interesów pomiędzy dealerem
                a klientem.
              </p>

              <RelatedLink href="/fca-car-finance-investigation">
                Dochodzenie FCA (EN)
              </RelatedLink>
            </Section>

            <Section title="Jakie masz opcje?">
              <ul className="list-disc space-y-2 pl-6">
                <li>zdobyć informacje i sprawdzić umowę</li>
                <li>złożyć reklamację samodzielnie</li>
                <li>skorzystać ze wsparcia specjalistycznego</li>
              </ul>

              <RelatedLink href="/how-to-complain-car-finance">
                Przewodnik krok po kroku (EN)
              </RelatedLink>
            </Section>

            <Section title="Najczęstsze pytania (krótko)">
              <p>
                <strong>Czy reklamacja wpływa na credit score?</strong>  
                Samo złożenie reklamacji zazwyczaj nie wpływa na ocenę kredytową.
              </p>

              <p className="mt-3">
                <strong>Czy zamknięta umowa nadal się liczy?</strong>  
                Czasami tak – zależy od okoliczności.
              </p>

              <RelatedLink href="/car-finance-mis-selling-faqs">
                Pełne FAQ (EN)
              </RelatedLink>
            </Section>

            <hr className="my-10" />

            <p className="text-sm text-slate-600">
              Ten przewodnik ma charakter informacyjny i nie stanowi porady prawnej.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Wróć do pełnego przewodnika (EN):{" "}
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
      <RelatedLink href={href}>Czytaj więcej</RelatedLink>
    </div>
  );
}

function LanguageBox() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-extrabold">Język</p>
      <p className="mt-2 text-sm">
        Wolisz angielski?{" "}
        <Link
          href="/car-finance-mis-selling"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Pełny przewodnik po angielsku →
        </Link>
      </p>
    </div>
  );
}