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
const FOREIGN_COUNTRIES = [
  { value: "AT", label: "Austria" },
  { value: "BE", label: "Belgia" },
  { value: "BG", label: "Bulgaria" },
  { value: "HR", label: "Croatia" },
  { value: "CY", label: "Cipru" },
  { value: "CZ", label: "Cehia" },
  { value: "DK", label: "Danemarca" },
  { value: "EE", label: "Estonia" },
  { value: "FI", label: "Finlanda" },
  { value: "FR", label: "Franta" },
  { value: "DE", label: "Germania" },
  { value: "GR", label: "Grecia" },
  { value: "HU", label: "Ungaria" },
  { value: "IE", label: "Irlanda" },
  { value: "IT", label: "Italia" },
  { value: "LV", label: "Letonia" },
  { value: "LT", label: "Lituania" },
  { value: "LU", label: "Luxemburg" },
  { value: "MT", label: "Malta" },
  { value: "NL", label: "Olanda" },
  { value: "PL", label: "Polonia" },
  { value: "PT", label: "Portugalia" },
  { value: "SK", label: "Slovacia" },
  { value: "SI", label: "Slovenia" },
  { value: "ES", label: "Spania" },
  { value: "SE", label: "Suedia" },
  { value: "UK", label: "Regatul Unit / UK" },
];
const FOREIGN_PERIOD_SLOTS = [1, 2, 3] as const;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  gender: "F" | "M";
  normalRoYears: string;
  normalRoMonths: string;
  foreignCountry1: string;
  foreignYears1: string;
  foreignMonths1: string;
  foreignCountry2: string;
  foreignYears2: string;
  foreignMonths2: string;
  foreignCountry3: string;
  foreignYears3: string;
  foreignMonths3: string;
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
  foreignCountry1: "UK",
  foreignYears1: "",
  foreignMonths1: "",
  foreignCountry2: "",
  foreignYears2: "",
  foreignMonths2: "",
  foreignCountry3: "",
  foreignYears3: "",
  foreignMonths3: "",
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
  const [sendingSimulationEmail, setSendingSimulationEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [simulationEmailMessage, setSimulationEmailMessage] = useState("");
  const [simulationEmailStatus, setSimulationEmailStatus] = useState<"success" | "error" | "">("");

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
    setSimulationEmailMessage("");
    setSimulationEmailStatus("");
    setResponse(null);

    if (!form.birthYear || !form.birthMonth) {
      setError("Te rugam sa alegi luna si anul nasterii.");
      return;
    }

    setSubmitting(true);
    try {
      const foreignPeriods = buildForeignPeriods(form);
      const foreignTotalMonths = foreignPeriods.reduce((total, period) => total + (period.monthsTotal || 0), 0);
      const result = await submitPensionCalculator({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        birthYearMonth: `${form.birthYear}-${form.birthMonth}`,
        gender: form.gender,
        periods: {
          normalRoYears: asNumber(form.normalRoYears),
          normalRoMonths: asNumber(form.normalRoMonths),
          foreignYears: Math.floor(foreignTotalMonths / 12),
          foreignMonths: foreignTotalMonths % 12,
          deosebiteYears: asNumber(form.deosebiteYears),
          deosebiteMonths: asNumber(form.deosebiteMonths),
          specialeYears: asNumber(form.specialeYears),
          specialeMonths: asNumber(form.specialeMonths),
          grupaIYears: asNumber(form.grupaIYears),
          grupaIMonths: asNumber(form.grupaIMonths),
          grupaIIYears: asNumber(form.grupaIIYears),
          grupaIIMonths: asNumber(form.grupaIIMonths),
        },
        foreignPeriods,
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

    if (!isValidEmail(form.email)) {
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
      setEmailMessage(
        emailResult.emailSent
          ? "Rezultatul a fost trimis pe email."
          : emailResult.emailError || "Emailul nu a putut fi trimis.",
      );
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

  async function handleSendSimulationEmail() {
    const recipientEmail = form.email.trim();

    if (!recipientEmail) {
      setSimulationEmailStatus("error");
      setSimulationEmailMessage("Fail: completeaza emailul.");
      return;
    }

    if (!isValidEmail(recipientEmail)) {
      setSimulationEmailStatus("error");
      setSimulationEmailMessage("Fail: email invalid.");
      return;
    }

    const simulationContact = {
      fullName: form.fullName.trim() || "Simulare Pensie Romania",
      email: recipientEmail,
      phone: form.phone.trim() || "07000000000",
    };

    setSendingSimulationEmail(true);
    setSimulationEmailMessage("");
    setSimulationEmailStatus("");
    setError("");

    try {
      const simulationResult = await submitPensionCalculator({
        ...simulationContact,
        birthYearMonth: "1960-10",
        gender: "M",
        applicationDate: "2025-10",
        periods: {
          normalRoYears: 35,
          normalRoMonths: 0,
          foreignYears: 0,
          foreignMonths: 0,
          deosebiteYears: 0,
          deosebiteMonths: 0,
          specialeYears: 0,
          specialeMonths: 0,
          grupaIYears: 0,
          grupaIMonths: 0,
          grupaIIYears: 0,
          grupaIIMonths: 0,
        },
        foreignPeriods: [],
        childrenRaised: 0,
        handicapType: "none",
        handicapYears: 0,
        handicapMonths: 0,
        domain: typeof window !== "undefined" ? window.location.hostname : "justproveit.co.uk",
        source: "ro-pension-calculator-email-simulation",
        pageUrl: typeof window !== "undefined" ? window.location.href : CANONICAL,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });

      const emailResult = await sendPensionCalculatorEmail(
        simulationResult.resultId,
        simulationContact,
      );

      if (emailResult.emailSent) {
        setSimulationEmailStatus("success");
        setSimulationEmailMessage("Success: email trimis.");
      } else {
        setSimulationEmailStatus("error");
        setSimulationEmailMessage(
          `Fail: ${emailResult.emailError || "emailul nu a putut fi trimis."}`,
        );
      }
    } catch (simulationError) {
      setSimulationEmailStatus("error");
      setSimulationEmailMessage(
        `Fail: ${
          simulationError instanceof Error
            ? simulationError.message
            : "emailul de simulare nu a putut fi trimis."
        }`,
      );
    } finally {
      setSendingSimulationEmail(false);
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

              <fieldset className="grid gap-4 md:grid-cols-2">
                <legend className="mb-2 text-base font-bold md:col-span-2">Date personale</legend>
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
                <div className="grid gap-3 md:col-span-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <TextInput label="Copii crescuti" type="number" min="0" value={form.childrenRaised} onChange={(value) => update("childrenRaised", value)} />
                  <div className="flex flex-col gap-2 sm:min-w-[190px]">
                    <button
                      type="button"
                      disabled={sendingSimulationEmail}
                      onClick={handleSendSimulationEmail}
                      className="inline-flex w-full items-center justify-center rounded-md border border-emerald-700 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {sendingSimulationEmail ? "Trimit..." : "Email simulare"}
                    </button>
                    {simulationEmailMessage ? (
                      <p
                        aria-live="polite"
                        className={`text-xs font-bold ${
                          simulationEmailStatus === "success" ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {simulationEmailMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
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
                  {FOREIGN_PERIOD_SLOTS.map((slot) => (
                    <ForeignPeriodRow
                      key={slot}
                      slot={slot}
                      country={form[`foreignCountry${slot}`]}
                      years={form[`foreignYears${slot}`]}
                      months={form[`foreignMonths${slot}`]}
                      onCountry={(value) => update(`foreignCountry${slot}`, value)}
                      onYears={(value) => update(`foreignYears${slot}`, value)}
                      onMonths={(value) => update(`foreignMonths${slot}`, value)}
                    />
                  ))}
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

function ForeignPeriodRow({
  slot,
  country,
  years,
  months,
  onCountry,
  onYears,
  onMonths,
}: {
  slot: number;
  country: string;
  years: string;
  months: string;
  onCountry: (value: string) => void;
  onYears: (value: string) => void;
  onMonths: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_110px_110px] md:items-end">
      <SelectInput
        label={`Tara ${slot}`}
        value={country}
        onChange={onCountry}
        options={FOREIGN_COUNTRIES}
        placeholder="Alege tara"
      />
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
  const recommendedScenario = result.recommended;

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
        Rezultat salvat
      </p>
      <div className="mt-3 space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-extrabold">Romania</h2>
          {recommendedScenario?.eligibleNow ? (
            <>
              <h3 className="mt-2 text-xl font-extrabold">{recommendedScenario.label}</h3>
              <p className="mt-2 text-sm text-slate-700">
                Varsta: <strong>{formatAge(recommendedScenario.retirementAge)}</strong>
                {" "}| Data estimata: <strong>{recommendedScenario.retirementDate}</strong>
              </p>
            </>
          ) : recommendedScenario ? (
            <>
              <h3 className="mt-2 text-xl font-extrabold">
                Cel mai devreme va puteti pensiona la data de{" "}
                <strong>{recommendedScenario.retirementDate}</strong>.
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                Varianta: <strong>{recommendedScenario.label}</strong>
                {" "}| Varsta: <strong>{formatAge(recommendedScenario.retirementAge)}</strong>
              </p>
            </>
          ) : (
            <h3 className="mt-2 text-xl font-extrabold">Nu exista o varianta eligibila cu datele introduse.</h3>
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
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-3 py-2">Scenariu</th>
                  <th className="px-3 py-2">Varsta</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.scenarios.map((scenario) => (
                  <tr key={scenario.type} className="border-b border-slate-200 bg-white/70">
                    <td className="px-3 py-2 font-semibold">{scenario.label}</td>
                    <td className="px-3 py-2">{formatScenarioAge(scenario)}</td>
                    <td className="px-3 py-2">{formatScenarioDate(scenario)}</td>
                    <td className="px-3 py-2">
                      <p className="font-semibold">{formatScenarioStatus(scenario)}</p>
                      {scenario.notApplicableReason ? (
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {scenario.notApplicableReason}
                        </p>
                      ) : null}
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
        </div>

        {(result.foreignPensionSections?.length
          ? result.foreignPensionSections
          : result.ukStatePension
            ? [
                {
                  countryName: "UK",
                  workedPeriod: result.stagiu.foreign,
                  retirementAge: result.ukStatePension.retirementAge,
                  retirementDate: result.ukStatePension.retirementDate,
                  eligibleNow: result.ukStatePension.eligibleNow,
                  sourceUrl: result.ukStatePension.sourceUrl,
                  note: result.ukStatePension.note,
                },
              ]
            : []
        ).map((section) => (
          <div key={`${section.countryName}-${section.retirementDate || section.workedPeriod.years}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-extrabold">{section.countryName}</h2>
            {section.retirementDate ? (
              <p className="mt-2 text-xl font-extrabold">
                Puteti primi pensia de stat din {section.countryName} de la data de{" "}
                <strong>{section.retirementDate}</strong>.
              </p>
            ) : (
              <p className="mt-2 text-xl font-extrabold">
                Stagiu declarat in {section.countryName}:{" "}
                <strong>{formatAge(section.workedPeriod)}</strong>.
              </p>
            )}
            <div className="mt-4 grid gap-2 text-sm">
              <Metric label="Stagiu declarat" value={formatAge(section.workedPeriod)} />
              {section.retirementAge ? (
                <Metric label="Varsta pensie de stat" value={formatAge(section.retirementAge)} />
              ) : null}
              {section.retirementDate ? (
                <Metric
                  label="Status"
                  value={section.eligibleNow ? "Eligibil acum" : "Eligibil la data indicata"}
                />
              ) : null}
            </div>
            {section.note ? (
              <p className="mt-3 text-xs leading-5 text-slate-600">{section.note}</p>
            ) : null}
            {section.sourceUrl ? (
              <a
                href={section.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
              >
                Verifica sursa oficiala
              </a>
            ) : null}
          </div>
        ))}
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
  if (scenario.notApplicable) {
    return "Nu se aplica";
  }
  if (scenario.eligibleNow) {
    return "Eligibil acum";
  }
  if (scenario.eligible || scenario.futureEligible || isOnlyAgePending(scenario)) {
    return "Eligibil la data indicata";
  }
  return "Nu acum";
}

function formatScenarioAge(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return scenario.notApplicable ? "N/A" : formatAge(scenario.retirementAge);
}

function formatScenarioDate(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return scenario.notApplicable ? "N/A" : scenario.retirementDate;
}

function isOnlyAgePending(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return (
    !scenario.notApplicable &&
    scenario.ineligibilityReasons.length > 0 &&
    scenario.ineligibilityReasons.every((reason) =>
      reason.trim().toLowerCase().startsWith("varsta"),
    )
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function asNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function buildForeignPeriods(form: FormState) {
  return FOREIGN_PERIOD_SLOTS.map((slot) => {
    const country = form[`foreignCountry${slot}` as keyof FormState];
    const years = form[`foreignYears${slot}` as keyof FormState];
    const months = form[`foreignMonths${slot}` as keyof FormState];

    return {
      country: String(country || ""),
      years: asNumber(String(years || "")),
      months: asNumber(String(months || "")),
    };
  })
    .map((period) => ({
      ...period,
      totalMonths: period.years * 12 + period.months,
    }))
    .filter((period) => period.country && period.totalMonths > 0)
    .map(({ country, years, months, totalMonths }) => ({
      country,
      years,
      months,
      monthsTotal: totalMonths,
    }));
}
