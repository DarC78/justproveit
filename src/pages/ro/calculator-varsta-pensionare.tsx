import ResultPanel from '@/components/PensionResultPanel';
import { sendPublicManualCrmEmail, sendPublicManualCrmSms } from "@/lib/crmAdmin";
import Head from "next/head";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  PensionCalculatorPayload,
  PensionCalculatorResponse,
  sendPensionCalculatorEmail,
  submitPensionCalculator,
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
type SpecialSituationKey =
  | "recognizedAntifascistRevolutionaryActivity"
  | "professionalOrPoliticalTrainingWhileEmployed"
  | "compensatoryPaymentsOug98_1999"
  | "unemploymentLaw1_1991IntegrationAid";
type PeriodInputState = {
  years: string;
  months: string;
};
type SpecialSituationsState = Record<SpecialSituationKey, PeriodInputState>;
const SPECIAL_SITUATION_OPTIONS: Array<{
  key: SpecialSituationKey;
  label: string;
}> = [
  {
    key: "recognizedAntifascistRevolutionaryActivity",
    label:
      "Perioada in care a desfasurat o activitate revolutionara antifascista, recunoscuta de organele in drept ca vechime in munca",
  },
  {
    key: "professionalOrPoliticalTrainingWhileEmployed",
    label:
      "Perioada in care o persoana incadrata in munca urmeaza cursuri de pregatire profesionala sau politica",
  },
  {
    key: "compensatoryPaymentsOug98_1999",
    label:
      "Perioadele pentru care se primesc plati compensatorii in baza Ordonantei de Urgenta nr. 98/1999",
  },
  {
    key: "unemploymentLaw1_1991IntegrationAid",
    label:
      "Perioadele in care a beneficiat de somaj si de ajutor de integrare profesionala prevazute de Legea nr. 1/1991",
  },
];
type ActionStatus = "success" | "error" | "";
const PURCHASE_EMAIL_TEMPLATE = "ro-pension-calculator-email-cumparare";
const PURCHASE_SMS_TEMPLATE = "ro-pension-calculator-sms-cumparare";
const PUBLIC_PURCHASE_AGENT = "Public pension calculator";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  gender: "F" | "M";
  normalRoYears: string;
  normalRoMonths: string;
  armyNormalYears: string;
  armyNormalMonths: string;
  armyReducedYears: string;
  armyReducedMonths: string;
  paidUnemploymentYears: string;
  paidUnemploymentMonths: string;
  maternityLeaveYears: string;
  maternityLeaveMonths: string;
  universityYears: string;
  universityMonths: string;
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
  specialSituations: SpecialSituationsState;
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
  armyNormalYears: "",
  armyNormalMonths: "",
  armyReducedYears: "",
  armyReducedMonths: "",
  paidUnemploymentYears: "",
  paidUnemploymentMonths: "",
  maternityLeaveYears: "",
  maternityLeaveMonths: "",
  universityYears: "",
  universityMonths: "",
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
  specialSituations: createInitialSpecialSituations(),
};

export default function RomanianPensionCalculatorPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<PensionCalculatorResponse | null>(null);
  const [sendingAfterSaleEmail, setSendingAfterSaleEmail] = useState(false);
  const [afterSaleMessage, setAfterSaleMessage] = useState("");
  const [afterSaleStatus, setAfterSaleStatus] = useState<ActionStatus>("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSimulationEmail, setSendingSimulationEmail] = useState(false);
  const [sendingPurchaseEmail, setSendingPurchaseEmail] = useState(false);
  const [sendingPurchaseSms, setSendingPurchaseSms] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [simulationEmailMessage, setSimulationEmailMessage] = useState("");
  const [simulationEmailStatus, setSimulationEmailStatus] = useState<ActionStatus>("");
  const [purchaseEmailMessage, setPurchaseEmailMessage] = useState("");
  const [purchaseEmailStatus, setPurchaseEmailStatus] = useState<ActionStatus>("");
  const [purchaseSmsMessage, setPurchaseSmsMessage] = useState("");
  const [purchaseSmsStatus, setPurchaseSmsStatus] = useState<ActionStatus>("");

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

  function buildCurrentCalculatorPayload(): PensionCalculatorPayload {
    const foreignPeriods = buildForeignPeriods(form);
    const foreignTotalMonths = foreignPeriods.reduce((total, period) => total + (period.monthsTotal || 0), 0);
    const additionalPeriods = buildAdditionalPeriodFields(form);
    return {
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
        ...additionalPeriods,
      },
      foreignPeriods,
      childrenRaised: asNumber(form.childrenRaised),
      handicapType: form.handicapType,
      handicapYears: asNumber(form.handicapYears),
      handicapMonths: asNumber(form.handicapMonths),
      domain: typeof window !== "undefined" ? window.location.hostname : "justproveit.co.uk",
      pageUrl: typeof window !== "undefined" ? window.location.href : CANONICAL,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    };
  }

  async function handleSendAfterSaleEmail() {
    setAfterSaleMessage("");
    setAfterSaleStatus("");
    setError("");
    if (!form.fullName.trim() || !form.phone.trim() || !isValidEmail(form.email) || !form.birthYear || !form.birthMonth) {
      setAfterSaleMessage("Completați numele, un email valid, telefonul și data nașterii înainte de trimitere.");
      setAfterSaleStatus("error");
      return;
    }
    setSendingAfterSaleEmail(true);
    try {
      const calculation = await submitPensionCalculator(buildCurrentCalculatorPayload());
      await sendPensionCalculatorEmail(calculation.resultId, {
        fullName: form.fullName, email: form.email, phone: form.phone,
      }, "after_sale");
      setResponse({ ...calculation, emailSent: true });
      setAfterSaleMessage("Detaliile după vânzare au fost trimise pe email.");
      setAfterSaleStatus("success");
    } catch (error) {
      setAfterSaleMessage(error instanceof Error ? error.message : "Emailul nu a putut fi trimis.");
      setAfterSaleStatus("error");
    } finally {
      setSendingAfterSaleEmail(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEmailMessage("");
    setSimulationEmailMessage("");
    setSimulationEmailStatus("");
    setPurchaseEmailMessage("");
    setPurchaseEmailStatus("");
    setPurchaseSmsMessage("");
    setPurchaseSmsStatus("");
    setResponse(null);
    setAfterSaleMessage("");
    setAfterSaleStatus("");

    if (!form.birthYear || !form.birthMonth) {
      setError("Te rugam sa alegi luna si anul nasterii.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPensionCalculator(buildCurrentCalculatorPayload());
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
        birthYearMonth: "1966-05",
        gender: "M",
        applicationDate: "2025-10",
        periods: {
          normalRoYears: 24,
          normalRoMonths: 0,
          foreignYears: 0,
          foreignMonths: 0,
          deosebiteYears: 0,
          deosebiteMonths: 0,
          specialeYears: 11,
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

  async function handleSendPurchaseEmail() {
    const recipientEmail = form.email.trim();

    if (!recipientEmail) {
      setPurchaseEmailStatus("error");
      setPurchaseEmailMessage("Fail: completeaza emailul.");
      return;
    }

    if (!isValidEmail(recipientEmail)) {
      setPurchaseEmailStatus("error");
      setPurchaseEmailMessage("Fail: email invalid.");
      return;
    }

    setSendingPurchaseEmail(true);
    setPurchaseEmailMessage("");
    setPurchaseEmailStatus("");
    setError("");

    try {
      const fullName = form.fullName.trim();
      const emailResult = await sendPublicManualCrmEmail({
        email: recipientEmail,
        firstName: fullName,
        emailtemplate: PURCHASE_EMAIL_TEMPLATE,
        templateKey: PURCHASE_EMAIL_TEMPLATE,
        campaign: PURCHASE_EMAIL_TEMPLATE,
        param1: fullName,
        param2: form.phone.trim(),
        param3: CANONICAL,
        param4: "",
        pageUrl: CANONICAL,
        agent: PUBLIC_PURCHASE_AGENT,
      });
      assertSuccessfulAction(emailResult, "emailul de cumparare nu a putut fi trimis.");
      setPurchaseEmailStatus("success");
      setPurchaseEmailMessage(formatActionSuccess(emailResult, "email cumparare trimis."));
    } catch (purchaseError) {
      setPurchaseEmailStatus("error");
      setPurchaseEmailMessage(
        `Fail: ${
          purchaseError instanceof Error
            ? purchaseError.message
            : "emailul de cumparare nu a putut fi trimis."
        }`,
      );
    } finally {
      setSendingPurchaseEmail(false);
    }
  }

  async function handlePurchaseSms() {
    const recipientPhone = form.phone.trim();

    if (!recipientPhone) {
      setPurchaseSmsStatus("error");
      setPurchaseSmsMessage("Fail: completeaza telefonul.");
      return;
    }

    setSendingPurchaseSms(true);
    setPurchaseSmsMessage("");
    setPurchaseSmsStatus("");
    setError("");

    try {
      const smsResult = await sendPublicManualCrmSms({
        phone: recipientPhone,
        template: PURCHASE_SMS_TEMPLATE,
        templateKey: PURCHASE_SMS_TEMPLATE,
        pageUrl: CANONICAL,
        agent: PUBLIC_PURCHASE_AGENT,
      });
      assertSuccessfulAction(smsResult, "SMS-ul de cumparare nu a putut fi trimis.");
      setPurchaseSmsStatus("success");
      setPurchaseSmsMessage(formatActionSuccess(smsResult, "SMS cumparare trimis."));
    } catch (smsError) {
      setPurchaseSmsStatus("error");
      setPurchaseSmsMessage(
        `Fail: ${
          smsError instanceof Error
            ? smsError.message
            : "SMS-ul de cumparare nu a putut fi trimis."
        }`,
      );
    } finally {
      setSendingPurchaseSms(false);
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
        <meta name="robots" content="noindex,nofollow" />
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
                    label="Armata - termen normal"
                    years={form.armyNormalYears}
                    months={form.armyNormalMonths}
                    onYears={(value) => update("armyNormalYears", value)}
                    onMonths={(value) => update("armyNormalMonths", value)}
                  />
                  <PeriodRow
                    label="Armata - termen redus"
                    years={form.armyReducedYears}
                    months={form.armyReducedMonths}
                    onYears={(value) => update("armyReducedYears", value)}
                    onMonths={(value) => update("armyReducedMonths", value)}
                  />
                  <PeriodRow
                    label="Somaj platit"
                    years={form.paidUnemploymentYears}
                    months={form.paidUnemploymentMonths}
                    onYears={(value) => update("paidUnemploymentYears", value)}
                    onMonths={(value) => update("paidUnemploymentMonths", value)}
                  />
                  <PeriodRow
                    label="Concediu de maternitate"
                    years={form.maternityLeaveYears}
                    months={form.maternityLeaveMonths}
                    onYears={(value) => update("maternityLeaveYears", value)}
                    onMonths={(value) => update("maternityLeaveMonths", value)}
                  />
                  <PeriodRow
                    label="Facultate fara suprapunere cu ani lucrati"
                    years={form.universityYears}
                    months={form.universityMonths}
                    onYears={(value) => update("universityYears", value)}
                    onMonths={(value) => update("universityMonths", value)}
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

              <fieldset>
                <legend className="mb-3 text-base font-bold">Situatii speciale pentru vechime</legend>
                <div className="grid gap-3">
                  {SPECIAL_SITUATION_OPTIONS.map((option) => (
                    <PeriodRow
                      key={option.key}
                      label={option.label}
                      years={form.specialSituations[option.key].years}
                      months={form.specialSituations[option.key].months}
                      onYears={(value) => updateSpecialSituation(option.key, "years", value)}
                      onMonths={(value) => updateSpecialSituation(option.key, "months", value)}
                    />
                  ))}
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
                <TextInput label="Copii crescuti" type="number" min="0" value={form.childrenRaised} onChange={(value) => update("childrenRaised", value)} />
              </fieldset>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={sendingSimulationEmail}
                    onClick={handleSendSimulationEmail}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-emerald-700 bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {sendingSimulationEmail ? "Trimit..." : "Email Simulare"}
                  </button>
                  <button
                    type="button"
                    disabled={sendingPurchaseEmail}
                    onClick={handleSendPurchaseEmail}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white"
                  >
                    {sendingPurchaseEmail ? "Trimit..." : "Email cumparare"}
                  </button>
                  <button
                    type="button"
                    disabled={sendingPurchaseSms}
                    onClick={handlePurchaseSms}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {sendingPurchaseSms ? "Trimit..." : "SMS Cumparare"}
                  </button>
                  <button type="button" disabled={sendingAfterSaleEmail} onClick={handleSendAfterSaleEmail}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                    {sendingAfterSaleEmail ? "Trimit..." : "Trimite Detalii După Vânzare"}
                  </button>
                </div>
                {afterSaleMessage ? <div aria-live="polite"><ActionMessage status={afterSaleStatus}>{afterSaleMessage}</ActionMessage></div> : null}
                {simulationEmailMessage || purchaseEmailMessage || purchaseSmsMessage ? (
                  <div aria-live="polite" className="space-y-1">
                    {simulationEmailMessage ? (
                      <ActionMessage status={simulationEmailStatus}>
                        {simulationEmailMessage}
                      </ActionMessage>
                    ) : null}
                    {purchaseEmailMessage ? (
                      <ActionMessage status={purchaseEmailStatus}>
                        {purchaseEmailMessage}
                      </ActionMessage>
                    ) : null}
                    {purchaseSmsMessage ? (
                      <ActionMessage status={purchaseSmsStatus}>
                        {purchaseSmsMessage}
                      </ActionMessage>
                    ) : null}
                  </div>
                ) : null}
              </div>

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
                <li>armata, somaj platit, concediu de maternitate si facultate fara suprapunere</li>
                <li>situatii speciale introduse cu ani si luni pentru calcul</li>
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

  function updateSpecialSituation(
    key: SpecialSituationKey,
    field: keyof PeriodInputState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      specialSituations: {
        ...current.specialSituations,
        [key]: {
          ...current.specialSituations[key],
          [field]: value,
        },
      },
    }));
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

function ActionMessage({
  children,
  status,
}: {
  children: string;
  status: ActionStatus;
}) {
  return (
    <p
      className={`text-xs font-bold ${
        status === "success" ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {children}
    </p>
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function assertSuccessfulAction(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    throw new Error(fallback);
  }

  if (!("success" in payload) || payload.success !== true) {
    throw new Error(readActionMessage(payload) || fallback);
  }
}

function formatActionSuccess(payload: unknown, fallback: string) {
  return `Success: ${readActionMessage(payload) || fallback}`;
}

function readActionMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "";
  }

  return typeof payload.message === "string" ? payload.message.trim() : "";
}

function asNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function createInitialSpecialSituations(): SpecialSituationsState {
  return SPECIAL_SITUATION_OPTIONS.reduce((state, option) => {
    state[option.key] = { years: "", months: "" };
    return state;
  }, {} as SpecialSituationsState);
}

function buildAdditionalPeriodFields(form: FormState) {
  const fields: Record<string, number> = {};

  addPeriodFields(fields, "armyNormal", form.armyNormalYears, form.armyNormalMonths);
  addPeriodFields(fields, "armyReduced", form.armyReducedYears, form.armyReducedMonths);
  addPeriodFields(
    fields,
    "paidUnemployment",
    form.paidUnemploymentYears,
    form.paidUnemploymentMonths,
  );
  addPeriodFields(
    fields,
    "maternityLeave",
    form.maternityLeaveYears,
    form.maternityLeaveMonths,
  );
  addPeriodFields(fields, "university", form.universityYears, form.universityMonths);
  SPECIAL_SITUATION_OPTIONS.forEach((option) => {
    const period = form.specialSituations[option.key];
    addPeriodFields(fields, option.key, period.years, period.months);
  });

  return fields;
}

function addPeriodFields(
  fields: Record<string, number>,
  prefix: string,
  yearsValue: string,
  monthsValue: string,
) {
  const years = asNumber(yearsValue);
  const months = asNumber(monthsValue);

  if (years === 0 && months === 0) {
    return;
  }

  fields[`${prefix}Years`] = years;
  fields[`${prefix}Months`] = months;
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
