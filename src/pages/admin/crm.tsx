import { useAuth } from "@/context/AuthContext";
import {
  CrmLead,
  CrmSale,
  findCrmLeadByPhone,
  insertManualCrmLead,
  listCrmLeads,
  listCrmSales,
  queueCrmSmsSequence,
  updateCrmLead,
} from "@/lib/crmAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";

type TabKey = "details" | "new" | "sales" | "personal" | "all" | "manual";
type GateStatus = "checking" | "allowed" | "denied";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "details", label: "Detalii Lead" },
  { key: "new", label: "Lead Nou" },
  { key: "sales", label: "Arata Vanzarile" },
  { key: "personal", label: "Potentiali Clienti" },
  { key: "all", label: "All Leads CRM" },
  { key: "manual", label: "Send Manual Email/SMS" },
];

const STATUS_OPTIONS = [
  "new lead",
  "nowinnofee",
  "ademaratsingur",
  "A_Demarat_CMC",
  "noqualify",
  "clientexistent",
  "donotcall",
  "CallBackStabilit",
  "HotLead",
  "SALE",
  "NuDoresteServiciul",
];

const LANGUAGE_OPTIONS = ["Romanian", "English", "Spanish", "Italian", "Polish", "Bulgarian"];

const EMAIL_SEQUENCE_OPTIONS = [
  { label: "Vrea Sa Cumpere Acum", value: "CallBack_EmailDeSumarizare" },
  { label: "CF_Se_Mai_Gandeste_schema", value: "CF_Se_Mai_Gandeste_schema" },
  { label: "CF_A_DEMARAT_SINGUR", value: "CF_A_DEMARAT_SINGUR" },
  { label: "CF_DEMARAT_CMC", value: "CF_DEMARAT_CMC" },
  { label: "VREA_OUT_CMC", value: "VREA_OUT_CMC" },
];

const FINANCE_COMPANIES = [
  "MotoNovo",
  "BlackHorse",
  "Close Brothers",
  "Santander",
  "Barclays Partner Finance",
  "Moneybarn",
  "MoneyWay",
  "Volkswagen Financial Services",
  "Advantage Finance",
  "Alphera",
  "Blue Motor Finance",
  "Vauxhall Finance",
  "Mercedes Benz Finance",
  "BMW Financial Services",
  "Creation Finance",
  "Northridge Finance",
  "First Response",
  "MannIsland",
  "Oodle Car Finance",
  "Starline Motor Finance",
  "Toyota Financial Service",
  "Car Finance 247",
  "Stellantis",
  "Billing Finance",
  "KIA FINANCE",
  "1st Stop Car Finance",
  "Audi Financial Services",
  "Hitachi Capital sau Novuna",
  "Paragon",
  "247 Money",
  "Admiral",
  "Aldermore Bank Plc",
  "Autolend",
  "Auto Money Motor Finance",
  "Bamboo",
  "Burnley Saving and Loans Finance",
  "C A Finance",
  "CarCashPoint",
  "CarMoney",
  "Carmoola",
  "Car Loans 365",
  "Conister Bank",
  "Evolution Loans",
  "Family Finance",
  "FCA Automotive Services",
  "FCE Bank Plc",
  "Finio Loans",
  "Ford Credit Europe",
  "Go Car Credit",
  "GMAC UK PLC",
  "Honda Financial Services",
  "Hyundai Financial Services",
  "Hanwells Financial",
  "Hartwell Financial",
  "IN-SYNC Group Ltd",
  "Jaguar Financial Services",
  "JBR Capital",
  "Kia Financial Services",
  "Land Rover Financial Services",
  "Lendable",
  "Lombard Asset Finance",
  "Lexus Financial Services",
  "Mallard Finance",
  "Marsh Finance",
  "MI Finance",
  "Mobilize",
  "PCF Bank",
  "PSA Finance",
  "Premium Plan",
  "Powerlease",
  "Redline Finance",
  "RateSetter",
  "R Raphael and Sons Plc.",
  "RCI (Mobilize)",
  "Shawbrook Bank",
  "Specialist Motor Finance",
  "Startline Motor Finance",
  "Suzuki Financial Services",
  "Tandem",
  "Tesla Finance",
  "Time Finance",
  "Unity Auto Finance",
  "V12 Vehicle Finance",
  "Volvo Financial Services",
  "Zopa",
  "Altul",
  "Nu stiu",
];

function blankLead(): CrmLead {
  return {
    fullName: "",
    phoneNumber: "",
    email: "",
    secondaryemail: "",
    statusOriginal: "new lead",
    language: "",
    observation: "",
    financeCompany: "",
    year: "",
    nrInmatriculare: "",
  };
}

function mergeCurrentOption(options: string[], current?: string | null) {
  const value = String(current || "").trim();
  if (!value || options.some((option) => option.toLowerCase() === value.toLowerCase())) {
    return options;
  }

  return [value, ...options];
}

export default function AdminCrmPage() {
  const router = useRouter();
  const { status, user, token, isAdmin, requireAdmin } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [activeTabState, setActiveTabState] = useState<TabKey>("details");
  const [selectedLead, setSelectedLead] = useState<CrmLead>(() => blankLead());
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function checkAdminAccess() {
      setGateStatus("checking");
      setGateError("");

      if (!isAdmin) {
        setGateStatus("denied");
        setGateError("The logged-in user profile does not include tenant-admin access.");
        return;
      }

      const result = await requireAdmin();

      if (!cancelled) {
        setGateStatus(result.allowed ? "allowed" : "denied");
        setGateError(result.error ?? "");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, requireAdmin, router, status]);

  const agentName = user?.name || user?.email || "";
  const queryTab = String(router.query.tab ?? "");
  const activeTab = TABS.some((item) => item.key === queryTab)
    ? (queryTab as TabKey)
    : activeTabState;

  function handleTabChange(nextTab: TabKey) {
    setActiveTabState(nextTab);
    setErrorMessage("");
    setStatusMessage("");
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: nextTab },
      },
      undefined,
      { shallow: true },
    );
  }

  function handleLeadSelected(lead: CrmLead) {
    setSelectedLead(lead);
    setActiveTabState("details");
    setStatusMessage("Lead incarcat.");
    setErrorMessage("");
  }

  return (
    <>
      <Head>
        <title>CRM | JustProveIt Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="crm-page">
        <TopNav />

        <section className="crm-toolbar" aria-label="CRM sections">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "toolbar-btn active" : "toolbar-btn"}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </section>

        {gateStatus === "checking" ? <StatusCard message="Checking admin access..." /> : null}
        {gateStatus === "denied" ? (
          <StatusCard
            title="Admin access required"
            message={gateError || "LaunchingStack did not confirm tenant admin access."}
          />
        ) : null}

        {gateStatus === "allowed" && token ? (
          <>
            {errorMessage ? <p className="crm-alert error">{errorMessage}</p> : null}
            {statusMessage ? <p className="crm-alert success">{statusMessage}</p> : null}

            {activeTab === "details" ? (
              <LeadDetailsPanel
                token={token}
                agentName={agentName}
                lead={selectedLead}
                onLeadChange={setSelectedLead}
                onStatus={setStatusMessage}
                onError={setErrorMessage}
              />
            ) : null}

            {activeTab === "new" ? (
              <NewLeadPanel
                token={token}
                agentName={agentName}
                onCreated={(lead) => {
                  setSelectedLead(lead);
                  setActiveTabState("details");
                  setStatusMessage("Lead adaugat.");
                }}
                onError={setErrorMessage}
              />
            ) : null}

            {activeTab === "sales" ? (
              <SalesPanel token={token} onError={setErrorMessage} />
            ) : null}

            {activeTab === "personal" ? (
              <LeadListPanel
                token={token}
                title="Potentiali clienti - lista personala"
                mine
                agentName={agentName}
                onSelectLead={handleLeadSelected}
                onError={setErrorMessage}
              />
            ) : null}

            {activeTab === "all" ? (
              <AllLeadsPanel
                token={token}
                onSelectLead={handleLeadSelected}
                onError={setErrorMessage}
              />
            ) : null}

            {activeTab === "manual" ? <ManualEmailSmsPanel /> : null}
          </>
        ) : null}

        <InfoBand />
        <FooterBand />
      </main>

      <style jsx global>{`
        body {
          background: #ffffff;
        }
      `}</style>
      <style jsx>{`
        .crm-page {
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
        }

        .crm-toolbar {
          width: min(1030px, calc(100vw - 40px));
          margin: 20px auto 0;
          border-radius: 14px 14px 0 0;
          background: #0c389d;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          padding: 24px 30px;
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .toolbar-btn {
          min-width: 137px;
          height: 31px;
          border: 0;
          border-radius: 4px;
          background: #ff4b26;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .toolbar-btn.active {
          background: #fff;
          color: #ff4b26;
          border: 1px solid #ff4b26;
        }

        .crm-alert {
          width: min(760px, calc(100vw - 32px));
          margin: 14px auto 0;
          font-size: 14px;
          font-weight: 700;
        }

        .crm-alert.success {
          color: #008a1e;
        }

        .crm-alert.error {
          color: #b00020;
        }

        @media (max-width: 760px) {
          .crm-toolbar {
            width: calc(100vw - 20px);
            padding: 16px 12px;
            gap: 10px;
          }

          .toolbar-btn {
            min-width: 0;
            width: calc(50% - 6px);
          }
        }
      `}</style>
    </>
  );
}

function TopNav() {
  return (
    <header className="top-nav">
      <Link href="/" className="brand">
        <span className="brand-mark">ProveIt</span>
      </Link>
      <select className="language-switch" defaultValue="RO" aria-label="Language">
        <option>RO</option>
        <option>EN</option>
        <option>ES</option>
        <option>IT</option>
      </select>
      <nav>
        <Link href="/">Recuperare Dobanda</Link>
        <Link href="/">Gaseste-mi pensia</Link>
        <Link href="/">Ghiduri</Link>
        <Link href="/">Servicii</Link>
        <Link href="/admin">More</Link>
      </nav>

      <style jsx>{`
        .top-nav {
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
          font-weight: 700;
        }

        .brand {
          color: #79a9ff;
          text-decoration: none;
          font-weight: 800;
        }

        .brand-mark {
          display: inline-block;
          color: #75a8ff;
        }

        .language-switch {
          width: 84px;
          height: 32px;
          border: 1px solid #ff4b26;
          border-radius: 18px;
          background: #fff;
          color: #111;
          font-size: 12px;
          text-align: center;
        }

        nav {
          display: flex;
          align-items: center;
          gap: 0;
        }

        nav :global(a) {
          color: #000;
          text-decoration: none;
          padding: 0 14px;
          border-left: 1px solid #111;
        }

        nav :global(a:first-child) {
          border-left: 0;
        }

        @media (max-width: 850px) {
          nav {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

function StatusCard({ title, message }: { title?: string; message: string }) {
  return (
    <section className="status-card">
      {title ? <h1>{title}</h1> : null}
      <p>{message}</p>
      <style jsx>{`
        .status-card {
          width: min(760px, calc(100vw - 32px));
          margin: 24px auto 240px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
        }
        h1 {
          margin: 0 0 8px;
          font-size: 24px;
        }
        p {
          margin: 0;
          font-weight: 700;
        }
      `}</style>
    </section>
  );
}

function LeadDetailsPanel({
  token,
  agentName,
  lead,
  onLeadChange,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  lead: CrmLead;
  onLeadChange: (lead: CrmLead) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<CrmLead>(lead);
  const [newObservation, setNewObservation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [smsBusy, setSmsBusy] = useState<"buy" | "skeptic" | "">("");

  useEffect(() => {
    setDraft(lead);
    setNewObservation("");
    setNewEmail("");
  }, [lead]);

  async function handlePhoneLookup() {
    if (!token || !draft.phoneNumber) {
      return;
    }

    try {
      const result = await findCrmLeadByPhone(token, draft.phoneNumber);
      if (result.lead) {
        setDraft(result.lead);
        onLeadChange(result.lead);
        onStatus("Lead gasit dupa telefon.");
        onError("");
      } else {
        onStatus("");
        onError("Nu am gasit lead dupa telefon.");
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut cauta lead-ul.");
    }
  }

  async function handleSave() {
    const id = draft.id || draft.wixId || draft._id;
    if (!id) {
      onError("Selecteaza sau cauta un lead inainte de salvare.");
      return;
    }

    setSaving(true);
    try {
      const payloadEmail = newEmail.trim() || draft.email || "";
      const result = await updateCrmLead(token, id, {
        observation: newObservation,
        financeCompany: draft.financeCompany || "",
        statusOriginal: draft.statusOriginal || "",
        language: draft.language || "",
        year: draft.year || "",
        nrInmatriculare: draft.nrInmatriculare || "",
        dataUrmatorContact: draft.dataUrmatorContact || null,
        email: payloadEmail,
        agent: agentName,
      });
      setDraft(result.lead);
      onLeadChange(result.lead);
      setNewObservation("");
      setNewEmail("");
      onStatus("Observatia a fost salvata.");
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut salva lead-ul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEmail() {
    if (!newEmail.trim()) {
      onError("Completeaza emailul nou inainte de salvare.");
      return;
    }

    await handleSave();
  }

  async function handleSmsSequence(type: "buy" | "skeptic") {
    const id = draft.id || draft.wixId || draft._id;
    if (!id) {
      onError("Selecteaza sau cauta un lead inainte de SMS.");
      return;
    }

    setSmsBusy(type);
    try {
      const result = await queueCrmSmsSequence(token, id, {
        type,
        agent: agentName,
      });
      setDraft(result.lead);
      onLeadChange(result.lead);
      onStatus(`SMS ${type === "buy" ? "CUMPARA" : "SCEPTIC"} adaugat pe secventa.`);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut adauga SMS-ul pe secventa.");
    } finally {
      setSmsBusy("");
    }
  }

  const financeOptions = mergeCurrentOption(FINANCE_COMPANIES, draft.financeCompany);
  const statusOptions = mergeCurrentOption(STATUS_OPTIONS, draft.statusOriginal);

  return (
    <CrmCard title="Detalii client" className="details-card">
      <div className="lookup-row">
        <input
          value={draft.phoneNumber ?? ""}
          onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
          placeholder="Cauta dupa telefon..."
        />
        <button type="button" className="orange small" onClick={handlePhoneLookup}>
          Cauta Lead
        </button>
      </div>

      <div className="detail-grid">
        <LabelValue label="Nume:" value={draft.fullName} />
        <LabelValue label="Este client?" value={draft.isCustomer} />
        <LabelValue label="Telefon:" value={draft.phoneNumber} />
        <LabelValue label="Actiune:" value={draft.statusOriginal} />
        <LabelValue label="Email:" value={draft.email} />
        <LabelValue label="Data lead:" value={formatDate(draft.leadDate)} />
        <LabelValue label="Email2:" value={draft.secondaryemail} />
        <span />
        <LabelValue label="Agent Initial" value={draft.initialAgent} />
        <LabelValue label="Ultimul Agent" value={draft.lastAgent} />
      </div>

      <hr />

      <div className="form-grid three">
        <label>
          Numar inmatriculare
          <input
            value={draft.nrInmatriculare ?? ""}
            onChange={(event) => setDraft({ ...draft, nrInmatriculare: event.target.value })}
          />
        </label>
        <label>
          Anul achizitiei
          <input
            value={draft.year ?? ""}
            onChange={(event) => setDraft({ ...draft, year: event.target.value })}
          />
        </label>
        <label>
          Firma finantare
          <select
            value={draft.financeCompany ?? ""}
            onChange={(event) => setDraft({ ...draft, financeCompany: event.target.value })}
          >
            <option value="">Firma de finantare</option>
            {financeOptions.map((company) => (
              <option key={company}>{company}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="inline-fields">
        <label>
          Limba
          <select
            value={draft.language ?? ""}
            onChange={(event) => setDraft({ ...draft, language: event.target.value })}
          >
            <option value="">Language</option>
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </select>
        </label>
        <label>
          Adauga email nou
          <input
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="Adauga email nou"
          />
        </label>
        <button type="button" className="orange small" onClick={handleAddEmail} disabled={saving}>
          Adauga Email
        </button>
      </div>

      <label className="wide-label">
        Observatii curente:
        <textarea
          value={newObservation}
          onChange={(event) => setNewObservation(event.target.value)}
          placeholder="Ce se intampla mai departe?"
        />
      </label>

      <button type="button" className="orange save" onClick={handleSave} disabled={saving}>
        {saving ? "Se salveaza..." : "Salveaza Observatie"}
      </button>

      <label className="wide-label previous">
        Informatii precedente:
        <div className="previous-log">{draft.observation || "Nu exista informatii precedente."}</div>
      </label>

      <div className="sequence-row">
        <select defaultValue="">
          <option value="">Secventa de email</option>
          {EMAIL_SEQUENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="orange small">Pune Client pe secventa</button>
      </div>

      <p className="green-label">Rezultat actiune:</p>
      <div className="sms-row">
        <button
          type="button"
          className="green"
          onClick={() => handleSmsSequence("buy")}
          disabled={Boolean(smsBusy)}
        >
          {smsBusy === "buy" ? "Se adauga..." : "SMS - CUMPARA"}
        </button>
        <button
          type="button"
          className="blue"
          onClick={() => handleSmsSequence("skeptic")}
          disabled={Boolean(smsBusy)}
        >
          {smsBusy === "skeptic" ? "Se adauga..." : "SMS - SCEPTIC"}
        </button>
      </div>

      <p className="green-label">Rezultat actiune:</p>
      <div className="finish-row">
        <label>
          Status:
          <select
            value={draft.statusOriginal ?? ""}
            onChange={(event) => setDraft({ ...draft, statusOriginal: event.target.value })}
          >
            <option value="">Status</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label>
          Data urmator contact
          <input
            type="date"
            value={toInputDate(draft.dataUrmatorContact)}
            onChange={(event) => setDraft({ ...draft, dataUrmatorContact: event.target.value })}
          />
        </label>
        <label>
          Choose a time
          <input type="time" />
        </label>
        <button type="button" className="orange small" onClick={handleSave}>
          Termina Cazul
        </button>
      </div>

      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function NewLeadPanel({
  token,
  agentName,
  onCreated,
  onError,
}: {
  token: string;
  agentName: string;
  onCreated: (lead: CrmLead) => void;
  onError: (message: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await insertManualCrmLead(token, {
        fullName,
        email,
        phoneNumber,
        language,
        agent: agentName,
      });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setLanguage("");
      onCreated(result.lead);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut adauga lead-ul.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="new-lead">
      <h1>Adauga Lead Nou</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nume complet *
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="First Name" />
        </label>
        <label>
          email *
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email..." />
        </label>
        <label>
          Phone *
          <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Template" />
        </label>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="">Language</option>
          {LANGUAGE_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button type="submit" className="orange" disabled={saving}>
          {saving ? "Se adauga..." : "Adauga Lead"}
        </button>
      </form>

      <style jsx>{`
        .new-lead {
          width: 330px;
          margin: 24px auto 100px;
          text-align: left;
        }
        h1 {
          margin: 0 0 6px;
          text-align: center;
          font-size: 36px;
          color: #444;
          font-weight: 800;
        }
        form {
          display: grid;
          gap: 12px;
        }
        label {
          display: grid;
          gap: 5px;
          font-size: 12px;
          font-weight: 700;
        }
        input,
        select {
          height: 32px;
          border: 1px solid #444;
          padding: 0 10px;
          font-size: 12px;
        }
        select {
          margin-top: 6px;
          border-radius: 4px;
          background: white;
        }
        .orange {
          margin-top: 8px;
          height: 34px;
          border: 0;
          background: #ff4b26;
          color: white;
          font-weight: 800;
        }
      `}</style>
    </section>
  );
}

function SalesPanel({ token, onError }: { token: string; onError: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sales, setSales] = useState<CrmSale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSales() {
    setLoading(true);
    try {
      const result = await listCrmSales(token, { email, phone, limit: 50 });
      setSales(result.sales);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca vanzarile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="Clienti - ultimele 50 de vanzari" className="wide-card">
      <div className="filter-grid sales-filter">
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
        <button type="button" className="orange small" onClick={loadSales}>
          Filter
        </button>
        <label>Telefon:</label>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>
      <DataTable
        columns={["Name", "Phone", "email", "Suma", "Data", "Proprietar MVP", "DialerFirst", "DialerLast"]}
        rows={sales.map((sale) => [
          sale.name,
          sale.phone,
          sale.email,
          formatMoney(sale.amountTotalMajor),
          formatDate(sale.wixCreatedDateUtc),
          sale.storeowner || "N/A",
          sale.dialerowner || "",
          sale.dialerlast || "N/A",
        ])}
        loading={loading}
        minWidth={1100}
      />
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function LeadListPanel({
  token,
  title,
  mine,
  agentName,
  onSelectLead,
  onError,
}: {
  token: string;
  title: string;
  mine?: boolean;
  agentName?: string;
  onSelectLead: (lead: CrmLead) => void;
  onError: (message: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [phone, setPhone] = useState("");
  const [onlyMine, setOnlyMine] = useState(Boolean(mine));
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      const result = await listCrmLeads(token, {
        status: status || "all",
        phone,
        mine: onlyMine,
        agent: agentName,
        overdue: true,
        limit: 100,
      });
      setLeads(result.leads);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca lead-urile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title={title}>
      <div className="filter-grid personal-filter">
        <label>Status:</label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Status</option>
          <option value="all">all</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button type="button" className="orange small" onClick={loadLeads}>
          Filter
        </button>
        <label>Telefon:</label>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(event) => setOnlyMine(event.target.checked)}
          />
          Doar lead-urile mele
        </label>
      </div>
      <LeadTable leads={leads} loading={loading} onSelectLead={onSelectLead} personal />
      <button type="button" className="orange below">Arata Vanzarile</button>
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function AllLeadsPanel({
  token,
  onSelectLead,
  onError,
}: {
  token: string;
  onSelectLead: (lead: CrmLead) => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("");
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");

  async function loadLeads() {
    setLoading(true);
    try {
      const result = await listCrmLeads(token, {
        email,
        phone,
        language,
        status: "all",
        limit: 100,
      });
      setLeads(result.leads);
      setResultText(`${result.total} rezultate`);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca lead-urile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="Leads CRM - all">
      <div className="filter-grid all-filter">
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
        <button type="button" className="orange small" onClick={loadLeads}>
          Filter
        </button>
        <label>Telefon:</label>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        <label>Language</label>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="">Status</option>
          <option value="all">all</option>
          {LANGUAGE_OPTIONS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <p className="green-label">{resultText ? `Rezultat actiune: ${resultText}` : "Rezultat actiune:"}</p>
      <LeadTable leads={leads} loading={loading} onSelectLead={onSelectLead} />
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function ManualEmailSmsPanel() {
  return (
    <section className="manual-panel">
      <button type="button" className="orange title-btn">Send email</button>
      <form>
        {["email *", "First Name *", "Template *", "Param1", "Param2", "Param3", "Param4", "Param5"].map((label) => (
          <label key={label}>
            {label}
            <input placeholder={label.replace(" *", "")} />
          </label>
        ))}
      </form>
      <button type="button" className="orange title-btn sms">Send SMS</button>
      <label>
        Phone *
        <input placeholder="Phone..." />
      </label>
      <textarea placeholder="How can we do better next time?" />
      <style jsx>{`
        .manual-panel {
          width: min(650px, calc(100vw - 32px));
          margin: 42px auto 24px;
          display: grid;
          gap: 14px;
        }
        form {
          display: grid;
          gap: 14px;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
        }
        input {
          height: 32px;
          border: 1px solid #555;
          padding: 0 10px;
        }
        form label:nth-child(n + 4) input {
          width: min(650px, 100%);
        }
        form label:nth-child(-n + 3) input,
        .manual-panel > label input {
          width: 230px;
        }
        textarea {
          width: min(620px, 100%);
          height: 245px;
          border: 1px solid #555;
          padding: 12px;
        }
        .orange {
          width: 170px;
          height: 32px;
          border: 0;
          background: #ff4b26;
          color: #fff;
          font-weight: 800;
        }
        .sms {
          margin-top: 40px;
        }
      `}</style>
    </section>
  );
}

function LeadTable({
  leads,
  loading,
  onSelectLead,
  personal,
}: {
  leads: CrmLead[];
  loading: boolean;
  onSelectLead: (lead: CrmLead) => void;
  personal?: boolean;
}) {
  const columns = personal
    ? ["Name", "Phone", "NextContactDate", "Status", "Lead Date"]
    : ["Name", "Phone", "Agent", "Status", "Lead Date"];
  const rows = leads.map((lead) =>
    personal
      ? [
          lead.fullName,
          lead.phoneNumber,
          formatDate(lead.dataUrmatorContact),
          lead.statusOriginal,
          formatDate(lead.leadDate),
        ]
      : [
          lead.fullName,
          lead.phoneNumber,
          lead.lastAgent || lead.initialAgent,
          lead.statusOriginal,
          formatDate(lead.leadDate),
        ],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRowClick={(index) => onSelectLead(leads[index])}
      minWidth={personal ? 720 : 700}
    />
  );
}

function DataTable({
  columns,
  rows,
  loading,
  onRowClick,
  minWidth,
}: {
  columns: string[];
  rows: Array<Array<string | number | null | undefined>>;
  loading?: boolean;
  onRowClick?: (index: number) => void;
  minWidth?: number;
}) {
  return (
    <div className="table-wrap">
      <table style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length}>Se incarca...</td>
            </tr>
          ) : rows.length ? (
            rows.map((row, index) => (
              <tr
                key={`${index}-${row[0]}`}
                onClick={() => onRowClick?.(index)}
                className={onRowClick ? "clickable" : undefined}
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell ?? ""}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>&nbsp;</td>
            </tr>
          )}
        </tbody>
      </table>
      <style jsx>{`
        .table-wrap {
          width: 100%;
          max-height: 365px;
          overflow: auto;
          border: 4px solid #ff4b26;
          margin-top: 26px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: center;
        }
        th {
          height: 40px;
          background: #ff4b26;
          color: #fff;
          font-weight: 700;
          border-right: 2px solid #111;
        }
        td {
          height: 36px;
          border-right: 2px solid #111;
          vertical-align: middle;
          background: #fff;
          padding: 3px 8px;
        }
        th:last-child,
        td:last-child {
          border-right: 0;
        }
        tbody tr.clickable {
          cursor: pointer;
        }
        tbody tr.clickable:hover td {
          background: #f6f8ff;
        }
        tbody tr td:last-child {
          background: #e5e5e5;
        }
      `}</style>
    </div>
  );
}

function CrmCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`crm-card ${className ?? ""}`}>
      <h1>{title}</h1>
      <div className="card-body">{children}</div>
      <style jsx>{`
        .crm-card {
          width: min(810px, calc(100vw - 32px));
          margin: 0 auto 40px;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
          overflow: hidden;
          background: #fff;
        }
        .crm-card.wide-card {
          width: min(1140px, calc(100vw - 32px));
        }
        .crm-card.details-card {
          width: min(810px, calc(100vw - 32px));
        }
        h1 {
          margin: 0;
          background: #0c389d;
          color: #fff;
          font-size: 30px;
          line-height: 75px;
          padding: 0 38px;
          font-weight: 800;
        }
        .card-body {
          padding: 22px 38px 28px;
        }
        @media (max-width: 760px) {
          h1 {
            font-size: 24px;
            line-height: 58px;
            padding: 0 22px;
          }
          .card-body {
            padding: 18px;
          }
        }
      `}</style>
    </section>
  );
}

function LabelValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="label-value">
      <span>{label}</span>
      <strong>{value || ""}</strong>
      <style jsx>{`
        .label-value {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 10px;
          min-height: 28px;
          align-items: start;
        }
        span {
          font-size: 14px;
        }
        strong {
          font-size: 14px;
          font-weight: 800;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}

function InfoBand() {
  return (
    <section className="info-band">
      <h2>Cum functioneaza acest site?</h2>
      <p>
        Credem ca este important sa intelegeti punctele forte si limitarile site-ului.
        Suntem un site jurnalistic si ne propunem sa oferim cele mai bune ghiduri,
        sfaturi, instrumente si tehnici pentru consumatori.
      </p>
      <p>
        Acest continut are scop informativ si nu constituie sfaturi financiare, fiscale
        sau juridice. Va rugam sa cititi termenii si conditiile complete.
      </p>
      <style jsx>{`
        .info-band {
          margin-top: 60px;
          background: #dcebff;
          text-align: center;
          padding: 26px 20px;
          font-size: 12px;
        }
        h2 {
          margin: 0 0 24px;
          font-size: 18px;
          font-weight: 800;
        }
        p {
          width: min(760px, 100%);
          margin: 0 auto 8px;
          line-height: 1.35;
        }
      `}</style>
    </section>
  );
}

function FooterBand() {
  return (
    <footer className="footer-band">
      <div>
        <strong>ProveIt</strong>
        <p>Proveit ajuta comunitatea sa isi apere drepturile</p>
      </div>
      <div>
        <strong>Link-uri utile</strong>
        <p>Informatii generale</p>
        <p>Programeaza un apel</p>
        <p>Povesti de success</p>
      </div>
      <div>
        <strong>Contactati-ne</strong>
        <p>+447447707829</p>
        <p>adriandfeta@proveitweb.co.uk</p>
        <p>United Kingdom</p>
      </div>
      <span>Copyright 2026 @ ProveIt. Toate drepturile rezervate.</span>
      <style jsx>{`
        .footer-band {
          background: #ff4b26;
          color: #fff;
          padding: 42px 12vw 26px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 34px;
          font-size: 13px;
        }
        strong {
          font-size: 18px;
        }
        p {
          margin: 10px 0 0;
        }
        span {
          grid-column: 1 / -1;
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
        }
        @media (max-width: 760px) {
          .footer-band {
            grid-template-columns: 1fr;
            padding: 34px 24px;
          }
        }
      `}</style>
    </footer>
  );
}

const panelStyles = `
  .lookup-row {
    display: grid;
    grid-template-columns: 1fr 140px;
    gap: 12px;
    margin-bottom: 18px;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 48px;
    row-gap: 8px;
  }
  hr {
    border: 0;
    border-top: 1px solid #ccc;
    margin: 24px 0 12px;
  }
  .form-grid {
    display: grid;
    gap: 24px;
  }
  .form-grid.three {
    grid-template-columns: 150px 150px minmax(250px, 1fr);
  }
  label {
    display: grid;
    gap: 8px;
    font-size: 14px;
  }
  input,
  select,
  textarea {
    border: 1px solid #555;
    background: #fff;
    color: #111;
    font-size: 12px;
    padding: 0 10px;
  }
  input,
  select {
    height: 31px;
  }
  textarea {
    padding: 12px;
    resize: vertical;
  }
  .inline-fields {
    display: grid;
    grid-template-columns: 210px minmax(260px, 1fr) 140px;
    align-items: end;
    gap: 16px;
    margin-top: 14px;
  }
  .wide-label {
    margin-top: 28px;
  }
  .wide-label textarea {
    height: 86px;
  }
  .previous-log {
    min-height: 150px;
    max-height: 260px;
    overflow: auto;
    border: 1px solid #555;
    background: #fff;
    color: #111;
    padding: 12px;
    font-size: 12px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .orange {
    border: 0;
    background: #ff4b26;
    color: #fff;
    font-weight: 800;
    cursor: pointer;
  }
  .orange.small {
    height: 31px;
    border-radius: 5px;
    padding: 0 18px;
  }
  .orange.save {
    width: 190px;
    height: 32px;
    border-radius: 5px;
    margin-top: 10px;
  }
  .orange.below {
    width: 150px;
    height: 32px;
    border-radius: 5px;
    margin-top: 14px;
  }
  .sequence-row {
    display: grid;
    grid-template-columns: 220px 190px;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-top: 10px;
  }
  .green-label {
    color: #008a1e;
    font-size: 14px;
    margin: 12px 0;
  }
  .sms-row {
    display: grid;
    grid-template-columns: 220px 220px;
    justify-content: space-between;
    gap: 20px;
  }
  .green,
  .blue {
    height: 32px;
    border: 0;
    color: white;
    border-radius: 5px;
    font-weight: 800;
    cursor: pointer;
  }
  .green {
    background: #008a1e;
  }
  .blue {
    background: #0b83ff;
  }
  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  .finish-row {
    display: grid;
    grid-template-columns: 1fr 125px 110px 150px;
    align-items: end;
    gap: 16px;
  }
  .filter-grid {
    display: grid;
    align-items: center;
    gap: 12px 28px;
    margin: 0 auto;
  }
  .sales-filter {
    width: 700px;
    grid-template-columns: 70px 250px 1fr;
  }
  .personal-filter {
    width: 710px;
    grid-template-columns: 70px 250px 150px;
  }
  .all-filter {
    width: 710px;
    grid-template-columns: 70px 250px 150px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .checkbox-label input {
    width: 16px;
    height: 16px;
  }
  @media (max-width: 760px) {
    .lookup-row,
    .detail-grid,
    .form-grid.three,
    .inline-fields,
    .sequence-row,
    .sms-row,
    .finish-row,
    .sales-filter,
    .personal-filter,
    .all-filter {
      width: 100%;
      grid-template-columns: 1fr;
    }
  }
`;

function formatDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB");
}

function toInputDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }
  return value.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
