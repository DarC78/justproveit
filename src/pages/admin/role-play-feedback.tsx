import { useAuth } from "@/context/AuthContext";
import {
  RolePlayFeedbackGroup,
  RolePlayFeedbackPayload,
  RolePlayFeedbackStatus,
  RolePlayParticipantRole,
  sendRolePlayFeedbackEmail,
} from "@/lib/rolePlayFeedback";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

const PAGE_PATH = "/admin/role-play-feedback";

type FormFeedbackStatus = RolePlayFeedbackStatus | "";

type CheckpointDefinition = {
  id: string;
  label: string;
};

type ScenarioDefinition = {
  id: string;
  title: string;
  focus: string;
  group: RolePlayFeedbackGroup;
  defaultRole: RolePlayParticipantRole;
  checkpoints: CheckpointDefinition[];
};

type ScenarioState = {
  participantRole: RolePlayParticipantRole;
  checkpoints: Record<string, FormFeedbackStatus>;
  notes: string;
};

type SummaryCounts = {
  totalItems: number;
  completedItems: number;
  missingItems: number;
  yes: number;
  partial: number;
  no: number;
  notApplicable: number;
  scorePercent: number;
};

type ActionStatus = "success" | "error" | "";

const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "scenario-1",
    title: "Scenariul 1",
    focus: "Calificare, legitimitate si pret",
    group: "A",
    defaultRole: "agent",
    checkpoints: [
      {
        id: "registration-number",
        label: "A mentionat numarul de inregistrare UK (14007642)?",
      },
      {
        id: "qualification-questions",
        label: "A pus toate cele 3 intrebari de calificare, in ordine?",
      },
      {
        id: "correct-numbers",
        label: "A folosit cifrele corecte (2940 lei, GBP 3000/an, GBP 15.000 la 5 ani)?",
      },
      {
        id: "legitimacy-facts",
        label: "A raspuns la intrebarea despre legitimitate cu fapte, nu cu presiune?",
      },
      {
        id: "price-structure",
        label: "A comunicat corect structura de pret (GBP 50 + conditionat GBP 47)?",
      },
    ],
  },
  {
    id: "scenario-2",
    title: "Scenariul 2",
    focus: "Tari multiple si obiectie de pret",
    group: "A",
    defaultRole: "agent",
    checkpoints: [
      {
        id: "countries",
        label: "A aflat corect ambele tari (Italia + UK)?",
      },
      {
        id: "lawyer-comparison",
        label: "A folosit comparatia cu avocatul (GBP 300/ora) la obiectia de pret?",
      },
      {
        id: "refund-guarantee",
        label: "A mentionat garantia de refund 100%?",
      },
      {
        id: "no-discount",
        label: "A explicat corect structura de pret, fara sa inventeze o reducere?",
      },
    ],
  },
  {
    id: "scenario-3",
    title: "Scenariul 3",
    focus: "Munca la negru si perioade relevante",
    group: "A",
    defaultRole: "agent",
    checkpoints: [
      {
        id: "black-work",
        label: "A clarificat ca munca la negru nu se cumuleaza?",
      },
      {
        id: "assimilated-periods",
        label: "A mentionat perioadele asimilate (copii/studii/armata) ca posibil relevante?",
      },
      {
        id: "no-promise",
        label: "A evitat sa promita un rezultat cert inainte de simulare?",
      },
    ],
  },
  {
    id: "scenario-4",
    title: "Scenariul 4",
    focus: "Valoare serviciu, cadru legal si callback",
    group: "B",
    defaultRole: "client",
    checkpoints: [
      {
        id: "custom-shoes",
        label: "A folosit analogia pantofi facuti la comanda vs. cumparati gata sau echivalentul din script?",
      },
      {
        id: "legal-framework",
        label: "A mentionat cadrul legal (Legea 360/2023 + regulamentele UE)?",
      },
      {
        id: "concrete-callback",
        label: "A stabilit o data si ora concreta de callback, nu doar ne mai auzim?",
      },
    ],
  },
  {
    id: "scenario-5",
    title: "Scenariul 5",
    focus: "Citire puncte si confirmare explicita",
    group: "B",
    defaultRole: "client",
    checkpoints: [
      {
        id: "four-points",
        label: "A citit toate cele 4 puncte, complet, fara sa sara niciunul?",
      },
      {
        id: "explicit-confirmation",
        label: "A cerut explicit formularea de confirmare din script, nu doar un OK general?",
      },
      {
        id: "calm-respectful",
        label: "A ramas calm si respectuos, fara presiune, pe tot parcursul refuzului?",
      },
    ],
  },
  {
    id: "scenario-6",
    title: "Scenariul 6",
    focus: "Confuzie Adrian Defta si carnet de munca pierdut",
    group: "B",
    defaultRole: "client",
    checkpoints: [
      {
        id: "doctor-nurse",
        label: "A folosit analogia doctor/asistenta pentru confuzia Adrian Defta?",
      },
      {
        id: "lost-work-book",
        label: "A explicat corect fluxul pentru carnetul de munca pierdut (adeverinte / arhive / lichidator)?",
      },
      {
        id: "extra-service-prices",
        label: "A mentionat corect preturile serviciului suplimentar (GBP 97 / GBP 197)?",
      },
    ],
  },
];

const STATUS_OPTIONS: Array<{
  value: RolePlayFeedbackStatus;
  label: string;
}> = [
  { value: "yes", label: "Da" },
  { value: "partial", label: "Partial" },
  { value: "no", label: "Nu" },
  { value: "na", label: "N/A" },
];

const ROLE_OPTIONS: Array<{ value: RolePlayParticipantRole; label: string }> = [
  { value: "agent", label: "Agent" },
  { value: "client", label: "Client" },
  { value: "observer", label: "Observator" },
];

const STATUS_LABELS: Record<RolePlayFeedbackStatus, string> = {
  yes: "Da",
  partial: "Partial",
  no: "Nu",
  na: "N/A",
};

export default function RolePlayFeedbackPage() {
  const router = useRouter();
  const { status: authStatus, token, user, isCrm, logout } = useAuth();
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [scenarioStates, setScenarioStates] = useState(createInitialScenarioStates);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [overallNotes, setOverallNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingScenarioId, setSendingScenarioId] = useState("");
  const [scenarioMessages, setScenarioMessages] = useState<
    Record<string, { status: ActionStatus; message: string }>
  >({});
  const [copyMessage, setCopyMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<ActionStatus>("");
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    setReviewerName((current) => current || user?.name || user?.email || "");
    setReviewerEmail((current) => current || user?.email || "");
  }, [user]);

  useEffect(() => {
    setSessionDate((current) => current || new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (authStatus !== "anonymous" || !router.isReady) {
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(PAGE_PATH)}`);
  }, [authStatus, router]);

  const feedbackGroup = useMemo(() => readRolePlayFeedbackGroup(user), [user]);
  const activeScenarios = useMemo(
    () =>
      feedbackGroup
        ? SCENARIOS.filter((scenario) => scenario.group === feedbackGroup)
        : [],
    [feedbackGroup],
  );
  const summary = useMemo(
    () => calculateSummary(scenarioStates, activeScenarios),
    [activeScenarios, scenarioStates],
  );
  const summaryText = useMemo(
    () =>
      buildSummaryText({
        feedbackGroup,
        scenarios: activeScenarios,
        agentName,
        agentEmail,
        reviewerName,
        reviewerEmail,
        sessionDate,
        scenarioStates,
        summary,
        strengths,
        improvements,
        overallNotes,
      }),
    [
      activeScenarios,
      agentName,
      agentEmail,
      feedbackGroup,
      reviewerName,
      reviewerEmail,
      sessionDate,
      scenarioStates,
      summary,
      strengths,
      improvements,
      overallNotes,
    ],
  );

  async function handleLogout() {
    await logout();
    await router.push("/login");
  }

  function updateScenarioRole(scenarioId: string, participantRole: RolePlayParticipantRole) {
    setScenarioStates((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        participantRole,
      },
    }));
  }

  function updateCheckpoint(
    scenarioId: string,
    checkpointId: string,
    value: RolePlayFeedbackStatus,
  ) {
    setScenarioStates((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        checkpoints: {
          ...current[scenarioId].checkpoints,
          [checkpointId]: value,
        },
      },
    }));
  }

  function updateScenarioNotes(scenarioId: string, notes: string) {
    setScenarioStates((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        notes,
      },
    }));
  }

  async function handleCopySummary() {
    setCopyMessage("");
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopyMessage("Sumarul a fost copiat.");
    } catch {
      setCopyMessage("Nu am putut copia sumarul din browser.");
    }
  }

  async function handleSendFeedback() {
    setSubmitStatus("");
    setSubmitMessage("");

    const validationError = validateFeedbackForm({
      feedbackGroup,
      agentName,
      agentEmail,
      reviewerName,
      sessionDate,
      scenarioStates,
      scenarios: activeScenarios,
    });

    if (validationError) {
      setSubmitStatus("error");
      setSubmitMessage(validationError);
      return;
    }

    if (!feedbackGroup) {
      return;
    }

    if (!token || !isCrm) {
      setSubmitStatus("error");
      setSubmitMessage("Autentificare CRM necesara pentru trimiterea feedback-ului.");
      return;
    }

    const browserContext = getBrowserContext();
    const payload: RolePlayFeedbackPayload = {
      source: "pension-role-play-feedback",
      feedbackGroup,
      emailScope: "group",
      agentName: agentName.trim(),
      agentEmail: agentEmail.trim(),
      reviewerName: reviewerName.trim(),
      reviewerEmail: reviewerEmail.trim() || user?.email || undefined,
      sessionDate,
      scenarios: buildScenarioPayload(scenarioStates, activeScenarios),
      summary,
      summaryText,
      strengths: strengths.trim() || undefined,
      improvements: improvements.trim() || undefined,
      overallNotes: overallNotes.trim() || undefined,
      ...browserContext,
    };

    setSending(true);
    try {
      const result = await sendRolePlayFeedbackEmail(token, payload);
      setSubmitStatus("success");
      setSubmitMessage(result.message || "Feedback-ul a fost trimis pe email.");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error
          ? error.message
          : "Feedback-ul nu a putut fi trimis pe email.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSendScenarioFeedback(scenario: ScenarioDefinition) {
    setScenarioMessages((current) => ({
      ...current,
      [scenario.id]: { status: "", message: "" },
    }));

    const validationError = validateScenarioFeedbackForm({
      feedbackGroup,
      agentName,
      agentEmail,
      reviewerName,
      sessionDate,
      scenario,
      scenarioState: scenarioStates[scenario.id],
    });

    if (validationError) {
      setScenarioMessages((current) => ({
        ...current,
        [scenario.id]: { status: "error", message: validationError },
      }));
      return;
    }

    if (!feedbackGroup) {
      return;
    }

    if (!token || !isCrm) {
      setScenarioMessages((current) => ({
        ...current,
        [scenario.id]: {
          status: "error",
          message: "Autentificare CRM necesara pentru trimiterea feedback-ului.",
        },
      }));
      return;
    }

    const scenarioSummary = calculateSummary(scenarioStates, [scenario]);
    const scenarioSummaryText = buildSummaryText({
      feedbackGroup,
      scenarios: [scenario],
      agentName,
      agentEmail,
      reviewerName,
      reviewerEmail,
      sessionDate,
      scenarioStates,
      summary: scenarioSummary,
      strengths: "",
      improvements: "",
      overallNotes: "",
    });

    const payload: RolePlayFeedbackPayload = {
      source: "pension-role-play-feedback",
      feedbackGroup,
      emailScope: "scenario",
      scenarioId: scenario.id,
      agentName: agentName.trim(),
      agentEmail: agentEmail.trim(),
      reviewerName: reviewerName.trim(),
      reviewerEmail: reviewerEmail.trim() || user?.email || undefined,
      sessionDate,
      scenarios: buildScenarioPayload(scenarioStates, [scenario]),
      summary: scenarioSummary,
      summaryText: scenarioSummaryText,
      ...getBrowserContext(),
    };

    setSendingScenarioId(scenario.id);
    try {
      const result = await sendRolePlayFeedbackEmail(token, payload);
      setScenarioMessages((current) => ({
        ...current,
        [scenario.id]: {
          status: "success",
          message: result.message || `${scenario.title} a fost trimis pe email.`,
        },
      }));
    } catch (error) {
      setScenarioMessages((current) => ({
        ...current,
        [scenario.id]: {
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : `${scenario.title} nu a putut fi trimis pe email.`,
        },
      }));
    } finally {
      setSendingScenarioId("");
    }
  }

  function handleReset() {
    if (!window.confirm("Stergi feedback-ul introdus pe pagina?")) {
      return;
    }

    setScenarioStates(createInitialScenarioStates());
    setStrengths("");
    setImprovements("");
    setOverallNotes("");
    setSubmitStatus("");
    setSubmitMessage("");
    setCopyMessage("");
    setScenarioMessages({});
  }

  if (authStatus === "loading" || authStatus === "anonymous") {
    return (
      <AuthGateShell
        title="Verificam accesul"
        message="Pagina de role play este disponibila dupa autentificare CRM."
      />
    );
  }

  if (!isCrm || !token) {
    return (
      <AuthGateShell
        title="Acces CRM necesar"
        message="Contul autentificat nu are acces CRM pentru aceasta pagina."
        actionHref="/admin"
        actionLabel="Inapoi la admin"
      />
    );
  }

  return (
    <>
      <Head>
        <title>Role play feedback | JustProveIt</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-950">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin" className="text-lg font-extrabold">
                Just<span className="text-emerald-700">ProveIt</span>
              </Link>
              <p className="mt-1 text-sm text-slate-600">Role play feedback</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Admin
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,0.66fr)_minmax(320px,0.34fr)]">
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Feedback training
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-normal">
                Role play pensii
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Tabara este citita automat din profilul CRM. Completeaza scenariile permise si trimite feedback pe email dupa fiecare scenariu.
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Date sesiune</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Agent evaluat"
                  value={agentName}
                  onChange={setAgentName}
                  placeholder="Nume agent"
                />
                <TextInput
                  label="Email agent"
                  type="email"
                  value={agentEmail}
                  onChange={setAgentEmail}
                  placeholder="agent@example.com"
                />
                <TextInput
                  label="Evaluator"
                  value={reviewerName}
                  onChange={setReviewerName}
                  placeholder="Nume evaluator"
                />
                <TextInput
                  label="Email evaluator"
                  type="email"
                  value={reviewerEmail}
                  onChange={setReviewerEmail}
                  placeholder="evaluator@example.com"
                />
                <TextInput
                  label="Data sesiune"
                  type="date"
                  value={sessionDate}
                  onChange={setSessionDate}
                />
                <ProfileGroupPanel feedbackGroup={feedbackGroup} />
              </div>
            </section>

            {feedbackGroup ? (
              <section className="space-y-4">
                {activeScenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.id}
                    scenario={scenario}
                    state={scenarioStates[scenario.id]}
                    sending={sendingScenarioId === scenario.id}
                    message={scenarioMessages[scenario.id]}
                    onRoleChange={(role) => updateScenarioRole(scenario.id, role)}
                    onCheckpointChange={(checkpointId, value) =>
                      updateCheckpoint(scenario.id, checkpointId, value)
                    }
                    onNotesChange={(notes) => updateScenarioNotes(scenario.id, notes)}
                    onSend={() => handleSendScenarioFeedback(scenario)}
                  />
                ))}
              </section>
            ) : (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <h2 className="text-lg font-extrabold">Tabara lipseste din profilul CRM</h2>
                <p className="mt-2 text-sm leading-6">
                  Pentru acest tool, LaunchingStack trebuie sa returneze `rolePlayFeedbackGroup`
                  cu valoarea `A` sau `B` in profilul userului CRM. Dupa actualizare, delogare/login
                  sau refresh de sesiune va incarca scenariile corecte.
                </p>
              </section>
            )}

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Debrief final</h2>
              <div className="mt-4 grid gap-4">
                <TextareaInput
                  label="Ce a mers bine"
                  value={strengths}
                  onChange={setStrengths}
                  placeholder="Ex: a ramas calm, a pus intrebarile in ordine, a explicat pretul clar..."
                />
                <TextareaInput
                  label="Ce trebuie imbunatatit"
                  value={improvements}
                  onChange={setImprovements}
                  placeholder="Ex: sa foloseasca cifrele exacte, sa nu promita rezultat cert..."
                />
                <TextareaInput
                  label="Observatii generale"
                  value={overallNotes}
                  onChange={setOverallNotes}
                  placeholder="Note suplimentare pentru agent."
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Sumar live
              </p>
              <p className="mt-2 inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                {feedbackGroup
                  ? `Tabara ${feedbackGroup}: ${formatScenarioRange(activeScenarios)}`
                  : "Tabara nesetata"}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold">{summary.scorePercent}%</h2>
              <p className="mt-1 text-sm text-slate-600">
                {summary.completedItems}/{summary.totalItems} puncte completate
              </p>
              {!feedbackGroup ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  Tabara A/B trebuie setata in profilul CRM.
                </p>
              ) : summary.missingItems > 0 ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                  Mai lipsesc {summary.missingItems} raspunsuri.
                </p>
              ) : (
                <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  Toate punctele sunt completate.
                </p>
              )}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-bold">
                <MetricPill label="Da" value={summary.yes} tone="yes" />
                <MetricPill label="Partial" value={summary.partial} tone="partial" />
                <MetricPill label="Nu" value={summary.no} tone="no" />
                <MetricPill label="N/A" value={summary.notApplicable} tone="na" />
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Trimite grupa</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {feedbackGroup
                  ? `Emailul de grup include doar scenariile din tabara ${feedbackGroup}. Pentru feedback imediat, foloseste butonul de pe fiecare scenariu.`
                  : "Emailul poate fi trimis dupa ce tabara A/B este setata in profilul CRM."}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  disabled={sending || !feedbackGroup}
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sending
                    ? "Trimit feedback..."
                    : feedbackGroup
                      ? `Trimite tabara ${feedbackGroup} pe email`
                      : "Tabara nesetata"}
                </button>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  Copiaza sumar
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex w-full items-center justify-center rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-800 hover:bg-red-50"
                >
                  Reseteaza formularul
                </button>
              </div>
              {submitMessage ? (
                <ActionMessage status={submitStatus}>{submitMessage}</ActionMessage>
              ) : null}
              {copyMessage ? (
                <p className="mt-3 text-sm font-semibold text-slate-600">{copyMessage}</p>
              ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold">Preview email</h2>
              <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                {summaryText}
              </pre>
            </section>
          </aside>
        </main>
      </div>
    </>
  );
}

function ScenarioCard({
  scenario,
  state,
  sending,
  message,
  onRoleChange,
  onCheckpointChange,
  onNotesChange,
  onSend,
}: {
  scenario: ScenarioDefinition;
  state: ScenarioState;
  sending: boolean;
  message?: { status: ActionStatus; message: string };
  onRoleChange: (role: RolePlayParticipantRole) => void;
  onCheckpointChange: (checkpointId: string, value: RolePlayFeedbackStatus) => void;
  onNotesChange: (notes: string) => void;
  onSend: () => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            {scenario.title}
          </p>
          <h2 className="mt-1 text-lg font-extrabold">{scenario.focus}</h2>
        </div>
        <label className="block min-w-44">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Rol in runda
          </span>
          <select
            value={state.participantRole}
            onChange={(event) => onRoleChange(event.target.value as RolePlayParticipantRole)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {scenario.checkpoints.map((checkpoint) => (
          <CheckpointRow
            key={checkpoint.id}
            checkpoint={checkpoint}
            value={state.checkpoints[checkpoint.id]}
            onChange={(value) => onCheckpointChange(checkpoint.id, value)}
          />
        ))}
      </div>

      <TextareaInput
        label="Feedback / exemple concrete"
        value={state.notes}
        onChange={onNotesChange}
        placeholder="Noteaza exemple scurte din runda."
        className="mt-4"
      />
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">
          Trimite feedback-ul pentru acest scenariu imediat dupa runda.
        </p>
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {sending ? "Trimit..." : `Trimite ${scenario.title}`}
        </button>
      </div>
      {message?.message ? (
        <ActionMessage status={message.status}>{message.message}</ActionMessage>
      ) : null}
    </article>
  );
}

function CheckpointRow({
  checkpoint,
  value,
  onChange,
}: {
  checkpoint: CheckpointDefinition;
  value: FormFeedbackStatus;
  onChange: (value: RolePlayFeedbackStatus) => void;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <p className="text-sm font-semibold leading-6 text-slate-800">{checkpoint.label}</p>
      <div className="grid grid-cols-4 gap-1">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={statusButtonClass(option.value, value === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileGroupPanel({ feedbackGroup }: { feedbackGroup: RolePlayFeedbackGroup | "" }) {
  return (
    <div
      className={`rounded-md border px-4 py-3 md:col-span-2 ${
        feedbackGroup
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="text-sm font-extrabold">
        {feedbackGroup ? `Tabara ${feedbackGroup}` : "Tabara nesetata"}
      </p>
      <p className="mt-1 text-xs font-semibold">
        {feedbackGroup
          ? `Setata automat din profilul CRM: scenariile ${feedbackGroup === "A" ? "1, 2, 3" : "4, 5, 6"}.`
          : "Profilul CRM trebuie sa contina rolePlayFeedbackGroup cu valoarea A sau B."}
      </p>
    </div>
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

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: RolePlayFeedbackStatus;
}) {
  return (
    <div className={`rounded-md border px-2 py-3 ${statusToneClass(tone)}`}>
      <p>{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}

function ActionMessage({
  status,
  children,
}: {
  status: ActionStatus;
  children: string;
}) {
  return (
    <p
      aria-live="polite"
      className={`mt-4 rounded-md border px-3 py-2 text-sm font-semibold ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {children}
    </p>
  );
}

function AuthGateShell({
  title,
  message,
  actionHref = "/login",
  actionLabel = "Autentificare",
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950">
      <Head>
        <title>{`${title} | JustProveIt`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
}

function createInitialScenarioStates() {
  return Object.fromEntries(
    SCENARIOS.map((scenario) => [scenario.id, createScenarioState(scenario)]),
  ) as Record<string, ScenarioState>;
}

function createScenarioState(scenario: ScenarioDefinition): ScenarioState {
  return {
    participantRole: scenario.defaultRole,
    checkpoints: Object.fromEntries(
      scenario.checkpoints.map((checkpoint) => [checkpoint.id, ""]),
    ) as Record<string, FormFeedbackStatus>,
    notes: "",
  };
}

function calculateSummary(
  states: Record<string, ScenarioState>,
  scenarios: ScenarioDefinition[],
): SummaryCounts {
  const counts: SummaryCounts = {
    totalItems: 0,
    completedItems: 0,
    missingItems: 0,
    yes: 0,
    partial: 0,
    no: 0,
    notApplicable: 0,
    scorePercent: 0,
  };

  scenarios.forEach((scenario) => {
    const state = states[scenario.id];
    scenario.checkpoints.forEach((checkpoint) => {
      counts.totalItems += 1;
      const value = state?.checkpoints[checkpoint.id] || "";

      if (!value) {
        counts.missingItems += 1;
        return;
      }

      counts.completedItems += 1;
      if (value === "yes") {
        counts.yes += 1;
      } else if (value === "partial") {
        counts.partial += 1;
      } else if (value === "no") {
        counts.no += 1;
      } else {
        counts.notApplicable += 1;
      }
    });
  });

  const scoredItems = counts.yes + counts.partial + counts.no;
  counts.scorePercent = scoredItems
    ? Math.round(((counts.yes + counts.partial * 0.5) / scoredItems) * 100)
    : 0;

  return counts;
}

function validateFeedbackForm({
  feedbackGroup,
  agentName,
  agentEmail,
  reviewerName,
  sessionDate,
  scenarioStates,
  scenarios,
}: {
  feedbackGroup: RolePlayFeedbackGroup | "";
  agentName: string;
  agentEmail: string;
  reviewerName: string;
  sessionDate: string;
  scenarioStates: Record<string, ScenarioState>;
  scenarios: ScenarioDefinition[];
}) {
  if (!feedbackGroup) {
    return "Tabara A/B lipseste din profilul CRM al evaluatorului.";
  }

  if (!agentName.trim()) {
    return "Completeaza numele agentului evaluat.";
  }

  if (!isValidEmail(agentEmail)) {
    return "Completeaza un email valid pentru agent.";
  }

  if (!reviewerName.trim()) {
    return "Completeaza numele evaluatorului.";
  }

  if (!sessionDate) {
    return "Completeaza data sesiunii.";
  }

  const missingCount = scenarios.reduce((count, scenario) => {
    const state = scenarioStates[scenario.id];
    return (
      count +
      scenario.checkpoints.filter((checkpoint) => !state?.checkpoints[checkpoint.id]).length
    );
  }, 0);

  if (missingCount > 0) {
    return `Completeaza toate punctele de feedback inainte de trimitere. Lipsesc ${missingCount} raspunsuri.`;
  }

  return "";
}

function validateScenarioFeedbackForm({
  feedbackGroup,
  agentName,
  agentEmail,
  reviewerName,
  sessionDate,
  scenario,
  scenarioState,
}: {
  feedbackGroup: RolePlayFeedbackGroup | "";
  agentName: string;
  agentEmail: string;
  reviewerName: string;
  sessionDate: string;
  scenario: ScenarioDefinition;
  scenarioState: ScenarioState;
}) {
  if (!feedbackGroup) {
    return "Tabara A/B lipseste din profilul CRM al evaluatorului.";
  }

  if (!agentName.trim()) {
    return "Completeaza numele agentului evaluat.";
  }

  if (!isValidEmail(agentEmail)) {
    return "Completeaza un email valid pentru agent.";
  }

  if (!reviewerName.trim()) {
    return "Completeaza numele evaluatorului.";
  }

  if (!sessionDate) {
    return "Completeaza data sesiunii.";
  }

  const missingCount = scenario.checkpoints.filter(
    (checkpoint) => !scenarioState?.checkpoints[checkpoint.id],
  ).length;

  if (missingCount > 0) {
    return `Completeaza toate punctele din ${scenario.title} inainte de trimitere. Lipsesc ${missingCount} raspunsuri.`;
  }

  return "";
}

function buildScenarioPayload(
  states: Record<string, ScenarioState>,
  scenarios: ScenarioDefinition[],
) {
  return scenarios.map((scenario) => {
    const state = states[scenario.id];

    return {
      id: scenario.id,
      title: `${scenario.title} - ${scenario.focus}`,
      group: scenario.group,
      participantRole: state.participantRole,
      feedbackItems: scenario.checkpoints.map((checkpoint) => ({
        id: checkpoint.id,
        label: checkpoint.label,
        status: state.checkpoints[checkpoint.id] as RolePlayFeedbackStatus,
      })),
      notes: state.notes.trim() || undefined,
    };
  });
}

function buildSummaryText({
  feedbackGroup,
  scenarios,
  agentName,
  agentEmail,
  reviewerName,
  reviewerEmail,
  sessionDate,
  scenarioStates,
  summary,
  strengths,
  improvements,
  overallNotes,
}: {
  feedbackGroup: RolePlayFeedbackGroup | "";
  scenarios: ScenarioDefinition[];
  agentName: string;
  agentEmail: string;
  reviewerName: string;
  reviewerEmail: string;
  sessionDate: string;
  scenarioStates: Record<string, ScenarioState>;
  summary: SummaryCounts;
  strengths: string;
  improvements: string;
  overallNotes: string;
}) {
  const lines = [
    "Role play feedback - pensii",
    "",
    `Tabara: ${feedbackGroup ? `${feedbackGroup} (${formatScenarioRange(scenarios)})` : "-"}`,
    `Agent: ${agentName.trim() || "-"}`,
    `Email agent: ${agentEmail.trim() || "-"}`,
    `Evaluator: ${reviewerName.trim() || "-"}`,
    `Email evaluator: ${reviewerEmail.trim() || "-"}`,
    `Data sesiune: ${sessionDate || "-"}`,
    "",
    `Scor: ${summary.scorePercent}%`,
    `Puncte completate: ${summary.completedItems}/${summary.totalItems}`,
    `Da: ${summary.yes} | Partial: ${summary.partial} | Nu: ${summary.no} | N/A: ${summary.notApplicable}`,
    "",
  ];

  scenarios.forEach((scenario) => {
    const state = scenarioStates[scenario.id];
    lines.push(`${scenario.title} - ${scenario.focus}`);
    lines.push(`Rol in runda: ${formatRole(state.participantRole)}`);
    scenario.checkpoints.forEach((checkpoint) => {
      const value = state.checkpoints[checkpoint.id];
      lines.push(`- ${checkpoint.label} ${value ? STATUS_LABELS[value] : "Lipsa"}`);
    });
    if (state.notes.trim()) {
      lines.push(`Note: ${state.notes.trim()}`);
    }
    lines.push("");
  });

  lines.push("Ce a mers bine:");
  lines.push(strengths.trim() || "-");
  lines.push("");
  lines.push("Ce trebuie imbunatatit:");
  lines.push(improvements.trim() || "-");
  lines.push("");
  lines.push("Observatii generale:");
  lines.push(overallNotes.trim() || "-");

  return lines.join("\n");
}

function getBrowserContext() {
  if (typeof window === "undefined") {
    return {
      domain: "www.justproveit.co.uk",
      pageUrl: `https://www.justproveit.co.uk${PAGE_PATH}`,
      referrer: "",
    };
  }

  return {
    domain: window.location.hostname || "www.justproveit.co.uk",
    pageUrl: window.location.href,
    referrer: document.referrer || "",
  };
}

function statusButtonClass(status: RolePlayFeedbackStatus, selected: boolean) {
  const base =
    "min-h-10 rounded-md border px-2 text-xs font-extrabold transition focus:outline-none focus:ring-2 focus:ring-emerald-100";

  if (!selected) {
    return `${base} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`;
  }

  return `${base} ${statusToneClass(status)}`;
}

function statusToneClass(status: RolePlayFeedbackStatus) {
  switch (status) {
    case "yes":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "partial":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "no":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function formatRole(role: RolePlayParticipantRole) {
  switch (role) {
    case "agent":
      return "Agent";
    case "client":
      return "Client";
    default:
      return "Observator";
  }
}

function formatScenarioRange(scenarios: ScenarioDefinition[]) {
  return scenarios.map((scenario) => scenario.title.replace("Scenariul ", "")).join("/");
}

function readRolePlayFeedbackGroup(user: unknown): RolePlayFeedbackGroup | "" {
  const candidates = [
    readStringField(user, "rolePlayFeedbackGroup"),
    readNestedStringField(user, "crmProfile", "rolePlayFeedbackGroup"),
  ];

  for (const candidate of candidates) {
    const normalized = candidate.trim().toUpperCase();
    if (normalized === "A" || normalized === "B") {
      return normalized;
    }
  }

  return "";
}

function readStringField(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) {
    return "";
  }

  const fieldValue = (value as Record<string, unknown>)[key];
  return typeof fieldValue === "string" ? fieldValue : "";
}

function readNestedStringField(value: unknown, parentKey: string, childKey: string) {
  if (!value || typeof value !== "object" || !(parentKey in value)) {
    return "";
  }

  return readStringField((value as Record<string, unknown>)[parentKey], childKey);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
