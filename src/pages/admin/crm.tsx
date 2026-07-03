import { useAuth } from "@/context/AuthContext";
import {
  addCrmLeadPhone,
  CrmActivity,
  CrmContactPhone,
  CrmHighLevelFunnelRow,
  CrmLead,
  CrmLeadIntentRow,
  CrmMissedCall,
  CrmPredictiveCampaignSummary,
  CrmSale,
  findCrmLeadByPhone,
  insertManualCrmLead,
  listCrmLeadIntents,
  listCrmHighLevelFunnels,
  listCrmMissedCalls,
  listCrmLeads,
  listCrmSales,
  queueCrmEmailSequence,
  queueCrmSmsSequence,
  scheduleManualCrmEmail,
  searchCrmActivity,
  sendManualCrmSms,
  updateCrmLead,
} from "@/lib/crmAdmin";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type TabKey = "details" | "new" | "sales" | "all" | "intents" | "manual" | "highLevelFunnels" | "missed";
type GateStatus = "checking" | "allowed" | "denied";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "details", label: "Detalii Lead" },
  { key: "new", label: "Lead Nou" },
  { key: "sales", label: "Arata Vanzarile" },
  { key: "all", label: "All Leads CRM" },
  { key: "intents", label: "Lead Intents" },
  { key: "manual", label: "Send Manual Email/SMS" },
  { key: "highLevelFunnels", label: "High Level Funnels" },
];
const ROUTABLE_TABS = new Set<TabKey>([...TABS.map((item) => item.key), "missed"]);

function getInitialTab(): TabKey {
  if (typeof window === "undefined") {
    return "details";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");
  return ROUTABLE_TABS.has(tab as TabKey) ? (tab as TabKey) : "details";
}

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
  "fu1",
  "fu2",
  "fu3",
  "FUEND",
  "FUNA",
  "FUNAEND",
];

const LANGUAGE_OPTIONS = ["ro", "es", "en", "it", "pl", "bg", "Romanian", "English", "Spanish", "Italian", "Polish", "Bulgarian"];
const LEAD_INTENT_LANGUAGE_OPTIONS = ["Romanian", "Spanish", "English", "Italian", "Polish", "Bulgarian"];
const LANGUAGE_LABELS: Record<string, string> = {
  ro: "Romanian",
  romana: "Romanian",
  romanian: "Romanian",
  es: "Spanish",
  spanish: "Spanish",
  en: "English",
  english: "English",
  it: "Italian",
  italian: "Italian",
  pl: "Polish",
  polish: "Polish",
  bg: "Bulgarian",
  bulgarian: "Bulgarian",
};

const EMAIL_SEQUENCE_OPTIONS = [
  { label: "Vrea Sa Cumpere Acum", value: "CallBack_EmailDeSumarizare" },
  { label: "CF_Se_Mai_Gandeste_schema", value: "CF_Se_Mai_Gandeste_schema" },
  { label: "CF_A_DEMARAT_SINGUR", value: "CF_A_DEMARAT_SINGUR" },
  { label: "CF_DEMARAT_CMC", value: "CF_DEMARAT_CMC" },
  { label: "VREA_OUT_CMC", value: "VREA_OUT_CMC" },
];

const CMC_COMPANIES = [
  { name: "ADG Law", domain: "adglaw.co.uk" },
  { name: "Alawco", domain: "alawco.co.uk" },
  { name: "Benson Goldstein", domain: "bensongoldstein.com" },
  { name: "BMW PCP Claims", domain: "bmwpcpclaims.com" },
  { name: "Bott & Co", domain: "bottonline.co.uk" },
  { name: "Car Finance Claim", domain: "car-finance-claim.co.uk" },
  { name: "Car Finance Claim", domain: "car-financeclaim.co.uk" },
  { name: "Car Finance Claims", domain: "carfinanceclaim.co.uk" },
  { name: "Car Finance Claims", domain: "carfinanceclaims.com" },
  { name: "Claim-Smart", domain: "claim-smart.co.uk" },
  { name: "Claimmate", domain: "claimmate.co.uk" },
  { name: "Consultation Claims", domain: "consultationclaims.co.uk" },
  { name: "Courmacs Legal", domain: "courmacslegal.co.uk" },
  { name: "Go Claim", domain: "goclaim.co.uk" },
  { name: "Goldbridge Solicitors", domain: "goldbridgesolicitors.co.uk" },
  { name: "HD Law", domain: "hd-law.co.uk" },
  { name: "Locksley Law", domain: "locksleylaw.co.uk" },
  { name: "Mis Sold Car Finance", domain: "missoldcarfinance.com" },
  { name: "Mis Sold PCP", domain: "mis-soldpcp.com" },
  { name: "Motor Finance Claims", domain: "motorfinanceclaims.com" },
  { name: "My Auto Redress", domain: "myautoredress.com" },
  { name: "My Claims Centre", domain: "myclaimscentre.co.uk" },
  { name: "Olton Alexander", domain: "oltonalexander.com" },
  { name: "PCP Claim Specialist", domain: "pcpclaimspecialist.co.uk" },
  { name: "PCP Claimback", domain: "pcp-claimback.co.uk" },
  { name: "PCP Claims", domain: "pcpclaims.co.uk" },
  { name: "PCP Claims", domain: "pcpclaims.com" },
  { name: "PCP Claims Pro", domain: "pcpclaim.pro" },
  { name: "PCP Reclaim", domain: "pcp-reclaim.com" },
  { name: "Reclaim My Money", domain: "reclaimmymoney.co.uk" },
  { name: "Reclaim247", domain: "reclaim247.co.uk" },
  { name: "Right 2 Redress", domain: "right2redress.com" },
  { name: "Slater + Gordon", domain: "slatergordon.co.uk" },
  { name: "The PCP Claims Company", domain: "thepcpclaimscompany.co.uk" },
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

function formatLanguage(value?: string | null) {
  const text = String(value || "").trim();
  return LANGUAGE_LABELS[text.toLowerCase()] || text;
}

function formatLeadIntentComposition(rows: CrmLeadIntentRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const serviceName = String(row.serviceDisplayName || row.serviceKey || "Unknown Service").trim();
    const intentName = String(row.interestType || "Unknown Intent").trim();
    const key = `${serviceName} ${intentName}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([firstLabel, firstCount], [secondLabel, secondCount]) => {
      if (secondCount !== firstCount) {
        return secondCount - firstCount;
      }

      return firstLabel.localeCompare(secondLabel);
    })
    .map(([label, count]) => `${label} ${count}`);
}

function getLocalDateKey(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isLeadIntentContactToday(row: CrmLeadIntentRow) {
  const todayKey = getLocalDateKey(new Date().toISOString());
  return Boolean(todayKey && getLocalDateKey(row.contactTimeUtc) === todayKey);
}

function summarizeLeadIntentRows(rows: CrmLeadIntentRow[]) {
  return rows.reduce(
    (summary, row) => {
      const intentName = String(row.interestType || "").toUpperCase();
      const serviceKey = String(row.serviceKey || row.serviceDisplayName || "").toLowerCase();

      summary.totalLeads += 1;
      if (intentName === "ASAP") {
        summary.asap += 1;
      }
      if (intentName === "CALENDLY") {
        summary.calendly += 1;
      }
      if (serviceKey.includes("carfinance") || serviceKey.includes("car finance")) {
        summary.carFinance += 1;
      }
      if (
        serviceKey.includes("pensiiinternationale") ||
        serviceKey.includes("internationalpensions") ||
        serviceKey.includes("privatepensions") ||
        serviceKey.includes("private pensions")
      ) {
        summary.internationalPensions += 1;
      }

      return summary;
    },
    { totalLeads: 0, asap: 0, calendly: 0, carFinance: 0, internationalPensions: 0 },
  );
}

type LeadIntentSortColumn =
  | "Created"
  | "Closed"
  | "Contact at"
  | "Name"
  | "Phone"
  | "Email"
  | "Intent"
  | "Service"
  | "CRM Status"
  | "Agent Name"
  | "Last Agent"
  | "Last Call"
  | "Last Callcode"
  | "Language"
  | "Source"
  | "Campaign";

type LeadIntentSortConfig = {
  column: LeadIntentSortColumn;
  direction: "asc" | "desc";
};

function getLeadIntentSortValue(row: CrmLeadIntentRow, column: LeadIntentSortColumn) {
  switch (column) {
    case "Created":
      return getDateTimeValue(row.createdAtUtc);
    case "Closed":
      return getDateTimeValue(row.closedAtUtc);
    case "Contact at":
      return getDateTimeValue(row.contactTimeUtc);
    case "Name":
      return row.lead?.fullName || "";
    case "Phone":
      return row.lead?.phoneNumber || "";
    case "Email":
      return row.lead?.email || "";
    case "Intent":
      return row.interestType || "";
    case "Service":
      return row.serviceDisplayName || row.serviceKey || "";
    case "CRM Status":
      return row.lead?.statusOriginal || "";
    case "Agent Name":
      return row.lastCallAgentName || "";
    case "Last Agent":
      return formatAgentLabel(row.lastCallAgentId, row.lastCallAgentName);
    case "Last Call":
      return getDateTimeValue(row.lastCallTimeUtc);
    case "Last Callcode":
      return row.lastCallCode ?? row.lastCallCodeDetails ?? "";
    case "Language":
      return formatLanguage(row.language);
    case "Source":
      return row.source || "";
    case "Campaign":
      return row.campaignName || row.adName || "";
    default:
      return "";
  }
}

function compareLeadIntentSortValues(first: string | number, second: string | number) {
  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return String(first || "").localeCompare(String(second || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function mergeLanguageOptions(options: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const item of [...LEAD_INTENT_LANGUAGE_OPTIONS, ...options.map(formatLanguage)]) {
    const value = String(item || "").trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(value);
  }

  return merged;
}

function mergeServiceOptions(
  options: Array<{ serviceKey: string; displayName?: string | null }>,
  current?: string | null,
) {
  const serviceOptions = options.filter((item) => item.serviceKey);
  const currentValue = String(current || "").trim();
  if (!currentValue || currentValue === "all" || serviceOptions.some((item) => item.serviceKey === currentValue)) {
    return serviceOptions;
  }

  return [{ serviceKey: currentValue, displayName: currentValue }, ...serviceOptions];
}

function mergeAgentOptions(
  options: Array<{ agentId: number; agentName?: string | null }>,
  current?: string | null,
) {
  const byId = new Map<number, { agentId: number; agentName?: string | null }>();
  for (const option of options) {
    const agentId = Number(option.agentId);
    if (Number.isInteger(agentId) && agentId > 0) {
      byId.set(agentId, { agentId, agentName: option.agentName });
    }
  }

  const unique = Array.from(byId.values()).sort((a, b) => a.agentId - b.agentId);
  const currentValue = Number.parseInt(String(current || ""), 10);

  if (!Number.isInteger(currentValue) || currentValue <= 0 || byId.has(currentValue)) {
    return unique;
  }

  return [{ agentId: currentValue, agentName: null }, ...unique];
}

function isInternationalPensionsIntent(row?: CrmLeadIntentRow | null) {
  const serviceText = `${row?.serviceKey || ""} ${row?.serviceDisplayName || ""}`
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  return (
    serviceText.includes("simulator pensie") ||
    serviceText.includes("simulatorpensie") ||
    serviceText.includes("pensii") ||
    serviceText.includes("pensie") ||
    serviceText.includes("pension")
  );
}

async function findLatestCrmLeadIntentByPhone(token: string, phone: string) {
  const baseParams = {
    createdLastDays: 3650,
    statusBucket: "both",
    toBeContacted: "oricand",
    intent: "all",
    service: "all",
    language: "all",
    phone,
    lastCallAgentId: "all",
    limit: 20,
  };

  const [openResult, closedResult] = await Promise.all([
    listCrmLeadIntents(token, { ...baseParams, closed: false }),
    listCrmLeadIntents(token, { ...baseParams, closed: true }),
  ]);

  const rows = [
    ...(openResult.rows || openResult.items || []),
    ...(closedResult.rows || closedResult.items || []),
  ];

  return rows.sort((first, second) => getDateTimeValue(second.createdAtUtc) - getDateTimeValue(first.createdAtUtc))[0] || null;
}

export default function AdminCrmPage() {
  const router = useRouter();
  const { status, user, token, isCrm } = useAuth();
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [gateError, setGateError] = useState("");
  const [activeTabState, setActiveTabState] = useState<TabKey>(() => getInitialTab());
  const [selectedLead, setSelectedLead] = useState<CrmLead>(() => blankLead());
  const [selectedIntent, setSelectedIntent] = useState<CrmLeadIntentRow | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const tabContentRef = useRef<HTMLDivElement | null>(null);
  const detailsTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const autoloadedPhoneRef = useRef("");
  const agentName = user?.name || user?.email || "";
  const activeTab = activeTabState;

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

      if (!isCrm) {
        setGateStatus("denied");
        setGateError("The logged-in user profile does not include CRM access.");
        return;
      }

      if (!cancelled) {
        setGateStatus("allowed");
        setGateError("");
      }
    }

    checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [isCrm, router, status]);

  useEffect(() => {
    if (!router.isReady || gateStatus !== "allowed" || !token || activeTab !== "details") {
      return;
    }

    const phoneQuery = router.query.phone ?? router.query.phoneNumber ?? router.query.telefon;
    const phone = Array.isArray(phoneQuery) ? phoneQuery[0] : phoneQuery;
    const cleanPhone = String(phone || "").trim();
    if (!cleanPhone || autoloadedPhoneRef.current === cleanPhone) {
      return;
    }

    let cancelled = false;
    autoloadedPhoneRef.current = cleanPhone;

    Promise.all([
      findCrmLeadByPhone(token, cleanPhone),
      findLatestCrmLeadIntentByPhone(token, cleanPhone).catch(() => null),
    ])
      .then(([result, latestIntent]) => {
        if (cancelled) {
          return;
        }

        const lead = latestIntent?.lead || result.lead;
        if (lead) {
          setSelectedLead(lead);
          setSelectedIntent(latestIntent);
          setStatusMessage("Lead incarcat dupa telefon.");
          setErrorMessage("");
          return;
        }

        setStatusMessage("");
        setErrorMessage("Nu am gasit lead dupa telefon.");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setStatusMessage("");
        setErrorMessage(error instanceof Error ? error.message : "Nu am putut cauta lead-ul.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, gateStatus, router.isReady, router.query.phone, router.query.phoneNumber, router.query.telefon, token]);

  function openTab(nextTab: TabKey) {
    setActiveTabState(nextTab);
    if (nextTab === "details") {
      window.requestAnimationFrame(() => {
        tabContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: nextTab },
      },
      undefined,
      { shallow: true },
    );
  }

  function handleTabChange(nextTab: TabKey) {
    setErrorMessage("");
    setStatusMessage("");
    openTab(nextTab);
  }

  async function handleLeadSelected(lead: CrmLead) {
    const phone = String(lead.phoneNumber || lead.normalizedPhone || "").trim();
    setSelectedLead(lead);
    setSelectedIntent(null);
    detailsTabButtonRef.current?.click();

    if (!token || !phone) {
      setStatusMessage("Lead incarcat.");
      setErrorMessage("");
      return;
    }

    try {
      const latestIntent = await findLatestCrmLeadIntentByPhone(token, phone);
      if (latestIntent?.lead) {
        setSelectedLead(latestIntent.lead);
        setSelectedIntent(latestIntent);
        setStatusMessage("Lead incarcat dupa ultimul intent.");
        setErrorMessage("");
        return;
      }

      setStatusMessage("Lead incarcat.");
      setErrorMessage("");
    } catch (error) {
      setStatusMessage("Lead incarcat.");
      setErrorMessage(error instanceof Error ? error.message : "Nu am putut incarca ultimul intent.");
    }
  }

  function handleIntentSelected(row: CrmLeadIntentRow) {
    if (!row.lead) {
      setErrorMessage("Intentul selectat nu are lead atasat.");
      return;
    }

    setSelectedLead(row.lead);
    setSelectedIntent(row);
    detailsTabButtonRef.current?.click();
    setStatusMessage("Intent incarcat.");
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
              ref={tab.key === "details" ? detailsTabButtonRef : undefined}
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
            message={gateError || "JustProveIt did not confirm CRM access for this user."}
          />
        ) : null}

        {gateStatus === "allowed" && token ? (
          <>
            {errorMessage ? <p className="crm-alert error">{errorMessage}</p> : null}
            {statusMessage ? <p className="crm-alert success">{statusMessage}</p> : null}

            <div ref={tabContentRef}>
              {activeTab === "details" ? (
                selectedIntent && isInternationalPensionsIntent(selectedIntent) ? (
                  <InternationalPensionsDetailsPanel lead={selectedLead} intent={selectedIntent} />
                ) : (
                  <LeadDetailsPanel
                    token={token}
                    agentName={agentName}
                    lead={selectedLead}
                    onLeadChange={setSelectedLead}
                    onIntentChange={setSelectedIntent}
                    onStatus={setStatusMessage}
                    onError={setErrorMessage}
                  />
                )
              ) : null}

              {activeTab === "new" ? (
                <NewLeadPanel
                  token={token}
                  agentName={agentName}
                  onCreated={(lead) => {
                    setSelectedLead(lead);
                    setSelectedIntent(null);
                    setActiveTabState("details");
                    setStatusMessage("Lead adaugat.");
                  }}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "sales" ? (
                <SalesPanel token={token} onError={setErrorMessage} />
              ) : null}

              {activeTab === "all" ? (
                <AllLeadsPanel
                  token={token}
                  onSelectLead={handleLeadSelected}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "intents" ? (
                <LeadIntentPanel
                  token={token}
                  onSelectIntent={handleIntentSelected}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "highLevelFunnels" ? (
                <HighLevelFunnelsPanel token={token} onError={setErrorMessage} />
              ) : null}

              {activeTab === "manual" ? (
                <ManualEmailSmsPanel
                  token={token}
                  agentName={agentName}
                  onStatus={setStatusMessage}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "missed" ? (
                <MissedCallsPanel token={token} onError={setErrorMessage} />
              ) : null}
            </div>
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
          width: min(1600px, calc(100vw - 48px));
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
          width: min(1600px, calc(100vw - 48px));
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
  onIntentChange,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  lead: CrmLead;
  onLeadChange: (lead: CrmLead) => void;
  onIntentChange: (intent: CrmLeadIntentRow | null) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<CrmLead>(lead);
  const [newObservation, setNewObservation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [smsBusy, setSmsBusy] = useState<"buy" | "skeptic" | "">("");
  const [emailSequenceBusy, setEmailSequenceBusy] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState("");
  const [selectedCmcDomain, setSelectedCmcDomain] = useState("");
  const [nextContactTime, setNextContactTime] = useState("");
  const [activityEmail, setActivityEmail] = useState("");
  const [activityRows, setActivityRows] = useState<CrmActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    setDraft(lead);
    setNewObservation("");
    setNewEmail("");
    setNewPhone("");
    setSelectedSequence("");
    setSelectedCmcDomain("");
    setNextContactTime(toInputTime(lead.dataUrmatorContact));
    setActivityEmail(lead.email || "");
    setActivityRows([]);
  }, [lead]);

  async function handlePhoneLookup() {
    if (!token || !draft.phoneNumber) {
      return;
    }

    try {
      const [result, latestIntent] = await Promise.all([
        findCrmLeadByPhone(token, draft.phoneNumber),
        findLatestCrmLeadIntentByPhone(token, draft.phoneNumber).catch(() => null),
      ]);
      const foundLead = latestIntent?.lead || result.lead;
      if (foundLead) {
        setDraft(foundLead);
        onLeadChange(foundLead);
        onIntentChange(latestIntent);
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
        dataUrmatorContact: buildDateTimeValue(draft.dataUrmatorContact, nextContactTime),
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

  async function handleAddPhone() {
    const phone = newPhone.trim();
    if (!phone) {
      onError("Completeaza telefonul nou.");
      return;
    }

    const id =
      draft.contactId ||
      draft.canonicalContactId ||
      draft.canonical?.contactId ||
      draft.id ||
      draft.wixId ||
      draft._id;
    if (!id) {
      onError("Selecteaza sau cauta un lead inainte de a adauga telefon.");
      return;
    }

    setPhoneSaving(true);
    try {
      const result = await addCrmLeadPhone(token, id, {
        phone,
        agent: agentName,
      });
      const updatedLead = mergePhoneResultIntoLead(draft, result.lead, result.contact?.phones, result.phone);
      setDraft(updatedLead);
      onLeadChange(updatedLead);
      setNewPhone("");
      onStatus("Telefonul a fost adaugat.");
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut adauga telefonul.");
    } finally {
      setPhoneSaving(false);
    }
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

  async function handleEmailSequence() {
    const id = draft.id || draft.wixId || draft._id;
    if (!id) {
      onError("Selecteaza sau cauta un lead inainte de secventa de email.");
      return;
    }

    if (!selectedSequence) {
      onError("Alege secventa de email.");
      return;
    }

    if (selectedSequence === "VREA_OUT_CMC" && !selectedCmcDomain) {
      onError("Selecteaza firma CMC.");
      return;
    }

    const selectedCmc = CMC_COMPANIES.find((company) => company.domain === selectedCmcDomain);

    setEmailSequenceBusy(true);
    try {
      const result = await queueCrmEmailSequence(token, id, {
        sequence: selectedSequence,
        cmcDomain: selectedCmcDomain || undefined,
        cmcName: selectedCmc?.name,
        agent: agentName,
      });
      setDraft(result.lead);
      onLeadChange(result.lead);
      onStatus(result.message || "Clientul a fost pus pe secventa de email.");
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut porni secventa de email.");
    } finally {
      setEmailSequenceBusy(false);
    }
  }

  async function handleActivitySearch() {
    const email = activityEmail.trim();
    if (!email) {
      onError("Introdu emailul pentru activitate.");
      return;
    }

    setActivityLoading(true);
    try {
      const result = await searchCrmActivity(token, email);
      setActivityRows(result.activities || result.items || []);
      onStatus("Activitatea a fost incarcata.");
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut cauta activitatea.");
    } finally {
      setActivityLoading(false);
    }
  }

  const financeOptions = mergeCurrentOption(FINANCE_COMPANIES, draft.financeCompany);
  const statusOptions = mergeCurrentOption(STATUS_OPTIONS, draft.statusOriginal);
  const languageOptions = mergeCurrentOption(LANGUAGE_OPTIONS, draft.language);
  const contactPhones = getDisplayPhones(draft);

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
        <div className="phone-detail">
          <span>Telefon:</span>
          <div className="phone-detail-body">
            <strong>{draft.phoneNumber || ""}</strong>
            {contactPhones.length > 1 ? (
              <ul className="phone-list">
                {contactPhones.map((phone, index) => (
                  <li key={phone.id || phone.normalizedPhone || phone.phone || index}>
                    {phone.phone || phone.normalizedPhone}
                    {phone.isPrimary ? " (principal)" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="add-phone-row">
              <input
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                placeholder="Telefon nou"
              />
              <button type="button" className="orange small" onClick={handleAddPhone} disabled={phoneSaving}>
                {phoneSaving ? "Se adauga..." : "Adauga telefon"}
              </button>
            </div>
          </div>
        </div>
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
            {languageOptions.map((language) => (
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
        <select
          value={selectedSequence}
          onChange={(event) => {
            setSelectedSequence(event.target.value);
            if (event.target.value !== "VREA_OUT_CMC") {
              setSelectedCmcDomain("");
            }
          }}
        >
          <option value="">Secventa de email</option>
          {EMAIL_SEQUENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="orange small"
          onClick={handleEmailSequence}
          disabled={emailSequenceBusy}
        >
          {emailSequenceBusy ? "Se trimite..." : "Pune Client pe secventa"}
        </button>
      </div>

      {selectedSequence === "VREA_OUT_CMC" ? (
        <label className="cmc-row">
          Firma claims management
          <select
            value={selectedCmcDomain}
            onChange={(event) => setSelectedCmcDomain(event.target.value)}
          >
            <option value="">Selecteaza firma CMC</option>
            {CMC_COMPANIES.map((company) => (
              <option key={company.domain} value={company.domain}>
                {company.domain}
              </option>
            ))}
          </select>
        </label>
      ) : null}

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
          <input type="time" value={nextContactTime} onChange={(event) => setNextContactTime(event.target.value)} />
        </label>
        <button type="button" className="orange small" onClick={handleSave}>
          Termina Cazul
        </button>
      </div>

      <hr />

      <div className="activity-search">
        <label>
          Cauta activitate dupa email
          <input value={activityEmail} onChange={(event) => setActivityEmail(event.target.value)} />
        </label>
        <button type="button" className="orange small" onClick={handleActivitySearch} disabled={activityLoading}>
          {activityLoading ? "Caut..." : "Cauta activitate"}
        </button>
      </div>
      <DataTable
        columns={["Timestamp", "State", "Param1", "Param2", "Param3", "Param4", "Param5"]}
        rows={activityRows.map((item) => [
          item.timestamp,
          item.state,
          item.param1,
          item.param2,
          item.param3,
          item.param4,
          item.param5,
        ])}
        loading={activityLoading}
        minWidth={880}
      />

      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function InternationalPensionsDetailsPanel({
  lead,
  intent,
}: {
  lead: CrmLead;
  intent: CrmLeadIntentRow;
}) {
  const calculatorUrl = buildPensionCalculatorUrl(lead);

  return (
    <CrmCard title="Detalii Pensii Internationale" className="details-card">
      <div className="detail-grid">
        <LabelValue label="Nume:" value={lead.fullName} />
        <LabelValue label="Telefon:" value={lead.phoneNumber} />
        <LabelValue label="Email:" value={lead.email} />
        <LabelValue label="Status:" value={lead.statusOriginal} />
        <LabelValue label="Intent:" value={intent.interestType} />
        <LabelValue label="Service:" value={intent.serviceDisplayName || intent.serviceKey} />
        <LabelValue label="Limba:" value={formatLanguage(intent.language || lead.language)} />
        <LabelValue label="Sursa:" value={intent.source} />
      </div>

      <div className="calculator-frame-wrap">
        <iframe
          title="Calculator varsta pensionare"
          src={calculatorUrl}
          className="calculator-frame"
        />
      </div>

      <style jsx>{panelStyles}</style>
      <style jsx>{`
        .calculator-frame-wrap {
          margin-top: 24px;
          border: 4px solid #0c389d;
          height: min(980px, calc(100vh - 240px));
          min-height: 680px;
          overflow: hidden;
          background: #fff;
        }

        .calculator-frame {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
      `}</style>
    </CrmCard>
  );
}

function buildPensionCalculatorUrl(lead: CrmLead) {
  const params = new URLSearchParams();
  const fullName = lead.fullName?.trim();
  const email = lead.email?.trim();
  const phone = lead.phoneNumber?.trim();

  if (fullName) {
    params.set("fullName", fullName);
    params.set("nume", fullName);
  }

  if (email) {
    params.set("email", email);
  }

  if (phone) {
    params.set("phone", phone);
    params.set("telefon", phone);
  }

  const query = params.toString();
  return `/ro/calculator-varsta-pensionare${query ? `?${query}` : ""}`;
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
        columns={["Name", "Phone", "email", "Suma", "Data", "DialerFirst", "DialerLast"]}
        rows={sales.map((sale) => [
          sale.name,
          sale.phone,
          sale.email,
          formatMoney(sale.amountTotalMajor),
          formatDate(sale.wixCreatedDateUtc),
          sale.dialerowner || "",
          sale.dialerlast || "N/A",
        ])}
        loading={loading}
        minWidth={980}
        className="sales-table"
      />
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
      const last6 = getLast6Digits(phone);
      const result = await listCrmLeads(token, {
        email,
        phone,
        last6,
        language: language === "all" ? "" : language,
        status: "all",
        limit: 200,
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

function LeadIntentPanel({
  token,
  onSelectIntent,
  onError,
}: {
  token: string;
  onSelectIntent: (row: CrmLeadIntentRow) => void;
  onError: (message: string) => void;
}) {
  const [createdLastDays, setCreatedLastDays] = useState("30");
  const [statusBucket, setStatusBucket] = useState("nocall");
  const [intent, setIntent] = useState("all");
  const [service, setService] = useState("all");
  const [language, setLanguage] = useState("all");
  const [phone, setPhone] = useState("");
  const [lastCallAgentId, setLastCallAgentId] = useState("all");
  const [toBeContacted, setToBeContacted] = useState("oricand");
  const [showMissedCalls, setShowMissedCalls] = useState(false);
  const [calendlyOnlyToday, setCalendlyOnlyToday] = useState(true);
  const [rows, setRows] = useState<CrmLeadIntentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState("");
  const [predictiveCampaignSummary, setPredictiveCampaignSummary] = useState<CrmPredictiveCampaignSummary[]>([]);
  const [selectedLeadsTotal, setSelectedLeadsTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<LeadIntentSortConfig>({ column: "Created", direction: "desc" });
  const [intentOptions, setIntentOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Array<{ serviceKey: string; displayName?: string | null }>>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>(LEAD_INTENT_LANGUAGE_OPTIONS);
  const [agentOptions, setAgentOptions] = useState<Array<{ agentId: number; agentName?: string | null }>>([]);
  const showCalendlyOnlyToday = intent.toUpperCase() === "CALENDLY";
  const showContactAt = intent.toUpperCase() !== "ASAP";
  const intentTableColumns: LeadIntentSortColumn[] = [
    "Created",
    "Closed",
    ...(showContactAt ? (["Contact at"] as const) : []),
    "Name",
    "Phone",
    "Email",
    "Intent",
    "Service",
    "CRM Status",
    "Agent Name",
    "Last Agent",
    "Last Call",
    "Last Callcode",
    "Language",
    "Source",
    "Campaign",
  ];
  const sortedRows = useMemo(() => {
    return [...rows].sort((first, second) => {
      const firstValue = getLeadIntentSortValue(first, sortConfig.column);
      const secondValue = getLeadIntentSortValue(second, sortConfig.column);
      const result = compareLeadIntentSortValues(firstValue, secondValue);

      if (result !== 0) {
        return sortConfig.direction === "asc" ? result : -result;
      }

      return getDateTimeValue(second.createdAtUtc) - getDateTimeValue(first.createdAtUtc);
    });
  }, [rows, sortConfig]);
  const intentCompositionSummary = useMemo(() => formatLeadIntentComposition(sortedRows), [sortedRows]);

  function toggleSort(column: LeadIntentSortColumn) {
    setSortConfig((current) => ({
      column,
      direction: current.column === column && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  useEffect(() => {
    loadIntents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadIntents() {
    setLoading(true);
    try {
      const result = await listCrmLeadIntents(token, {
        createdLastDays,
        statusBucket,
        toBeContacted,
        intent,
        service,
        language,
        phone,
        lastCallAgentId,
        closed: false,
        includeMissedCalls: showMissedCalls,
        calendlyOnlyToday: showCalendlyOnlyToday && calendlyOnlyToday,
        limit: 300,
      });
      const nextRows = result.rows || result.items || [];
      const shouldFilterCalendlyToday = showCalendlyOnlyToday && calendlyOnlyToday;
      const visibleRows = shouldFilterCalendlyToday ? nextRows.filter(isLeadIntentContactToday) : nextRows;
      const summary = shouldFilterCalendlyToday ? summarizeLeadIntentRows(visibleRows) : result.leadSummary || {};
      setRows(visibleRows);
      setSelectedLeadsTotal(shouldFilterCalendlyToday ? visibleRows.length : result.total ?? 0);
      setResultText(
        `Total Leads: ${summary.totalLeads ?? 0} | ASAP ${summary.asap ?? 0} | Calendly ${summary.calendly ?? 0} | Car Finance ${summary.carFinance ?? 0} | International Pensions ${summary.internationalPensions ?? 0}`,
      );
      setIntentOptions(result.options?.intents || []);
      setServiceOptions(result.options?.services || []);
      setLanguageOptions(mergeLanguageOptions(result.options?.languages || []));
      setAgentOptions(result.options?.agents || []);
      setPredictiveCampaignSummary(result.predictiveCampaignSummary || []);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca lead intent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="Lead Intents" className="wide-card">
      <div className="filter-grid intent-filter">
        <label>Created last days</label>
        <input
          type="number"
          min="1"
          max="3650"
          value={createdLastDays}
          onChange={(event) => setCreatedLastDays(event.target.value)}
        />

        <label>Status type</label>
        <select value={statusBucket} onChange={(event) => setStatusBucket(event.target.value)}>
          <option value="nocall">NoCall</option>
          <option value="postcallfu">PostCallFU</option>
          <option value="finished">Finished</option>
        </select>

        <label>Intent</label>
        <select value={intent} onChange={(event) => setIntent(event.target.value)}>
          <option value="all">all</option>
          {mergeCurrentOption(intentOptions, intent === "all" ? "" : intent).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label>Service</label>
        <select value={service} onChange={(event) => setService(event.target.value)}>
          <option value="all">all</option>
          {mergeServiceOptions(serviceOptions, service).map((item) => (
            <option key={item.serviceKey} value={item.serviceKey}>
              {item.displayName || item.serviceKey}
            </option>
          ))}
        </select>

        <label>Language</label>
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="all">all</option>
          {mergeLanguageOptions(mergeCurrentOption(languageOptions, language === "all" ? "" : language)).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <label>Phone</label>
        <input
          type="search"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone or last 6"
        />

        <label>ToBeContacted</label>
        <select value={toBeContacted} onChange={(event) => setToBeContacted(event.target.value)}>
          <option value="past">In trecut</option>
          <option value="today">Azi</option>
          <option value="tomorrow">Maine</option>
          <option value="next3days">Urmatoarele 3 zile</option>
          <option value="nextweek">Urmatoarea saptamana</option>
          <option value="oricand">Oricand</option>
        </select>

        <label>Agent</label>
        <select value={lastCallAgentId} onChange={(event) => setLastCallAgentId(event.target.value)}>
          <option value="all">all</option>
          {mergeAgentOptions(agentOptions, lastCallAgentId).map((item) => (
            <option key={item.agentId} value={item.agentId}>
              {formatAgentLabel(item.agentId, item.agentName)}
            </option>
          ))}
        </select>

        <label>Show MissedCalls</label>
        <input
          type="checkbox"
          checked={showMissedCalls}
          onChange={(event) => setShowMissedCalls(event.target.checked)}
        />

        {showCalendlyOnlyToday ? (
          <>
            <label className="calendly-only-today-label">Only today</label>
            <input
              className="calendly-only-today-input"
              type="checkbox"
              checked={calendlyOnlyToday}
              onChange={(event) => setCalendlyOnlyToday(event.target.checked)}
            />
          </>
        ) : null}

        <button type="button" className="orange small" onClick={loadIntents} disabled={loading}>
          {loading ? "Se incarca..." : "Filter"}
        </button>
      </div>

      <p className="green-label">
        {resultText || "Total Leads: 0 | ASAP 0 | Calendly 0 | Car Finance 0 | International Pensions 0"}
        <br />
        Total Selected Leads: {selectedLeadsTotal}
        {predictiveCampaignSummary.length ? (
          <>
            <br />
            {predictiveCampaignSummary.map((campaign) => (
              <span key={campaign.queueId ?? campaign.campaignName}>
                {formatPredictiveCampaignSummary(campaign)}
                <br />
              </span>
            ))}
          </>
        ) : null}
      </p>
      <p className="green-label">
        Total: {sortedRows.length}
        {intentCompositionSummary.length ? ` | ${intentCompositionSummary.join(" | ")}` : ""}
      </p>
      <DataTable
        columns={intentTableColumns}
        rows={sortedRows.map((row) => [
          formatDateTime(row.createdAtUtc),
          formatDateTime(row.closedAtUtc),
          ...(showContactAt ? [formatDateTime(row.contactTimeUtc)] : []),
          row.lead?.fullName,
          row.lead?.phoneNumber,
          row.lead?.email,
          row.interestType,
          row.serviceDisplayName || row.serviceKey,
          row.lead?.statusOriginal,
          row.lastCallAgentName,
          formatAgentLabel(row.lastCallAgentId, row.lastCallAgentName),
          formatDateTime(row.lastCallTimeUtc),
          row.lastCallCodeDetails || row.lastCallCode,
          formatLanguage(row.language),
          row.source,
          row.campaignName || row.adName,
        ])}
        loading={loading}
        onRowDoubleClick={(index) => {
          const row = sortedRows[index];
          if (row?.lead) {
            onSelectIntent(row);
            return;
          }

          onError("Intentul selectat nu are lead atasat.");
        }}
        sortableColumns={Object.fromEntries(
          intentTableColumns.map((column) => [
            column,
            {
              direction: sortConfig.column === column ? sortConfig.direction : "desc",
              onClick: () => toggleSort(column),
            },
          ]),
        )}
        minWidth={1560}
      />
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function HighLevelFunnelsPanel({ token, onError }: { token: string; onError: (message: string) => void }) {
  const [dateBegin, setDateBegin] = useState(() => getDateInputDaysAgo(30));
  const [dateEnd, setDateEnd] = useState(() => getDateInputDaysAgo(0));
  const [agentId, setAgentId] = useState("all");
  const [agentOptions, setAgentOptions] = useState<Array<{ agentId: number; agentName?: string | null }>>([]);
  const [rows, setRows] = useState<CrmHighLevelFunnelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataSourceMessage, setDataSourceMessage] = useState("");
  const totalLeads = rows.reduce((sum, row) => sum + getFunnelLeadCount(row), 0);
  const totalTalked = rows.reduce((sum, row) => sum + getFunnelTalkToAgentCount(row), 0);
  const totalSales = rows.reduce((sum, row) => sum + getFunnelSalesCount(row), 0);
  const totalRevenue = rows.reduce((sum, row) => sum + getFunnelRevenue(row), 0);

  useEffect(() => {
    loadFunnels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFunnels() {
    setLoading(true);
    try {
      const result = await listCrmHighLevelFunnels(token, {
        dateBegin,
        dateEnd,
        agentId,
        service: "simulator pensie",
        intent: "all",
      });
      setRows(result.rows || result.items || []);
      setAgentOptions(result.options?.agents || []);
      setDataSourceMessage("");
      onError("");
    } catch (error) {
      if (!isNotFoundError(error)) {
        onError(error instanceof Error ? error.message : "Nu am putut incarca high level funnels.");
        return;
      }

      try {
        const fallback = await loadHighLevelFunnelsFromLeadIntents(token, dateBegin, dateEnd, agentId);
        setRows(fallback.rows);
        setAgentOptions(fallback.agents);
        setDataSourceMessage("Using lead-intents fallback until the high-level funnels API is deployed.");
        onError("");
      } catch (fallbackError) {
        onError(
          fallbackError instanceof Error
            ? fallbackError.message
            : "Nu am putut incarca high level funnels din lead-intents.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="High Level Funnels - Simulator Pensie" className="wide-card">
      <div className="filter-grid high-level-filter">
        <label>Date begin</label>
        <input type="date" value={dateBegin} onChange={(event) => setDateBegin(event.target.value)} />

        <label>Date end</label>
        <input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} />

        <label>Agent</label>
        <select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
          <option value="all">all</option>
          {mergeAgentOptions(agentOptions, agentId).map((item) => (
            <option key={item.agentId} value={item.agentId}>
              {formatAgentLabel(item.agentId, item.agentName)}
            </option>
          ))}
        </select>

        <button type="button" className="orange small" onClick={loadFunnels} disabled={loading}>
          {loading ? "Se incarca..." : "Filter"}
        </button>
      </div>

      <p className="green-label">
        Total leads: {totalLeads} | Talk to an agent: {totalTalked} | Sales: {totalSales} | Revenue:{" "}
        {formatPounds(totalRevenue)}
        {dataSourceMessage ? (
          <>
            <br />
            {dataSourceMessage}
          </>
        ) : null}
      </p>

      <DataTable
        columns={["Lead source", "Number of leads", "Calendly booked", "Talk to an agent", "Sales", "Revenue"]}
        rows={rows.map((row) => [
          row.leadSource || row.source,
          getFunnelLeadCount(row),
          formatCalendlyBooked(row.calendlyBooked),
          getFunnelTalkToAgentCount(row),
          getFunnelSalesCount(row),
          formatPounds(getFunnelRevenue(row)),
        ])}
        loading={loading}
        minWidth={980}
      />
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function ManualEmailSmsPanel({
  token,
  agentName,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [template, setTemplate] = useState("");
  const [params, setParams] = useState(["", "", "", "", ""]);
  const [phone, setPhone] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [smsBusy, setSmsBusy] = useState(false);

  function updateParam(index: number, value: string) {
    setParams((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  async function handleSendEmail(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      onError("Completeaza emailul.");
      return;
    }
    if (!template.trim()) {
      onError("Alege sau completeaza template-ul.");
      return;
    }

    setEmailBusy(true);
    try {
      await scheduleManualCrmEmail(token, {
        email: email.trim(),
        firstName: firstName.trim(),
        emailtemplate: template.trim(),
        campaign: template.trim(),
        param1: params[0].trim(),
        param2: params[1].trim(),
        param3: params[2].trim(),
        param4: params[3].trim(),
        param5: params[4].trim(),
        agent: agentName,
      });
      onStatus("Emailul a fost adaugat in coada de trimitere.");
      onError("");
      setEmail("");
      setFirstName("");
      setTemplate("");
      setParams(["", "", "", "", ""]);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut programa emailul.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleSendSms() {
    if (!phone.trim()) {
      onError("Completeaza telefonul.");
      return;
    }
    if (!smsMessage.trim()) {
      onError("Completeaza mesajul SMS.");
      return;
    }

    setSmsBusy(true);
    try {
      await sendManualCrmSms(token, {
        phone: phone.trim(),
        message: smsMessage.trim(),
        agent: agentName,
      });
      onStatus("SMS-ul a fost trimis.");
      onError("");
      setPhone("");
      setSmsMessage("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut trimite SMS-ul.");
    } finally {
      setSmsBusy(false);
    }
  }

  return (
    <section className="manual-panel">
      <div className="orange title-btn" role="heading" aria-level={3}>Send email</div>
      <form onSubmit={handleSendEmail}>
        <label>
          email *
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email" />
        </label>
        <label>
          First Name *
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First Name" />
        </label>
        <label>
          Template *
          <input
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            placeholder="Template"
            list="crm-email-templates"
          />
          <datalist id="crm-email-templates">
            {EMAIL_SEQUENCE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </datalist>
        </label>
        {params.map((value, index) => (
          <label key={index}>
            Param{index + 1}
            <input
              value={value}
              onChange={(event) => updateParam(index, event.target.value)}
              placeholder={`Param${index + 1}`}
            />
          </label>
        ))}
        <button type="submit" className="orange submit-btn" disabled={emailBusy}>
          {emailBusy ? "Sending..." : "Queue email"}
        </button>
      </form>
      <label>
        Phone *
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone..." />
      </label>
      <textarea
        value={smsMessage}
        onChange={(event) => setSmsMessage(event.target.value)}
        placeholder="How can we do better next time?"
      />
      <button type="button" className="orange submit-btn" onClick={handleSendSms} disabled={smsBusy}>
        {smsBusy ? "Sending..." : "Send SMS"}
      </button>
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .submit-btn {
          border-radius: 5px;
          cursor: pointer;
        }
        .title-btn {
          cursor: default;
        }
      `}</style>
    </section>
  );
}

function MissedCallsPanel({ token, onError }: { token: string; onError: (message: string) => void }) {
  const [calls, setCalls] = useState<CrmMissedCall[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCalls() {
    setLoading(true);
    try {
      const result = await listCrmMissedCalls(token, 10);
      setCalls(result.calls || result.items || []);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca missed calls.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="Missed calls fara follow-up" className="wide-card">
      <button type="button" className="orange small" onClick={loadCalls} disabled={loading}>
        {loading ? "Se incarca..." : "Refresh"}
      </button>
      <DataTable
        columns={["Phone", "Last missed", "Last connected", "Last connected campaign"]}
        rows={calls.map((call) => [
          call.phoneNumber || call.phonenumber || call.phone,
          formatDateTime(call.lastMissed || call.lastmissed),
          formatDateTime(call.lastConnected || call.lastconnected),
          call.lastConnectedCampaign || call.lastconnectedcampaign,
        ])}
        loading={loading}
        minWidth={850}
      />
      <style jsx>{panelStyles}</style>
    </CrmCard>
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
  onRowDoubleClick,
  sortableColumns,
  minWidth,
  className,
}: {
  columns: string[];
  rows: Array<Array<string | number | null | undefined>>;
  loading?: boolean;
  onRowClick?: (index: number) => void;
  onRowDoubleClick?: (index: number) => void;
  sortableColumns?: Record<string, { direction: "asc" | "desc"; onClick: () => void }>;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div className={`table-wrap ${className ?? ""}`}>
      <table style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = sortableColumns?.[column];
              return (
                <th key={column}>
                  {sortable ? (
                    <button type="button" className="sort-button" onClick={sortable.onClick}>
                      {column}
                      <span aria-hidden="true">{sortable.direction === "asc" ? " ▲" : " ▼"}</span>
                    </button>
                  ) : (
                    column
                  )}
                </th>
              );
            })}
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
                onDoubleClick={() => onRowDoubleClick?.(index)}
                className={onRowClick || onRowDoubleClick ? "clickable" : undefined}
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
          max-height: min(56vh, 680px);
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
          position: sticky;
          top: 0;
          z-index: 2;
          height: 40px;
          background: #ff4b26;
          color: #fff;
          font-weight: 700;
          border-right: 2px solid #111;
        }
        .sort-button {
          width: 100%;
          min-height: 40px;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          cursor: pointer;
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
        .sales-table :global(th:first-child),
        .sales-table :global(td:first-child) {
          width: 9%;
          max-width: 90px;
          white-space: normal;
          word-break: break-word;
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
          width: min(1600px, calc(100vw - 48px));
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
          .crm-card,
          .crm-card.wide-card,
          .crm-card.details-card {
            width: calc(100vw - 20px);
          }
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

function getPhoneKey(phone: CrmContactPhone) {
  return String(phone.normalizedPhone || phone.phone || phone.id || "").trim();
}

function mergeContactPhones(existing: CrmContactPhone[], incoming: CrmContactPhone[]) {
  const merged: CrmContactPhone[] = [];
  const seen = new Set<string>();

  [...existing, ...incoming].forEach((phone) => {
    const key = getPhoneKey(phone);
    if (!key || seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(phone);
  });

  return merged;
}

function getDisplayPhones(lead: CrmLead) {
  const apiPhones = Array.isArray(lead.phones) ? lead.phones : [];
  if (!lead.phoneNumber) {
    return apiPhones;
  }

  const primaryPhone: CrmContactPhone = {
    phone: lead.phoneNumber,
    normalizedPhone: lead.normalizedPhone || lead.phoneNumber,
    isPrimary: true,
  };

  return mergeContactPhones([primaryPhone], apiPhones);
}

function mergePhoneResultIntoLead(
  currentLead: CrmLead,
  refreshedLead?: CrmLead | null,
  refreshedPhones?: CrmContactPhone[],
  addedPhone?: CrmContactPhone | null,
) {
  const baseLead = refreshedLead || currentLead;
  const incomingPhones = refreshedPhones || baseLead.phones || [];
  const phones = mergeContactPhones(
    Array.isArray(currentLead.phones) ? currentLead.phones : [],
    addedPhone ? [...incomingPhones, addedPhone] : incomingPhones,
  );
  const fallbackPhone = addedPhone?.phone || addedPhone?.normalizedPhone || currentLead.phoneNumber || null;

  return {
    ...currentLead,
    ...baseLead,
    phoneNumber: baseLead.phoneNumber || fallbackPhone,
    normalizedPhone: baseLead.normalizedPhone || addedPhone?.normalizedPhone || currentLead.normalizedPhone || fallbackPhone,
    phones,
  };
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
  .phone-detail {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 10px;
    min-height: 28px;
    align-items: start;
  }
  .phone-detail > span {
    font-size: 14px;
  }
  .phone-detail strong {
    font-size: 14px;
    font-weight: 800;
    word-break: break-word;
  }
  .phone-detail-body {
    display: grid;
    gap: 8px;
  }
  .phone-list {
    margin: 0;
    padding-left: 16px;
    font-size: 12px;
    line-height: 1.35;
  }
  .phone-list li {
    word-break: break-word;
  }
  .add-phone-row {
    display: grid;
    grid-template-columns: minmax(130px, 1fr) 132px;
    align-items: center;
    gap: 8px;
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
  .cmc-row {
    width: min(420px, 100%);
    margin-top: 12px;
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
  .activity-search {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) 150px;
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
  .intent-filter {
    width: min(940px, 100%);
    grid-template-columns: 130px minmax(120px, 1fr) 100px minmax(150px, 1fr) 90px minmax(150px, 1fr);
  }
  .high-level-filter {
    width: min(940px, 100%);
    grid-template-columns: 100px minmax(140px, 1fr) 80px minmax(140px, 1fr) 70px minmax(170px, 1fr) 100px;
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
  .calendly-only-today-label {
    grid-column: 5;
  }
  .calendly-only-today-input {
    grid-column: 6;
  }
  @media (max-width: 760px) {
    .lookup-row,
    .detail-grid,
    .phone-detail,
    .add-phone-row,
    .form-grid.three,
    .inline-fields,
    .sequence-row,
    .cmc-row,
    .sms-row,
    .finish-row,
    .activity-search,
    .sales-filter,
    .personal-filter,
    .all-filter,
    .intent-filter,
    .high-level-filter {
      width: 100%;
      grid-template-columns: 1fr;
    }
    .calendly-only-today-label,
    .calendly-only-today-input {
      grid-column: auto;
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateTimeValue(value?: string | null) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatAgentLabel(agentId?: number | null, agentName?: string | null) {
  if (agentId === undefined || agentId === null) {
    return "";
  }

  return agentName ? `${agentId} - ${agentName}` : String(agentId);
}

function formatPredictiveCampaignSummary(campaign: CrmPredictiveCampaignSummary) {
  const queueName = campaign.campaignName || `Queue ${campaign.queueId}`;

  return [
    queueName,
    `Total Leads: ${campaign.totalLeads ?? 0}`,
    `Finished Leads To Ag ${getFinishedToAgCount(campaign)}`,
    `Finished Not Ag ${getFinishedNotAgCount(campaign)}`,
    `ToBeDialled ${campaign.toBeDialled ?? 0}`,
    `VoiceMails: ${getVoiceMailCount(campaign)}`,
    formatTopCallCodes(campaign.topCallCodes),
    `Dialled zero times: ${campaign.toBeDialledZeroTrials ?? 0} / 1-3 times: ${campaign.toBeDialledOneToThreeTrials ?? 0} / 4-5 times: ${campaign.toBeDialledFourToFiveTrials ?? 0} / 5+ times: ${campaign.toBeDialledFivePlusTrials ?? 0}`,
    `Called Today: ${campaign.calledToday ?? 0} (${campaign.calledYesterday ?? 0}) Connected Today: ${campaign.connectedToday ?? 0} (${campaign.connectedYesterday ?? 0})`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function getFinishedToAgCount(campaign: CrmPredictiveCampaignSummary) {
  return campaign.finishedLeadsToAg ?? campaign.finishedToAg ?? campaign.leadsToAg ?? 0;
}

function getFinishedNotAgCount(campaign: CrmPredictiveCampaignSummary) {
  return campaign.finishedNotAg ?? campaign.noAgLeads ?? 0;
}

function getVoiceMailCount(campaign: CrmPredictiveCampaignSummary) {
  const voiceMailCallCode = campaign.topCallCodes?.find((callCode) => callCode.callCode === 5);
  return voiceMailCallCode?.count ?? campaign.toBeDialledLastCallCode5 ?? 0;
}

function formatTopCallCodes(
  callCodes?: Array<{ callCode?: number | null; label?: string | null; count?: number; yesterdayCount?: number }>,
) {
  if (!callCodes?.length) {
    return "";
  }

  const topCallCodes = callCodes
    .filter((callCode) => {
      const label = String(callCode.label || "").trim().toLowerCase();
      return Boolean(callCode.callCode && callCode.callCode > 0 && callCode.callCode !== 5 && label !== "default");
    })
    .sort((first, second) => {
      const countDiff = (second.count ?? 0) - (first.count ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      return (first.callCode ?? 0) - (second.callCode ?? 0);
    })
    .slice(0, 5);

  if (!topCallCodes.length) {
    return "";
  }

  return topCallCodes
    .map((callCode) => `${callCode.label || `CallCode ${callCode.callCode ?? ""}`}: ${callCode.count ?? 0}`)
    .join(" | ");
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

function toInputTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toTimeString().slice(0, 5);
}

function buildDateTimeValue(dateValue?: string | null, timeValue?: string) {
  const datePart = toInputDate(dateValue);
  if (!datePart) {
    return null;
  }

  if (!timeValue) {
    return datePart;
  }

  const date = new Date(`${datePart}T${timeValue}`);
  if (Number.isNaN(date.getTime())) {
    return datePart;
  }

  return date.toISOString();
}

function getLast6Digits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : "";
}

function getDateInputDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

async function loadHighLevelFunnelsFromLeadIntents(
  token: string,
  dateBegin: string,
  dateEnd: string,
  agentId: string,
) {
  const createdLastDays = getCreatedLastDaysForDateBegin(dateBegin);
  const params = {
    createdLastDays,
    statusBucket: "both",
    toBeContacted: "oricand",
    intent: "all",
    service: "all",
    language: "all",
    phone: "",
    lastCallAgentId: "all",
    includeMissedCalls: false,
    calendlyOnlyToday: false,
    limit: 2000,
  };
  const [openResult, closedResult] = await Promise.all([
    listCrmLeadIntents(token, { ...params, closed: false }),
    listCrmLeadIntents(token, { ...params, closed: true }),
  ]);
  const allRows = dedupeLeadIntentRows([
    ...(openResult.rows || openResult.items || []),
    ...(closedResult.rows || closedResult.items || []),
  ]);
  const agents = [
    ...(openResult.options?.agents || []),
    ...(closedResult.options?.agents || []),
  ];

  return {
    rows: buildHighLevelFunnelRowsFromLeadIntents(allRows, dateBegin, dateEnd, agentId),
    agents: mergeAgentOptions(agents, agentId),
  };
}

function buildHighLevelFunnelRowsFromLeadIntents(
  rows: CrmLeadIntentRow[],
  dateBegin: string,
  dateEnd: string,
  agentId: string,
) {
  const selectedAgentId = Number.parseInt(agentId, 10);
  const hasAgentFilter = Number.isInteger(selectedAgentId) && selectedAgentId > 0;
  const leadProfiles = buildLeadIntentProfiles(rows);
  const groups = new Map<string, CrmHighLevelFunnelRow>();
  const sourceNames = new Set<string>();
  const countedProfiles = new Set<string>();

  for (const row of rows) {
    const profileKey = getPrimaryLeadIntentIdentityKey(row);
    const profile = profileKey ? leadProfiles.get(profileKey) : null;
    if (
      !isSimulatorPensieIntent(row) ||
      isCalendlyBookedIntent(row) ||
      !isDateInInputRange(row.createdAtUtc, dateBegin, dateEnd) ||
      (hasAgentFilter && !profile?.agentIds.has(selectedAgentId)) ||
      (profileKey && countedProfiles.has(profileKey))
    ) {
      continue;
    }

    const leadSource = String(row.source || "Unknown").trim() || "Unknown";
    const calendlyBooked = profile?.calendlyBooked || false;
    const key = `${leadSource}::${calendlyBooked ? "yes" : "no"}`;
    sourceNames.add(leadSource);
    if (profileKey) {
      countedProfiles.add(profileKey);
    }

    const current =
      groups.get(key) ||
      ({
        leadSource,
        numberOfLeads: 0,
        calendlyBooked,
        talkToAnAgent: 0,
        sales: 0,
        revenue: null,
      } satisfies CrmHighLevelFunnelRow);

    current.numberOfLeads = getFunnelLeadCount(current) + 1;
    if (profile?.talkedToAgent || isTalkedToAgentIntent(row)) {
      current.talkToAnAgent = getFunnelTalkToAgentCount(current) + 1;
    }
    if (profile?.sale || isSaleIntent(row)) {
      current.sales = getFunnelSalesCount(current) + 1;
    }

    groups.set(key, current);
  }

  for (const leadSource of sourceNames) {
    for (const calendlyBooked of [true, false]) {
      const key = `${leadSource}::${calendlyBooked ? "yes" : "no"}`;
      if (!groups.has(key)) {
        groups.set(key, {
          leadSource,
          numberOfLeads: 0,
          calendlyBooked,
          talkToAnAgent: 0,
          sales: 0,
          revenue: null,
        });
      }
    }
  }

  return Array.from(groups.values()).sort((first, second) => {
    const sourceSort = String(first.leadSource || first.source || "").localeCompare(
      String(second.leadSource || second.source || ""),
      undefined,
      { sensitivity: "base" },
    );
    if (sourceSort !== 0) {
      return sourceSort;
    }

    return formatCalendlyBooked(second.calendlyBooked).localeCompare(formatCalendlyBooked(first.calendlyBooked));
  });
}

function buildLeadIntentProfiles(rows: CrmLeadIntentRow[]) {
  const profiles = new Map<
    string,
    {
      calendlyBooked: boolean;
      talkedToAgent: boolean;
      sale: boolean;
      agentIds: Set<number>;
    }
  >();

  for (const row of rows) {
    if (!isSimulatorPensieIntent(row)) {
      continue;
    }

    const keys = getLeadIntentIdentityKeys(row);
    if (!keys.length) {
      continue;
    }

    const existingProfile = keys.map((key) => profiles.get(key)).find(Boolean);
    const profile =
      existingProfile ||
      ({
        calendlyBooked: false,
        talkedToAgent: false,
        sale: false,
        agentIds: new Set<number>(),
      } satisfies {
        calendlyBooked: boolean;
        talkedToAgent: boolean;
        sale: boolean;
        agentIds: Set<number>;
      });

    profile.calendlyBooked = profile.calendlyBooked || isCalendlyBookedIntent(row);
    profile.talkedToAgent = profile.talkedToAgent || isTalkedToAgentIntent(row);
    profile.sale = profile.sale || isSaleIntent(row);

    const rowAgentId = Number(row.lastCallAgentId);
    if (Number.isInteger(rowAgentId) && rowAgentId > 0 && rowAgentId !== 5) {
      profile.agentIds.add(rowAgentId);
    }

    for (const key of keys) {
      profiles.set(key, profile);
    }
  }

  return profiles;
}

function getPrimaryLeadIntentIdentityKey(row: CrmLeadIntentRow) {
  return getLeadIntentIdentityKeys(row)[0] || "";
}

function getLeadIntentIdentityKeys(row: CrmLeadIntentRow) {
  const keys = new Set<string>();
  const lead = row.lead;

  addIdentityKey(keys, "canonical", lead?.canonicalContactId || lead?.canonical?.contactId);
  addIdentityKey(keys, "contact", lead?.contactId);
  addIdentityKey(keys, "lead", row.leadId || lead?.id || lead?.wixId || lead?._id || lead?.leadid);
  addIdentityKey(keys, "phone", lead?.normalizedPhone || lead?.phoneNumber, normalizeIdentityPhone);
  addIdentityKey(keys, "email", lead?.email, normalizeIdentityEmail);
  addIdentityKey(keys, "email", lead?.secondaryemail, normalizeIdentityEmail);

  return Array.from(keys);
}

function addIdentityKey(
  keys: Set<string>,
  prefix: string,
  value?: string | null,
  normalize: (value: string) => string = (item) => item.trim(),
) {
  const normalized = normalize(String(value || ""));
  if (normalized) {
    keys.add(`${prefix}:${normalized}`);
  }
}

function normalizeIdentityPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-10) : "";
}

function normalizeIdentityEmail(value: string) {
  return value.trim().toLowerCase();
}

function dedupeLeadIntentRows(rows: CrmLeadIntentRow[]) {
  const seen = new Set<string>();
  return rows.filter((row, index) => {
    const key = row.interestId || `${row.leadId || ""}-${row.serviceId || ""}-${row.createdAtUtc || ""}-${index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getCreatedLastDaysForDateBegin(dateBegin: string) {
  const begin = getDateRangeBoundary(dateBegin, "start");
  if (!begin) {
    return 30;
  }

  const diffMs = Date.now() - begin.getTime();
  return Math.max(1, Math.ceil(diffMs / 86400000) + 1);
}

function isDateInInputRange(value: string | null | undefined, dateBegin: string, dateEnd: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return false;
  }

  const begin = getDateRangeBoundary(dateBegin, "start");
  const end = getDateRangeBoundary(dateEnd, "end");

  return (!begin || date >= begin) && (!end || date <= end);
}

function getDateRangeBoundary(value: string, side: "start" | "end") {
  if (!value) {
    return null;
  }

  const suffix = side === "start" ? "T00:00:00" : "T23:59:59.999";
  const date = new Date(`${value}${suffix}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSimulatorPensieIntent(row: CrmLeadIntentRow) {
  const serviceText = `${row.serviceKey || ""} ${row.serviceDisplayName || ""}`
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  return serviceText.includes("simulator pensie") || serviceText.includes("simulatorpensie");
}

function isCalendlyBookedIntent(row: CrmLeadIntentRow) {
  return String(row.interestType || "").trim().toUpperCase() === "CALENDLY";
}

function isSaleIntent(row: CrmLeadIntentRow) {
  return String(row.lead?.statusOriginal || "").trim().toUpperCase() === "SALE";
}

function isTalkedToAgentIntent(row: CrmLeadIntentRow) {
  const agentId = Number(row.lastCallAgentId);
  return Number.isInteger(agentId) && agentId > 0 && agentId !== 5;
}

function isNotFoundError(error: unknown) {
  return error instanceof Error && /not found|404/i.test(error.message);
}

function getFunnelLeadCount(row: CrmHighLevelFunnelRow) {
  return Number(row.numberOfLeads ?? row.leadCount ?? 0) || 0;
}

function getFunnelTalkToAgentCount(row: CrmHighLevelFunnelRow) {
  return Number(row.talkToAnAgent ?? row.talkedToAgent ?? 0) || 0;
}

function getFunnelSalesCount(row: CrmHighLevelFunnelRow) {
  return Number(row.sales ?? 0) || 0;
}

function getFunnelRevenue(row: CrmHighLevelFunnelRow) {
  return Number(row.revenue ?? 0) || 0;
}

function formatCalendlyBooked(value?: boolean | string | number | null) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }

  if (["1", "true", "yes", "y"].includes(text.toLowerCase())) {
    return "Yes";
  }

  if (["0", "false", "no", "n"].includes(text.toLowerCase())) {
    return "No";
  }

  return text;
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

function formatPounds(value?: number | null) {
  const amount = formatMoney(value);
  return amount ? `£${amount}` : "";
}
