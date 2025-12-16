import Head from "next/head";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <Head>
        <title>Car Finance Mis-Selling – Complete UK Guide | JustProveIt</title>
        <meta
          name="description"
          content="The complete UK guide to car finance mis-selling: what it is, why the FCA is investigating, who may be affected and what you can do next."
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1>Car Finance Mis-Selling – The Complete UK Guide</h1>

        <p>
          This guide explains car finance mis-selling in the UK, including hidden
          commissions, discretionary commission models, inflated interest rates
          and your rights under UK consumer law.
        </p>

        <h2>What is car finance mis-selling?</h2>
        <p>
          Car finance may be mis-sold when important information is not properly
          disclosed or when incentives influence the interest rate you are given.
        </p>

        <h2>Why car finance is under investigation</h2>
        <p>
          The Financial Conduct Authority (FCA) has raised concerns about how some
          car finance agreements were structured and sold.
        </p>

        <h2>Who may be affected</h2>
        <ul>
          <li><Link href="/pcp-mis-selling">PCP agreements</Link></li>
          <li><Link href="/hire-purchase-mis-selling">Hire Purchase agreements</Link></li>
        </ul>

        <h2>What you can do next</h2>
        <p>
          You can complain yourself or use a specialist service. Understanding
          your options is important.
        </p>
      </main>
    </>
  );
}