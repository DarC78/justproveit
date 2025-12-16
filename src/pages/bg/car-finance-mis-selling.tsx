import Head from "next/head";
import Link from "next/link";

/* ================= CONFIG ================= */

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/bg/car-finance-mis-selling";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Car Finance Mis-Selling във Великобритания – Ръководство за българи | JustProveIt";

const DESCRIPTION =
  "Ясно обяснение на car finance mis-selling във Великобритания, предназначено за българи в UK. Разбери какво означава, кого може да засегне и какви са опциите.";

/* ================= PAGE ================= */

export default function CarFinanceMisSellingBG() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Car Finance Mis-Selling във Великобритания – обяснение за българи",
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
    inLanguage: "bg-GB",
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
        name: "Български",
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
        <meta httpEquiv="content-language" content="bg-GB" />

        {/* hreflang */}
        <link
          rel="alternate"
          hrefLang="en-GB"
          href={`${SITE_URL}/car-finance-mis-selling`}
        />
        <link rel="alternate" hrefLang="bg-GB" href={CANONICAL} />
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
              JustProveIt • Информационно ръководство (BG)
            </p>

            <h1 className="mt-2 text-3xl font-extrabold">
              Car Finance Mis-Selling във Великобритания – обяснение за българи
            </h1>

            <p className="mt-4 text-lg">
              Много българи в UK са закупили автомобил чрез{" "}
              <strong>PCP</strong> или <strong>Hire Purchase</strong>, приемайки,
              че предложението от дилъра е стандартно. В действителност някои
              договори повдигат въпроси относно прозрачността, лихвите и
              комисионните.
            </p>

            <LanguageBox />

            <Section title="Какво означава car finance mis-selling?">
              <p>
                „Mis-selling“ означава, че договорът за финансиране може да е бил
                представен без пълна и ясна информация – особено относно лихвения
                процент, комисионните и наличните алтернативи.
              </p>
              <p className="mt-3">
                Важно е <strong>как е бил продаден договорът</strong>, а не дали
                сте плащали редовно.
              </p>

              <RelatedLink href="/what-is-car-finance-mis-selling">
                Пълно обяснение (EN)
              </RelatedLink>
            </Section>

            <Section title="Кого може да засегне?">
              <ul className="list-disc space-y-2 pl-6">
                <li>договорът вече е приключен</li>
                <li>вече не притежавате автомобила</li>
                <li>не сте пропускали плащания</li>
                <li>процесът е бил бърз и с малко обяснения</li>
              </ul>

              <RelatedLink href="/who-is-eligible-car-finance">
                Критерии за допустимост (EN)
              </RelatedLink>
            </Section>

            <Section title="Кои видове финансиране са най-често засегнати?">
              <TwoCols>
                <InfoCard
                  title="PCP"
                  text="Фокус върху месечната вноска, по-малко внимание към общата цена и лихвата."
                  href="/pcp-mis-selling"
                />
                <InfoCard
                  title="Hire Purchase"
                  text="Изглежда по-просто, но може да крие същите проблеми с прозрачността."
                  href="/hire-purchase-mis-selling"
                />
              </TwoCols>
            </Section>

            <Section title="Защо се намесва FCA?">
              <p>
                FCA (Financial Conduct Authority) разследва модели на продажба и
                комисионни, които могат да създадат конфликт на интереси между
                дилъра и клиента.
              </p>

              <RelatedLink href="/fca-car-finance-investigation">
                Разследване на FCA (EN)
              </RelatedLink>
            </Section>

            <Section title="Какви са опциите ви?">
              <ul className="list-disc space-y-2 pl-6">
                <li>да се информирате и прегледате договора</li>
                <li>да подадете жалба самостоятелно</li>
                <li>да използвате специализирана помощ</li>
              </ul>

              <RelatedLink href="/how-to-complain-car-finance">
                Ръководство стъпка по стъпка (EN)
              </RelatedLink>
            </Section>

            <Section title="Често задавани въпроси (накратко)">
              <p>
                <strong>Влияе ли жалбата на кредитния ми рейтинг?</strong>  
                Самото подаване на жалба обикновено не влияе на кредитния рейтинг.
              </p>

              <p className="mt-3">
                <strong>Има ли значение, ако договорът е приключен?</strong>  
                Понякога да – зависи от обстоятелствата.
              </p>

              <RelatedLink href="/car-finance-mis-selling-faqs">
                Пълни FAQ (EN)
              </RelatedLink>
            </Section>

            <hr className="my-10" />

            <p className="text-sm text-slate-600">
              Това ръководство е с информативна цел и не представлява правен съвет.
            </p>

            <p className="mt-4 text-sm text-slate-600">
              Обратно към пълното ръководство (EN):{" "}
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
      <RelatedLink href={href}>Прочети повече</RelatedLink>
    </div>
  );
}

function LanguageBox() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-extrabold">Език</p>
      <p className="mt-2 text-sm">
        Предпочиташ английски?{" "}
        <Link
          href="/car-finance-mis-selling"
          className="font-semibold text-emerald-700 hover:underline"
        >
          Пълно ръководство на английски →
        </Link>
      </p>
    </div>
  );
}