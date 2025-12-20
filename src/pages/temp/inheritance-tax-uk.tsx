import Head from "next/head";
import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/inheritance-tax-uk";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const TITLE =
  "Inheritance Tax UK – The Complete Independent Guide (Part 1) | JustProveIt";

const DESCRIPTION =
  "Understand inheritance tax in the UK: thresholds, rates, who pays it, when it applies, and the legal framework behind IHT. Independent, plain-English guide.";

export default function InheritanceTaxUKPart1() {
  const published = "2025-12-16";
  const modified = "2025-12-16";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Inheritance Tax UK – The Complete Independent Guide | JustProveIt",
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
        name: "Inheritance Tax UK",
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
        <script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is inheritance tax in the UK?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inheritance tax (IHT) is a tax charged on the value of a person’s estate when they die, and in some cases on gifts made during their lifetime. It applies if the total value exceeds available tax-free thresholds."
          }
        },
        {
          "@type": "Question",
          "name": "How much is inheritance tax in the UK?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The standard rate of inheritance tax in the UK is 40% on the value of an estate above the available nil-rate band and any other applicable allowances."
          }
        },
        {
          "@type": "Question",
          "name": "What is the inheritance tax threshold?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The inheritance tax threshold is known as the nil-rate band. Estates valued below this threshold are not usually subject to inheritance tax. Additional allowances may apply, such as the residence nil-rate band."
          }
        },
        {
          "@type": "Question",
          "name": "Do spouses pay inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Transfers between spouses or civil partners are generally exempt from inheritance tax. Any unused allowances can usually be transferred to the surviving spouse’s estate."
          }
        },
        {
          "@type": "Question",
          "name": "Do children pay inheritance tax on what they inherit?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inheritance tax is paid by the estate, not by beneficiaries personally. However, the amount beneficiaries receive may be reduced if inheritance tax is due."
          }
        },
        {
          "@type": "Question",
          "name": "What assets count towards inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Assets that count towards inheritance tax include property, money, savings, investments, business interests, and certain gifts made during the deceased’s lifetime."
          }
        },
        {
          "@type": "Question",
          "name": "What is the seven-year rule for inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The seven-year rule applies to lifetime gifts. If the person who made the gift survives for seven years, the gift is usually exempt from inheritance tax. If death occurs within seven years, some tax may be due."
          }
        },
        {
          "@type": "Question",
          "name": "Are all gifts subject to inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Some gifts are immediately exempt, such as gifts between spouses, gifts to charities, and certain small or regular gifts made from surplus income."
          }
        },
        {
          "@type": "Question",
          "name": "Do trusts avoid inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Trusts do not automatically avoid inheritance tax. Many trusts are subject to their own inheritance tax charges, including entry charges, periodic charges, and exit charges."
          }
        },
        {
          "@type": "Question",
          "name": "What is Business Property Relief?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Business Property Relief can reduce the value of qualifying business assets for inheritance tax purposes, sometimes by up to 100%, subject to strict conditions."
          }
        },
        {
          "@type": "Question",
          "name": "What is Agricultural Property Relief?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Agricultural Property Relief applies to certain qualifying agricultural land and buildings, reducing their value for inheritance tax purposes, provided specific ownership and use conditions are met."
          }
        },
        {
          "@type": "Question",
          "name": "Is inheritance tax paid before probate?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Some inheritance tax is usually payable before probate is granted. In certain cases, such as property, HMRC allows the tax to be paid in instalments."
          }
        },
        {
          "@type": "Question",
          "name": "Can inheritance tax be avoided legally?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inheritance tax planning can reduce tax using exemptions and reliefs provided by law. Aggressive avoidance schemes may be challenged by HMRC."
          }
        },
        {
          "@type": "Question",
          "name": "Does having a will reduce inheritance tax?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Having a will does not automatically reduce inheritance tax, but it allows available exemptions, reliefs and allowances to be applied correctly."
          }
        }
      ]
    })
  }}
/>
      </Head>

      <div className="min-h-screen bg-white text-slate-900">
        <SiteHeader />

        <main id="content" className="mx-auto max-w-6xl px-4 pb-16 pt-6">
          <article className="max-w-4xl">
            <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold text-emerald-700">
                JustProveIt • Independent UK Guide
              </p>

              <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
                Inheritance Tax in the UK – The Complete Independent Guide
              </h1>

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Part 1: What inheritance tax is, who it applies to, and how the UK system works
              </p>

              <p className="mt-4 text-base text-slate-700">
                Inheritance tax (IHT) is one of the most misunderstood taxes in the UK.
                Many people assume it only affects the very wealthy, or that it only
                applies to cash left behind after death.
              </p>

              <p className="mt-3 text-base text-slate-700">
                In reality, inheritance tax often affects ordinary families,
                particularly where property values have increased over time.
                This guide explains how inheritance tax works in the UK, clearly and
                without pressure.
              </p>
            </header>

            <nav className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-extrabold">On this page (Part 1)</p>
              <ol className="mt-3 space-y-2 text-sm">
                <li><a href="#introduction" className="hover:underline">Introduction</a></li>
                <li><a href="#what-is-iht" className="hover:underline">What is inheritance tax?</a></li>
                <li><a href="#who-pays" className="hover:underline">Who pays inheritance tax?</a></li>
                <li><a href="#thresholds" className="hover:underline">Inheritance tax thresholds</a></li>
                <li><a href="#rate" className="hover:underline">Inheritance tax rate</a></li>
                <li><a href="#what-counts" className="hover:underline">What counts towards an estate?</a></li>
                <li><a href="#legal-framework" className="hover:underline">Legal framework</a></li>
              </ol>
            </nav>

            <Section id="introduction" title="Introduction">
              <p>
                Inheritance tax is charged on the value of a person’s estate when
                they die, and in some cases on gifts made during their lifetime.
              </p>
              <p>
                The tax is calculated based on the total value of assets,
                less allowable exemptions and reliefs.
              </p>
              <Callout>
                Inheritance tax is about value, timing, and structure — not just wealth.
              </Callout>
            </Section>

            <Section id="what-is-iht" title="What is inheritance tax?">
              <p>
                Inheritance tax is a tax on the estate (property, money and possessions)
                of someone who has died. It can also apply to certain lifetime gifts.
              </p>
              <p>
                The responsibility for dealing with inheritance tax usually falls
                on the executors or administrators of the estate.
              </p>
            </Section>

            <Section id="who-pays" title="Who pays inheritance tax?">
              <p>
                Technically, inheritance tax is paid by the estate, not by the
                beneficiaries personally.
              </p>
              <p>
                However, the impact is often felt by beneficiaries because tax
                reduces what is ultimately passed on.
              </p>
            </Section>

            <Section id="thresholds" title="Inheritance tax thresholds">
              <p>
                Every individual has a tax-free threshold known as the
                <strong> nil-rate band</strong>.
              </p>
              <p>
                There may also be an additional
                <strong> residence nil-rate band</strong> where a home is passed
                to direct descendants.
              </p>
            </Section>

            <Section id="rate" title="Inheritance tax rate">
              <p>
                The standard rate of inheritance tax in the UK is
                <strong> 40%</strong> on the value of the estate above the available thresholds.
              </p>
              <p>
                Lower rates may apply in limited circumstances, such as where
                part of the estate is left to charity.
              </p>
            </Section>

            <Section id="what-counts" title="What counts towards an estate?">
              <ul className="list-disc pl-6 space-y-2">
                <li>Property and land</li>
                <li>Money and savings</li>
                <li>Investments</li>
                <li>Business interests</li>
                <li>Gifts made in certain circumstances</li>
              </ul>
            </Section>

            <Section id="legal-framework" title="The legal framework">
              <p>
                Inheritance tax is governed primarily by the
                Inheritance Tax Act 1984, alongside HMRC guidance and case law.
              </p>
              <p>
                The rules are technical, and outcomes depend heavily on facts,
                timing and documentation.
              </p>
            </Section>
            {/* =========================
    PART 2 — Eligibility, Gifts & Thresholds
   ========================= */}

<Section id="who-is-affected" title="Who is affected by inheritance tax in the UK?">
  <p>
    One of the most persistent myths about inheritance tax is that it only affects
    the very wealthy. In reality, inheritance tax increasingly affects
    <strong> ordinary families</strong>, particularly where property values have risen.
  </p>

  <p>
    You may be affected by inheritance tax if the total value of an estate —
    including property, savings, investments and certain gifts —
    exceeds available tax-free thresholds.
  </p>

  <Callout>
    Inheritance tax is triggered by value, not income or lifestyle.
  </Callout>

  <h3 className="mt-6 text-lg font-bold">Common situations where inheritance tax arises</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Owning property in the UK</li>
    <li>Being single, divorced or widowed</li>
    <li>Leaving assets to adult children or grandchildren</li>
    <li>Having made gifts without surviving seven years</li>
    <li>Owning business or agricultural assets without relief planning</li>
  </ul>
</Section>

<Section id="nil-rate-band" title="The nil-rate band (basic threshold)">
  <p>
    The <strong>nil-rate band</strong> is the amount an individual can pass on
    before inheritance tax becomes payable.
  </p>

  <p>
    Anything above this threshold is potentially taxed at
    <strong> 40%</strong>, subject to reliefs and exemptions.
  </p>

  <p>
    The nil-rate band applies per individual and does not automatically increase
    with asset values or inflation.
  </p>

  <Callout>
    Many estates exceed the threshold simply due to property price growth.
  </Callout>
</Section>

<Section id="residence-nil-rate-band" title="The residence nil-rate band (RNRB)">
  <p>
    In addition to the basic nil-rate band, an extra allowance —
    the <strong>residence nil-rate band</strong> — may apply where
    a qualifying home is passed to direct descendants.
  </p>

  <h3 className="mt-6 text-lg font-bold">Key conditions</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>The property must have been the deceased’s residence</li>
    <li>It must be left to direct descendants (children, grandchildren)</li>
    <li>The estate must not exceed taper thresholds</li>
  </ul>

  <p>
    The residence nil-rate band is often misunderstood and can be lost entirely
    if conditions are not met.
  </p>
</Section>

<Section id="spouses" title="Spouses and civil partners">
  <p>
    Transfers between spouses or civil partners are generally
    <strong> exempt from inheritance tax</strong>.
  </p>

  <p>
    This means that no inheritance tax is usually due on the first death,
    regardless of estate size.
  </p>

  <h3 className="mt-6 text-lg font-bold">Transferable allowances</h3>
  <p>
    Any unused nil-rate band and residence nil-rate band can normally be
    transferred to the surviving spouse’s estate.
  </p>

  <Callout>
    Many estates rely heavily on transferred allowances — but paperwork matters.
  </Callout>
</Section>

<Section id="gifts" title="Gifts and inheritance tax">
  <p>
    Inheritance tax does not only apply on death. Certain gifts made during
    lifetime can also fall within the tax net.
  </p>

  <h3 className="mt-6 text-lg font-bold">Potentially Exempt Transfers (PETs)</h3>
  <p>
    Most lifetime gifts are classed as <strong>Potentially Exempt Transfers</strong>.
    These become fully exempt if the person making the gift survives
    <strong> seven years</strong>.
  </p>

  <h3 className="mt-6 text-lg font-bold">If death occurs within seven years</h3>
  <p>
    If the donor dies within seven years, some or all of the gift may become
    chargeable to inheritance tax.
  </p>
</Section>

<Section id="seven-year-rule" title="The seven-year rule (explained simply)">
  <p>
    The seven-year rule determines whether lifetime gifts become taxable.
  </p>

  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Survive 7 years → gift usually tax-free</li>
    <li>Death within 7 years → gift may be taxed</li>
    <li>Taper relief may reduce tax after year 3</li>
  </ul>

  <p>
    Importantly, taper relief reduces the <strong>tax</strong>,
    not the value of the gift itself.
  </p>

  <Callout>
    The clock starts on the date of the gift — not the date it is reported.
  </Callout>
</Section>

<Section id="gift-exemptions" title="Gift exemptions (often misunderstood)">
  <p>
    Some gifts are immediately exempt from inheritance tax, regardless of timing.
  </p>

  <h3 className="mt-6 text-lg font-bold">Common exemptions</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Annual exemption (small yearly allowance)</li>
    <li>Small gifts to individuals</li>
    <li>Normal expenditure out of income</li>
    <li>Gifts to spouses or charities</li>
  </ul>

  <p>
    Misusing or misunderstanding these exemptions is a frequent cause of
    unexpected inheritance tax bills.
  </p>
</Section>

<Section id="common-traps" title="Common inheritance tax traps">
  <p>
    Inheritance tax problems often arise not from deliberate avoidance,
    but from assumptions and outdated advice.
  </p>

  <ul className="mt-4 list-disc space-y-3 pl-6">
    <li>
      <strong>“My house goes to my children automatically.”</strong><br />
      Ownership structure and wills matter.
    </li>
    <li>
      <strong>“I gave it away years ago.”</strong><br />
      Gifts may still fall within the seven-year window.
    </li>
    <li>
      <strong>“Spouses don’t pay inheritance tax.”</strong><br />
      True — but the tax may arise on the second death.
    </li>
    <li>
      <strong>“Trusts avoid inheritance tax.”</strong><br />
      Trusts have their own complex tax regime.
    </li>
  </ul>

  <Callout>
    Most inheritance tax issues arise from complexity, not intention.
  </Callout>
</Section>

<Section id="what-next" title="What this guide covers next">
  <p>
    In the final part of this guide, we will cover:
  </p>

  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Trusts and inheritance tax</li>
    <li>Business Property Relief (BPR)</li>
    <li>Agricultural Property Relief (APR)</li>
    <li>Planning vs avoidance</li>
    <li>FAQs and real-world scenarios</li>
  </ul>

  <p className="mt-4">
    Understanding the rules is the foundation. Planning comes later.
  </p>
</Section>

{/* =========================
    PART 3 — Trusts, Reliefs, FAQs & Conclusion
   ========================= */}

<Section id="trusts" title="Trusts and inheritance tax">
  <p>
    Trusts are often mentioned in discussions about inheritance tax, but they are
    frequently misunderstood. Trusts do not automatically avoid inheritance tax
    and can introduce their own tax charges.
  </p>

  <h3 className="mt-6 text-lg font-bold">How trusts interact with inheritance tax</h3>
  <p>
    When assets are placed into trust, inheritance tax may arise immediately,
    later, or both — depending on the type of trust and the value involved.
  </p>

  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Entry charges when assets are placed into trust</li>
    <li>Periodic charges (usually every 10 years)</li>
    <li>Exit charges when assets leave the trust</li>
  </ul>

  <Callout>
    Trusts are planning tools — not shortcuts — and must be used carefully.
  </Callout>
</Section>

<Section id="trust-types" title="Common trust types (high-level)">
  <p>
    Different trusts are taxed differently. The structure matters more than the
    name.
  </p>

  <ul className="mt-4 list-disc space-y-3 pl-6">
    <li>
      <strong>Discretionary trusts</strong> — most flexible, but subject to
      periodic and exit charges.
    </li>
    <li>
      <strong>Interest in possession trusts</strong> — beneficiary has an
      immediate right to income.
    </li>
    <li>
      <strong>Bare trusts</strong> — assets treated as belonging to the
      beneficiary.
    </li>
  </ul>

  <p>
    Choosing the wrong trust structure can create tax issues rather than solve
    them.
  </p>
</Section>

<Section id="business-property-relief" title="Business Property Relief (BPR)">
  <p>
    Business Property Relief can reduce the value of certain business assets for
    inheritance tax purposes — sometimes by up to <strong>100%</strong>.
  </p>

  <h3 className="mt-6 text-lg font-bold">Assets that may qualify</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Shares in qualifying trading companies</li>
    <li>Business interests</li>
    <li>Certain partnership assets</li>
  </ul>

  <p>
    Investment businesses and passive activities usually do not qualify.
  </p>

  <Callout>
    Whether a business qualifies depends on activity, not label.
  </Callout>
</Section>

<Section id="agricultural-property-relief" title="Agricultural Property Relief (APR)">
  <p>
    Agricultural Property Relief applies to qualifying agricultural property,
    including farmland and farm buildings, subject to strict conditions.
  </p>

  <h3 className="mt-6 text-lg font-bold">Key factors</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Type of land and use</li>
    <li>Length of ownership</li>
    <li>Occupation and control</li>
  </ul>

  <p>
    APR does not usually cover the full value of farmhouses or development value.
  </p>

  <Callout>
    Agricultural relief is technical — small details make large differences.
  </Callout>
</Section>

<Section id="planning-vs-avoidance" title="Planning vs avoidance">
  <p>
    There is an important legal and practical distinction between inheritance tax
    planning and tax avoidance.
  </p>

  <h3 className="mt-6 text-lg font-bold">Inheritance tax planning</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Uses reliefs and exemptions provided by law</li>
    <li>Requires documentation and timing</li>
    <li>Is transparent and defensible</li>
  </ul>

  <h3 className="mt-6 text-lg font-bold">Tax avoidance schemes</h3>
  <ul className="mt-3 list-disc space-y-2 pl-6">
    <li>Often marketed as “guaranteed”</li>
    <li>Rely on artificial structures</li>
    <li>May be challenged by HMRC</li>
  </ul>

  <Callout>
    If something sounds risk-free and guaranteed, it usually isn’t.
  </Callout>
</Section>

<Section id="faqs" title="Frequently asked questions">
  <h3 className="mt-4 text-lg font-bold">Does everyone pay inheritance tax?</h3>
  <p>
    No. Many estates fall below thresholds or qualify for exemptions and reliefs.
  </p>

  <h3 className="mt-4 text-lg font-bold">Is inheritance tax paid before probate?</h3>
  <p>
    Some inheritance tax is usually due before probate can be granted, although
    instalment options may apply for certain assets.
  </p>

  <h3 className="mt-4 text-lg font-bold">Can inheritance tax be paid in instalments?</h3>
  <p>
    Yes. HMRC allows instalments for certain assets, such as property, subject to
    interest.
  </p>

  <h3 className="mt-4 text-lg font-bold">Does having a will reduce inheritance tax?</h3>
  <p>
    A will does not reduce tax by itself, but it allows exemptions, reliefs and
    allowances to be used properly.
  </p>
</Section>

<Section id="final-thoughts" title="Final thoughts">
  <p>
    Inheritance tax is not just a financial issue — it is a legal, emotional and
    administrative one.
  </p>

  <p>
    Most problems arise not because people ignore inheritance tax, but because
    the rules are complex and change over time.
  </p>

  <Callout>
    Understanding comes first. Decisions should follow — not the other way around.
  </Callout>
</Section>

          </article>
        </main>
      </div>
    </>
  );
}

/* ---------------- UI helpers ---------------- */

function Section({ id, title, children }) {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="prose prose-slate mt-4 max-w-none">{children}</div>
    </section>
  );
}

function Callout({ children }) {
  return (
    <div className="my-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-semibold text-amber-900">Key point</p>
      <div className="mt-2 text-sm text-amber-900/90">{children}</div>
    </div>
  );
}