import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  evaluateQuickReport,
  getQuickReportCompletion,
  getQuickReportFlagCounts,
  submitQuickReportFaza0,
  type QuickReportAnswers,
  type QuickReportDisplayFlag,
  type QuickReportEmailScope,
  type QuickReportFaza1Answers,
  type QuickReportFlag,
  type QuickReportResult,
  type YesNo,
} from "@/lib/quickReport";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/raport-gratuit";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const STANDARD_TAX_CODE = "1257L";

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

type Faza1FormAnswers = {
  marriedOrCivilPartner: YesNo;
  lowerPartnerAnnualIncome: string;
  higherPartnerBasicRateTaxpayer: YesNo;
  worksOvertimeOrVariableHours: YesNo;
  holidayPayChecked: YesNo;
  redundancyInLast3Years: YesNo;
  ageAtDismissal: string;
  yearsService: string;
  weeklyPay: string;
  redundancyAmountReceived: string;
  selfAssessmentIncome: YesNo;
  declaredUsualExpenses: YesNo;
  hasStudentLoan: YesNo;
  studentLoanPlan: string;
  annualIncome: string;
  repaymentsTaken: YesNo;
  hasRomanianIncomeWhileUkResident: YesNo;
  checkedStatePensionForecast: YesNo;
  knownContributionGaps: YesNo;
  ukEmployersCount: string;
  checkedAllWorkplacePensions: YesNo;
  workedInRomania: YesNo;
  hadCarFinance2007To2024: YesNo;
  hadGapInsuranceOrAddOns: YesNo;
  hadPaydayLoans: YesNo;
  paysMonthlyCurrentAccountFee: YesNo;
  usesIncludedBenefits: YesNo;
  usesOverdraftRegularly: YesNo;
  overdraftApr: string;
  checkedCouncilTaxBand: YesNo;
  hasActiveSubscriptionsList: YesNo;
  receivesLowIncomeBenefit: YesNo;
  hasSocialTariff: YesNo;
  hasMortgage: YesNo;
  fixedRateEndsInMonths: string;
  hasOldBankAccounts: YesNo;
  hasRomanianInheritanceOrProperty: YesNo;
};

const initialFaza1Answers: Faza1FormAnswers = {
  marriedOrCivilPartner: "",
  lowerPartnerAnnualIncome: "",
  higherPartnerBasicRateTaxpayer: "",
  worksOvertimeOrVariableHours: "",
  holidayPayChecked: "",
  redundancyInLast3Years: "",
  ageAtDismissal: "",
  yearsService: "",
  weeklyPay: "",
  redundancyAmountReceived: "",
  selfAssessmentIncome: "",
  declaredUsualExpenses: "",
  hasStudentLoan: "",
  studentLoanPlan: "",
  annualIncome: "",
  repaymentsTaken: "",
  hasRomanianIncomeWhileUkResident: "",
  checkedStatePensionForecast: "",
  knownContributionGaps: "",
  ukEmployersCount: "",
  checkedAllWorkplacePensions: "",
  workedInRomania: "",
  hadCarFinance2007To2024: "",
  hadGapInsuranceOrAddOns: "",
  hadPaydayLoans: "",
  paysMonthlyCurrentAccountFee: "",
  usesIncludedBenefits: "",
  usesOverdraftRegularly: "",
  overdraftApr: "",
  checkedCouncilTaxBand: "",
  hasActiveSubscriptionsList: "",
  receivesLowIncomeBenefit: "",
  hasSocialTariff: "",
  hasMortgage: "",
  fixedRateEndsInMonths: "",
  hasOldBankAccounts: "",
  hasRomanianInheritanceOrProperty: "",
};

type ContactForm = {
  fullName: string;
  email: string;
  phone: string;
  consentVerbal: boolean;
};

type ReportPhase = "faza0" | "faza1";

type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
};

type Faza1PreviewResult = {
  code: string;
  title: string;
  flag: QuickReportDisplayFlag;
  output: string;
  specialistFollowUp?: boolean;
};

const initialContact: ContactForm = {
  fullName: "",
  email: "",
  phone: "",
  consentVerbal: false,
};

export default function FreeQuickReportPage() {
  const router = useRouter();
  const { status: authStatus, token, isCrm, logout } = useAuth();
  const [contact, setContact] = useState<ContactForm>(initialContact);
  const [answers, setAnswers] = useState<QuickReportAnswers>(initialAnswers);
  const [faza1Answers, setFaza1Answers] = useState<Faza1FormAnswers>(initialFaza1Answers);
  const [sendingPhase, setSendingPhase] = useState<ReportPhase | "">("");
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [messagePhase, setMessagePhase] = useState<ReportPhase | "">("");
  const [message, setMessage] = useState("");
  const sending = sendingPhase !== "";
  const results = useMemo(() => evaluateQuickReport(answers), [answers]);
  const completion = useMemo(() => getQuickReportCompletion(results), [results]);
  const faza1Results = useMemo(() => buildFaza1PreviewResults(faza1Answers), [faza1Answers]);
  const faza1Completion = useMemo(() => getFaza1Completion(faza1Results), [faza1Results]);
  const totalCompletion = {
    completed: completion.completed + faza1Completion.completed,
    total: completion.total + faza1Completion.total,
    complete: completion.complete && faza1Completion.complete,
  };
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

  async function handleSendFaza1Report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendReport("faza1");
  }

  async function handleSendFaza0Report() {
    await sendReport("faza0");
  }

  async function sendReport(phase: ReportPhase) {
    setStatus("");
    setMessagePhase(phase);
    setMessage("");

    const contactDetails = validateContactAndAccess();
    if (!contactDetails) {
      return;
    }

    if (!completion.complete) {
      setStatus("error");
      setMessage("Completeaza toate verificarile Faza 0 inainte de trimitere.");
      return;
    }

    if (phase === "faza1" && !faza1Completion.complete) {
      setStatus("error");
      setMessage("Completeaza toate verificarile Faza 1 inainte de trimitere.");
      return;
    }

    await submitReport(phase, contactDetails);
  }

  function validateContactAndAccess(): ContactDetails | null {
    const fullName = contact.fullName.trim();
    const email = contact.email.trim();
    const phone = contact.phone.trim();

    if (!fullName || !email || !phone) {
      setStatus("error");
      setMessage("Completeaza numele, emailul si telefonul clientului.");
      return null;
    }

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Completeaza o adresa de email valida.");
      return null;
    }

    if (!contact.consentVerbal) {
      setStatus("error");
      setMessage("Bifeaza consimtamantul verbal inainte de trimiterea raportului.");
      return null;
    }

    if (!token || !isCrm) {
      setStatus("error");
      setMessage("Autentificare CRM necesara pentru trimiterea raportului.");
      return null;
    }

    return { fullName, email, phone };
  }

  async function submitReport(phase: ReportPhase, contactDetails: ContactDetails) {
    if (!token) {
      setStatus("error");
      setMessage("Autentificare CRM necesara pentru trimiterea raportului.");
      return;
    }

    const completedResults = results.filter(
      (result): result is QuickReportResult & { flag: QuickReportFlag } => result.flag !== "necompletat",
    );
    const browserLocation = getBrowserLocation();

    setSendingPhase(phase);
    try {
      const response = await submitQuickReportFaza0(token, {
        tenantKey: "justproveit",
        source: "raport_gratuit_faza0",
        fullName: contactDetails.fullName,
        email: contactDetails.email,
        phone: contactDetails.phone,
        consentVerbalAt: new Date().toISOString(),
        standardTaxCode: STANDARD_TAX_CODE,
        domain: browserLocation.domain,
        pageUrl: browserLocation.pageUrl,
        referrer: browserLocation.referrer,
        answers: {
          existingFaza0Answers: answers,
        },
        results: completedResults,
        emailScope: getEmailScope(phase),
        ...(phase === "faza1"
          ? {
              faza1Answers: buildFaza1AnswersPayload(faza1Answers),
            }
          : {}),
      });
      setStatus("success");
      if (response.emailSent === false) {
        setMessage(
          response.emailError
            ? `${formatReportPhase(phase)} a fost salvat, dar emailul nu a fost trimis: ${response.emailError}`
            : `${formatReportPhase(phase)} a fost salvat, dar emailul nu a fost trimis.`,
        );
      } else {
        setMessage(response.message || `${formatReportPhase(phase)} a fost trimis pe email.`);
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Raportul nu a putut fi trimis.");
    } finally {
      setSendingPhase("");
    }
  }

  function updateContact<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setContact((current) => ({ ...current, [key]: value }));
  }

  function updateAnswer<K extends keyof QuickReportAnswers>(key: K, value: QuickReportAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function updateFaza1Answer<K extends keyof Faza1FormAnswers>(key: K, value: Faza1FormAnswers[K]) {
    setFaza1Answers((current) => ({ ...current, [key]: value }));
  }

  if (authStatus === "loading" || authStatus === "anonymous") {
    return (
      <AuthGateShell
        title="Verificam accesul"
        message="Raportul gratuit este disponibil dupa autentificare."
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
        <title>Raport gratuit financiar UK | JustProveIt</title>
        <meta
          name="description"
          content="Raport gratuit cu verificari rapide pentru romanii din UK: fiscalitate, credit, pensii, datorii, facturi si active."
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
            <Link href="/ro/calculator-varsta-pensionare" className="text-sm font-semibold text-emerald-700 hover:underline">
              Calculator pensie
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

        <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]">
          <form onSubmit={handleSendFaza1Report} className="space-y-6 rounded-lg border border-slate-200 bg-slate-100/80 p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold tracking-wide text-emerald-700">
                Raport gratuit
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-normal md:text-4xl">
                Verificari rapide pentru bani pierduti in UK
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
              <legend className="mb-2 text-base font-bold">Faza 0 - verificari rapide</legend>

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

              <CheckFields title="CD01 - Credit score / raport de credit">
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

            <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={handleSendFaza0Report}
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
              >
                {sendingPhase === "faza0" ? "Trimit raport faza zero..." : "Trimite raport faza zero"}
              </button>
              {message && messagePhase === "faza0" ? (
                <StatusMessage status={status} message={message} />
              ) : null}
            </div>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-base font-bold">Faza 1 - verificari extinse</legend>

              <CheckFields title="MF02 - Marriage Allowance">
                <SelectInput
                  label="Clientul este casatorit sau in civil partnership?"
                  value={faza1Answers.marriedOrCivilPartner}
                  onChange={(value) => updateFaza1Answer("marriedOrCivilPartner", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.marriedOrCivilPartner === "yes" ? (
                  <>
                    <NumberInput
                      label="Venitul anual al partenerului cu venit mai mic"
                      value={faza1Answers.lowerPartnerAnnualIncome}
                      onChange={(value) => updateFaza1Answer("lowerPartnerAnnualIncome", value)}
                      min={0}
                      step="1"
                    />
                    <SelectInput
                      label="Partenerul cu venit mai mare plateste basic rate tax?"
                      value={faza1Answers.higherPartnerBasicRateTaxpayer}
                      onChange={(value) => updateFaza1Answer("higherPartnerBasicRateTaxpayer", value as YesNo)}
                      options={yesNoOptions}
                    />
                  </>
                ) : null}
              </CheckFields>

              <CheckFields title="MF03 - Overtime / holiday pay">
                <SelectInput
                  label="Lucreaza overtime sau ore variabile?"
                  value={faza1Answers.worksOvertimeOrVariableHours}
                  onChange={(value) => updateFaza1Answer("worksOvertimeOrVariableHours", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.worksOvertimeOrVariableHours === "yes" ? (
                  <SelectInput
                    label="A verificat daca holiday pay include overtime/ore variabile?"
                    value={faza1Answers.holidayPayChecked}
                    onChange={(value) => updateFaza1Answer("holidayPayChecked", value as YesNo)}
                    options={yesNoOptions}
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="MF04 - Redundancy pay">
                <SelectInput
                  label="A avut redundancy in ultimii 3 ani?"
                  value={faza1Answers.redundancyInLast3Years}
                  onChange={(value) => updateFaza1Answer("redundancyInLast3Years", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.redundancyInLast3Years === "yes" ? (
                  <>
                    <NumberInput
                      label="Varsta la concediere"
                      value={faza1Answers.ageAtDismissal}
                      onChange={(value) => updateFaza1Answer("ageAtDismissal", value)}
                      min={16}
                      step="1"
                    />
                    <NumberInput
                      label="Ani vechime la angajator"
                      value={faza1Answers.yearsService}
                      onChange={(value) => updateFaza1Answer("yearsService", value)}
                      min={0}
                      step="1"
                    />
                    <NumberInput
                      label="Salariu saptamanal brut"
                      value={faza1Answers.weeklyPay}
                      onChange={(value) => updateFaza1Answer("weeklyPay", value)}
                      min={0}
                      step="1"
                    />
                    <NumberInput
                      label="Suma primita la redundancy"
                      value={faza1Answers.redundancyAmountReceived}
                      onChange={(value) => updateFaza1Answer("redundancyAmountReceived", value)}
                      min={0}
                      step="1"
                    />
                  </>
                ) : null}
              </CheckFields>

              <CheckFields title="MF05 - Self-assessment expenses">
                <SelectInput
                  label="Are venit declarat prin self assessment?"
                  value={faza1Answers.selfAssessmentIncome}
                  onChange={(value) => updateFaza1Answer("selfAssessmentIncome", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.selfAssessmentIncome === "yes" ? (
                  <SelectInput
                    label="Declara cheltuielile uzuale deductibile?"
                    value={faza1Answers.declaredUsualExpenses}
                    onChange={(value) => updateFaza1Answer("declaredUsualExpenses", value as YesNo)}
                    options={yesNoOptions}
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="MF06 - Student loan overpayment">
                <SelectInput
                  label="Are student loan?"
                  value={faza1Answers.hasStudentLoan}
                  onChange={(value) => updateFaza1Answer("hasStudentLoan", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.hasStudentLoan === "yes" ? (
                  <>
                    <SelectInput
                      label="Plan student loan"
                      value={faza1Answers.studentLoanPlan}
                      onChange={(value) => updateFaza1Answer("studentLoanPlan", value)}
                      options={[
                        { value: "Plan 1", label: "Plan 1" },
                        { value: "Plan 2", label: "Plan 2" },
                        { value: "Plan 4", label: "Plan 4" },
                        { value: "Postgraduate Loan", label: "Postgraduate Loan" },
                        { value: "Unknown", label: "Nu stie" },
                      ]}
                    />
                    <NumberInput
                      label="Venit anual"
                      value={faza1Answers.annualIncome}
                      onChange={(value) => updateFaza1Answer("annualIncome", value)}
                      min={0}
                      step="1"
                    />
                    <SelectInput
                      label="I s-au luat rambursari din salariu?"
                      value={faza1Answers.repaymentsTaken}
                      onChange={(value) => updateFaza1Answer("repaymentsTaken", value as YesNo)}
                      options={yesNoOptions}
                    />
                  </>
                ) : null}
              </CheckFields>

              <CheckFields title="MF07 - Dubla impozitare RO-UK">
                <SelectInput
                  label="A avut venit din Romania cat timp era rezident fiscal in UK?"
                  value={faza1Answers.hasRomanianIncomeWhileUkResident}
                  onChange={(value) => updateFaza1Answer("hasRomanianIncomeWhileUkResident", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="PE01 - NI record / State Pension forecast">
                <SelectInput
                  label="A verificat State Pension forecast?"
                  value={faza1Answers.checkedStatePensionForecast}
                  onChange={(value) => updateFaza1Answer("checkedStatePensionForecast", value as YesNo)}
                  options={yesNoOptions}
                />
                <SelectInput
                  label="Stie ca are gaps in NI contributions?"
                  value={faza1Answers.knownContributionGaps}
                  onChange={(value) => updateFaza1Answer("knownContributionGaps", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="PE02 - Pensii ocupationale uitate">
                <NumberInput
                  label="Cati angajatori a avut in UK?"
                  value={faza1Answers.ukEmployersCount}
                  onChange={(value) => updateFaza1Answer("ukEmployersCount", value)}
                  min={0}
                  step="1"
                />
                <SelectInput
                  label="A verificat toate workplace pensions de la angajatori?"
                  value={faza1Answers.checkedAllWorkplacePensions}
                  onChange={(value) => updateFaza1Answer("checkedAllWorkplacePensions", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="PE03 - Pensia internationala RO-UK">
                <SelectInput
                  label="A lucrat in Romania?"
                  value={faza1Answers.workedInRomania}
                  onChange={(value) => updateFaza1Answer("workedInRomania", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD02 - Car finance mis-selling">
                <SelectInput
                  label="A avut car finance intre 2007 si 2024?"
                  value={faza1Answers.hadCarFinance2007To2024}
                  onChange={(value) => updateFaza1Answer("hadCarFinance2007To2024", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD03 - GAP insurance / add-ons">
                <SelectInput
                  label="A avut GAP insurance sau add-ons pe finance?"
                  value={faza1Answers.hadGapInsuranceOrAddOns}
                  onChange={(value) => updateFaza1Answer("hadGapInsuranceOrAddOns", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD04 - Payday loans">
                <SelectInput
                  label="A avut payday loans?"
                  value={faza1Answers.hadPaydayLoans}
                  onChange={(value) => updateFaza1Answer("hadPaydayLoans", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD05 - Packaged bank accounts">
                <SelectInput
                  label="Plateste taxa lunara pentru cont curent?"
                  value={faza1Answers.paysMonthlyCurrentAccountFee}
                  onChange={(value) => updateFaza1Answer("paysMonthlyCurrentAccountFee", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.paysMonthlyCurrentAccountFee === "yes" ? (
                  <SelectInput
                    label="Foloseste beneficiile incluse in cont?"
                    value={faza1Answers.usesIncludedBenefits}
                    onChange={(value) => updateFaza1Answer("usesIncludedBenefits", value as YesNo)}
                    options={yesNoOptions}
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="CD06 - Overdraft">
                <SelectInput
                  label="Foloseste overdraft regulat?"
                  value={faza1Answers.usesOverdraftRegularly}
                  onChange={(value) => updateFaza1Answer("usesOverdraftRegularly", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.usesOverdraftRegularly === "yes" ? (
                  <NumberInput
                    label="APR overdraft"
                    value={faza1Answers.overdraftApr}
                    onChange={(value) => updateFaza1Answer("overdraftApr", value)}
                    min={0}
                    step="0.1"
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="FC01 - Council Tax band">
                <SelectInput
                  label="A verificat Council Tax band?"
                  value={faza1Answers.checkedCouncilTaxBand}
                  onChange={(value) => updateFaza1Answer("checkedCouncilTaxBand", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="FC03 - Abonamente uitate">
                <SelectInput
                  label="Are o lista activa cu abonamentele lunare?"
                  value={faza1Answers.hasActiveSubscriptionsList}
                  onChange={(value) => updateFaza1Answer("hasActiveSubscriptionsList", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="FC04 - Tarife sociale apa/broadband">
                <SelectInput
                  label="Primeste un beneficiu de venit mic?"
                  value={faza1Answers.receivesLowIncomeBenefit}
                  onChange={(value) => updateFaza1Answer("receivesLowIncomeBenefit", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.receivesLowIncomeBenefit === "yes" ? (
                  <SelectInput
                    label="Are social tariff la apa sau broadband?"
                    value={faza1Answers.hasSocialTariff}
                    onChange={(value) => updateFaza1Answer("hasSocialTariff", value as YesNo)}
                    options={yesNoOptions}
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="FC06 - Remortgage check">
                <SelectInput
                  label="Are mortgage?"
                  value={faza1Answers.hasMortgage}
                  onChange={(value) => updateFaza1Answer("hasMortgage", value as YesNo)}
                  options={yesNoOptions}
                />
                {faza1Answers.hasMortgage === "yes" ? (
                  <NumberInput
                    label="In cate luni se termina fixed rate?"
                    value={faza1Answers.fixedRateEndsInMonths}
                    onChange={(value) => updateFaza1Answer("fixedRateEndsInMonths", value)}
                    min={0}
                    step="1"
                  />
                ) : null}
              </CheckFields>

              <CheckFields title="AA01 - Conturi uitate">
                <SelectInput
                  label="Are conturi bancare vechi sau nefolosite?"
                  value={faza1Answers.hasOldBankAccounts}
                  onChange={(value) => updateFaza1Answer("hasOldBankAccounts", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="AA02 - Mosteniri sau proprietati in Romania">
                <SelectInput
                  label="Are mostenire, teren sau proprietate in Romania?"
                  value={faza1Answers.hasRomanianInheritanceOrProperty}
                  onChange={(value) => updateFaza1Answer("hasRomanianInheritanceOrProperty", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>
            </fieldset>

            {message && messagePhase === "faza1" ? (
              <StatusMessage status={status} message={message} />
            ) : null}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
            >
              {sendingPhase === "faza1" ? "Trimit raport faza 1..." : "Trimite raport faza 1"}
            </button>
          </form>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Completare formular
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-normal">
                {totalCompletion.completed}/{totalCompletion.total} verificari completate
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Faza 0: {completion.completed}/{completion.total} | Faza 1: {faza1Completion.completed}/{faza1Completion.total}
              </p>
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">Rezultate Faza 0</h2>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  {completion.completed}/{completion.total}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {results.map((result) => (
                  <ResultItem key={result.code} result={result} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold">Rezultate Faza 1</h2>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                  {faza1Completion.completed}/{faza1Completion.total}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {faza1Results.map((result) => (
                  <Faza1ResultItem key={result.code} result={result} />
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

function StatusMessage({
  status,
  message,
}: {
  status: "success" | "error" | "";
  message: string;
}) {
  return (
    <p
      aria-live="polite"
      className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </p>
  );
}

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

function NumberInput({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
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

function Faza1ResultItem({ result }: { result: Faza1PreviewResult }) {
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
      {result.specialistFollowUp ? (
        <p className="mt-2 text-xs font-semibold text-amber-800">
          Poate necesita follow-up specialist daca se declanseaza.
        </p>
      ) : null}
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

function getEmailScope(phase: ReportPhase): QuickReportEmailScope {
  return phase;
}

function formatReportPhase(phase: ReportPhase) {
  return phase === "faza0" ? "Raportul Faza 0" : "Raportul Faza 1";
}

function buildFaza1PreviewResults(answers: Faza1FormAnswers): Faza1PreviewResult[] {
  return [
    evaluateMarriageAllowance(answers),
    evaluateHolidayPay(answers),
    evaluateRedundancyPay(answers),
    evaluateSelfAssessmentExpenses(answers),
    evaluateStudentLoan(answers),
    evaluateDoubleTaxation(answers),
    evaluateStatePensionForecast(answers),
    evaluateWorkplacePensions(answers),
    evaluateInternationalPension(answers),
    evaluateCarFinance(answers),
    evaluateGapInsurance(answers),
    evaluatePaydayLoans(answers),
    evaluatePackagedAccount(answers),
    evaluateOverdraft(answers),
    evaluateCouncilTaxBand(answers),
    evaluateSubscriptions(answers),
    evaluateSocialTariff(answers),
    evaluateRemortgage(answers),
    evaluateOldBankAccounts(answers),
    evaluateRomanianAssets(answers),
  ];
}

function getFaza1Completion(results: Faza1PreviewResult[]) {
  const completed = results.filter((result) => result.flag !== "necompletat").length;

  return {
    completed,
    total: results.length,
    complete: completed === results.length,
  };
}

function evaluateMarriageAllowance(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.marriedOrCivilPartner)) {
    return incompleteFaza1("MF02", "Marriage Allowance");
  }

  if (answers.marriedOrCivilPartner === "no") {
    return faza1Result("MF02", "Marriage Allowance", "verde", "Nu pare aplicabila Marriage Allowance.");
  }

  if (!hasNumberValue(answers.lowerPartnerAnnualIncome, 0) || !hasYesNo(answers.higherPartnerBasicRateTaxpayer)) {
    return incompleteFaza1("MF02", "Marriage Allowance");
  }

  if (Number(answers.lowerPartnerAnnualIncome) <= 12570 && answers.higherPartnerBasicRateTaxpayer === "yes") {
    return faza1Result(
      "MF02",
      "Marriage Allowance",
      "rosu",
      "Poate exista drept de transfer al unei parti din personal allowance catre partenerul cu venit mai mare.",
    );
  }

  return faza1Result("MF02", "Marriage Allowance", "verde", "Nu am identificat un semn rapid de eligibilitate.");
}

function evaluateHolidayPay(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.worksOvertimeOrVariableHours)) {
    return incompleteFaza1("MF03", "Overtime / holiday pay");
  }

  if (answers.worksOvertimeOrVariableHours === "no") {
    return faza1Result("MF03", "Overtime / holiday pay", "verde", "Nu pare sa existe risc rapid pe overtime holiday pay.");
  }

  if (!hasYesNo(answers.holidayPayChecked)) {
    return incompleteFaza1("MF03", "Overtime / holiday pay");
  }

  if (answers.holidayPayChecked === "no") {
    return faza1Result(
      "MF03",
      "Overtime / holiday pay",
      "rosu",
      "Merita verificat daca holiday pay a inclus overtime sau ore variabile.",
    );
  }

  return faza1Result("MF03", "Overtime / holiday pay", "verde", "Clientul spune ca holiday pay a fost verificat.");
}

function evaluateRedundancyPay(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.redundancyInLast3Years)) {
    return incompleteFaza1("MF04", "Redundancy pay");
  }

  if (answers.redundancyInLast3Years === "no") {
    return faza1Result("MF04", "Redundancy pay", "verde", "Nu pare aplicabila verificarea redundancy pay.");
  }

  if (
    !hasNumberValue(answers.ageAtDismissal, 16) ||
    !hasNumberValue(answers.yearsService, 0) ||
    !hasNumberValue(answers.weeklyPay, 0)
  ) {
    return incompleteFaza1("MF04", "Redundancy pay");
  }

  return faza1Result(
    "MF04",
    "Redundancy pay",
    "galben",
    "A existat redundancy. Backend-ul calculeaza suma statutorie estimata si compara cu suma primita.",
  );
}

function evaluateSelfAssessmentExpenses(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.selfAssessmentIncome)) {
    return incompleteFaza1("MF05", "Self-assessment expenses");
  }

  if (answers.selfAssessmentIncome === "no") {
    return faza1Result("MF05", "Self-assessment expenses", "verde", "Nu pare aplicabila verificarea self-assessment expenses.");
  }

  if (!hasYesNo(answers.declaredUsualExpenses)) {
    return incompleteFaza1("MF05", "Self-assessment expenses");
  }

  if (answers.declaredUsualExpenses === "no") {
    return faza1Result(
      "MF05",
      "Self-assessment expenses",
      "rosu",
      "Poate pierde bani daca nu declara cheltuielile deductibile uzuale.",
    );
  }

  return faza1Result("MF05", "Self-assessment expenses", "verde", "Cheltuielile uzuale par deja declarate.");
}

function evaluateStudentLoan(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.hasStudentLoan)) {
    return incompleteFaza1("MF06", "Student loan overpayment");
  }

  if (answers.hasStudentLoan === "no") {
    return faza1Result("MF06", "Student loan overpayment", "verde", "Nu pare aplicabila verificarea student loan.");
  }

  if (!answers.studentLoanPlan || !hasNumberValue(answers.annualIncome, 0) || !hasYesNo(answers.repaymentsTaken)) {
    return incompleteFaza1("MF06", "Student loan overpayment");
  }

  if (answers.repaymentsTaken === "yes") {
    return faza1Result(
      "MF06",
      "Student loan overpayment",
      "galben",
      "Exista student loan si rambursari luate. Backend-ul verifica planul, venitul si posibila supraplata.",
    );
  }

  return faza1Result("MF06", "Student loan overpayment", "verde", "Nu apare un semn rapid de supraplata.");
}

function evaluateDoubleTaxation(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.hasRomanianIncomeWhileUkResident)) {
    return incompleteFaza1("MF07", "Dubla impozitare RO-UK", true);
  }

  if (answers.hasRomanianIncomeWhileUkResident === "yes") {
    return faza1Result(
      "MF07",
      "Dubla impozitare RO-UK",
      "rosu",
      "A existat venit din Romania in perioada de rezidenta UK. Cazul trebuie verificat specialist.",
      true,
    );
  }

  return faza1Result("MF07", "Dubla impozitare RO-UK", "verde", "Nu apare risc rapid de dubla impozitare RO-UK.", true);
}

function evaluateStatePensionForecast(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.checkedStatePensionForecast) || !hasYesNo(answers.knownContributionGaps)) {
    return incompleteFaza1("PE01", "NI record / State Pension forecast");
  }

  if (answers.checkedStatePensionForecast === "no" || answers.knownContributionGaps === "yes") {
    return faza1Result(
      "PE01",
      "NI record / State Pension forecast",
      "rosu",
      "Merita verificat State Pension forecast si eventualele gaps in NI contributions.",
    );
  }

  return faza1Result("PE01", "NI record / State Pension forecast", "verde", "Forecast-ul si gaps par deja verificate.");
}

function evaluateWorkplacePensions(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasNumberValue(answers.ukEmployersCount, 0) || !hasYesNo(answers.checkedAllWorkplacePensions)) {
    return incompleteFaza1("PE02", "Pensii ocupationale uitate");
  }

  if (Number(answers.ukEmployersCount) > 1 && answers.checkedAllWorkplacePensions === "no") {
    return faza1Result(
      "PE02",
      "Pensii ocupationale uitate",
      "rosu",
      "A avut mai multi angajatori si nu a verificat toate workplace pensions.",
    );
  }

  return faza1Result("PE02", "Pensii ocupationale uitate", "verde", "Nu apare un semn rapid de pensii ocupationale uitate.");
}

function evaluateInternationalPension(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.workedInRomania)) {
    return incompleteFaza1("PE03", "Pensia internationala RO-UK", true);
  }

  if (answers.workedInRomania === "yes") {
    return faza1Result(
      "PE03",
      "Pensia internationala RO-UK",
      "rosu",
      "A lucrat in Romania. Poate necesita verificare specialist pentru pensia internationala RO-UK.",
      true,
    );
  }

  return faza1Result("PE03", "Pensia internationala RO-UK", "verde", "Nu pare aplicabila pensia internationala RO-UK.", true);
}

function evaluateCarFinance(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoTriggerResult(
    "CD02",
    "Car finance mis-selling",
    answers.hadCarFinance2007To2024,
    "A avut car finance intre 2007 si 2024. Poate exista oportunitate de verificare mis-selling.",
    "Nu pare aplicabila verificarea car finance mis-selling.",
  );
}

function evaluateGapInsurance(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoTriggerResult(
    "CD03",
    "GAP insurance / add-ons",
    answers.hadGapInsuranceOrAddOns,
    "A avut GAP insurance sau add-ons. Merita verificat daca au fost vandute corect.",
    "Nu pare aplicabila verificarea GAP insurance / add-ons.",
  );
}

function evaluatePaydayLoans(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoTriggerResult(
    "CD04",
    "Payday loans",
    answers.hadPaydayLoans,
    "A avut payday loans. Poate exista oportunitate de verificare affordability / mis-selling.",
    "Nu pare aplicabila verificarea payday loans.",
  );
}

function evaluatePackagedAccount(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.paysMonthlyCurrentAccountFee)) {
    return incompleteFaza1("CD05", "Packaged bank accounts");
  }

  if (answers.paysMonthlyCurrentAccountFee === "no") {
    return faza1Result("CD05", "Packaged bank accounts", "verde", "Nu plateste taxa lunara pentru cont curent.");
  }

  if (!hasYesNo(answers.usesIncludedBenefits)) {
    return incompleteFaza1("CD05", "Packaged bank accounts");
  }

  if (answers.usesIncludedBenefits === "no") {
    return faza1Result(
      "CD05",
      "Packaged bank accounts",
      "rosu",
      "Plateste taxa lunara dar nu foloseste beneficiile incluse. Merita verificat costul.",
    );
  }

  return faza1Result("CD05", "Packaged bank accounts", "verde", "Foloseste beneficiile incluse in cont.");
}

function evaluateOverdraft(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.usesOverdraftRegularly)) {
    return incompleteFaza1("CD06", "Overdraft");
  }

  if (answers.usesOverdraftRegularly === "no") {
    return faza1Result("CD06", "Overdraft", "verde", "Nu foloseste overdraft regulat.");
  }

  if (!hasNumberValue(answers.overdraftApr, 0)) {
    return incompleteFaza1("CD06", "Overdraft");
  }

  if (Number(answers.overdraftApr) >= 30) {
    return faza1Result("CD06", "Overdraft", "rosu", "Overdraft-ul folosit regulat are APR ridicat. Merita verificat.");
  }

  return faza1Result("CD06", "Overdraft", "galben", "Foloseste overdraft regulat. Merita comparate costurile.");
}

function evaluateCouncilTaxBand(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoInverseTriggerResult(
    "FC01",
    "Council Tax band",
    answers.checkedCouncilTaxBand,
    "Nu a verificat Council Tax band. Merita verificat daca banda este corecta.",
    "Council Tax band a fost verificat.",
  );
}

function evaluateSubscriptions(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoInverseTriggerResult(
    "FC03",
    "Abonamente uitate",
    answers.hasActiveSubscriptionsList,
    "Nu are o lista activa cu abonamentele lunare. Exista risc de plati uitate.",
    "Are o lista activa cu abonamentele lunare.",
  );
}

function evaluateSocialTariff(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.receivesLowIncomeBenefit)) {
    return incompleteFaza1("FC04", "Tarife sociale apa/broadband");
  }

  if (answers.receivesLowIncomeBenefit === "no") {
    return faza1Result("FC04", "Tarife sociale apa/broadband", "verde", "Nu pare aplicabil social tariff pe baza raspunsului.");
  }

  if (!hasYesNo(answers.hasSocialTariff)) {
    return incompleteFaza1("FC04", "Tarife sociale apa/broadband");
  }

  if (answers.hasSocialTariff === "no") {
    return faza1Result(
      "FC04",
      "Tarife sociale apa/broadband",
      "rosu",
      "Primeste beneficiu de venit mic, dar nu are social tariff. Merita verificat.",
    );
  }

  return faza1Result("FC04", "Tarife sociale apa/broadband", "verde", "Are deja social tariff.");
}

function evaluateRemortgage(answers: Faza1FormAnswers): Faza1PreviewResult {
  if (!hasYesNo(answers.hasMortgage)) {
    return incompleteFaza1("FC06", "Remortgage check");
  }

  if (answers.hasMortgage === "no") {
    return faza1Result("FC06", "Remortgage check", "verde", "Nu are mortgage.");
  }

  if (!hasNumberValue(answers.fixedRateEndsInMonths, 0)) {
    return incompleteFaza1("FC06", "Remortgage check");
  }

  if (Number(answers.fixedRateEndsInMonths) <= 6) {
    return faza1Result("FC06", "Remortgage check", "rosu", "Fixed rate se termina in urmatoarele 6 luni. Merita verificat din timp.");
  }

  return faza1Result("FC06", "Remortgage check", "verde", "Fixed rate nu pare sa se termine foarte curand.");
}

function evaluateOldBankAccounts(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoTriggerResult(
    "AA01",
    "Conturi uitate",
    answers.hasOldBankAccounts,
    "Are conturi vechi sau nefolosite. Merita verificat daca exista bani ramasi in conturi.",
    "Nu pare sa aiba conturi vechi/nefolosite.",
  );
}

function evaluateRomanianAssets(answers: Faza1FormAnswers): Faza1PreviewResult {
  return yesNoTriggerResult(
    "AA02",
    "Mosteniri sau proprietati in Romania",
    answers.hasRomanianInheritanceOrProperty,
    "Are mostenire, teren sau proprietate in Romania. Poate necesita verificare specialist.",
    "Nu pare aplicabila verificarea pentru active in Romania.",
    true,
  );
}

function yesNoTriggerResult(
  code: string,
  title: string,
  value: YesNo,
  redOutput: string,
  greenOutput: string,
  specialistFollowUp = false,
) {
  if (!hasYesNo(value)) {
    return incompleteFaza1(code, title, specialistFollowUp);
  }

  return value === "yes"
    ? faza1Result(code, title, "rosu", redOutput, specialistFollowUp)
    : faza1Result(code, title, "verde", greenOutput, specialistFollowUp);
}

function yesNoInverseTriggerResult(
  code: string,
  title: string,
  value: YesNo,
  redOutput: string,
  greenOutput: string,
) {
  if (!hasYesNo(value)) {
    return incompleteFaza1(code, title);
  }

  return value === "no"
    ? faza1Result(code, title, "rosu", redOutput)
    : faza1Result(code, title, "verde", greenOutput);
}

function faza1Result(
  code: string,
  title: string,
  flag: QuickReportFlag,
  output: string,
  specialistFollowUp = false,
): Faza1PreviewResult {
  return { code, title, flag, output, specialistFollowUp };
}

function incompleteFaza1(code: string, title: string, specialistFollowUp = false): Faza1PreviewResult {
  return {
    code,
    title,
    flag: "necompletat",
    output: "Completeaza raspunsurile pentru aceasta verificare.",
    specialistFollowUp,
  };
}

function buildFaza1AnswersPayload(answers: Faza1FormAnswers): QuickReportFaza1Answers {
  const payload: QuickReportFaza1Answers = {
    marriedOrCivilPartner: yesNoToBoolean(answers.marriedOrCivilPartner),
    worksOvertimeOrVariableHours: yesNoToBoolean(answers.worksOvertimeOrVariableHours),
    redundancyInLast3Years: yesNoToBoolean(answers.redundancyInLast3Years),
    selfAssessmentIncome: yesNoToBoolean(answers.selfAssessmentIncome),
    hasStudentLoan: yesNoToBoolean(answers.hasStudentLoan),
    hasRomanianIncomeWhileUkResident: yesNoToBoolean(answers.hasRomanianIncomeWhileUkResident),
    checkedStatePensionForecast: yesNoToBoolean(answers.checkedStatePensionForecast),
    knownContributionGaps: yesNoToBoolean(answers.knownContributionGaps),
    ukEmployersCount: numberOrUndefined(answers.ukEmployersCount),
    checkedAllWorkplacePensions: yesNoToBoolean(answers.checkedAllWorkplacePensions),
    workedInRomania: yesNoToBoolean(answers.workedInRomania),
    hadCarFinance2007To2024: yesNoToBoolean(answers.hadCarFinance2007To2024),
    hadGapInsuranceOrAddOns: yesNoToBoolean(answers.hadGapInsuranceOrAddOns),
    hadPaydayLoans: yesNoToBoolean(answers.hadPaydayLoans),
    paysMonthlyCurrentAccountFee: yesNoToBoolean(answers.paysMonthlyCurrentAccountFee),
    usesOverdraftRegularly: yesNoToBoolean(answers.usesOverdraftRegularly),
    checkedCouncilTaxBand: yesNoToBoolean(answers.checkedCouncilTaxBand),
    hasActiveSubscriptionsList: yesNoToBoolean(answers.hasActiveSubscriptionsList),
    receivesLowIncomeBenefit: yesNoToBoolean(answers.receivesLowIncomeBenefit),
    hasMortgage: yesNoToBoolean(answers.hasMortgage),
    hasOldBankAccounts: yesNoToBoolean(answers.hasOldBankAccounts),
    hasRomanianInheritanceOrProperty: yesNoToBoolean(answers.hasRomanianInheritanceOrProperty),
  };

  if (answers.marriedOrCivilPartner === "yes") {
    payload.lowerPartnerAnnualIncome = numberOrUndefined(answers.lowerPartnerAnnualIncome);
    payload.higherPartnerBasicRateTaxpayer = yesNoToBoolean(answers.higherPartnerBasicRateTaxpayer);
  }

  if (answers.worksOvertimeOrVariableHours === "yes") {
    payload.holidayPayChecked = yesNoToBoolean(answers.holidayPayChecked);
  }

  if (answers.redundancyInLast3Years === "yes") {
    payload.ageAtDismissal = numberOrUndefined(answers.ageAtDismissal);
    payload.yearsService = numberOrUndefined(answers.yearsService);
    payload.weeklyPay = numberOrUndefined(answers.weeklyPay);
    payload.redundancyAmountReceived = numberOrUndefined(answers.redundancyAmountReceived);
  }

  if (answers.selfAssessmentIncome === "yes") {
    payload.declaredUsualExpenses = yesNoToBoolean(answers.declaredUsualExpenses);
  }

  if (answers.hasStudentLoan === "yes") {
    payload.studentLoanPlan = answers.studentLoanPlan || undefined;
    payload.annualIncome = numberOrUndefined(answers.annualIncome);
    payload.repaymentsTaken = yesNoToBoolean(answers.repaymentsTaken);
  }

  if (answers.paysMonthlyCurrentAccountFee === "yes") {
    payload.usesIncludedBenefits = yesNoToBoolean(answers.usesIncludedBenefits);
  }

  if (answers.usesOverdraftRegularly === "yes") {
    payload.overdraftApr = numberOrUndefined(answers.overdraftApr);
  }

  if (answers.receivesLowIncomeBenefit === "yes") {
    payload.hasSocialTariff = yesNoToBoolean(answers.hasSocialTariff);
  }

  if (answers.hasMortgage === "yes") {
    payload.fixedRateEndsInMonths = numberOrUndefined(answers.fixedRateEndsInMonths);
  }

  return removeUndefinedValues(payload);
}

function getBrowserLocation() {
  if (typeof window === "undefined") {
    return {
      domain: "www.justproveit.co.uk",
      pageUrl: CANONICAL,
      referrer: "",
    };
  }

  return {
    domain: window.location.hostname || "www.justproveit.co.uk",
    pageUrl: window.location.href,
    referrer: document.referrer || "",
  };
}

function hasYesNo(value: YesNo) {
  return value === "yes" || value === "no";
}

function hasNumberValue(value: string, min = 0) {
  const numericValue = Number(value);
  return value.trim() !== "" && Number.isFinite(numericValue) && numericValue >= min;
}

function numberOrUndefined(value: string) {
  return hasNumberValue(value, Number.NEGATIVE_INFINITY) ? Number(value) : undefined;
}

function yesNoToBoolean(value: YesNo) {
  if (value === "yes") {
    return true;
  }
  if (value === "no") {
    return false;
  }
  return undefined;
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function AuthGateShell({
  title,
  message,
  actionLabel = "Autentificare",
  actionHref,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950">
      <Head>
        <title>{`${title} | JustProveIt`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {actionLabel}
        </Link>
      </main>
    </div>
  );
}
