import Head from "next/head";

export default function Page() {
  return (
    <>
      <Head>
        <title>Discretionary Commission Models (DCM) | JustProveIt</title>
        <meta
          name="description"
          content="What Discretionary Commission Models are and why they caused problems in car finance."
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1>Discretionary Commission Models (DCM)</h1>

        <p>
          Discretionary Commission Models allowed dealers to increase interest
          rates to earn more commission.
        </p>

        <p>
          The FCA banned these models due to concerns about consumer harm.
        </p>
      </main>
    </>
  );
}