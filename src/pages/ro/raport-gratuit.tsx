import Head from "next/head";
import Link from "next/link";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  evaluateQuickReport,
  getQuickReportCompletion,
  getQuickReportFlagCounts,
  getStandardTaxCode,
  submitQuickReport,
  type QuickReportAnswers,
  type QuickReportDisplayFlag,
  type QuickReportFlag,
  type QuickReportResult,
} from "@/lib/quickReport";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/raport-gratuit";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;

const initialAnswers: QuickReportAnswers = {
  multipleJobs: "",
  taxRecoveredLast5Years: "",
  electoralRoll: "",
  creditReportChecked: "",
  bankSwitchLast: "",
  insuranceRenewal: "",
  transferMethod: "",
  transferCompared: "",
  utilitiesCompared: "",
};

type ContactForm = {
  fullName: string;
  email: string;
  phone: string;
  consentVerbal: boolean;
};

const initialContact: ContactForm = {
  fullName: "",
  email: "",
  phone: "",
  consentVerbal: false,
};

export default function FreeQuickReportPage() {
  const [contact, setContact] = useState<ContactForm>(initialContact);
  const [answers, setAnswers] = useState<QuickReportAnswers>(initialAnswers);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [message, setMessage] = useState("");
  const standardTaxCode = getStandardTaxCode();
  const results = useMemo(() => evaluateQuickReport(answers), [answers]);
  const completion = useMemo(() => getQuickReportCompletion(results), [results]);
  const counts = useMemo(() => getQuickReportFlagCounts(results), [results]);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Raport gratuit - verificari rapide",
      url: CANONICAL,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "ro-GB",
      publisher: {
        "@type": "Organization",
        name: "JustProveIt",
        url: SITE_URL,
      },
    }),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fullName = params.get("name") ?? params.get("fullName") ?? params.get("nume") ?? "";
    const email = params.get("email") ?? "";
    const phone = params.get("phone") ?? params.get("telefon") ?? params.get("tel") ?? "";

    if (!fullName && !email && !phone) {
      return;
    }

    setContact((current) => ({
      ...current,
      fullName: fullName || current.fullName,
      email: email || current.email,
      phone: phone || current.phone,
    }));
  }, []);

  async function handleSendReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setMessage("");

    const fullName = contact.fullName.trim();
    const email = contact.email.trim();
    const phone = contact.phone.trim();

    if (!fullName || !email || !phone) {
      setStatus("error");
      setMessage("Completeaza numele, emailul si telefonul clientului.");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Completeaza o adresa de email valida.");
      return;
    }

    if (!contact.consentVerbal) {
      setStatus("error");
      setMessage("Bifeaza consimtamantul verbal inainte de trimiterea raportului.");
      return;
    }

    if (!completion.complete) {
      setStatus("error");
      setMessage("Completeaza toate verificarile inainte de trimiterea raportului.");
      return;
    }

    const completedResults = results.filter(
      (result): result is QuickReportResult & { flag: QuickReportFlag } => result.flag !== "necompletat",
    );

    setSending(true);
    try {
      const response = await submitQuickReport({
        fullName,
        email,
        phone,
        consentVerbalAt: new Date().toISOString(),
        answers,
        results: completedResults,
        standardTaxCode,
        domain: typeof window !== "undefined" ? window.location.hostname : "justproveit.co.uk",
        pageUrl: typeof window !== "undefined" ? window.location.href : CANONICAL,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });

      if (response.emailSent === false) {
        setStatus("error");
        setMessage(response.emailError || "Raportul a fost salvat, dar emailul nu a putut fi trimis.");
        return;
      }

      setStatus("success");
      setMessage(response.message || "Raportul a fost trimis pe email.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Raportul nu a putut fi trimis.");
    } finally {
      setSending(false);
    }
  }

  function updateContact<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setContact((current) => ({ ...current, [key]: value }));
  }

  function updateAnswer<K extends keyof QuickReportAnswers>(key: K, value: QuickReportAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <Head>
        <title>Raport gratuit financiar UK | JustProveIt</title>
        <meta
          name="description"
          content="Raport gratuit cu 6 verificari rapide pentru romanii din UK: cod fiscal, credit score, bank switching, asigurari, transfer bani si utilitati."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta httpEquiv="content-language" content="ro-GB" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/ro" className="text-lg font-extrabold">
              Just<span className="text-emerald-700">ProveIt</span>
            </Link>
            <Link href="/ro/calculator-varsta-pensionare" className="text-sm font-semibold text-emerald-700 hover:underline">
              Calculator pensie
            </Link>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]">
          <form onSubmit={handleSendReport} className="space-y-6 rounded-lg border border-slate-200 bg-slate-100/80 p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold tracking-wide text-emerald-700">
                Raport gratuit
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-normal md:text-4xl">
                6 verificari rapide pentru bani pierduti in UK
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
                Agentul completeaza raspunsurile in timpul apelului, iar clientul primeste raportul pe email.
              </p>
            </div>

            <fieldset className="grid gap-4 md:grid-cols-3">
              <legend className="mb-2 text-base font-bold md:col-span-3">Date client</legend>
              <TextInput label="Nume complet" value={contact.fullName} onChange={(value) => updateContact("fullName", value)} />
              <TextInput label="Email" type="email" value={contact.email} onChange={(value) => updateContact("email", value)} />
              <TextInput label="Telefon" type="tel" value={contact.phone} onChange={(value) => updateContact("phone", value)} />
              <label className="flex gap-3 text-sm leading-6 text-slate-700 md:col-span-3">
                <input
                  type="checkbox"
                  checked={contact.consentVerbal}
                  onChange={(event) => updateContact("consentVerbal", event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
                />
                <span>Confirm ca am obtinut consimtamant verbal pentru trimiterea raportului pe email.</span>
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-base font-bold">Verificari rapide</legend>

              <CheckFields title="MF01 - Cod fiscal gresit">
                <SelectInput
                  label="Ai avut mai multe joburi in acest an fiscal sau in ultimii 5 ani?"
                  value={answers.multipleJobs}
                  onChange={(value) => updateAnswer("multipleJobs", value as QuickReportAnswers["multipleJobs"])}
                  options={yesNoOptions}
                />
                <SelectInput
                  label="Ai recuperat taxele pe ultimii 5 ani?"
                  value={answers.taxRecoveredLast5Years}
                  onChange={(value) => updateAnswer("taxRecoveredLast5Years", value as QuickReportAnswers["taxRecoveredLast5Years"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="MF02 - Credit score / raport de credit">
                <SelectInput
                  label="Esti inscris pe electoral roll la adresa curenta?"
                  value={answers.electoralRoll}
                  onChange={(value) => updateAnswer("electoralRoll", value as QuickReportAnswers["electoralRoll"])}
                  options={yesNoOptions}
                />
                <SelectInput
                  label="Ai verificat vreodata raportul de credit pentru erori?"
                  value={answers.creditReportChecked}
                  onChange={(value) => updateAnswer("creditReportChecked", value as QuickReportAnswers["creditReportChecked"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD07 - Bank switching bonus neaccesat">
                <SelectInput
                  label="Cand ai schimbat ultima data un cont curent de la orice banca?"
                  value={answers.bankSwitchLast}
                  onChange={(value) => updateAnswer("bankSwitchLast", value as QuickReportAnswers["bankSwitchLast"])}
                  options={[
                    { value: "within12", label: "In ultimele 12 luni" },
                    { value: "over12", label: "Acum peste 12 luni" },
                    { value: "never", label: "Niciodata" },
                  ]}
                />
              </CheckFields>

              <CheckFields title="FC02 - Asigurari auto/casa">
                <SelectInput
                  label="Cand ai reinnoit ultima data asigurarea auto sau de casa si ai comparat pretul cu piata?"
                  value={answers.insuranceRenewal}
                  onChange={(value) => updateAnswer("insuranceRenewal", value as QuickReportAnswers["insuranceRenewal"])}
                  options={[
                    { value: "compared", label: "Am comparat pretul cu piata" },
                    { value: "autoNoCompare", label: "Reinnoire automata, fara comparare, in ultimele 12 luni" },
                    { value: "notApplicable", label: "Nu am asigurare auto/casa" },
                  ]}
                />
              </CheckFields>

              <CheckFields title="FC05 - Comisioane remitere bani spre Romania">
                <SelectInput
                  label="Ce metoda folosesti ca sa trimiti bani in Romania?"
                  value={answers.transferMethod}
                  onChange={(value) => updateAnswer("transferMethod", value as QuickReportAnswers["transferMethod"])}
                  options={[
                    { value: "bank", label: "Banca traditionala" },
                    { value: "westernUnion", label: "Western Union" },
                    { value: "moneyGram", label: "MoneyGram" },
                    { value: "wise", label: "Wise" },
                    { value: "revolut", label: "Revolut" },
                    { value: "other", label: "Alta metoda" },
                  ]}
                />
                <SelectInput
                  label="Ai comparat vreodata cu Wise/Revolut?"
                  value={answers.transferCompared}
                  onChange={(value) => updateAnswer("transferCompared", value as QuickReportAnswers["transferCompared"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="FC07 - Facturi de utilitati">
                <SelectInput
                  label="Ai comparat sau schimbat furnizorul de energie/broadband/mobile in ultimele 12 luni?"
                  value={answers.utilitiesCompared}
                  onChange={(value) => updateAnswer("utilitiesCompared", value as QuickReportAnswers["utilitiesCompared"])}
                  options={yesNoOptions}
                />
              </CheckFields>
            </fieldset>

            {message ? (
              <p
                aria-live="polite"
                className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
                  status === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
            >
              {sending ? "Trimit..." : "Trimite raport"}
            </button>
          </form>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Rezultat instant
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-normal">
                {completion.completed}/{completion.total} verificari completate
              </h2>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <MetricPill label="Rosu" value={counts.rosu} tone="rosu" />
                <MetricPill label="Galben" value={counts.galben} tone="galben" />
                <MetricPill label="Verde" value={counts.verde} tone="verde" />
                <MetricPill label="Lipsa" value={counts.necompletat} tone="necompletat" />
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Rezultatul este informativ si nu reprezinta sfat financiar reglementat.
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold">Rezultate pentru email</h2>
              <div className="mt-4 space-y-3">
                {results.map((result) => (
                  <ResultItem key={result.code} result={result} />
                ))}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </>
  );
}

const yesNoOptions = [
  { value: "yes", label: "Da" },
  { value: "no", label: "Nu" },
];

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">Alege raspunsul</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckFields({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
    </div>
  );
}

function ResultItem({ result }: { result: QuickReportResult }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{result.code}</p>
          <h3 className="mt-1 text-sm font-extrabold text-slate-950">{result.title}</h3>
        </div>
        <FlagBadge flag={result.flag} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{result.output}</p>
    </article>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: QuickReportDisplayFlag;
}) {
  return (
    <div className={`rounded-md border px-2 py-3 ${flagToneClass(tone)}`}>
      <p>{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}

function FlagBadge({ flag }: { flag: QuickReportDisplayFlag }) {
  return (
    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-extrabold uppercase ${flagToneClass(flag)}`}>
      {formatFlag(flag)}
    </span>
  );
}

function flagToneClass(flag: QuickReportDisplayFlag) {
  switch (flag) {
    case "rosu":
      return "border-red-200 bg-red-50 text-red-800";
    case "galben":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "verde":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatFlag(flag: QuickReportDisplayFlag) {
  if (flag === "necompletat") {
    return "lipsa";
  }
  return flag;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
