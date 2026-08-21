import { useAuth } from "@/context/AuthContext";
import { getStoredSession, isInvalidOrExpiredTokenError } from "@/lib/auth";
import { sendManualCrmEmail, sendManualCrmSms } from "@/lib/crmAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
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
type SpecialSituationKey =
  | "removedFromServicePoliticalRacialPre1945"
  | "recognizedAntifascistRevolutionaryActivity"
  | "illegalSuspensionOrDismissalAnnulled"
  | "professionalOrPoliticalTrainingWhileEmployed"
  | "wifeFollowingHusbandPermanentMissionAbroad"
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
    key: "removedFromServicePoliticalRacialPre1945",
    label:
      "Perioada in care a fost indepartata din serviciu pentru activitate politica revolutionara, antifascista sau democratica, inainte de 23 August 1944, ori ca urmare a persecutiilor rasiale sau nationale, in perioada ianuarie 1938 - decembrie 1945",
  },
  {
    key: "recognizedAntifascistRevolutionaryActivity",
    label:
      "Perioada in care a desfasurat o activitate revolutionara antifascista, recunoscuta de organele in drept ca vechime in munca",
  },
  {
    key: "illegalSuspensionOrDismissalAnnulled",
    label:
      "Perioada in care a fost suspendata din functie ori i s-a desfacut contractul de munca, daca aceste masuri au fost anulate ulterior ca fiind ilegale",
  },
  {
    key: "professionalOrPoliticalTrainingWhileEmployed",
    label:
      "Perioada in care o persoana incadrata in munca urmeaza cursuri de pregatire profesionala sau politica",
  },
  {
    key: "wifeFollowingHusbandPermanentMissionAbroad",
    label:
      "Timpul cat sotia salariata lipseste din tara pentru a-si urma sotul trimis in misiune permanenta in strainatate",
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
const ADDITIONAL_BREAKDOWN_LABELS: Record<string, string> = {
  armyNormal: "Armata - termen normal",
  armyReduced: "Armata - termen redus",
  paidUnemployment: "Somaj platit",
  maternityLeave: "Concediu de maternitate",
  university: "Facultate fara suprapunere",
};
SPECIAL_SITUATION_OPTIONS.forEach((option) => {
  ADDITIONAL_BREAKDOWN_LABELS[option.key] = option.label;
});
type ActionStatus = "success" | "error" | "";
const PURCHASE_EMAIL_TEMPLATE = "ro-pension-calculator-email-cumparare";
const PURCHASE_SMS_TEXT = `Felicitari pentru ca doriti sa vedeti exact cand iesiti la pensie in Romania si in alte tari in care ati mai muncit. 

Aveti aici link-ul pentru serviciul nostru: https://www.proveitweb.co.uk/saleconsultation

Costul serviciului este de £50 astazi. Daca va puteti pensiona in urmatorii 2 ani, mai platiti £47 sub forma a doua rate, una luna urmatoare si una cealalta luna. Ratele sunt in valoare de £23.5 (prin urmare inca £47 in total). Dupa cum va spuneam, daca nu va puteti pensiona in urmatorii 2 ani nu mai aveti nimic de plata. 

Serviciul nostru costa in:
1 - Simulare pe cazul dvs. sa vedeti exact cand iesiti la pensie in Romania, si cand iesiti in fiecare din tarile in care ati mai muncit. 
2 - Va raspundem la orice intrebare in cadrul simularii.
3 - Va facem o programare cu dl. Adrian Defta pentru a va clarifica orice alte intrebari ati avea. 

Mai mult, in urmatoarele 30 de zile puteti intreba orice.`;

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
  const router = useRouter();
  const { status: authStatus, token, isCrm, user, logout, refreshSession } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<PensionCalculatorResponse | null>(null);
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

  useEffect(() => {
    if (authStatus !== "anonymous" || !router.isReady) {
      return;
    }

    const next = encodeURIComponent(
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : PAGE_PATH,
    );
    router.replace(`/login?next=${next}`);
  }, [authStatus, router]);

  async function handleLogout() {
    await logout();
    await router.push("/login");
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

    if (!form.birthYear || !form.birthMonth) {
      setError("Te rugam sa alegi luna si anul nasterii.");
      return;
    }

    setSubmitting(true);
    try {
      const foreignPeriods = buildForeignPeriods(form);
      const foreignTotalMonths = foreignPeriods.reduce((total, period) => total + (period.monthsTotal || 0), 0);
      const additionalPeriods = buildAdditionalPeriodFields(form);
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
    if (!token) {
      setPurchaseEmailStatus("error");
      setPurchaseEmailMessage("Fail: autentificare necesara.");
      return;
    }

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
      const emailResult = await runWithPurchaseAuthRetry((accessToken) =>
        sendManualCrmEmail(accessToken, {
          email: recipientEmail,
          firstName: form.fullName.trim(),
          emailtemplate: PURCHASE_EMAIL_TEMPLATE,
          campaign: PURCHASE_EMAIL_TEMPLATE,
          param1: form.fullName.trim(),
          param2: form.phone.trim(),
          param3: typeof window !== "undefined" ? window.location.href : CANONICAL,
          param4: typeof document !== "undefined" ? document.referrer : "",
          agent: user?.name || user?.email || "ro-pension-calculator",
        }),
      );
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
    if (!token) {
      setPurchaseSmsStatus("error");
      setPurchaseSmsMessage("Fail: autentificare necesara.");
      return;
    }

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
      const smsResult = await runWithPurchaseAuthRetry((accessToken) =>
        sendManualCrmSms(accessToken, {
          phone: recipientPhone,
          message: PURCHASE_SMS_TEXT,
          agent: user?.name || user?.email || "ro-pension-calculator",
        }),
      );
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

  async function runWithPurchaseAuthRetry<T>(request: (accessToken: string) => Promise<T>) {
    if (!token) {
      throw new Error("autentificare necesara.");
    }

    try {
      return await request(token);
    } catch (error) {
      if (!isInvalidOrExpiredTokenError(error)) {
        throw error;
      }

      const refreshed = await refreshSession();
      const refreshedToken = getStoredSession().token;

      if (!refreshed || !refreshedToken) {
        await router.push(`/login?next=${encodeURIComponent(PAGE_PATH)}`);
        throw new Error("Sesiunea a expirat. Te rugam sa te autentifici din nou.");
      }

      return request(refreshedToken);
    }
  }

  if (authStatus === "loading" || authStatus === "anonymous") {
    return (
      <AuthGateShell
        title="Verificam accesul"
        message="Calculatorul de simulare pensie este disponibil dupa autentificare."
        actionHref={`/login?next=${encodeURIComponent(PAGE_PATH)}`}
      />
    );
  }

  if (!isCrm || !token) {
    return (
      <AuthGateShell
        title="Acces CRM necesar"
        message="Contul autentificat nu are acces CRM pentru aceasta pagina."
        actionLabel="Inapoi la administrare"
        actionHref="/admin"
      />
    );
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
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
            >
              Sign out
            </button>
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
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
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
                </div>
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

function AuthGateShell({
  actionHref = "/login",
  actionLabel = "Autentificare",
  message,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  title: string;
}) {
  return (
    <>
      <Head>
        <title>{title} | JustProveIt</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/ro" className="text-lg font-extrabold">
            Just<span className="text-emerald-700">ProveIt</span>
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">{message}</p>
          <Link
            href={actionHref}
            className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          >
            {actionLabel}
          </Link>
        </section>
      </main>
    </>
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

          {result.stagiu.additionalBreakdown &&
          Object.keys(result.stagiu.additionalBreakdown).length > 0 ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-bold text-slate-800">Perioade suplimentare incluse</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {Object.entries(result.stagiu.additionalBreakdown).map(([key, period]) => (
                  <Metric
                    key={key}
                    label={`${formatAdditionalBreakdownLabel(key, period.label)} (${formatBreakdownClassification(period.classification)})`}
                    value={formatAge(period)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <h3 className="text-sm font-bold text-amber-900">Atentionari</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

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

function formatAdditionalBreakdownLabel(key: string, backendLabel?: string) {
  return backendLabel || ADDITIONAL_BREAKDOWN_LABELS[key] || key;
}

function formatBreakdownClassification(classification?: string) {
  switch (classification) {
    case "contributiv":
      return "contributiv";
    case "asimilat":
      return "asimilat";
    case "excluded":
      return "exclus";
    default:
      return classification || "inclus";
  }
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
