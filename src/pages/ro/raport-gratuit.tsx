import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { updateCrmLead } from "@/lib/crmAdmin";
import {
  evaluateQuickReport,
  getQuickReportCompletion,
  getQuickReportFlagCounts,
  saveQuickReportInternalAnswers,
  submitQuickReportFaza0,
  type QuickReportAnswers,
  type QuickReportDisplayFlag,
  type QuickReportFlag,
  type QuickReportInternalAnswers,
  type QuickReportInternalAnswersPayload,
  type QuickReportResult,
  type YesNo,
} from "@/lib/quickReport";

const SITE_URL = "https://www.justproveit.co.uk";
const PAGE_PATH = "/ro/raport-gratuit";
const CANONICAL = `${SITE_URL}${PAGE_PATH}`;
const STANDARD_TAX_CODE = "1257L";
const MONEY_CHECK_CALENDLY_URL = "https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani";
const INTERNAL_DRAFT_STORAGE_KEY = "justproveit:money-check:internal-draft";

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

const initialInternalAnswers: QuickReportInternalAnswers = {
  ukEmploymentType: "",
  knowsAllPrivatePensions: "",
  hadCarFinanceBeforeNov2024: "",
  hasCreditCardOverdraftOrPaydayLoansDebt: "",
  checkedCouncilTaxBand: "",
  creditScoreLevel: "",
  agentObservations: "",
};

type ContactForm = {
  fullName: string;
  email: string;
  phone: string;
};

type SaveAction = "faza0" | "internal" | "";

type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
};

type SavedQuickReportReference = {
  reportId?: string;
  leadId?: string;
  email: string;
  phone: string;
};

type InternalDraftRecord = {
  contact: ContactForm;
  internalAnswers: QuickReportInternalAnswers;
  savedReport: SavedQuickReportReference | null;
  updatedAt: string;
};

const initialContact: ContactForm = {
  fullName: "",
  email: "",
  phone: "",
};

export default function FreeQuickReportPage() {
  const router = useRouter();
  const { status: authStatus, token, isCrm, logout, user } = useAuth();
  const [contact, setContact] = useState<ContactForm>(initialContact);
  const [answers, setAnswers] = useState<QuickReportAnswers>(initialAnswers);
  const [internalAnswers, setInternalAnswers] = useState<QuickReportInternalAnswers>(initialInternalAnswers);
  const [savedReport, setSavedReport] = useState<SavedQuickReportReference | null>(null);
  const [sendingAction, setSendingAction] = useState<SaveAction>("");
  const [status, setStatus] = useState<"success" | "error" | "">("");
  const [message, setMessage] = useState("");
  const [internalStatus, setInternalStatus] = useState<"success" | "error" | "">("");
  const [internalMessage, setInternalMessage] = useState("");
  const [internalDraftHydrated, setInternalDraftHydrated] = useState(false);
  const [internalDraftNotice, setInternalDraftNotice] = useState("");
  const [lastSavedInternalDraftSignature, setLastSavedInternalDraftSignature] = useState("");
  const [calendlyFallbackUrl, setCalendlyFallbackUrl] = useState("");
  const sending = sendingAction !== "";
  const results = useMemo(() => evaluateQuickReport(answers), [answers]);
  const completion = useMemo(() => getQuickReportCompletion(results), [results]);
  const internalCompletion = useMemo(() => getInternalAnswersCompletion(internalAnswers), [internalAnswers]);
  const counts = useMemo(() => getQuickReportFlagCounts(results), [results]);
  const internalDraftSignature = useMemo(
    () => buildInternalDraftSignature(contact, internalAnswers),
    [contact, internalAnswers],
  );
  const hasUnsavedInternalAnswers =
    internalDraftHydrated &&
    hasAnyInternalAnswers(internalAnswers) &&
    internalDraftSignature !== lastSavedInternalDraftSignature;
  const agentDisplayName = user?.name || user?.email || "[Nume]";
  const clientDisplayName = contact.fullName.trim() || "<X>";
  const clientEmailDisplay = contact.email.trim() || "<adresa>";

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
    const fullName = getFirstQueryValue(params, ["MCC_FULLNAME", "name", "fullName", "nume"]);
    const email = getFirstQueryValue(params, ["MCC_EMAIL", "email"]);
    const phone = getFirstQueryValue(params, ["MCC_ANI", "phone", "telefon", "tel"]);
    const queryContact = {
      fullName,
      email,
      phone,
    };
    const storedDraft = readStoredInternalDraft();
    const hasQueryContact = hasAnyContactDetails(queryContact);

    if (storedDraft) {
      if (!hasQueryContact || contactsReferToSameClient(queryContact, storedDraft.contact)) {
        setContact({
          fullName: fullName || storedDraft.contact.fullName,
          email: email || storedDraft.contact.email,
          phone: phone || storedDraft.contact.phone,
        });
        setInternalAnswers(storedDraft.internalAnswers);
        setSavedReport(storedDraft.savedReport);
        setInternalDraftNotice(
          `Am reincarcat informatii interne nesalvate pentru ${formatDraftContact(storedDraft.contact)}.`,
        );
        setInternalDraftHydrated(true);
        return;
      }

      setInternalDraftNotice(
        `Atentie: exista informatii interne nesalvate pentru ${formatDraftContact(
          storedDraft.contact,
        )}, de la ${formatDraftDate(storedDraft.updatedAt)}. Salvati-le inainte de urmatorul apel.`,
      );
    }

    if (hasQueryContact) {
      setContact((current) => ({
        ...current,
        fullName: fullName || current.fullName,
        email: email || current.email,
        phone: phone || current.phone,
      }));
    }

    setInternalDraftHydrated(true);
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

  useEffect(() => {
    if (!internalDraftHydrated) {
      return;
    }

    if (hasUnsavedInternalAnswers) {
      writeStoredInternalDraft({
        contact,
        internalAnswers,
        savedReport,
        updatedAt: new Date().toISOString(),
      });
    } else if (hasAnyInternalAnswers(internalAnswers)) {
      clearStoredInternalDraft();
    }
  }, [contact, hasUnsavedInternalAnswers, internalAnswers, internalDraftHydrated, savedReport]);

  useEffect(() => {
    if (!hasUnsavedInternalAnswers) {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedInternalAnswers]);

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  async function handleSendFaza0Report() {
    setStatus("");
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

    await submitReport(contactDetails);
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

    if (!token || !isCrm) {
      setStatus("error");
      setMessage("Autentificare CRM necesara pentru trimiterea raportului.");
      return null;
    }

    return { fullName, email, phone };
  }

  async function submitReport(contactDetails: ContactDetails) {
    if (!token) {
      setStatus("error");
      setMessage("Autentificare CRM necesara pentru trimiterea raportului.");
      return;
    }

    const completedResults = results.filter(
      (result): result is QuickReportResult & { flag: QuickReportFlag } => result.flag !== "necompletat",
    );
    const browserLocation = getBrowserLocation();

    setSendingAction("faza0");
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
        emailScope: "faza0",
      });
      setSavedReport({
        reportId: response.reportId || undefined,
        leadId: response.leadId || undefined,
        email: contactDetails.email,
        phone: contactDetails.phone,
      });
      setStatus("success");
      if (response.emailSent === false) {
        setMessage(
          response.emailError
            ? `Raportul Gratuit a fost salvat, dar emailul nu a fost trimis: ${response.emailError}`
            : "Raportul Gratuit a fost salvat, dar emailul nu a fost trimis.",
        );
      } else {
        setMessage(response.message || "Raportul Gratuit a fost trimis pe email.");
      }
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Raportul nu a putut fi trimis.";
      setMessage(`Salvare Raport Gratuit: ${errorMessage}`);
    } finally {
      setSendingAction("");
    }
  }

  async function handleSaveInternalAnswers() {
    setInternalStatus("");
    setInternalMessage("");
    setCalendlyFallbackUrl("");

    const contactDetails = validateContactAndAccess();
    if (!contactDetails) {
      setInternalStatus("error");
      setInternalMessage("Completeaza numele, emailul si telefonul clientului.");
      return;
    }

    if (!token) {
      setInternalStatus("error");
      setInternalMessage("Autentificare CRM necesara pentru salvare.");
      return;
    }

    if (
      (!savedReport?.reportId && !savedReport?.leadId) ||
      savedReport.email !== contactDetails.email ||
      savedReport.phone !== contactDetails.phone
    ) {
      setInternalStatus("error");
      setInternalMessage("Trimite mai intai Raportul Gratuit, apoi salveaza informatiile interne in CRM.");
      return;
    }

    if (!internalCompletion.complete) {
      setInternalStatus("error");
      setInternalMessage("Completeaza intrebarile interne inainte de salvare.");
      return;
    }

    const calendlyWindow = openPendingCalendlyWindow();
    const completedResults = results.filter(
      (result): result is QuickReportResult & { flag: QuickReportFlag } => result.flag !== "necompletat",
    );
    const browserLocation = getBrowserLocation();
    const agentObservations = internalAnswers.agentObservations.trim();
    const agentName = user?.name || user?.email || "";

    setSendingAction("internal");
    try {
      const response = await saveQuickReportInternalAnswers(token, {
        tenantKey: "justproveit",
        source: "raport_gratuit_crm_internal",
        reportId: savedReport.reportId,
        leadId: savedReport.leadId,
        fullName: contactDetails.fullName,
        email: contactDetails.email,
        phone: contactDetails.phone,
        domain: browserLocation.domain,
        pageUrl: browserLocation.pageUrl,
        referrer: browserLocation.referrer,
        answers: buildInternalAnswersPayload(internalAnswers, false),
        faza0Answers: answers,
        faza0Results: completedResults,
      });
      setSavedReport({
        reportId: response.reportId || savedReport.reportId,
        leadId: response.leadId || savedReport.leadId,
        email: contactDetails.email,
        phone: contactDetails.phone,
      });

      const observationFallback = await saveAgentObservationFallback(
        token,
        response.leadId || savedReport.leadId,
        agentObservations,
        agentName,
      );
      const fallbackMessage = observationFallback.saved
        ? agentObservations
          ? " Observatia agent a fost salvata in Observatii lead."
          : ""
        : ` Observatia agent nu a fost salvata: ${observationFallback.message}`;
      const calendlyUrl = buildCalendlyUrl(contactDetails);
      const calendlyOpened = openCalendlyBooking(calendlyUrl, calendlyWindow);
      if (!calendlyOpened) {
        setCalendlyFallbackUrl(calendlyUrl);
      }
      if (observationFallback.saved) {
        setLastSavedInternalDraftSignature(internalDraftSignature);
        setInternalDraftNotice("");
        clearStoredInternalDraft();
      }
      setInternalStatus("success");
      setInternalMessage(
        `${response.message || "Informatiile interne au fost salvate in CRM."}${fallbackMessage}${
          calendlyOpened
            ? " Calendly se deschide pentru programare."
            : " Browserul a blocat fereastra Calendly. Folositi linkul de mai jos."
        }`,
      );
    } catch (error) {
      closePendingCalendlyWindow(calendlyWindow);
      setInternalStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Informatiile interne nu au putut fi salvate.";
      setInternalMessage(`Salvare Informatii interne CRM: ${errorMessage}`);
    } finally {
      setSendingAction("");
    }
  }

  function updateContact<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setContact((current) => ({ ...current, [key]: value }));
  }

  function updateAnswer<K extends keyof QuickReportAnswers>(key: K, value: QuickReportAnswers[K]) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function updateInternalAnswer<K extends keyof QuickReportInternalAnswers>(
    key: K,
    value: QuickReportInternalAnswers[K],
  ) {
    setInternalAnswers((current) => ({ ...current, [key]: value }));
    setInternalStatus("");
    setInternalMessage("");
    setCalendlyFallbackUrl("");
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
          <div className="space-y-6 rounded-lg border border-slate-200 bg-slate-100/80 p-5 shadow-sm">
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
            </fieldset>

            <AgentOpeningScript agentName={agentDisplayName} clientName={clientDisplayName} />

            <fieldset className="space-y-4">
              <legend className="mb-2 text-base font-bold">Faza 0 - verificari rapide</legend>

              <CheckFields title="MF01 - Cod fiscal gresit">
                <SelectInput
                  label="Ati avut mai multe joburi in acest an fiscal sau in ultimii 5 ani?"
                  value={answers.multipleJobs}
                  onChange={(value) => updateAnswer("multipleJobs", value as QuickReportAnswers["multipleJobs"])}
                  options={yesNoOptions}
                />
                <SelectInput
                  label="Ati recuperat taxele pe ultimii 5 ani?"
                  value={answers.taxRecoveredLast5Years}
                  onChange={(value) => updateAnswer("taxRecoveredLast5Years", value as QuickReportAnswers["taxRecoveredLast5Years"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD01 - Credit score / raport de credit">
                <SelectInput
                  label="Sunteti inscrisi pe electoral roll la adresa curenta?"
                  value={answers.electoralRoll}
                  onChange={(value) => updateAnswer("electoralRoll", value as QuickReportAnswers["electoralRoll"])}
                  options={yesNoOptions}
                />
                <SelectInput
                  label="Ati verificat vreodata raportul de credit pentru erori?"
                  value={answers.creditReportChecked}
                  onChange={(value) => updateAnswer("creditReportChecked", value as QuickReportAnswers["creditReportChecked"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="CD07 - Bank switching bonus neaccesat">
                <SelectInput
                  label="Cand ati schimbat ultima data un cont curent de la orice banca?"
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
                  label="Cand ati reinnoit ultima data asigurarea auto sau de casa si ati comparat pretul cu piata?"
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
                  label="Ce metoda folositi ca sa trimiteti bani in Romania?"
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
                  label="Ati comparat vreodata cu Wise/Revolut?"
                  value={answers.transferCompared}
                  onChange={(value) => updateAnswer("transferCompared", value as QuickReportAnswers["transferCompared"])}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="FC07 - Facturi de utilitati">
                <SelectInput
                  label="Ati comparat sau schimbat furnizorul de energie/broadband/mobile in ultimele 12 luni?"
                  value={answers.utilitiesCompared}
                  onChange={(value) => updateAnswer("utilitiesCompared", value as QuickReportAnswers["utilitiesCompared"])}
                  options={yesNoOptions}
                />
              </CheckFields>
            </fieldset>

            <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4">
              <AgentReportSendScript email={clientEmailDisplay} />
              <button
                type="button"
                onClick={handleSendFaza0Report}
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
              >
                {sendingAction === "faza0" ? "Trimit Raport Gratuit..." : "Trimite Raport Gratuit"}
              </button>
              {message ? <StatusMessage status={status} message={message} /> : null}
            </div>

            <fieldset className="space-y-4 border-t border-slate-200 pt-5">
              <legend className="text-base font-bold">Informatii interne CRM</legend>
              <p className="text-sm leading-6 text-slate-600">
                Aceste raspunsuri se salveaza doar in CRM si nu apar in raportul trimis clientului.
              </p>
              <ScriptCallout title="Script trecere catre Club">
                <p>
                  Va spuneam ca aceste prime 6 verificari gratuite fac parte dintr-un program mai mare, numit Clubul
                  Aici Sunt Banii Dumneavoastra. Dl. Adrian Defta conduce acest club si ofera o discutie gratuita,
                  similara cu cea pe care am avut-o noi, astfel incat sa descopere si alte posibilitati ca
                  dumneavoastra sa nu pierdeti bani in UK. Pot sa va mai adresez cateva intrebari sa vedem daca va
                  calificati pentru acea discutie gratuita?
                </p>
              </ScriptCallout>

              <CheckFields title="1 - Munca in UK si pensii private">
                <SelectInput
                  label="Ati muncit in UK ca angajat sau ca self-employed?"
                  value={internalAnswers.ukEmploymentType}
                  onChange={(value) => updateInternalAnswer("ukEmploymentType", value as QuickReportInternalAnswers["ukEmploymentType"])}
                  options={ukEmploymentOptions}
                />
                <SelectInput
                  label="Stiti toate pensiile private pe care le aveti?"
                  value={internalAnswers.knowsAllPrivatePensions}
                  onChange={(value) => updateInternalAnswer("knowsAllPrivatePensions", value as YesNo)}
                  options={yesNoOptions}
                />
                <p className="md:col-span-2 text-xs leading-5 text-slate-500">
                  Obs: fiecare angajator va subscrie la un fond de pensie privata, iar de multe ori le pierdem urma atunci cand schimbam locul de munca.
                </p>
              </CheckFields>

              <CheckFields title="2 - Masina cu plata in rate">
                <SelectInput
                  label="Ati avut o masina cu plata in rate inainte de Noiembrie 2024?"
                  value={internalAnswers.hadCarFinanceBeforeNov2024}
                  onChange={(value) => updateInternalAnswer("hadCarFinanceBeforeNov2024", value as YesNo)}
                  options={yesNoOptions}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Daca a fost inainte de Noiembrie 2024, clientul poate verifica daca isi poate recupera dobanda platita in plus.
                </p>
              </CheckFields>

              <CheckFields title="3 - Datorii pe credit">
                <SelectInput
                  label="Aveti datorii pe carduri de credit, overdraft sau payday loans?"
                  value={internalAnswers.hasCreditCardOverdraftOrPaydayLoansDebt}
                  onChange={(value) => updateInternalAnswer("hasCreditCardOverdraftOrPaydayLoansDebt", value as YesNo)}
                  options={yesNoOptions}
                />
              </CheckFields>

              <CheckFields title="4 - Banda de taxa de consiliu">
                <SelectInput
                  label="V-ati verificat vreodata ca sunteti incadrat in banda de taxa de consiliu corespunzatoare?"
                  value={internalAnswers.checkedCouncilTaxBand}
                  onChange={(value) => updateInternalAnswer("checkedCouncilTaxBand", value as YesNo)}
                  options={yesNoOptions}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Sunt aproximativ 1m de proprietati in UK incadrate in banda gresita si platesc mai multa taxa de consiliu.
                </p>
              </CheckFields>

              <CheckFields title="5 - Scor de credit">
                <SelectInput
                  label="Cum este scorul de credit?"
                  value={internalAnswers.creditScoreLevel}
                  onChange={(value) => updateInternalAnswer("creditScoreLevel", value as QuickReportInternalAnswers["creditScoreLevel"])}
                  options={creditScoreOptions}
                />
              </CheckFields>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Observatii agent</span>
                <textarea
                  value={internalAnswers.agentObservations}
                  onChange={(event) => updateInternalAnswer("agentObservations", event.target.value)}
                  rows={5}
                  placeholder="Scrie aici orice observatii interne pentru CRM."
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </fieldset>

            <div className="flex flex-col items-start gap-3 border-t border-slate-200 pt-4">
              <AgentScheduleScript />
              {hasUnsavedInternalAnswers ? (
                <p className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
                  Aveti informatii interne nesalvate. Inainte sa treceti la urmatorul apel, apasati Programeaza apel.
                </p>
              ) : null}
              {internalDraftNotice ? (
                <p className="w-full rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
                  {internalDraftNotice}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleSaveInternalAnswers}
                disabled={sending}
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400 md:w-auto"
              >
                {sendingAction === "internal" ? "Salvez si deschid Calendly..." : "Programeaza apel"}
              </button>
              {internalMessage ? <StatusMessage status={internalStatus} message={internalMessage} /> : null}
              {calendlyFallbackUrl ? (
                <a
                  href={calendlyFallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  Deschide Calendly manual
                </a>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Completare formular
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-normal">
                {completion.completed}/{completion.total} verificari completate
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Informatii CRM: {internalCompletion.completed}/{internalCompletion.total}
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
                <h2 className="text-base font-bold">Informatii interne CRM</h2>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                  {internalCompletion.completed}/{internalCompletion.total}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                Aceste raspunsuri sunt pentru CRM si follow-up intern. Nu se trimit clientului in emailul raportului gratuit.
              </p>
              {savedReport?.reportId || savedReport?.leadId ? (
                <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                  Raport salvat pentru atasare CRM.
                </p>
              ) : (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  Trimite Raportul Gratuit inainte de salvarea informatiilor interne.
                </p>
              )}
              {hasUnsavedInternalAnswers ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
                  Informatii interne nesalvate. Apasati Programeaza apel inainte de urmatorul apel.
                </p>
              ) : null}
              <div className="mt-4 space-y-3">
                {INTERNAL_AGENT_TALK_TRACK.map((item) => (
                  <InternalTalkTrackItem key={item.title} title={item.title} text={item.text} />
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

const ukEmploymentOptions = [
  { value: "employee", label: "Angajat" },
  { value: "selfEmployed", label: "Self-employed" },
  { value: "both", label: "Angajat si self-employed" },
  { value: "notWorked", label: "Nu a muncit in UK" },
  { value: "unknown", label: "Nu stie / neclar" },
];

const creditScoreOptions = [
  { value: "low", label: "Mic" },
  { value: "medium", label: "Mediu" },
  { value: "high", label: "Mare" },
];

const INTERNAL_AGENT_TALK_TRACK = [
  {
    title: "1 - Munca in UK si pensii private",
    text:
      "Va intreb pentru ca fiecare angajator va inscrie de obicei intr-un fond de pensie privata. Cand schimbati jobul, este foarte usor sa pierdeti urma acestor pensii si sa lasati bani pe care ii aveti deja stransi.",
  },
  {
    title: "2 - Masina cu plata in rate",
    text:
      "Aceasta verificare conteaza pentru ca multe contracte auto cu plata in rate pot avea dobanzi sau comisioane care merita verificate. Daca masina a fost luata inainte de Noiembrie 2024, poate exista o sansa de recuperare.",
  },
  {
    title: "3 - Datorii pe carduri sau overdraft",
    text:
      "Va intreb pentru ca datoriile pe carduri, overdraft sau payday loans pot costa foarte mult lunar. Uneori exista variante mai bune de organizare, reducere a costurilor sau verificare daca imprumutul a fost acordat corect.",
  },
  {
    title: "4 - Banda de taxa de consiliu",
    text:
      "Unele proprietati sunt incadrate gresit la council tax si oamenii platesc prea mult ani la rand. Daca banda este gresita, se poate cere verificare si uneori se pot recupera bani platiti in plus.",
  },
  {
    title: "5 - Scor de credit",
    text:
      "Scorul de credit influenteaza chirii, carduri, imprumuturi, dobanzi si uneori chiar accesul la servicii. O eroare mica in raport poate costa mult in timp, asa ca merita verificat periodic.",
  },
];

function AgentOpeningScript({ agentName, clientName }: { agentName: string; clientName: string }) {
  return (
    <ScriptCallout title="AGENT - script inceput apel">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Versiunea scurta</p>
          <p>
            Buna ziua, dl./dna. {clientName}! Sunt {agentName}, din partea Proveit. Noi ajutam comunitatea de romani
            din UK sa isi apere drepturile financiare impotriva firmelor. V-ati lasat numarul de telefon mai demult la
            noi iar acum lansam un serviciu nou care va poate aduce mii de lire. Saptamana asta va oferim o mostra
            total gratuita. Aveti acum 5-10 minute?
          </p>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Versiunea lunga</p>
          <p>
            Buna ziua, dl./dna. {clientName}! Sunt {agentName}, din partea Proveit. Noi ajutam comunitatea de romani
            din UK sa isi apere drepturile financiare impotriva firmelor. V-ati lasat numarul de telefon mai demult la
            noi iar acum lansam un serviciu nou care va poate aduce mii de lire. Prin urmare saptamana asta va oferim o
            mostra total gratuita. Facem 6 verificari sa vedem daca exista bani la care aveti dreptul si nu ii
            accesati. Aveti acum 5-10 minute sa facem aceste verificari? Nu avem nevoie de date personale.
          </p>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          <p className="text-xs font-extrabold uppercase tracking-wide">Obligatoriu - nu se modifica substanta</p>
          <p className="mt-2 italic">
            Inainte sa continuam, o formalitate scurta: sunt {agentName} si reprezint Proveit, firma inregistrata in
            Marea Britanie cu numarul 14007642. Apelul este inregistrat. Pot sa continui?
          </p>
        </div>
        <p>
          Ca sa va ajut cat mai exact, va pun cateva intrebari scurte, fara date personale, notez raspunsurile si, la
          final, va trimit tot raportul pe email, structurat clar.
        </p>
      </div>
    </ScriptCallout>
  );
}

function AgentReportSendScript({ email }: { email: string }) {
  return (
    <ScriptCallout title="Script trimitere raport">
      <div className="space-y-3">
        <p>
          Perfect, asta a fost tot - 6 verificari, facute chiar acum, la telefon. Va trimit imediat raportul pe email,
          cu tot ce am gasit, scris clar. Am in sistem adresa: {email}. E OK?
        </p>
        <p className="font-bold">[trimite email]</p>
        <p>OK. L-am trimis. L-ati primit? Verificati si la spam daca nu apare in 30 de secunde.</p>
        <p>
          Bun. Aveti acolo toate verificarile, inclusiv link-uri la cele 5 banci care va platesc acum bani. Puteti sa
          vedeti link-urile? Aveti acolo tot ce va trebuie pentru a nu pierde bani.
        </p>
        <p>Spuneti-mi daca sunt intrebari.</p>
        <p className="italic">&lt;asteptam sa vedem ce intrebari au si le raspundem&gt;</p>
      </div>
    </ScriptCallout>
  );
}

function AgentScheduleScript() {
  return (
    <ScriptCallout title="Script programare apel">
      <p>
        Perfect. Va calificati pentru o programare cu dl. Adrian Defta pentru a aprofunda aceste subiecte. Este un apel
        gratuit, dureaza aproximativ 15 minute. Puteti sa intrebati orice in legatura cu aceste probleme, si in general
        despre orice probleme aveti in UK. Cand sa va fac aceasta programare? Urmatoarea data disponibila este...
      </p>
    </ScriptCallout>
  );
}

function ScriptCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
      <h2 className="text-sm font-extrabold text-slate-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InternalTalkTrackItem({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </article>
  );
}

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

function getFirstQueryValue(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function hasAnyContactDetails(contact: ContactForm) {
  return Boolean(contact.fullName.trim() || contact.email.trim() || contact.phone.trim());
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function contactsReferToSameClient(first: ContactForm, second: ContactForm) {
  const firstPhone = normalizePhone(first.phone);
  const secondPhone = normalizePhone(second.phone);
  if (firstPhone && secondPhone && firstPhone === secondPhone) {
    return true;
  }

  const firstEmail = first.email.trim().toLowerCase();
  const secondEmail = second.email.trim().toLowerCase();
  return Boolean(firstEmail && secondEmail && firstEmail === secondEmail);
}

function formatDraftContact(contact: ContactForm) {
  return contact.fullName.trim() || contact.email.trim() || contact.phone.trim() || "un client fara nume";
}

function formatDraftDate(value: string) {
  if (!value) {
    return "o data necunoscuta";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "o data necunoscuta";
  }

  return date.toLocaleString("ro-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasAnyInternalAnswers(answers: QuickReportInternalAnswers) {
  return Object.values(answers).some((value) => String(value || "").trim());
}

function buildInternalDraftSignature(contact: ContactForm, answers: QuickReportInternalAnswers) {
  return JSON.stringify({
    contact: {
      fullName: contact.fullName.trim(),
      email: contact.email.trim().toLowerCase(),
      phone: normalizePhone(contact.phone),
    },
    answers: {
      ukEmploymentType: answers.ukEmploymentType,
      knowsAllPrivatePensions: answers.knowsAllPrivatePensions,
      hadCarFinanceBeforeNov2024: answers.hadCarFinanceBeforeNov2024,
      hasCreditCardOverdraftOrPaydayLoansDebt: answers.hasCreditCardOverdraftOrPaydayLoansDebt,
      checkedCouncilTaxBand: answers.checkedCouncilTaxBand,
      creditScoreLevel: answers.creditScoreLevel,
      agentObservations: answers.agentObservations.trim(),
    },
  });
}

function readStoredInternalDraft(): InternalDraftRecord | null {
  try {
    const rawDraft = window.localStorage.getItem(INTERNAL_DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      return null;
    }

    const parsed = JSON.parse(rawDraft) as Partial<InternalDraftRecord>;
    const internalAnswers = normalizeInternalAnswers(parsed.internalAnswers);
    if (!hasAnyInternalAnswers(internalAnswers)) {
      return null;
    }

    return {
      contact: normalizeContact(parsed.contact),
      internalAnswers,
      savedReport: normalizeSavedReport(parsed.savedReport),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

function writeStoredInternalDraft(record: InternalDraftRecord) {
  try {
    window.localStorage.setItem(INTERNAL_DRAFT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Local draft persistence is a convenience; CRM saving remains the source of truth.
  }
}

function clearStoredInternalDraft() {
  try {
    window.localStorage.removeItem(INTERNAL_DRAFT_STORAGE_KEY);
  } catch {
    // Ignore localStorage failures.
  }
}

function normalizeContact(value: unknown): ContactForm {
  const record = value && typeof value === "object" ? (value as Partial<ContactForm>) : {};
  return {
    fullName: typeof record.fullName === "string" ? record.fullName : "",
    email: typeof record.email === "string" ? record.email : "",
    phone: typeof record.phone === "string" ? record.phone : "",
  };
}

function normalizeInternalAnswers(value: unknown): QuickReportInternalAnswers {
  const record = value && typeof value === "object" ? (value as Partial<QuickReportInternalAnswers>) : {};
  return {
    ukEmploymentType: record.ukEmploymentType || "",
    knowsAllPrivatePensions: record.knowsAllPrivatePensions || "",
    hadCarFinanceBeforeNov2024: record.hadCarFinanceBeforeNov2024 || "",
    hasCreditCardOverdraftOrPaydayLoansDebt: record.hasCreditCardOverdraftOrPaydayLoansDebt || "",
    checkedCouncilTaxBand: record.checkedCouncilTaxBand || "",
    creditScoreLevel: record.creditScoreLevel || "",
    agentObservations: typeof record.agentObservations === "string" ? record.agentObservations : "",
  };
}

function normalizeSavedReport(value: unknown): SavedQuickReportReference | null {
  const record = value && typeof value === "object" ? (value as Partial<SavedQuickReportReference>) : null;
  if (!record) {
    return null;
  }

  const email = typeof record.email === "string" ? record.email : "";
  const phone = typeof record.phone === "string" ? record.phone : "";
  const reportId = typeof record.reportId === "string" ? record.reportId : "";
  const leadId = typeof record.leadId === "string" ? record.leadId : "";

  if (!email && !phone && !reportId && !leadId) {
    return null;
  }

  return {
    reportId: reportId || undefined,
    leadId: leadId || undefined,
    email,
    phone,
  };
}

function openPendingCalendlyWindow() {
  if (typeof window === "undefined") {
    return null;
  }

  const popup = window.open("", "_blank");
  if (popup) {
    popup.opener = null;
  }
  return popup;
}

function closePendingCalendlyWindow(popup: Window | null) {
  if (!popup || popup.closed) {
    return;
  }

  popup.close();
}

function buildCalendlyUrl(contactDetails: ContactDetails) {
  const calendlyUrl = new URL(MONEY_CHECK_CALENDLY_URL);
  calendlyUrl.searchParams.set("name", contactDetails.fullName);
  calendlyUrl.searchParams.set("email", contactDetails.email);
  return calendlyUrl.toString();
}

function openCalendlyBooking(calendlyUrl: string, popup: Window | null) {
  if (popup && !popup.closed) {
    popup.location.href = calendlyUrl;
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.open(calendlyUrl, "_blank", "noopener,noreferrer"));
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

function buildInternalAnswersPayload(
  answers: QuickReportInternalAnswers,
  includeAgentObservations: boolean,
): QuickReportInternalAnswersPayload {
  const { agentObservations, ...questionAnswers } = answers;
  const observation = agentObservations.trim();

  return includeAgentObservations && observation
    ? { ...questionAnswers, agentObservations: observation }
    : questionAnswers;
}

async function saveAgentObservationFallback(
  token: string,
  leadId: string | null | undefined,
  observation: string,
  agentName: string,
) {
  const cleanObservation = observation.trim();
  const cleanLeadId = String(leadId || "").trim();

  if (!cleanObservation) {
    return { saved: true, message: "" };
  }

  if (!cleanLeadId) {
    return { saved: false, message: "lipseste leadId pentru salvarea observatiei." };
  }

  try {
    await updateCrmLead(token, cleanLeadId, {
      observation: `Money Check - Observatii agent:\n${cleanObservation}`,
      agent: agentName || "Money Check",
    });
    return { saved: true, message: "" };
  } catch (error) {
    return {
      saved: false,
      message: error instanceof Error ? error.message : "eroare necunoscuta la salvarea observatiei.",
    };
  }
}

function hasYesNo(value: YesNo) {
  return value === "yes" || value === "no";
}

function getInternalAnswersCompletion(answers: QuickReportInternalAnswers) {
  const completed = [
    Boolean(answers.ukEmploymentType),
    hasYesNo(answers.knowsAllPrivatePensions),
    hasYesNo(answers.hadCarFinanceBeforeNov2024),
    hasYesNo(answers.hasCreditCardOverdraftOrPaydayLoansDebt),
    hasYesNo(answers.checkedCouncilTaxBand),
    Boolean(answers.creditScoreLevel),
  ].filter(Boolean).length;
  const total = 6;

  return {
    completed,
    total,
    complete: completed === total,
  };
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
