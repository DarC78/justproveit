import Head from "next/head";
import Link from "next/link";

export default function WhoIsEligibleCarFinance() {
  return (
    <>
      <Head>
        <title>
          Who Is Eligible for Car Finance Mis-Selling? | JustProveIt
        </title>
        <meta
          name="description"
          content="Find out who may be eligible for car finance mis-selling in the UK. Eligibility explained clearly, including PCP, Hire Purchase, closed agreements and key factors."
        />
        <link
          rel="canonical"
          href="https://www.justproveit.co.uk/who-is-eligible-car-finance"
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <h1 className="text-3xl font-extrabold">
            Who Is Eligible for Car Finance Mis-Selling in the UK?
          </h1>

          <p className="mt-4 text-lg">
            Eligibility for car finance mis-selling is often misunderstood.
            Many people assume it only applies if something went obviously
            wrong. In reality, eligibility usually depends on how the finance
            agreement was sold.
          </p>

          <h2 className="mt-10 text-2xl font-bold">
            Eligibility is about the sale, not the outcome
          </h2>

          <p className="mt-3">
            You may be eligible even if your car finance agreement was paid
            in full, you never missed a payment, or you no longer own the car.
            Mis-selling focuses on whether the agreement was fair and
            transparent at the point of sale.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>The agreement is fully settled</li>
            <li>You never complained at the time</li>
            <li>You believed the deal was standard</li>
            <li>You paid every instalment on time</li>
          </ul>

          <h2 className="mt-10 text-2xl font-bold">
            Commission and interest rate disclosure
          </h2>

          <p className="mt-3">
            Commission itself is not illegal. Eligibility issues arise when
            commission influenced the interest rate and this was not clearly
            explained to the customer.
          </p>

          <p className="mt-3">
            You may be eligible if you were not told that the dealer could
            influence your interest rate or that higher rates meant higher
            commission.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Related:{" "}
            <Link
              href="/hidden-commission-explained"
              className="font-semibold text-emerald-700 hover:underline"
            >
              How hidden commission worked in car finance →
            </Link>
          </p>

          <h2 className="mt-10 text-2xl font-bold">
            Does the type of finance matter?
          </h2>

          <h3 className="mt-6 text-xl font-bold">
            PCP (Personal Contract Purchase)
          </h3>

          <p className="mt-2">
            PCP agreements are most commonly linked to car finance mis-selling
            concerns. This is because customers are often encouraged to focus
            on monthly payments rather than the total cost of credit.
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Related:{" "}
            <Link
              href="/pcp-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              PCP mis-selling explained →
            </Link>
          </p>

          <h3 className="mt-6 text-xl font-bold">
            Hire Purchase (HP)
          </h3>

          <p className="mt-2">
            Hire Purchase agreements can also be affected, particularly where
            interest rates were discretionary or commission was not disclosed.
            Simpler agreements are not automatically fairer.
          </p>

          <p className="mt-2 text-sm text-slate-600">
            Related:{" "}
            <Link
              href="/hire-purchase-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Hire Purchase mis-selling explained →
            </Link>
          </p>

          <h2 className="mt-10 text-2xl font-bold">
            Do you need paperwork to be eligible?
          </h2>

          <p className="mt-3">
            No. Lenders usually hold copies of finance agreements. Even if you
            no longer have documents, basic details are often enough for a
            lender to locate your agreement.
          </p>

          <h2 className="mt-10 text-2xl font-bold">
            Are closed agreements still eligible?
          </h2>

          <p className="mt-3">
            In some cases, yes. An agreement does not always need to be active
            to be reviewed. Time limits can apply, but they are not always based
            on when the agreement ended.
          </p>

          <h2 className="mt-10 text-2xl font-bold">
            What does not usually affect eligibility
          </h2>

          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>Missing or late payments</li>
            <li>Understanding finance terminology</li>
            <li>Whether the dealer appeared helpful</li>
            <li>Whether the car was new or used</li>
          </ul>

          <h2 className="mt-10 text-2xl font-bold">
            What to do if you think you may be eligible
          </h2>

          <p className="mt-3">
            Understanding eligibility does not mean you must complain. It
            allows you to make an informed decision about what, if anything,
            to do next.
          </p>

          <p className="mt-3 text-sm text-slate-600">
            Next step:{" "}
            <Link
              href="/how-to-complain-car-finance"
              className="font-semibold text-emerald-700 hover:underline"
            >
              How the car finance complaint process works →
            </Link>
          </p>

          <hr className="my-10" />

          <p className="text-sm text-slate-600">
            This guide is part of our complete explanation of{" "}
            <Link
              href="/car-finance-mis-selling"
              className="font-semibold text-emerald-700 hover:underline"
            >
              car finance mis-selling in the UK
            </Link>
            .
          </p>
        </article>
      </main>
    </>
  );
}