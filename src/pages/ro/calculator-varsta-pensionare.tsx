import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  PensionCalculatorResponse,
  sendPensionCalculatorEmail,
  submitPensionCalculator,
  type AgeYM,
} from "@/lib/pensionCalculator";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/calculator-varsta-pensionare";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const BIRTH_YEARS = Array.from({ length: 1980 - 1945 + 1 }, (_, index) =>
  String(1945 + index),
);
const BIRTH_MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  gender: "F" | "M";
  normalRoYears: string;
  normalRoMonths: string;
  foreignYears: string;
  foreignMonths: string;
  deosebiteYears: string;
  deosebiteMonths: string;
  specialeYears: string;
  specialeMonths: string;
  grupaIYears: string;
  grupaIMonths: string;
  grupaIIYears: string;
  grupaIIMonths: string;
  childrenRaised: string;
  handicapType: string;
  handicapYears: string;
  handicapMonths: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  birthYear: "",
  birthMonth: "",
  gender: "F",
  normalRoYears: "",
  normalRoMonths: "",
  foreignYears: "",
  foreignMonths: "",
  deosebiteYears: "",
  deosebiteMonths: "",
  specialeYears: "",
  specialeMonths: "",
  grupaIYears: "",
  grupaIMonths: "",
  grupaIIYears: "",
  grupaIIMonths: "",
  childrenRaised: "",
  handicapType: "none",
  handicapYears: "",
  handicapMonths: "",
};

export default function RomanianPensionCalculatorPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<PensionCalculatorResponse | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculator varsta de pensionare Romania",
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
    const fullName =
      params.get("name") ??
      params.get("fullName") ??
      params.get("nume") ??
      "";
    const email = params.get("email") ?? "";
    const phone =
      params.get("phone") ??
      params.get("telefon") ??
      params.get("tel") ??
      "";

    if (!fullName && !email && !phone) {
      return;
    }

    setForm((current) => ({
      ...current,
      fullName: fullName || current.fullName,
      email: email || current.email,
      phone: phone || current.phone,
    }));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEmailMessage("");
    setResponse(null);

    if (!form.birthYear || !form.birthMonth) {
      setError("Te rugam sa alegi luna si anul nasterii.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPensionCalculator({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        birthYearMonth: `${form.birthYear}-${form.birthMonth}`,
        gender: form.gender,
        periods: {
          normalRoYears: asNumber(form.normalRoYears),
          normalRoMonths: asNumber(form.normalRoMonths),
          foreignYears: asNumber(form.foreignYears),
          foreignMonths: asNumber(form.foreignMonths),
          deosebiteYears: asNumber(form.deosebiteYears),
          deosebiteMonths: asNumber(form.deosebiteMonths),
          specialeYears: asNumber(form.specialeYears),
          specialeMonths: asNumber(form.specialeMonths),
          grupaIYears: asNumber(form.grupaIYears),
          grupaIMonths: asNumber(form.grupaIMonths),
          grupaIIYears: asNumber(form.grupaIIYears),
          grupaIIMonths: asNumber(form.grupaIIMonths),
        },
        childrenRaised: asNumber(form.childrenRaised),
        handicapType: form.handicapType,
        handicapYears: asNumber(form.handicapYears),
        handicapMonths: asNumber(form.handicapMonths),
        domain: typeof window !== "undefined" ? window.location.hostname : "justproveit.co.uk",
        pageUrl: typeof window !== "undefined" ? window.location.href : CANONICAL,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });
      setResponse(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Calculatorul nu a putut procesa cererea.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendEmail() {
    if (!response?.resultId) {
      return;
    }

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setEmailMessage("Completeaza numele, emailul si telefonul inainte de trimiterea rezultatului.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setEmailMessage("Completeaza o adresa de email valida inainte de trimiterea rezultatului.");
      return;
    }

    setSendingEmail(true);
    setEmailMessage("");
    setError("");

    try {
      const emailResult = await sendPensionCalculatorEmail(response.resultId, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
      });
      setResponse((current) =>
        current
          ? {
              ...current,
              emailSent: emailResult.emailSent,
              emailError: emailResult.emailError ?? null,
            }
          : current,
      );
      setEmailMessage("Rezultatul a fost trimis pe email.");
    } catch (sendError) {
      setEmailMessage(
        sendError instanceof Error
          ? sendError.message
          : "Emailul nu a putut fi trimis.",
      );
    } finally {
      setSendingEmail(false);
    }
  }


  return (
    <>
      <Head>
        <title>Calculator varsta de pensionare Romania | JustProveIt</title>
        <meta
          name="description"
          content="Calculator informativ pentru varsta de pensionare in Romania, cu stagiu in UK sau alte state, grupe de munca si reducere pentru copii."
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
            <Link href="/ro" className="text-sm font-semibold text-emerald-700 hover:underline">
              Ghiduri RO
            </Link>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
          <section>
            <p className="text-sm font-semibold tracking-wide text-emerald-700">
              Calculator informativ
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-normal md:text-4xl">
              Calculator varsta de pensionare in Romania
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
              Completeaza datele principale, iar noi calculam scenariile de pensionare dupa
              Legea 360/2023. Datele de contact sunt necesare doar daca vrei sa trimiti
              rezultatul pe email.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-lg border border-slate-200 bg-slate-100/80 p-5 shadow-sm">
              <fieldset className="grid gap-4 md:grid-cols-3">
                <legend className="mb-2 text-base font-bold md:col-span-3">Date de contact</legend>
                <TextInput label="Nume complet" value={form.fullName} onChange={(value) => update("fullName", value)} />
                <TextInput label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
                <TextInput label="Telefon" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
              </fieldset>

              <fieldset className="grid gap-4 md:grid-cols-3">
                <legend className="mb-2 text-base font-bold md:col-span-3">Date personale</legend>
                <SelectInput
                  label="Luna nasterii"
                  value={form.birthMonth}
                  onChange={(value) => update("birthMonth", value)}
                  options={BIRTH_MONTHS}
                  placeholder="Alege luna"
                  required
                />
                <SelectInput
                  label="Anul nasterii"
                  value={form.birthYear}
                  onChange={(value) => update("birthYear", value)}
                  options={BIRTH_YEARS.map((year) => ({ value: year, label: year }))}
                  placeholder="Alege anul"
                  required
                />
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Sex</span>
                  <select
                    value={form.gender}
                    onChange={(event) => update("gender", event.target.value as "F" | "M")}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="F">Femeie</option>
                    <option value="M">Barbat</option>
                  </select>
                </label>
                <TextInput label="Copii crescuti" type="number" min="0" value={form.childrenRaised} onChange={(value) => update("childrenRaised", value)} />
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-base font-bold">Stagii de cotizare</legend>
                <div className="space-y-3">
                  <PeriodRow
                    label="Romania - conditii normale"
                    years={form.normalRoYears}
                    months={form.normalRoMonths}
                    onYears={(value) => update("normalRoYears", value)}
                    onMonths={(value) => update("normalRoMonths", value)}
                  />
                  <PeriodRow
                    label="UK / strainatate"
                    years={form.foreignYears}
                    months={form.foreignMonths}
                    onYears={(value) => update("foreignYears", value)}
                    onMonths={(value) => update("foreignMonths", value)}
                  />
                  <PeriodRow
                    label="Conditii deosebite"
                    years={form.deosebiteYears}
                    months={form.deosebiteMonths}
                    onYears={(value) => update("deosebiteYears", value)}
                    onMonths={(value) => update("deosebiteMonths", value)}
                  />
                  <PeriodRow
                    label="Conditii speciale"
                    years={form.specialeYears}
                    months={form.specialeMonths}
                    onYears={(value) => update("specialeYears", value)}
                    onMonths={(value) => update("specialeMonths", value)}
                  />
                  <PeriodRow
                    label="Grupa I inainte de 2001"
                    years={form.grupaIYears}
                    months={form.grupaIMonths}
                    onYears={(value) => update("grupaIYears", value)}
                    onMonths={(value) => update("grupaIMonths", value)}
                  />
                  <PeriodRow
                    label="Grupa II inainte de 2001"
                    years={form.grupaIIYears}
                    months={form.grupaIIMonths}
                    onYears={(value) => update("grupaIIYears", value)}
                    onMonths={(value) => update("grupaIIMonths", value)}
                  />
                </div>
              </fieldset>

              <fieldset className="grid gap-4 md:grid-cols-3">
                <legend className="mb-2 text-base font-bold md:col-span-3">Handicap, daca se aplica</legend>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Tip</span>
                  <select
                    value={form.handicapType}
                    onChange={(event) => update("handicapType", event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="none">Nu se aplica</option>
                    <option value="grav">Grav</option>
                    <option value="accentuat">Accentuat</option>
                    <option value="mediu">Mediu</option>
                    <option value="deficienta_vizuala_grava">Deficienta vizuala grava</option>
                  </select>
                </label>
                <TextInput label="Ani in conditii de handicap" type="number" min="0" value={form.handicapYears} onChange={(value) => update("handicapYears", value)} />
                <TextInput label="Luni" type="number" min="0" max="11" value={form.handicapMonths} onChange={(value) => update("handicapMonths", value)} />
              </fieldset>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
              >
                {submitting ? "Calculez..." : "Calculeaza variantele"}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <ResultPanel
              emailMessage={emailMessage}
              onSendEmail={handleSendEmail}
              response={response}
              sendingEmail={sendingEmail}
            />
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold">Ce acopera versiunea simplificata</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                <li>varsta standard conform Anexei nr. 5</li>
                <li>stagiu Romania si stagiu UK/strainatate</li>
                <li>conditii deosebite, speciale, Grupa I si Grupa II</li>
                <li>reducerea pentru femei cu copii</li>
                <li>scenarii de pensionare anticipata si stagiu depasit</li>
              </ul>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Nu calculeaza cuantumul pensiei. Rezultatele sunt informative si pot depinde de
                documentele acceptate de casa de pensii.
              </p>
            </section>
          </aside>
        </main>
      </div>
    </>
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
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
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PeriodRow({
  label,
  years,
  months,
  onYears,
  onMonths,
}: {
  label: string;
  years: string;
  months: string;
  onYears: (value: string) => void;
  onMonths: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_110px_110px] md:items-end">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <TextInput label="Ani" type="number" min="0" value={years} onChange={onYears} />
      <TextInput label="Luni" type="number" min="0" max="11" value={months} onChange={onMonths} />
    </div>
  );
}

function ResultPanel({
  emailMessage,
  onSendEmail,
  response,
  sendingEmail,
}: {
  emailMessage: string;
  onSendEmail: () => void;
  response: PensionCalculatorResponse | null;
  sendingEmail: boolean;
}) {
  if (!response) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold">Rezultatul apare aici</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Dupa calcul, vei vedea recomandarea principala si scenariile. Daca vrei, trimiti apoi
          rezultatul pe email.
        </p>
      </section>
    );
  }

  const { result } = response;
  const standardScenario = result.scenarios.find(
    (scenario) => scenario.type === "limita_varsta_standard",
  );
  const earliestFutureScenario = findEarliestFutureRetirementScenario(result);

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
        Rezultat salvat
      </p>
      {result.recommended?.eligibleNow ? (
        <>
          <h2 className="mt-2 text-xl font-extrabold">{result.recommended.label}</h2>
          <p className="mt-2 text-sm text-slate-700">
            Varsta: <strong>{formatAge(result.recommended.retirementAge)}</strong>
            {" "}| Data estimata: <strong>{result.recommended.retirementDate}</strong>
          </p>
        </>
      ) : earliestFutureScenario ? (
        <>
          <h2 className="mt-2 text-xl font-extrabold">
            Cel mai devreme va puteti pensiona la data de{" "}
            <strong>{earliestFutureScenario.retirementDate}</strong>.
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            Varianta: <strong>{earliestFutureScenario.label}</strong>
            {" "}| Varsta: <strong>{formatAge(earliestFutureScenario.retirementAge)}</strong>
          </p>
        </>
      ) : (
        <h2 className="mt-2 text-xl font-extrabold">Nu exista o varianta eligibila cu datele introduse.</h2>
      )}

      <div className="mt-4 grid gap-2 text-sm">
        <Metric label="Varsta acum" value={formatAge(result.currentAge)} />
        <Metric
          label="Varsta standard"
          value={
            standardScenario
              ? `${formatAge(result.anexa.standardAge)} (${standardScenario.retirementDate})`
              : formatAge(result.anexa.standardAge)
          }
        />
        <Metric label="Stagiu complet" value={formatAge(result.anexa.fullStagiu)} />
        <Metric label="Stagiu minim" value={formatAge(result.anexa.minimumStagiu)} />
        <Metric label="Stagiu total contributiv" value={formatAge(result.stagiu.totalContributiv)} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2">Scenariu</th>
              <th className="px-3 py-2">Varsta</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.scenarios.map((scenario) => (
              <tr key={scenario.type} className="border-b border-slate-100">
                <td className="px-3 py-2 font-semibold">{scenario.label}</td>
                <td className="px-3 py-2">{formatAge(scenario.retirementAge)}</td>
                <td className="px-3 py-2">{scenario.retirementDate}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold">{formatScenarioStatus(scenario)}</p>
                  {scenario.eligibilityReasons.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-emerald-700">Conditii indeplinite:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-600">
                        {scenario.eligibilityReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scenario.ineligibilityReasons.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-red-700">Conditii neindeplinite:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-600">
                        {scenario.ineligibilityReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-700">
          Email: {response.emailSent ? "trimis" : "netrimis"}
        </p>
        <button
          type="button"
          disabled={sendingEmail || response.emailSent}
          onClick={onSendEmail}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {sendingEmail ? "Trimit..." : response.emailSent ? "Email trimis" : "Trimite rezultatul pe email"}
        </button>
        {emailMessage ? (
          <p className="mt-2 text-sm font-semibold text-slate-700">{emailMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatAge(age: AgeYM) {
  if (age.months === 0) {
    return `${age.years} ani`;
  }
  return `${age.years} ani si ${age.months} luni`;
}

function formatScenarioStatus(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  if (scenario.eligibleNow) {
    return "Eligibil acum";
  }
  if (scenario.eligible || isOnlyAgePending(scenario)) {
    return "Eligibil la data indicata";
  }
  return "Nu acum";
}

function findEarliestFutureRetirementScenario(
  result: PensionCalculatorResponse["result"],
) {
  return result.scenarios
    .sort((left, right) => compareYearMonth(left.retirementDate, right.retirementDate))[0] ?? null;
}

function isOnlyAgePending(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return (
    scenario.ineligibilityReasons.length > 0 &&
    scenario.ineligibilityReasons.every((reason) =>
      reason.trim().toLowerCase().startsWith("varsta"),
    )
  );
}

function compareYearMonth(left: string, right: string) {
  return yearMonthIndex(left) - yearMonthIndex(right);
}

function yearMonthIndex(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(match[1]) * 12 + Number(match[2]);
}

function asNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}
