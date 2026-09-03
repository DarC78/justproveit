import { useAuth } from "@/context/AuthContext";
import {
  addCrmLeadPhone,
  closeCrmInboundSmsCase,
  createCrmAsapIntent,
  CrmActivity,
  CrmAgentReportPaymentSummary,
  CrmAgentReportPauseBreakdownRow,
  CrmAgentReportRow,
  CrmContactPhone,
  CrmHighLevelFunnelRow,
  CrmInboundSms,
  CrmLead,
  CrmLeadIntentServiceOption,
  CrmLeadIntentRow,
  CrmMissedCall,
  CrmPredictiveCampaignSummary,
  CrmQuickReportDetails,
  CrmQuickReportResult,
  CrmSale,
  CrmSaleHistoryEvent,
  CrmSaleHistoryResponse,
  findCrmLeadByPhone,
  getCrmLeadQuickReport,
  getCrmSaleHistory,
  insertManualCrmLead,
  listCrmAgentReport,
  listCrmInboundSms,
  listCrmLeadIntents,
  listCrmHighLevelFunnels,
  listCrmMissedCalls,
  listCrmLeads,
  listCrmSales,
  queueCrmEmailSequence,
  queueCrmSmsSequence,
  reserveCrmLeadIntent,
  scheduleManualCrmEmail,
  searchCrmActivity,
  sendManualCrmSms,
  stopCrmLeadDialler,
  updateCrmLead,
} from "@/lib/crmAdmin";
import { sendGenericUpdateEmail } from "@/lib/genericReports";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type TabKey =
  | "details"
  | "new"
  | "sales"
  | "all"
  | "intents"
  | "inboundSms"
  | "agentreport"
  | "manual"
  | "highLevelFunnels"
  | "missed";
type GateStatus = "checking" | "allowed" | "denied";
type InboundSmsThreadStatus = "answered" | "to_be_answered" | "past_due";
type InboundSmsThread = {
  phone: string;
  phoneKey: string;
  messages: CrmInboundSms[];
  lastSms: CrmInboundSms;
  lastAt: string | null;
  status: InboundSmsThreadStatus;
  leadName: string;
};
type SmsTranscriptItem = {
  timestamp: string | null;
  direction: "inbound" | "outbound";
  body: string;
  agent: string;
};
type LocalOutboundSms = SmsTranscriptItem & {
  phoneKey: string;
  timestamp: string;
};

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "details", label: "Detalii Lead" },
  { key: "new", label: "Lead Nou" },
  { key: "sales", label: "Arata Vanzarile" },
  { key: "all", label: "All Leads CRM" },
  { key: "intents", label: "Lead Intents" },
  { key: "inboundSms", label: "InboundSMS" },
  { key: "agentreport", label: "Agent Report" },
  { key: "manual", label: "Send Manual Email/SMS" },
];
const ROUTABLE_TABS = new Set<TabKey>([...TABS.map((item) => item.key), "missed", "highLevelFunnels"]);

function getInitialTab(): TabKey {
  if (typeof window === "undefined") {
    return "details";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");
  return ROUTABLE_TABS.has(tab as TabKey) ? (tab as TabKey) : "details";
}

function hasCheckoutReturnSignal(query: Record<string, string | string[] | undefined>) {
  const checkout = getQueryValue(query.checkout);
  const sessionId = getQueryValue(query.session_id);
  const payment = getQueryValue(query.payment);
  const sale = getQueryValue(query.sale);

  return checkout === "success" || payment === "success" || sale === "success" || Boolean(sessionId);
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
const DEFAULT_EMAIL_SEQUENCE_OPTIONS = [{ label: "Test email", value: "Test email" }];

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

const QUICK_REPORT_FREE_CHECK_ORDER = ["MF01", "CD01", "CD07", "FC02", "FC05", "FC07"];

const QUICK_REPORT_FREE_CHECK_LABELS: Record<string, string> = {
  MF01: "Cod fiscal (tax code) gresit",
  CD01: "Credit score / raport de credit",
  CD07: "Bank switching bonus neaccesat",
  FC02: "Asigurari auto/casa",
  FC05: "Comisioane remitere bani spre Romania",
  FC07: "Facturi de utilitati",
};

const QUICK_REPORT_FAZA0_ANSWER_LABELS: Record<string, string> = {
  multipleJobs: "A avut mai multe joburi?",
  taxRecoveredLast5Years: "A recuperat taxele pe ultimii 5 ani?",
  electoralRoll: "Este inscris pe electoral roll?",
  creditReportChecked: "A verificat raportul de credit pentru erori?",
  bankSwitchLast: "Cand a schimbat ultima data banca?",
  insuranceRenewal: "Cum a reinnoit asigurarea auto/casa?",
  transferMethod: "Cum trimite bani in Romania?",
  transferCompared: "A comparat comisioanele de transfer?",
  utilitiesCompared: "A comparat facturile de utilitati?",
};

const QUICK_REPORT_INTERNAL_ANSWER_LABELS: Record<string, string> = {
  ukEmploymentType: "A muncit in UK ca angajat/self-employed?",
  knowsAllPrivatePensions: "Stie toate pensiile private?",
  hadCarFinanceBeforeNov2024: "Masina cu plata in rate inainte de Noiembrie 2024?",
  hasCreditCardOverdraftOrPaydayLoansDebt: "Datorii pe carduri de credit / overdraft / payday loans?",
  checkedCouncilTaxBand: "A verificat banda de council tax?",
  creditScoreLevel: "Scor de credit",
  agentObservations: "Observatii agent",
};

const QUICK_REPORT_VALUE_LABELS: Record<string, Record<string, string>> = {
  multipleJobs: { yes: "Da", no: "Nu" },
  taxRecoveredLast5Years: { yes: "Da", no: "Nu" },
  electoralRoll: { yes: "Da", no: "Nu" },
  creditReportChecked: { yes: "Da", no: "Nu" },
  transferCompared: { yes: "Da", no: "Nu" },
  utilitiesCompared: { yes: "Da", no: "Nu" },
  knowsAllPrivatePensions: { yes: "Da", no: "Nu" },
  hadCarFinanceBeforeNov2024: { yes: "Da", no: "Nu" },
  hasCreditCardOverdraftOrPaydayLoansDebt: { yes: "Da", no: "Nu" },
  checkedCouncilTaxBand: { yes: "Da", no: "Nu" },
  bankSwitchLast: {
    within12: "In ultimele 12 luni",
    over12: "Acum mai mult de 12 luni",
    never: "Niciodata",
  },
  insuranceRenewal: {
    compared: "A comparat ofertele",
    autoNoCompare: "Reinnoire automata fara comparatie",
    notApplicable: "Nu se aplica",
  },
  transferMethod: {
    bank: "Banca",
    westernUnion: "Western Union",
    moneyGram: "MoneyGram",
    wise: "Wise",
    revolut: "Revolut",
    other: "Alta metoda",
  },
  ukEmploymentType: {
    employee: "Angajat",
    selfEmployed: "Self-employed",
    both: "Angajat si self-employed",
    notWorked: "Nu a muncit in UK",
    unknown: "Nu stie / necunoscut",
  },
  creditScoreLevel: {
    low: "Mic",
    medium: "Mediu",
    high: "Mare",
  },
};

const LEAD_FIELD_LABELS: Record<string, string> = {
  id: "Lead ID",
  wixId: "Wix ID",
  _id: "Record ID",
  contactId: "Contact ID",
  canonicalContactId: "Canonical contact ID",
  leadid: "Legacy lead ID",
  fullName: "Nume",
  phoneNumber: "Telefon",
  normalizedPhone: "Telefon normalizat",
  email: "Email",
  secondaryemail: "Email 2",
  emailLeads: "Email leads",
  emailAsap: "Email ASAP",
  isCustomer: "Este client?",
  statusOriginal: "Rezultat",
  dataUrmatorContact: "FU",
  observation: "Obs",
  language: "Limba",
  initialAgent: "Agent initial",
  lastAgent: "Ultimul agent",
  leadDate: "Data lead",
  createdAtUtc: "Creat",
  updatedAtUtc: "Actualizat",
  addToDialler: "Add to dialler",
  financeCompany: "Firma finantare",
  year: "Anul achizitiei",
  nrInmatriculare: "Numar inmatriculare",
  canonical: "Canonical",
  phones: "Telefoane",
};

const LEAD_INTENT_FIELD_LABELS: Record<string, string> = {
  interestId: "Intent ID",
  leadId: "Lead ID",
  contactId: "Contact ID",
  canonicalContactId: "Canonical contact ID",
  serviceId: "Service ID",
  serviceKey: "Service",
  serviceDisplayName: "Service display",
  interestType: "Lead intent",
  source: "Source",
  campaignName: "Campaign",
  adGroupName: "Ad group",
  adName: "Ad",
  language: "Limba",
  contactTimeUtc: "FU intent",
  intentStatus: "Intent status",
  addToDialler: "Add to dialler",
  notes: "Notes",
  createdAtUtc: "Creat",
  closedAtUtc: "Inchis",
  updatedAtUtc: "Actualizat",
  reservedByAgent: "Rezervat de",
  reservedAtUtc: "Rezervat la",
  reservationExpiresAtUtc: "Rezervare expira",
};

const LEAD_FIELD_ORDER = [
  "id",
  "wixId",
  "_id",
  "contactId",
  "canonicalContactId",
  "leadid",
  "fullName",
  "phoneNumber",
  "normalizedPhone",
  "email",
  "secondaryemail",
  "emailLeads",
  "emailAsap",
  "isCustomer",
  "statusOriginal",
  "dataUrmatorContact",
  "observation",
  "language",
  "initialAgent",
  "lastAgent",
  "leadDate",
  "createdAtUtc",
  "updatedAtUtc",
  "addToDialler",
  "financeCompany",
  "year",
  "nrInmatriculare",
  "canonical",
  "phones",
];

const LEAD_INTENT_FIELD_ORDER = [
  "interestId",
  "leadId",
  "contactId",
  "canonicalContactId",
  "serviceId",
  "serviceKey",
  "serviceDisplayName",
  "interestType",
  "source",
  "campaignName",
  "adGroupName",
  "adName",
  "language",
  "contactTimeUtc",
  "intentStatus",
  "addToDialler",
  "notes",
  "lastCallAgentId",
  "lastCallAgentName",
  "lastCallTraceId",
  "lastCallTimeUtc",
  "lastCallCode",
  "lastCallCodeDetails",
  "totalPreviousCalls",
  "postIntentLastCallAgentId",
  "postIntentLastCallAgentName",
  "postIntentLastCallTraceId",
  "postIntentLastCallTimeUtc",
  "postIntentLastCallCode",
  "postIntentLastCallCodeDetails",
  "createdAtUtc",
  "closedAtUtc",
  "updatedAtUtc",
  "reservedByAgent",
  "reservedAtUtc",
  "reservationExpiresAtUtc",
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

const JOB_APPLICATION_LEAD_INTENT_OPTIONS = ["JobApplication", "JobApplications"];
const HIDDEN_LEAD_INTENT_OPTIONS = [
  ...JOB_APPLICATION_LEAD_INTENT_OPTIONS,
  "BookCall",
  "InboundEmail",
  "inbound_email",
  "MissedCall",
  "PostCallFU",
];

function normalizeLeadIntentType(value?: string | null) {
  return String(value || "")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
}

function isExplicitOnlyLeadIntent(value?: string | null) {
  const normalized = normalizeLeadIntentType(value);
  return HIDDEN_LEAD_INTENT_OPTIONS.some(
    (intent) => normalizeLeadIntentType(intent) === normalized,
  );
}

function isJobApplicationLeadIntent(value?: unknown) {
  const normalized = normalizeLeadIntentType(String(value || ""));
  return JOB_APPLICATION_LEAD_INTENT_OPTIONS.some(
    (intent) => normalizeLeadIntentType(intent) === normalized,
  );
}

function includesJobApplicationText(value?: unknown) {
  return normalizeLeadIntentType(String(value || "")).includes("JOBAPPLICATION");
}

function isJobApplicationLeadContext(
  lead?: CrmLead | null,
  intent?: CrmLeadIntentRow | null,
  forceJobApplication = false,
) {
  if (forceJobApplication || isJobApplicationLeadIntent(intent?.interestType)) {
    return true;
  }

  const leadRecord = (lead || {}) as Record<string, unknown>;
  const intentRecord = (intent || {}) as Record<string, unknown>;
  const signalKeys = [
    "interestType",
    "leadIntent",
    "leadIntentType",
    "intent",
    "intentType",
    "lead_intent",
    "source",
    "serviceKey",
    "serviceDisplayName",
    "campaignName",
    "adGroupName",
    "adName",
  ];

  return signalKeys.some(
    (key) => includesJobApplicationText(leadRecord[key]) || includesJobApplicationText(intentRecord[key]),
  );
}

function shouldHideExplicitOnlyLeadIntents(intent: string) {
  return String(intent || "").trim().toLowerCase() === "all";
}

function filterExplicitOnlyLeadIntents(rows: CrmLeadIntentRow[], intent: string) {
  if (!shouldHideExplicitOnlyLeadIntents(intent)) {
    return rows;
  }

  return rows.filter((row) => !isExplicitOnlyLeadIntent(row.interestType));
}

function mergeLeadIntentOptions(options: string[], current?: string | null) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const item of options) {
    const value = String(item || "").trim();
    const key = value.toLowerCase();
    if (!value || isExplicitOnlyLeadIntent(value) || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(value);
  }

  return mergeCurrentOption(merged, isExplicitOnlyLeadIntent(current) ? null : current);
}

function formatLanguage(value?: string | null) {
  const text = String(value || "").trim();
  return LANGUAGE_LABELS[text.toLowerCase()] || text;
}

function formatLeadIntentComposition(rows: CrmLeadIntentRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const serviceName = formatLeadIntentServiceDisplay(
      row.serviceDisplayName || row.serviceKey,
      "Unknown Service",
    );
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
  | "TotalPreviousCalls"
  | "LastAgent"
  | "LastCall"
  | "LastCallCode"
  | "Language"
  | "Source"
  | "Campaign";

type LeadIntentSortConfig = {
  column: LeadIntentSortColumn;
  direction: "asc" | "desc";
};

function getLeadIntentSortValue(
  row: CrmLeadIntentRow,
  column: LeadIntentSortColumn,
  agentNameById?: Map<number, string>,
) {
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
      return formatLeadIntentServiceDisplay(row.serviceDisplayName, row.serviceKey);
    case "CRM Status":
      return row.lead?.statusOriginal || "";
    case "TotalPreviousCalls":
      return getLeadIntentTotalPreviousCalls(row);
    case "LastAgent":
      return formatLeadIntentPostIntentLastAgent(row, agentNameById);
    case "LastCall":
      return getDateTimeValue(getLeadIntentPostIntentLastCallTime(row));
    case "LastCallCode":
      return getLeadIntentPostIntentLastCallCode(row);
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

const MONEY_CHECK_SERVICE_KEY = "FreeMoneyCheck";
const MONEY_CHECK_SERVICE_LABEL = "Money Check";
const MONEY_CHECK_SERVICE_ALIASES = [MONEY_CHECK_SERVICE_KEY, MONEY_CHECK_SERVICE_LABEL, "free_money_check"];
const MONEY_CHECK_SERVICE_OPTION: CrmLeadIntentServiceOption = {
  serviceKey: MONEY_CHECK_SERVICE_KEY,
  displayName: MONEY_CHECK_SERVICE_LABEL,
};

const HIDDEN_LEAD_INTENT_SERVICE_OPTIONS = ["Book Call", "Inbound SMS", "Missed Calls"];
const DEFAULT_NEW_ASAP_SERVICE_OPTIONS: CrmLeadIntentServiceOption[] = [
  { serviceKey: "simulator pensie", displayName: "simulator pensie" },
  MONEY_CHECK_SERVICE_OPTION,
  { serviceKey: "other", displayName: "other" },
];

function isMoneyCheckServiceValue(value?: string | null) {
  const normalized = normalizeLeadIntentType(value);
  return Boolean(
    normalized &&
      MONEY_CHECK_SERVICE_ALIASES.some((alias) => normalizeLeadIntentType(alias) === normalized),
  );
}

function normalizeLeadIntentServiceOption(item: { serviceKey?: string | null; displayName?: string | null }) {
  const serviceKey = String(item.serviceKey || "").trim();
  const displayName = String(item.displayName || "").trim();

  if (!serviceKey) {
    return null;
  }

  if (isMoneyCheckServiceValue(serviceKey) || isMoneyCheckServiceValue(displayName)) {
    return MONEY_CHECK_SERVICE_OPTION;
  }

  return { serviceKey, displayName: displayName || null };
}

function formatLeadIntentServiceDisplay(
  value?: string | null,
  fallback?: string | null,
) {
  if (isMoneyCheckServiceValue(value) || isMoneyCheckServiceValue(fallback)) {
    return MONEY_CHECK_SERVICE_LABEL;
  }

  return String(value || fallback || "").trim();
}

function matchesServiceOption(item: { serviceKey: string; displayName?: string | null }, value: string) {
  const normalizedValue = normalizeLeadIntentType(value);
  return (
    normalizeLeadIntentType(item.serviceKey) === normalizedValue ||
    normalizeLeadIntentType(item.displayName) === normalizedValue
  );
}

function isHiddenLeadIntentServiceValue(value?: string | null) {
  const normalized = normalizeLeadIntentType(value);
  return HIDDEN_LEAD_INTENT_SERVICE_OPTIONS.some(
    (service) => normalizeLeadIntentType(service) === normalized,
  );
}

function isHiddenLeadIntentServiceOption(item: { serviceKey?: string | null; displayName?: string | null }) {
  return isHiddenLeadIntentServiceValue(item.serviceKey) || isHiddenLeadIntentServiceValue(item.displayName);
}

function mergeServiceOptions(
  options: Array<{ serviceKey: string; displayName?: string | null }>,
  current?: string | null,
) {
  const seen = new Set<string>();
  const serviceOptions: Array<{ serviceKey: string; displayName?: string | null }> = [];

  for (const item of [...options, MONEY_CHECK_SERVICE_OPTION]) {
    const normalizedItem = normalizeLeadIntentServiceOption(item);
    if (!normalizedItem || isHiddenLeadIntentServiceOption(normalizedItem)) {
      continue;
    }

    const key = normalizeLeadIntentType(normalizedItem.serviceKey);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    serviceOptions.push(normalizedItem);
  }

  const currentValue = String(current || "").trim();
  if (
    !currentValue ||
    currentValue === "all" ||
    isHiddenLeadIntentServiceValue(currentValue) ||
    serviceOptions.some((item) => matchesServiceOption(item, currentValue))
  ) {
    return serviceOptions;
  }

  return [
    { serviceKey: currentValue, displayName: formatLeadIntentServiceDisplay(currentValue) || currentValue },
    ...serviceOptions,
  ];
}

function mergeAgentOptions(
  options: Array<{ agentId: number | string; agentName?: string | null }>,
  current?: string | null,
) {
  const byId = new Map<number, { agentId: number; agentName?: string | null }>();
  for (const option of options) {
    const agentId = parseAgentId(option.agentId);
    if (agentId) {
      byId.set(agentId, { agentId, agentName: getReadableAgentName(option.agentName) || null });
    }
  }

  const unique = Array.from(byId.values()).sort((a, b) => a.agentId - b.agentId);
  const currentValue = parseAgentId(current);

  if (!currentValue || byId.has(currentValue)) {
    return unique;
  }

  return [{ agentId: currentValue, agentName: null }, ...unique];
}

function buildAgentNameById(options: Array<{ agentId: number; agentName?: string | null }>) {
  const names = new Map<number, string>();

  for (const option of options) {
    const agentId = parseAgentId(option.agentId);
    const agentName = getReadableAgentName(option.agentName);
    if (agentId && agentName) {
      names.set(agentId, agentName);
    }
  }

  return names;
}

function parseAgentId(value?: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }

  const agentId = Number(text);
  return Number.isSafeInteger(agentId) && agentId > 0 ? agentId : null;
}

function getReadableAgentName(value?: string | null) {
  const name = String(value || "").trim();
  return parseAgentId(name) ? "" : name;
}

function isCarFinanceIntent(row?: CrmLeadIntentRow | null) {
  const serviceText = `${row?.serviceKey || ""} ${row?.serviceDisplayName || ""}`
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  return serviceText.includes("car finance") || serviceText.includes("carfinance");
}

function isAsapLeadIntent(row?: CrmLeadIntentRow | null) {
  return String(row?.interestType || "").trim().toUpperCase() === "ASAP";
}

function getLeadIntentId(row?: CrmLeadIntentRow | null) {
  return String(row?.interestId || "").trim();
}

function getLeadIntentServiceKey(row?: CrmLeadIntentRow | null) {
  return String(row?.serviceKey || row?.serviceDisplayName || "").trim();
}

function getLeadIntentServiceLabel(row?: CrmLeadIntentRow | null) {
  return formatLeadIntentServiceDisplay(row?.serviceDisplayName, row?.serviceKey) || "n/a";
}

function resolveNewAsapServiceSelection(
  options: CrmLeadIntentServiceOption[],
  preferredService?: string | null,
) {
  const visibleOptions = mergeServiceOptions(
    options.length ? options : DEFAULT_NEW_ASAP_SERVICE_OPTIONS,
    preferredService,
  );
  const preferred = String(preferredService || "").trim().toLowerCase();
  const preferredOption = visibleOptions.find(
    (option) =>
      option.serviceKey.toLowerCase() === preferred ||
      String(option.displayName || "").trim().toLowerCase() === preferred,
  );

  return preferredOption?.serviceKey || visibleOptions[0]?.serviceKey || "";
}

function isEmailLookupValue(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeLookupEmail(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeLookupPhone(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

async function listCrmLeadIntentRowsForLookup(
  token: string,
  lookup: { phone?: string | null; email?: string | null },
  intent = "all",
) {
  const baseParams = {
    createdLastDays: 3650,
    statusBucket: "both",
    toBeContacted: "oricand",
    intent,
    service: "all",
    language: "all",
    phone: lookup.phone || undefined,
    email: lookup.email || undefined,
    lastCallAgentId: "all",
    limit: 20,
  };

  const [openResult, closedResult] = await Promise.all([
    listCrmLeadIntents(token, { ...baseParams, closed: false }),
    listCrmLeadIntents(token, { ...baseParams, closed: true }),
  ]);

  return [
    ...(openResult.rows || openResult.items || []),
    ...(closedResult.rows || closedResult.items || []),
  ].sort((first, second) => getDateTimeValue(second.createdAtUtc) - getDateTimeValue(first.createdAtUtc));
}

async function findLatestCrmLeadIntent(
  token: string,
  lookup: { phone?: string | null; email?: string | null },
  intent = "all",
) {
  const rows = await listCrmLeadIntentRowsForLookup(token, lookup, intent);
  return rows[0] || null;
}

async function findJobApplicationCrmLeadIntent(
  token: string,
  lookup: { phone?: string | null; email?: string | null },
) {
  const rowGroups = await Promise.all(
    [...JOB_APPLICATION_LEAD_INTENT_OPTIONS, "all"].map((intent) =>
      listCrmLeadIntentRowsForLookup(token, lookup, intent).catch(() => [] as CrmLeadIntentRow[]),
    ),
  );

  return rowGroups
    .flat()
    .filter((row): row is CrmLeadIntentRow => Boolean(row) && isJobApplicationLeadContext(row?.lead, row))
    .sort((first, second) => getDateTimeValue(second?.createdAtUtc) - getDateTimeValue(first?.createdAtUtc))[0] || null;
}

async function findCrmLeadIntentForDetails(
  token: string,
  lookup: { phone?: string | null; email?: string | null },
) {
  const [jobApplicationIntent, latestIntent] = await Promise.all([
    findJobApplicationCrmLeadIntent(token, lookup),
    findLatestCrmLeadIntent(token, lookup).catch(() => null),
  ]);

  return jobApplicationIntent || latestIntent;
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
  const forcedDetailsIntent = useMemo(() => {
    const intentQuery = router.query.intent ?? router.query.leadIntent ?? router.query.interestType;
    const value = Array.isArray(intentQuery) ? intentQuery[0] : intentQuery;
    return String(value || "").trim();
  }, [router.query.intent, router.query.interestType, router.query.leadIntent]);
  const forceJobApplicationDetails = isJobApplicationLeadIntent(forcedDetailsIntent);

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
      findCrmLeadIntentForDetails(token, { phone: cleanPhone }).catch(() => null),
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
    const email = String(lead.email || "").trim();
    setSelectedLead(lead);
    setSelectedIntent(null);
    detailsTabButtonRef.current?.click();

    if (!token || (!phone && !email)) {
      setStatusMessage("Lead incarcat.");
      setErrorMessage("");
      return;
    }

    try {
      const latestIntent = await findCrmLeadIntentForDetails(token, phone ? { phone } : { email });
      if (latestIntent?.lead) {
        setSelectedLead(latestIntent.lead);
        setSelectedIntent(latestIntent);
        setStatusMessage(
          isJobApplicationLeadIntent(latestIntent.interestType)
            ? "Lead incarcat dupa intent JobApplication."
            : "Lead incarcat dupa ultimul intent.",
        );
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
                <LeadDetailsPanel
                  token={token}
                  agentName={agentName}
                  lead={selectedLead}
                  selectedIntent={selectedIntent}
                  forceJobApplication={forceJobApplicationDetails}
                  onLeadChange={setSelectedLead}
                  onIntentChange={setSelectedIntent}
                  onStatus={setStatusMessage}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "new" ? (
                <NewLeadPanel
                  token={token}
                  agentName={agentName}
                  onStatus={setStatusMessage}
                  onCreated={(lead) => {
                    setSelectedLead(lead);
                    setSelectedIntent(null);
                    setActiveTabState("details");
                    setStatusMessage("Lead adaugat.");
                  }}
                  onAccepted={(reference) => {
                    setSelectedLead(blankLead());
                    setSelectedIntent(null);
                    setStatusMessage(
                      reference
                        ? `Lead preluat pentru procesare. Referinta: ${reference}.`
                        : "Lead preluat pentru procesare.",
                    );
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
                  agentName={agentName}
                  onSelectLead={handleLeadSelected}
                  onStatus={setStatusMessage}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "intents" ? (
                <LeadIntentPanel
                  token={token}
                  agentName={agentName}
                  onSelectIntent={handleIntentSelected}
                  onStatus={setStatusMessage}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "inboundSms" ? (
                <InboundSmsPanel
                  token={token}
                  agentName={agentName}
                  onStatus={setStatusMessage}
                  onError={setErrorMessage}
                />
              ) : null}

              {activeTab === "agentreport" ? (
                <AgentReportPanel token={token} onError={setErrorMessage} />
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
  selectedIntent,
  forceJobApplication,
  onLeadChange,
  onIntentChange,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  lead: CrmLead;
  selectedIntent: CrmLeadIntentRow | null;
  forceJobApplication?: boolean;
  onLeadChange: (lead: CrmLead) => void;
  onIntentChange: (intent: CrmLeadIntentRow | null) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState<CrmLead>(lead);
  const [lookupValue, setLookupValue] = useState("");
  const [newObservation, setNewObservation] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [smsBusy, setSmsBusy] = useState<"buy" | "skeptic" | "">("");
  const [emailSequenceBusy, setEmailSequenceBusy] = useState(false);
  const [statusUpdateBusy, setStatusUpdateBusy] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState("");
  const [selectedCmcDomain, setSelectedCmcDomain] = useState("");
  const [lastContactDate, setLastContactDate] = useState("");
  const [lastContactTime, setLastContactTime] = useState("");
  const [activityLookup, setActivityLookup] = useState("");
  const [activityRows, setActivityRows] = useState<CrmActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [quickReport, setQuickReport] = useState<CrmQuickReportDetails | null>(null);
  const [quickReportLoading, setQuickReportLoading] = useState(false);
  const [quickReportMessage, setQuickReportMessage] = useState("");
  const isCarFinance = isCarFinanceIntent(selectedIntent);
  const isJobApplication = isJobApplicationLeadContext(draft, selectedIntent, forceJobApplication);
  const emailSequenceOptions = isCarFinance ? EMAIL_SEQUENCE_OPTIONS : DEFAULT_EMAIL_SEQUENCE_OPTIONS;
  const lastContactValue = isJobApplication ? lead.dataUrmatorContact : getLeadLastContactValue(lead, selectedIntent);
  const selectedEmail = getLeadStatusUpdateEmail(draft);

  useEffect(() => {
    setDraft(lead);
    setLookupValue(getLeadLookupValue(lead));
    setNewObservation("");
    setNewEmail("");
    setNewPhone("");
    setSelectedSequence("");
    setSelectedCmcDomain("");
    setLastContactDate(toInputDate(lastContactValue));
    setLastContactTime(toInputTime(lastContactValue));
    setActivityLookup(getLeadLookupValue(lead));
    setActivityRows([]);
    setQuickReport(null);
    setQuickReportMessage("");
    void loadLeadHistory(lead, { silent: true });
    void loadLeadQuickReport(lead, selectedIntent, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, selectedIntent]);

  async function handleLeadLookup() {
    const lookup = lookupValue.trim();
    if (!token || !lookup) {
      return;
    }

    try {
      const isEmailLookup = isEmailLookupValue(lookup);
      const [leadResult, latestIntent] = await Promise.all([
        isEmailLookup
          ? listCrmLeads(token, { email: lookup, status: "all", limit: 1 })
          : findCrmLeadByPhone(token, lookup),
        findCrmLeadIntentForDetails(token, isEmailLookup ? { email: lookup } : { phone: lookup }).catch(() => null),
      ]);
      const foundLead =
        latestIntent?.lead ||
        ("leads" in leadResult ? leadResult.leads?.[0] : leadResult.lead);
      if (foundLead) {
        setDraft(foundLead);
        onLeadChange(foundLead);
        onIntentChange(latestIntent);
        onStatus(isEmailLookup ? "Lead gasit dupa email." : "Lead gasit dupa telefon.");
        onError("");
      } else {
        onStatus("");
        onError(isEmailLookup ? "Nu am gasit lead dupa email." : "Nu am gasit lead dupa telefon.");
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut cauta lead-ul.");
    }
  }

  async function handleSave() {
    const updateIds = getLeadUpdateIdCandidates(draft, selectedIntent, isJobApplication);
    if (!updateIds.length) {
      onError("Selecteaza sau cauta un lead inainte de salvare.");
      return;
    }

    setSaving(true);
    try {
      const payloadEmail = newEmail.trim() || draft.email || "";
      const nextObservation = isJobApplication
        ? String(draft.observation || "")
        : buildObservationHistory(draft.observation, newObservation);
      const updatePayload = {
        observation: nextObservation,
        financeCompany: draft.financeCompany || "",
        statusOriginal: draft.statusOriginal || "",
        language: draft.language || "",
        year: draft.year || "",
        nrInmatriculare: draft.nrInmatriculare || "",
        dataUrmatorContact: buildDateTimeValue(lastContactDate, isJobApplication ? "" : lastContactTime),
        email: payloadEmail,
        agent: agentName,
        ...(isJobApplication
          ? {
              leadId: selectedIntent?.leadId || draft.leadid || undefined,
              contactId: selectedIntent?.contactId || draft.contactId || undefined,
              canonicalContactId:
                selectedIntent?.canonicalContactId ||
                draft.canonicalContactId ||
                draft.canonical?.contactId ||
                undefined,
              intentId: selectedIntent?.interestId || undefined,
              interestId: selectedIntent?.interestId || undefined,
              leadIntentId: selectedIntent?.interestId || undefined,
              interestType: selectedIntent?.interestType || "JobApplication",
            }
          : {}),
      };
      const result = await updateCrmLeadByCandidateIds(token, updateIds, updatePayload);
      const updatedLead = isJobApplication
        ? { ...draft, ...result.lead }
        : { ...draft, ...result.lead, observation: result.lead?.observation ?? nextObservation };
      setDraft(updatedLead);
      onLeadChange(updatedLead);
      setNewObservation("");
      setNewEmail("");
      onStatus(isJobApplication ? "Lead salvat." : "Observatia a fost salvata.");
      onError("");
    } catch (error) {
      onError(formatLeadSaveError(error, isJobApplication));
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
    if (!isCarFinance) {
      onError("No SMS configured for this lead intent.");
      return;
    }

    const id = draft.id || draft.wixId || draft._id;
    if (!id) {
      onError("Selecteaza sau cauta un lead inainte de SMS.");
      return;
    }

    setSmsBusy(type);
    try {
      const result = await queueCrmSmsSequence(token, id, {
        type,
        intentId: selectedIntent?.interestId || undefined,
        serviceKey: selectedIntent?.serviceKey || undefined,
        agent: agentName,
      });
      const updatedLead = { ...draft, ...result.lead };
      setDraft(updatedLead);
      onLeadChange(updatedLead);
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
        intentId: selectedIntent?.interestId || undefined,
        serviceKey: selectedIntent?.serviceKey || undefined,
        agent: agentName,
      });
      const updatedLead = { ...draft, ...result.lead };
      setDraft(updatedLead);
      onLeadChange(updatedLead);
      onStatus(result.message || "Clientul a fost pus pe secventa de email.");
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut porni secventa de email.");
    } finally {
      setEmailSequenceBusy(false);
    }
  }

  async function loadLeadHistory(
    leadForHistory: CrmLead = draft,
    options: { lookup?: string; silent?: boolean } = {},
  ) {
    const params = buildLeadHistoryParams(leadForHistory, selectedIntent, options.lookup);
    if (!params.contactId && !params.email && !params.phone) {
      if (!options.silent) {
        onError("Introdu telefonul sau emailul pentru istoric.");
      }
      return;
    }

    setActivityLoading(true);
    try {
      const result = await searchCrmActivity(token, params);
      setActivityRows(result.activities || result.items || []);
      if (!options.silent) {
        onStatus("Istoricul a fost incarcat.");
        onError("");
      }
    } catch (error) {
      if (!options.silent) {
        onError(error instanceof Error ? error.message : "Nu am putut cauta istoricul.");
      }
    } finally {
      setActivityLoading(false);
    }
  }

  async function loadLeadQuickReport(
    leadForReport: CrmLead = draft,
    intentForReport: CrmLeadIntentRow | null = selectedIntent,
    options: { silent?: boolean } = {},
  ) {
    const params = buildLeadQuickReportParams(leadForReport, intentForReport);
    if (!hasLeadQuickReportLookup(params)) {
      setQuickReport(null);
      if (!options.silent) {
        setQuickReportMessage("Introdu telefonul sau emailul pentru a cauta raportul gratuit.");
      }
      return;
    }

    setQuickReportLoading(true);
    setQuickReportMessage("");
    try {
      const result = await getCrmLeadQuickReport(token, params);
      const report = getQuickReportDetailsFromResponse(result);
      setQuickReport(report);
      setQuickReportMessage(report ? "" : "Nu am gasit un raport gratuit salvat pentru acest lead.");
    } catch (error) {
      setQuickReport(null);
      const message = formatQuickReportDetailsError(error);
      setQuickReportMessage(message);
      if (!options.silent) {
        onError(message);
      }
    } finally {
      setQuickReportLoading(false);
    }
  }

  async function handleActivitySearch() {
    await loadLeadHistory(draft, { lookup: activityLookup.trim() });
  }

  async function refreshLeadHistoryByEmail(email: string) {
    setActivityLoading(true);
    try {
      const result = await searchCrmActivity(token, { email, limit: 500 });
      setActivityRows(result.activities || result.items || []);
      setActivityLookup(email);
      return true;
    } catch (error) {
      onError(
        error instanceof Error
          ? `Status update sent, but history could not be refreshed: ${error.message}`
          : "Status update sent, but history could not be refreshed.",
      );
      return false;
    } finally {
      setActivityLoading(false);
    }
  }

  async function handleSendStatusUpdate() {
    const email = getLeadStatusUpdateEmail(draft);
    if (!email) {
      onStatus("");
      onError("Lead-ul selectat nu are email.");
      return;
    }

    setStatusUpdateBusy(true);
    try {
      await sendGenericUpdateEmail(token, { to: email });
      const historyRefreshed = await refreshLeadHistoryByEmail(email);
      onStatus("Status update sent");
      if (historyRefreshed) {
        onError("");
      }
    } catch (error) {
      onStatus("");
      onError(error instanceof Error ? error.message : "Nu am putut trimite status update.");
    } finally {
      setStatusUpdateBusy(false);
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
          value={lookupValue}
          onChange={(event) => setLookupValue(event.target.value)}
          placeholder="Cauta dupa telefon sau email..."
        />
        <button type="button" className="orange small" onClick={handleLeadLookup}>
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
        {!isJobApplication ? <LabelValue label="Actiune:" value={draft.statusOriginal} /> : null}
        <LabelValue label="Email:" value={draft.email} />
        <LabelValue label="Data lead:" value={formatDate(draft.leadDate)} />
        <LabelValue label="Email2:" value={draft.secondaryemail} />
        <span />
        <LabelValue label="Agent Initial" value={draft.initialAgent} />
        <LabelValue label="Ultimul Agent" value={draft.lastAgent} />
      </div>

      <div className="selected-lead-actions">
        <button
          type="button"
          className="orange small"
          onClick={handleSendStatusUpdate}
          disabled={!selectedEmail || statusUpdateBusy}
        >
          {statusUpdateBusy ? "Sending..." : "send status update"}
        </button>
      </div>

      <QuickReportCrmPanel
        report={quickReport}
        loading={quickReportLoading}
        message={quickReportMessage}
        onReload={() => loadLeadQuickReport(draft, selectedIntent)}
      />

      <hr />

      {isJobApplication ? (
        <JobApplicationLeadPanel
          lead={draft}
          selectedIntent={selectedIntent}
          statusOptions={statusOptions}
          lastContactDate={lastContactDate}
          saving={saving}
          onLeadChange={setDraft}
          onLastContactDateChange={setLastContactDate}
          onSave={handleSave}
        />
      ) : (
        <>
          {isCarFinance ? (
            <>
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
            </>
          ) : null}

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
              {emailSequenceOptions.map((option) => (
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
              disabled={!isCarFinance || Boolean(smsBusy)}
            >
              {smsBusy === "buy" ? "Se adauga..." : "SMS - CUMPARA"}
            </button>
            <button
              type="button"
              className="blue"
              onClick={() => handleSmsSequence("skeptic")}
              disabled={!isCarFinance || Boolean(smsBusy)}
            >
              {smsBusy === "skeptic" ? "Se adauga..." : "SMS - SCEPTIC"}
            </button>
            {!isCarFinance ? <span className="sms-warning">no SMS configured</span> : null}
          </div>

          <p className="green-label">Rezultat actiune:</p>
          <div className="finish-row">
            <label>
              Last Status:
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
              Data ultimului Contact
              <input
                type="date"
                value={lastContactDate}
                onChange={(event) => setLastContactDate(event.target.value)}
              />
            </label>
            <label>
              Time
              <input type="time" value={lastContactTime} onChange={(event) => setLastContactTime(event.target.value)} />
            </label>
            <button type="button" className="orange small" onClick={handleSave}>
              Termina Cazul
            </button>
          </div>
        </>
      )}

      <hr />

      <div className="activity-search">
        <label>
          Cauta istoric dupa telefon sau email
          <input value={activityLookup} onChange={(event) => setActivityLookup(event.target.value)} />
        </label>
        <button type="button" className="orange small" onClick={handleActivitySearch} disabled={activityLoading}>
          {activityLoading ? "Caut..." : "Cauta istoric"}
        </button>
      </div>
      <DataTable
        columns={["timestamp", "Action", "Agent", "Param1", "Param2", "Param3", "Param4"]}
        rows={activityRows.map((item) => [
          formatDateTime(item.timestamp),
          item.action || item.state,
          item.agent,
          item.param1,
          item.param2,
          item.param3,
          item.param4,
        ])}
        loading={activityLoading}
        minWidth={880}
        className="lead-history-table"
      />

      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function JobApplicationLeadPanel({
  lead,
  selectedIntent,
  statusOptions,
  lastContactDate,
  saving,
  onLeadChange,
  onLastContactDateChange,
  onSave,
}: {
  lead: CrmLead;
  selectedIntent: CrmLeadIntentRow | null;
  statusOptions: string[];
  lastContactDate: string;
  saving: boolean;
  onLeadChange: (lead: CrmLead) => void;
  onLastContactDateChange: (value: string) => void;
  onSave: () => void;
}) {
  const leadFields = getAvailableRecordFields(lead, {
    labels: LEAD_FIELD_LABELS,
    preferredOrder: LEAD_FIELD_ORDER,
  });
  const intentFields = getAvailableRecordFields(selectedIntent, {
    labels: LEAD_INTENT_FIELD_LABELS,
    preferredOrder: LEAD_INTENT_FIELD_ORDER,
    excludedKeys: ["lead"],
  });

  return (
    <section className="job-application-panel">
      <div className="job-application-heading">
        <h2>JobApplication</h2>
        <span>{selectedIntent?.serviceDisplayName || selectedIntent?.serviceKey || "Lead intent"}</span>
      </div>

      <div className="job-application-edit-grid">
        <label>
          FU
          <input
            type="date"
            value={lastContactDate}
            onChange={(event) => onLastContactDateChange(event.target.value)}
          />
        </label>
        <label>
          Rezultat
          <select
            value={lead.statusOriginal ?? ""}
            onChange={(event) => onLeadChange({ ...lead, statusOriginal: event.target.value })}
          >
            <option value="">Status</option>
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="job-application-obs">
          Obs
          <textarea
            value={lead.observation ?? ""}
            onChange={(event) => onLeadChange({ ...lead, observation: event.target.value })}
            placeholder="Observatii"
          />
        </label>
        <button type="button" className="orange save" onClick={onSave} disabled={saving}>
          {saving ? "Se salveaza..." : "Salveaza lead"}
        </button>
      </div>

      <AvailableFieldsSection title="Toate informatiile lead-ului" fields={leadFields} />
      {selectedIntent ? <AvailableFieldsSection title="Informatii lead intent" fields={intentFields} /> : null}
    </section>
  );
}

function QuickReportCrmPanel({
  report,
  loading,
  message,
  onReload,
}: {
  report: CrmQuickReportDetails | null;
  loading: boolean;
  message: string;
  onReload: () => void;
}) {
  const results = getQuickReportResults(report);
  const faza0Answers = getQuickReportFaza0Answers(report);
  const internalAnswers = getQuickReportInternalAnswers(report);
  const answeredFaza0 = getLabeledAnswerRows(faza0Answers, QUICK_REPORT_FAZA0_ANSWER_LABELS);
  const answeredInternal = getLabeledAnswerRows(internalAnswers, QUICK_REPORT_INTERNAL_ANSWER_LABELS);

  return (
    <section className="quick-report-panel">
      <div className="quick-report-heading">
        <div>
          <h2>Money Check - raport gratuit</h2>
          <p>
            {report
              ? `Raport ${getQuickReportReference(report)}${getQuickReportDate(report) ? ` | ${formatDateTime(getQuickReportDate(report))}` : ""}`
              : "Ultimul raport gratuit atasat acestui lead."}
          </p>
        </div>
        <button type="button" className="orange small" onClick={onReload} disabled={loading}>
          {loading ? "Se incarca..." : "Reincarca raport"}
        </button>
      </div>

      {message ? <p className="quick-report-message">{message}</p> : null}

      {report ? (
        <>
          <div className="quick-report-meta">
            <LabelValue label="Nume:" value={report.fullName} />
            <LabelValue label="Email:" value={report.email} />
            <LabelValue label="Telefon:" value={report.phone || report.phoneNumber || report.normalizedPhone} />
            <LabelValue label="Lead ID:" value={report.leadId} />
          </div>

          <QuickReportResultSection results={results} />
          <QuickReportAnswerSection title="Raspunsuri Faza Zero" rows={answeredFaza0} />
          <QuickReportAnswerSection title="Informatii interne CRM" rows={answeredInternal} />
        </>
      ) : null}
    </section>
  );
}

function QuickReportResultSection({ results }: { results: CrmQuickReportResult[] }) {
  const byCode = new Map(results.map((result) => [String(result.code || "").trim().toUpperCase(), result]));
  const orderedResults = QUICK_REPORT_FREE_CHECK_ORDER.map((code) => byCode.get(code)).filter(
    (result): result is CrmQuickReportResult => Boolean(result),
  );
  const extraResults = results.filter(
    (result) => !QUICK_REPORT_FREE_CHECK_ORDER.includes(String(result.code || "").trim().toUpperCase()),
  );
  const visibleResults = [...orderedResults, ...extraResults];

  return (
    <section className="quick-report-subsection">
      <h3>Rezultatele celor 6 verificari</h3>
      {visibleResults.length ? (
        <div className="quick-report-results">
          {visibleResults.map((result, index) => {
            const code = String(result.code || "").trim().toUpperCase();
            return (
              <article key={`${code || "check"}-${index}`} className="quick-report-result-card">
                <div className="quick-report-result-title">
                  <span>{code || `Check ${index + 1}`}</span>
                  <strong>{result.title || QUICK_REPORT_FREE_CHECK_LABELS[code] || "Verificare"}</strong>
                  <em className={quickReportFlagClass(result.flag)}>{formatQuickReportFlag(result.flag)}</em>
                </div>
                <p>{result.output || "Nu exista rezultat salvat pentru aceasta verificare."}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="quick-report-empty">Nu exista rezultate salvate pentru cele 6 verificari.</p>
      )}
    </section>
  );
}

function QuickReportAnswerSection({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <section className="quick-report-subsection">
      <h3>{title}</h3>
      {rows.length ? (
        <div className="quick-report-answer-grid">
          {rows.map((row) => (
            <div key={row.label} className="quick-report-answer-row">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="quick-report-empty">Nu exista informatii salvate.</p>
      )}
    </section>
  );
}

function AvailableFieldsSection({ title, fields }: { title: string; fields: AvailableRecordField[] }) {
  return (
    <section className="available-fields-section">
      <h3>{title}</h3>
      {fields.length ? (
        <div className="available-fields-grid">
          {fields.map((field) => (
            <div key={field.key} className="available-field-row">
              <div>
                <span>{field.label}</span>
                <code>{field.key}</code>
              </div>
              <div className="available-field-value">{renderAvailableFieldValue(field.value)}</div>
            </div>
          ))}
        </div>
      ) : (
        <p>Nu exista campuri completate.</p>
      )}
    </section>
  );
}

function NewLeadPanel({
  token,
  agentName,
  onStatus,
  onCreated,
  onAccepted,
  onError,
}: {
  token: string;
  agentName: string;
  onStatus: (message: string) => void;
  onCreated: (lead: CrmLead) => void;
  onAccepted: (reference?: string | null) => void;
  onError: (message: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("");
  const [service, setService] = useState<"simulator pensie" | "FreeMoneyCheck" | "other">("simulator pensie");
  const [saving, setSaving] = useState(false);
  const [stopDiallerPhone, setStopDiallerPhone] = useState("");
  const [stopDiallerSaving, setStopDiallerSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await insertManualCrmLead(token, {
        fullName,
        email,
        phoneNumber,
        language,
        service,
        interestType: "ASAP",
        agent: agentName,
      });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setLanguage("");
      setService("simulator pensie");
      if (result?.lead) {
        onCreated(result.lead);
      } else {
        onAccepted(result?.jobId || result?.requestId || result?.operationId || null);
      }
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut adauga lead-ul.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStopDiallerSubmit(event: FormEvent) {
    event.preventDefault();
    const phone = stopDiallerPhone.trim();
    if (!phone) {
      onError("Introdu numarul de telefon pentru oprirea din dialler.");
      onStatus("");
      return;
    }

    setStopDiallerSaving(true);
    try {
      const result = await stopCrmLeadDialler(token, {
        phone,
        reason: "Removed from dialler from CRM New Lead tab",
        agent: agentName,
      });
      setStopDiallerPhone("");
      onError("");
      onStatus(result?.message || "Lead scos din dialler.");
    } catch (error) {
      onStatus("");
      onError(error instanceof Error ? error.message : "Nu am putut scoate lead-ul din dialler.");
    } finally {
      setStopDiallerSaving(false);
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
        <select
          value={service}
          onChange={(event) => setService(event.target.value as "simulator pensie" | "FreeMoneyCheck" | "other")}
        >
          <option value="simulator pensie">simulator pensie</option>
          <option value="FreeMoneyCheck">Money Check</option>
          <option value="other">other</option>
        </select>
        <button type="submit" className="orange" disabled={saving}>
          {saving ? "Se adauga..." : "Adauga Lead"}
        </button>
      </form>

      <div className="stop-dialler">
        <h2>stop dialling a lead</h2>
        <form onSubmit={handleStopDiallerSubmit}>
          <label>
            Phone number
            <input
              type="tel"
              value={stopDiallerPhone}
              onChange={(event) => setStopDiallerPhone(event.target.value)}
              placeholder="07771866203"
            />
          </label>
          <button type="submit" className="orange" disabled={stopDiallerSaving}>
            {stopDiallerSaving ? "Se opreste..." : "remove from dialler"}
          </button>
        </form>
      </div>

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
        .stop-dialler {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #ddd;
        }
        .stop-dialler h2 {
          margin: 0 0 12px;
          text-align: center;
          font-size: 20px;
          color: #444;
          font-weight: 800;
          text-transform: none;
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sales, setSales] = useState<CrmSale[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoadingKey, setHistoryLoadingKey] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<CrmSaleHistoryResponse | null>(null);
  const [selectedHistorySaleKey, setSelectedHistorySaleKey] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");
  const [historyMessageType, setHistoryMessageType] = useState<"info" | "error">("info");
  const isCheckoutReturn = useMemo(() => hasCheckoutReturnSignal(router.query), [router.query]);

  useEffect(() => {
    if (isCheckoutReturn) {
      return;
    }

    void loadSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCheckoutReturn) {
      return;
    }

    let stopped = false;
    let attempts = 0;
    const maxAttempts = 10;

    const pollSales = () => {
      attempts += 1;
      void loadSales({ forceRefresh: true }).finally(() => {
        if (!stopped && attempts >= maxAttempts && intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      });
    };

    const intervalId = window.setInterval(pollSales, 12000);
    pollSales();

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckoutReturn]);

  async function loadSales(options: { forceRefresh?: boolean } = {}) {
    setLoading(true);
    try {
      const result = await listCrmSales(token, {
        fresh: true,
        forceRefresh: options.forceRefresh === true || undefined,
        email,
        phone,
        limit: 50,
        offset: 0,
      });
      setSales(result.sales);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca vanzarile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSaleHistory(sale: CrmSale) {
    const saleKey = getSaleKey(sale);
    setHistoryLoadingKey(saleKey);
    setSelectedHistorySaleKey(saleKey);
    setSelectedHistory(null);
    setHistoryMessage("Loading sale history for 30 days after the sale...");
    setHistoryMessageType("info");
    try {
      const result = await getCrmSaleHistory(token, buildSaleHistoryParams(sale));
      setSelectedHistory(result);
      setHistoryMessage("");
      onError("");
    } catch (error) {
      if (isNotFoundError(error)) {
        try {
          const fallbackHistory = await loadSaleActivityHistoryFallback(token, sale);
          if (fallbackHistory) {
            setSelectedHistory(fallbackHistory);
            setHistoryMessage("Sales history endpoint is not available in LaunchingStack yet. Showing contact activity instead.");
            setHistoryMessageType("info");
            onError("");
            return;
          }
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error ? fallbackError.message : "Nu am putut incarca istoricul de contact.";
          setSelectedHistory(null);
          setHistoryMessage(`Sales history endpoint returned Not Found. Contact activity fallback also failed: ${fallbackMessage}`);
          setHistoryMessageType("error");
          onError(fallbackMessage);
          return;
        }
      }

      setSelectedHistory(null);
      const message = formatSaleHistoryError(error);
      setHistoryMessage(message);
      setHistoryMessageType("error");
      onError(message);
    } finally {
      setHistoryLoadingKey("");
    }
  }

  return (
    <CrmCard title="Clienti - ultimele 50 de vanzari" className="wide-card">
      <div className="filter-grid sales-filter">
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
        <button type="button" className="orange small" onClick={() => loadSales({ forceRefresh: true })}>
          Filter
        </button>
        <label>Telefon:</label>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>
      <DataTable
        columns={["Name", "Phone", "email", "Suma", "Data", "DialerFirst", "DialerLast", "History"]}
        rows={sales.map((sale) => [
          sale.name,
          sale.phone,
          sale.email,
          formatMoney(sale.amountTotalMajor),
          formatDate(sale.wixCreatedDateUtc),
          formatDialerAgentWithDate(sale.dialerowner, getDialerFirstCallDate(sale)),
          formatDialerAgentWithDate(sale.dialerlast, getDialerLastCallDate(sale)) || "N/A",
          <button
            key={`history-${getSaleKey(sale)}`}
            type="button"
            className="history-btn"
            onClick={() => loadSaleHistory(sale)}
            disabled={historyLoadingKey === getSaleKey(sale)}
          >
            {historyLoadingKey === getSaleKey(sale) ? "Loading" : "History"}
          </button>,
        ])}
        loading={loading}
        minWidth={1080}
        className="sales-table"
      />
      {historyMessage ? (
        <p className={historyMessageType === "error" ? "history-message error" : "history-message"}>
          {historyMessage}
        </p>
      ) : null}
      {selectedHistory ? (
        <SaleHistoryPanel
          history={selectedHistory}
          selectedSale={sales.find((sale) => getSaleKey(sale) === selectedHistorySaleKey) || null}
          onClose={() => {
            setSelectedHistory(null);
            setSelectedHistorySaleKey("");
          }}
        />
      ) : null}
      <style jsx>{panelStyles}</style>
      <style jsx>{`
        .history-btn {
          min-width: 82px;
          height: 28px;
          border: 0;
          border-radius: 5px;
          background: #0c389d;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .history-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .history-message {
          margin: 12px 0 0;
          font-size: 13px;
          font-weight: 700;
          color: #0c389d;
        }
        .history-message.error {
          color: #b00020;
        }
      `}</style>
    </CrmCard>
  );
}

function SaleHistoryPanel({
  history,
  selectedSale,
  onClose,
}: {
  history: CrmSaleHistoryResponse;
  selectedSale: CrmSale | null;
  onClose: () => void;
}) {
  const sale = history.sale || selectedSale;
  const contact = history.contact;
  const events = history.events || [];

  return (
    <section className="sale-history-panel" aria-label="Sale history">
      <div className="history-header">
        <div>
          <h2>History</h2>
          <p>
            {sale?.name || contact?.displayName || "Sale"} {sale?.phone ? `| ${sale.phone}` : ""}
            {sale?.email ? ` | ${sale.email}` : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close sale history">
          Close
        </button>
      </div>

      <div className="history-summary">
        <LabelValue label="Sale ID" value={sale?.id || sale?.wixId || sale?._id} />
        <LabelValue label="Amount" value={formatPounds(sale?.amountTotalMajor)} />
        <LabelValue label="Service" value={sale?.serviceKey} />
        <LabelValue label="Source" value={formatSourceRecord(sale?.sourceSystem, sale?.sourceRecordId)} />
        <LabelValue label="Contact" value={contact?.displayName || contact?.id} />
        <LabelValue label="Status" value={contact?.status} />
      </div>

      <div className="history-events">
        {events.length ? (
          events.map((event, index) => (
            <article key={event.eventId || `${event.eventType}-${event.occurredAtUtc}-${index}`} className="event-row">
              <span className={`event-type ${getSaleHistoryEventClass(event.eventType)}`}>
                {getSaleHistoryEventIcon(event.eventType)}
              </span>
              <div className="event-body">
                <div className="event-title-row">
                  <strong>{event.title || formatEventType(event.eventType)}</strong>
                  <time>{formatDateTime(event.occurredAtUtc)}</time>
                </div>
                {event.description ? <p>{event.description}</p> : null}
                <div className="metadata-row">
                  {formatSaleHistoryMetadata(event).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-history">No history events returned.</p>
        )}
      </div>

      <style jsx>{`
        .sale-history-panel {
          margin-top: 22px;
          border: 4px solid #0c389d;
          background: #fff;
        }
        .history-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: center;
          padding: 16px 18px;
          background: #f6f8ff;
          border-bottom: 1px solid #cdd8ff;
        }
        h2 {
          margin: 0 0 4px;
          font-size: 22px;
          color: #111;
        }
        .history-header p {
          margin: 0;
          font-size: 13px;
          color: #333;
        }
        .history-header button {
          min-width: 82px;
          height: 30px;
          border: 0;
          border-radius: 5px;
          background: #ff4b26;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .history-summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px 18px;
          padding: 16px 18px;
          border-bottom: 1px solid #e4e8f4;
        }
        .history-events {
          display: grid;
          gap: 0;
        }
        .event-row {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid #e4e8f4;
        }
        .event-row:last-child {
          border-bottom: 0;
        }
        .event-type {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }
        .type-lead {
          background: #0c389d;
        }
        .type-intent {
          background: #6f2dbd;
        }
        .type-service {
          background: #007a5a;
        }
        .type-sale {
          background: #008a1e;
        }
        .type-call {
          background: #b45f00;
        }
        .type-sms {
          background: #007a5a;
        }
        .type-email {
          background: #0c389d;
        }
        .type-default {
          background: #555;
        }
        .event-body {
          min-width: 0;
        }
        .event-title-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: baseline;
        }
        .event-title-row strong {
          font-size: 15px;
        }
        time {
          flex: 0 0 auto;
          font-size: 12px;
          color: #555;
        }
        .event-body p {
          margin: 7px 0 0;
          line-height: 1.45;
        }
        .metadata-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .metadata-row span {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          border-radius: 999px;
          padding: 4px 9px;
          font-size: 12px;
        }
        .empty-history {
          margin: 0;
          padding: 16px 18px;
        }
        @media (max-width: 760px) {
          .history-header,
          .event-title-row {
            display: grid;
          }
          .history-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

function AllLeadsPanel({
  token,
  agentName,
  onSelectLead,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  onSelectLead: (lead: CrmLead) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("");
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAsapLoading, setNewAsapLoading] = useState(false);
  const [serviceOptionsLoading, setServiceOptionsLoading] = useState(false);
  const [newAsapServiceOptions, setNewAsapServiceOptions] =
    useState<CrmLeadIntentServiceOption[]>(DEFAULT_NEW_ASAP_SERVICE_OPTIONS);
  const [newAsapService, setNewAsapService] = useState(DEFAULT_NEW_ASAP_SERVICE_OPTIONS[0]?.serviceKey || "");
  const [latestSingleLeadIntent, setLatestSingleLeadIntent] = useState<CrmLeadIntentRow | null>(null);
  const [resultText, setResultText] = useState("");
  const singleLead = leads.length === 1 ? leads[0] : null;
  const visibleNewAsapServiceOptions = useMemo(
    () => mergeServiceOptions(newAsapServiceOptions, newAsapService),
    [newAsapService, newAsapServiceOptions],
  );

  async function loadLeads() {
    setLoading(true);
    setLatestSingleLeadIntent(null);
    setNewAsapService(DEFAULT_NEW_ASAP_SERVICE_OPTIONS[0]?.serviceKey || "");
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
      const nextLeads = result.leads || [];
      setLeads(nextLeads);
      setResultText(`${result.total} rezultate`);
      onError("");
      if (nextLeads.length === 1) {
        await loadSingleLeadNewAsapDefaults(nextLeads[0]);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca lead-urile.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSingleLeadNewAsapDefaults(lead: CrmLead) {
    const latestIntent = await findLatestIntentForLead(lead);
    setLatestSingleLeadIntent(latestIntent);
    const preferredService = getLeadIntentServiceKey(latestIntent);
    await loadNewAsapServiceOptions(preferredService);
  }

  async function findLatestIntentForLead(lead: CrmLead) {
    const lookup = buildLeadIntentLookup(lead);
    if (!lookup.phone && !lookup.email) {
      return null;
    }

    try {
      return await findLatestCrmLeadIntent(token, lookup);
    } catch {
      return null;
    }
  }

  async function loadNewAsapServiceOptions(preferredService?: string | null) {
    setServiceOptionsLoading(true);
    try {
      const result = await listCrmLeadIntents(token, {
        createdLastDays: 3650,
        statusBucket: "both",
        toBeContacted: "oricand",
        intent: "all",
        service: "all",
        language: "all",
        lastCallAgentId: "all",
        closed: false,
        limit: 1,
      });
      const options = result.options?.services?.length
        ? result.options.services
        : DEFAULT_NEW_ASAP_SERVICE_OPTIONS;
      setNewAsapServiceOptions(options);
      setNewAsapService(resolveNewAsapServiceSelection(options, preferredService));
    } catch {
      setNewAsapServiceOptions(DEFAULT_NEW_ASAP_SERVICE_OPTIONS);
      setNewAsapService(resolveNewAsapServiceSelection(DEFAULT_NEW_ASAP_SERVICE_OPTIONS, preferredService));
    } finally {
      setServiceOptionsLoading(false);
    }
  }

  async function handleCreateNewAsapIntent() {
    if (!singleLead) {
      onStatus("");
      onError("Cauta un lead unic inainte de New ASAP.");
      return;
    }

    if (!newAsapService) {
      onStatus("");
      onError("Alege serviciul pentru noul intent ASAP.");
      return;
    }

    const leadId = getLeadRecordId(singleLead);
    const contactId = getLeadCanonicalContactId(singleLead, latestSingleLeadIntent);
    const phoneValue = getLeadPhoneValue(singleLead);
    const emailValue = getLeadStatusUpdateEmail(singleLead);
    if (!leadId && !contactId && !phoneValue && !emailValue) {
      onStatus("");
      onError("Lead-ul unic nu are id, telefon sau email pentru crearea intentului.");
      return;
    }

    setNewAsapLoading(true);
    try {
      const result = await createCrmAsapIntent(token, {
        leadId: leadId || undefined,
        contactId: contactId || undefined,
        email: emailValue || undefined,
        phone: phoneValue || undefined,
        interestType: "ASAP",
        serviceKey: newAsapService,
        source: "crm_admin_all_leads",
        agent: agentName,
      });
      const createdIntent = result.intent || result.leadIntent || null;
      setLatestSingleLeadIntent(createdIntent);
      if (createdIntent?.serviceKey) {
        setNewAsapService(createdIntent.serviceKey);
      }
      if (result.lead) {
        setLeads([result.lead]);
      }
      onStatus(result.message || "New ASAP intent creat.");
      onError("");
    } catch (error) {
      onStatus("");
      onError(error instanceof Error ? error.message : "Nu am putut crea intentul ASAP.");
    } finally {
      setNewAsapLoading(false);
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
      {singleLead ? (
        <div className="new-asap-row">
          <label>
            Service
            <select
              value={newAsapService}
              onChange={(event) => setNewAsapService(event.target.value)}
              disabled={serviceOptionsLoading || newAsapLoading}
            >
              {visibleNewAsapServiceOptions.map((option) => (
                <option key={option.serviceKey} value={option.serviceKey}>
                  {option.displayName || option.serviceKey}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="orange small"
            onClick={handleCreateNewAsapIntent}
            disabled={newAsapLoading || serviceOptionsLoading || !newAsapService}
          >
            {newAsapLoading ? "Creating..." : "New ASAP"}
          </button>
          <span>
            {serviceOptionsLoading
              ? "Se incarca serviciile..."
              : latestSingleLeadIntent
                ? `Ultimul intent: ${getLeadIntentServiceLabel(latestSingleLeadIntent)}`
                : "Nu am gasit intent precedent."}
          </span>
        </div>
      ) : null}
      <LeadTable leads={leads} loading={loading} onSelectLead={onSelectLead} />
      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

function LeadIntentPanel({
  token,
  agentName,
  onSelectIntent,
  onStatus,
  onError,
}: {
  token: string;
  agentName: string;
  onSelectIntent: (row: CrmLeadIntentRow) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [createdLastDays, setCreatedLastDays] = useState("30");
  const [statusBucket, setStatusBucket] = useState("all");
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
  const [reservingIntentId, setReservingIntentId] = useState("");
  const [resultText, setResultText] = useState("");
  const [predictiveCampaignSummary, setPredictiveCampaignSummary] = useState<CrmPredictiveCampaignSummary[]>([]);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [selectedLeadsTotal, setSelectedLeadsTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState<LeadIntentSortConfig>({ column: "Created", direction: "desc" });
  const [intentOptions, setIntentOptions] = useState<string[]>([]);
  const [serviceOptions, setServiceOptions] = useState<Array<{ serviceKey: string; displayName?: string | null }>>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>(LEAD_INTENT_LANGUAGE_OPTIONS);
  const [agentOptions, setAgentOptions] = useState<Array<{ agentId: number; agentName?: string | null }>>([]);
  const agentNameById = useMemo(() => buildAgentNameById(agentOptions), [agentOptions]);
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
    "TotalPreviousCalls",
    "LastAgent",
    "LastCall",
    "LastCallCode",
    "Language",
    "Source",
    "Campaign",
  ];
  const sortedRows = useMemo(() => {
    return [...rows].sort((first, second) => {
      const firstValue = getLeadIntentSortValue(first, sortConfig.column, agentNameById);
      const secondValue = getLeadIntentSortValue(second, sortConfig.column, agentNameById);
      const result = compareLeadIntentSortValues(firstValue, secondValue);

      if (result !== 0) {
        return sortConfig.direction === "asc" ? result : -result;
      }

      return getDateTimeValue(second.createdAtUtc) - getDateTimeValue(first.createdAtUtc);
    });
  }, [agentNameById, rows, sortConfig]);
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
    const shouldFilterStatus = statusBucket !== "all";
    try {
      const result = await listCrmLeadIntents(token, {
        createdLastDays,
        statusBucket: shouldFilterStatus ? statusBucket : undefined,
        toBeContacted,
        intent,
        service,
        language,
        phone,
        lastCallAgentId,
        closed: shouldFilterStatus ? false : "all",
        includeMissedCalls: showMissedCalls,
        calendlyOnlyToday: showCalendlyOnlyToday && calendlyOnlyToday,
        limit: 300,
      });
      const nextRows = result.rows || result.items || [];
      const rowsWithoutExplicitOnlyIntents = filterExplicitOnlyLeadIntents(nextRows, intent);
      const shouldFilterCalendlyToday = showCalendlyOnlyToday && calendlyOnlyToday;
      const visibleRows = shouldFilterCalendlyToday
        ? rowsWithoutExplicitOnlyIntents.filter(isLeadIntentContactToday)
        : rowsWithoutExplicitOnlyIntents;
      const summary = shouldFilterCalendlyToday || shouldHideExplicitOnlyLeadIntents(intent)
        ? summarizeLeadIntentRows(visibleRows)
        : result.leadSummary || {};
      setRows(visibleRows);
      setSelectedLeadsTotal(
        shouldFilterCalendlyToday || shouldHideExplicitOnlyLeadIntents(intent)
          ? visibleRows.length
          : result.total ?? 0,
      );
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

  async function handleIntentDoubleClick(index: number) {
    const row = sortedRows[index];
    if (!row?.lead) {
      onError("Intentul selectat nu are lead atasat.");
      return;
    }

    if (!isAsapLeadIntent(row)) {
      onSelectIntent(row);
      return;
    }

    const interestId = getLeadIntentId(row);
    if (!interestId) {
      onError("Intentul ASAP selectat nu are id pentru rezervare.");
      return;
    }

    setReservingIntentId(interestId);
    try {
      await reserveCrmLeadIntent(token, interestId, {
        agent: agentName,
        reservationTtlMinutes: 15,
        reason: "Opened ASAP intent from Lead Intents tab",
      });
      setRows((current) => current.filter((item) => getLeadIntentId(item) !== interestId));
      setReservingIntentId("");
      onStatus("Intent ASAP rezervat pentru 15 minute.");
      onError("");
      onSelectIntent(row);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut rezerva intentul ASAP.";
      onStatus("");
      await loadIntents();
      onError(message);
      setReservingIntentId("");
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
          <option value="all">All</option>
          <option value="nocall">NoCall</option>
          <option value="finished">Finished</option>
        </select>

        <label>Intent</label>
        <select value={intent} onChange={(event) => setIntent(event.target.value)}>
          <option value="all">all</option>
          {mergeLeadIntentOptions(intentOptions, intent === "all" ? "" : intent).map((item) => (
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
                {formatPredictiveCampaignSummary(campaign, showCampaignDetails)}
                <br />
              </span>
            ))}
          </>
        ) : null}
      </p>
      {predictiveCampaignSummary.length ? (
        <div className="campaign-summary-actions">
          <button
            type="button"
            className="orange small"
            aria-expanded={showCampaignDetails}
            onClick={() => setShowCampaignDetails((current) => !current)}
          >
            {showCampaignDetails ? "collapse campaigns details" : "expand campaigns details"}
          </button>
        </div>
      ) : null}
      <p className="green-label">
        Total: {sortedRows.length}
        {intentCompositionSummary.length ? ` | ${intentCompositionSummary.join(" | ")}` : ""}
        {reservingIntentId ? " | Se rezerva intentul ASAP..." : ""}
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
          formatLeadIntentServiceDisplay(row.serviceDisplayName, row.serviceKey),
          row.lead?.statusOriginal,
          getLeadIntentTotalPreviousCalls(row),
          formatLeadIntentPostIntentLastAgent(row, agentNameById),
          formatDateTime(getLeadIntentPostIntentLastCallTime(row)),
          formatLeadIntentPostIntentLastCallCode(row),
          formatLanguage(row.language),
          row.source,
          row.campaignName || row.adName,
        ])}
        loading={loading}
        onRowDoubleClick={(index) => {
          void handleIntentDoubleClick(index);
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

function InboundSmsPanel({
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
  const [receivedLastDays, setReceivedLastDays] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showOnlyInProgress, setShowOnlyInProgress] = useState(true);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [smsRows, setSmsRows] = useState<CrmInboundSms[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedThreadPhone, setSelectedThreadPhone] = useState("");
  const [activityRows, setActivityRows] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [closingCase, setClosingCase] = useState(false);
  const [stoppingDialler, setStoppingDialler] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [localOutboundSms, setLocalOutboundSms] = useState<LocalOutboundSms[]>([]);
  const [closedThreadOverrides, setClosedThreadOverrides] = useState<Record<string, { closedAtUtc: string; agent: string }>>({});
  const threadRows = useMemo(
    () => applyClosedThreadOverrides(groupInboundSmsThreads(smsRows), closedThreadOverrides),
    [closedThreadOverrides, smsRows],
  );
  const visibleThreadRows = useMemo(
    () => threadRows.filter((thread) => !showOnlyInProgress || isInboundSmsThreadInProgress(thread)),
    [showOnlyInProgress, threadRows],
  );
  const selectedThread = useMemo(
    () => threadRows.find((thread) => thread.phoneKey === selectedThreadPhone) || null,
    [selectedThreadPhone, threadRows],
  );
  const conversationRows = useMemo(() => {
    const activitySmsRows = activityRows
      .filter(isSmsActivity)
      .map<SmsTranscriptItem>((item) => ({
        timestamp: item.timestamp || null,
        direction: getActivitySmsDirection(item),
        body: getActivitySmsBody(item),
        agent: item.agent || "",
      }))
      .filter((item) => item.body || item.timestamp)
      .sort(sortSmsTranscriptItems);

    const localRows = localOutboundSms.filter((item) => item.phoneKey === selectedThreadPhone);

    const fallbackRows = (selectedThread?.messages || [])
      .map<SmsTranscriptItem>((sms) => ({
        timestamp: getInboundSmsReceivedAt(sms),
        direction: "inbound" as const,
        body: getInboundSmsMessage(sms),
        agent: "",
      }))
      .sort(sortSmsTranscriptItems);

    return mergeSmsTranscriptItems(activitySmsRows.length ? activitySmsRows : fallbackRows, localRows);
  }, [activityRows, localOutboundSms, selectedThread, selectedThreadPhone]);

  useEffect(() => {
    loadInboundSms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInboundSms(options: { showOnlyInProgress?: boolean; statusFilter?: string } = {}) {
    const nextShowOnlyInProgress = options.showOnlyInProgress ?? showOnlyInProgress;
    const nextStatusFilter = options.statusFilter ?? statusFilter;
    setLoading(true);
    setLocalMessage("");
    try {
      const result = await listCrmInboundSms(token, {
        receivedLastDays,
        status: nextShowOnlyInProgress ? "all" : nextStatusFilter,
        phone: phoneFilter.trim(),
        limit: 100,
        offset: 0,
      });
      const nextRows = result.items || result.rows || result.messages || [];
      setSmsRows(nextRows);
      setTotal(result.total ?? nextRows.length);
      if (selectedThreadPhone && !groupInboundSmsThreads(nextRows).some((thread) => thread.phoneKey === selectedThreadPhone)) {
        setSelectedThreadPhone("");
        setActivityRows([]);
      }
      onError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut incarca SMS-urile inbound.";
      setSmsRows([]);
      setTotal(0);
      setLocalMessage(
        message.toLowerCase().includes("not found")
          ? "Endpointul InboundSMS nu este disponibil inca in LaunchingStack."
          : message,
      );
      if (!message.toLowerCase().includes("not found")) {
        onError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPhoneHistory(phone: string) {
    if (!phone) {
      onError("Threadul selectat nu are telefon.");
      return;
    }

    setHistoryLoading(true);
    try {
      const result = await searchCrmActivity(token, { phone, limit: 500 });
      setActivityRows(result.activities || result.items || []);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca istoricul telefonului.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSelectThread(thread: InboundSmsThread) {
    setSelectedThreadPhone(thread.phoneKey);
    setActivityRows([]);
    setReplyText("");
    await loadPhoneHistory(thread.phone);
  }

  async function handleSendReply() {
    if (!selectedThread) {
      onError("Selecteaza un thread inainte de raspuns.");
      return;
    }

    const phone = selectedThread.phone;
    if (!phone) {
      onError("Threadul selectat nu are telefon.");
      return;
    }

    if (!replyText.trim()) {
      onError("Completeaza raspunsul SMS.");
      return;
    }

    const message = replyText.trim();
    setSendingReply(true);
    try {
      await sendManualCrmSms(token, {
        phone,
        message,
        agent: agentName,
      });
      setLocalOutboundSms((current) => [
        ...current,
        {
          phoneKey: selectedThread.phoneKey,
          timestamp: new Date().toISOString(),
          direction: "outbound",
          body: message,
          agent: agentName,
        },
      ]);
      setReplyText("");
      onStatus("SMS-ul a fost trimis.");
      onError("");
      await loadPhoneHistory(phone);
      await loadInboundSms();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut trimite raspunsul SMS.");
    } finally {
      setSendingReply(false);
    }
  }

  async function handleCloseCase() {
    if (!selectedThread) {
      onError("Selecteaza un thread inainte de inchidere.");
      return;
    }

    const phone = selectedThread.phone;
    if (!phone) {
      onError("Threadul selectat nu are telefon.");
      return;
    }

    const inboundSmsId = getInboundSmsId(selectedThread.lastSms);
    const closedAtUtc = new Date().toISOString();
    setClosingCase(true);
    try {
      await closeCrmInboundSmsCase(token, {
        inboundSmsId: inboundSmsId || undefined,
        smsId: selectedThread.lastSms.smsId || undefined,
        phone,
        status: "answered",
        agent: agentName,
      });
      setClosedThreadOverrides((current) => ({
        ...current,
        [selectedThread.phoneKey]: { closedAtUtc, agent: agentName },
      }));
      setSmsRows((current) =>
        current.map((sms) =>
          getPhoneThreadKey(getInboundSmsPhone(sms)) === selectedThread.phoneKey
            ? markInboundSmsAnswered(sms, closedAtUtc, agentName)
            : sms,
        ),
      );
      onStatus("Cazul SMS a fost inchis.");
      onError("");
      await loadPhoneHistory(phone);
      await loadInboundSms();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut inchide cazul SMS.");
    } finally {
      setClosingCase(false);
    }
  }

  async function handleStopDialling() {
    if (!selectedThread) {
      onError("Selecteaza un thread inainte de oprirea din dialler.");
      return;
    }

    const phone = selectedThread.phone;
    if (!phone) {
      onError("Threadul selectat nu are telefon.");
      return;
    }

    setStoppingDialler(true);
    try {
      const result = await stopCrmLeadDialler(token, {
        phone,
        reason: "Removed from dialler from CRM InboundSMS tab",
        agent: agentName,
      });
      onStatus(result?.message || "Lead scos din dialler.");
      onError("");
      await loadPhoneHistory(phone);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut scoate lead-ul din dialler.");
    } finally {
      setStoppingDialler(false);
    }
  }

  return (
    <CrmCard title="InboundSMS" className="wide-card">
      <div className="filter-grid inbound-sms-filter">
        <label>Received last days</label>
        <input
          type="number"
          min="1"
          max="3650"
          value={receivedLastDays}
          onChange={(event) => setReceivedLastDays(event.target.value)}
        />

        <label>Status</label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          disabled={showOnlyInProgress}
        >
          <option value="all">all</option>
          <option value="answered">answered</option>
          <option value="to_be_answered">to be answered</option>
          <option value="past_due">past due</option>
        </select>

        <label>Phone</label>
        <input
          type="search"
          value={phoneFilter}
          onChange={(event) => setPhoneFilter(event.target.value)}
          placeholder="Telefon..."
        />

        <label className="in-progress-filter">
          <input
            type="checkbox"
            checked={showOnlyInProgress}
            onChange={(event) => {
              const checked = event.target.checked;
              setShowOnlyInProgress(checked);
              void loadInboundSms({ showOnlyInProgress: checked });
            }}
          />
          Show Only In Progress
        </label>

        <button type="button" className="orange small" onClick={() => loadInboundSms()} disabled={loading}>
          {loading ? "Se incarca..." : "Filter"}
        </button>
      </div>

      <p className="green-label">
        Threaduri SMS: {visibleThreadRows.length} / SMS inbound: {total}
      </p>
      {localMessage ? <p className="inbound-local-message">{localMessage}</p> : null}

      <DataTable
        columns={["Ultimul SMS", "Status", "Phone", "Lead", "SMS-uri", "Ultimul mesaj", "Answered at", "Agent"]}
        rows={visibleThreadRows.map((thread) => [
          formatDateTime(thread.lastAt),
          formatInboundSmsStatusLabel(thread.status),
          thread.phone,
          thread.leadName,
          getInboundSmsThreadCount(thread),
          getInboundSmsPreview(thread.lastSms),
          formatDateTime(thread.lastSms.answeredAtUtc || thread.lastSms.lastReplyAtUtc),
          thread.lastSms.replyAgent,
        ])}
        loading={loading}
        onRowClick={(index) => {
          const thread = visibleThreadRows[index];
          if (thread) {
            void handleSelectThread(thread);
          }
        }}
        rowClassName={(index) => `sms-${visibleThreadRows[index]?.status || "to_be_answered"}`}
        minWidth={1260}
      />

      <div className="inbound-sms-detail">
        <div className="inbound-selected">
          <h2>Thread selectat</h2>
          {selectedThread ? (
            <>
              <LabelValue label="Telefon:" value={selectedThread.phone} />
              <LabelValue label="Status:" value={formatInboundSmsStatusLabel(selectedThread.status)} />
              <LabelValue label="Ultimul SMS:" value={formatDateTime(selectedThread.lastAt)} />
              <div className="inbound-message-body">
                {historyLoading && !conversationRows.length ? (
                  <p>Se incarca conversatia...</p>
                ) : conversationRows.length ? (
                  conversationRows.map((item, index) => (
                    <div
                      key={`${item.timestamp || index}-${index}`}
                      className={`sms-transcript-item sms-transcript-${item.direction}`}
                    >
                      <div className="sms-transcript-meta">
                        {formatDateTime(item.timestamp)} - {item.direction === "outbound" ? "outbound" : "inbound"}
                        {item.agent ? ` - ${item.agent}` : ""}
                      </div>
                      <div className="sms-transcript-body">{item.body}</div>
                    </div>
                  ))
                ) : (
                  <p>Nu exista SMS-uri in istoricul disponibil.</p>
                )}
              </div>
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Scrie raspunsul SMS..."
              />
              <button
                type="button"
                className="orange small"
                onClick={handleSendReply}
                disabled={sendingReply}
              >
                {sendingReply ? "Se trimite..." : "Trimite SMS"}
              </button>
            </>
          ) : (
            <p>Selecteaza un thread din lista.</p>
          )}
        </div>

        <div className="inbound-history">
          <div className="inbound-history-heading">
            <h2>Istoric telefon</h2>
            <div className="inbound-history-actions">
              <button
                type="button"
                className="orange small"
                onClick={handleCloseCase}
                disabled={!selectedThread || selectedThread.status === "answered" || closingCase}
              >
                {closingCase ? "Closing..." : "Close Case"}
              </button>
              <button
                type="button"
                className="orange small"
                onClick={handleStopDialling}
                disabled={!selectedThread || stoppingDialler}
              >
                {stoppingDialler ? "Se opreste..." : "stop dialling"}
              </button>
            </div>
          </div>
          <DataTable
            columns={["timestamp", "Action", "Agent", "Param1", "Param2", "Param3", "Param4", "Param5"]}
            rows={activityRows.map((item) => [
              formatDateTime(item.timestamp),
              item.action || item.state,
              item.agent,
              item.param1,
              item.param2,
              item.param3,
              item.param4,
              item.param5,
            ])}
            loading={historyLoading}
            minWidth={880}
            className="inbound-history-table"
          />
        </div>
      </div>

      <style jsx>{panelStyles}</style>
    </CrmCard>
  );
}

const AGENT_REPORT_TIMEZONE = "Europe/Bucharest";
const AGENT_REPORT_WINDOW_SCHEDULE = "weekday:18-22,saturday:11-17";
const AGENT_REPORT_PAYMENT_RATE_EURO = 7;

function AgentReportPanel({ token, onError }: { token: string; onError: (message: string) => void }) {
  const [dateBegin, setDateBegin] = useState(() => getDateInputDaysAgo(30));
  const [dateEnd, setDateEnd] = useState(() => getDateInputDaysAgo(0));
  const [agentId, setAgentId] = useState("all");
  const [agentOptions, setAgentOptions] = useState<Array<{ agentId: number | string; agentName?: string | null }>>([]);
  const [rows, setRows] = useState<CrmAgentReportRow[]>([]);
  const [pauseRows, setPauseRows] = useState<CrmAgentReportPauseBreakdownRow[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<CrmAgentReportPaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const summary = useMemo(() => summarizeAgentReportRows(rows), [rows]);
  const paymentLoggedIntervalSeconds =
    getAgentReportPaymentDurationSeconds(paymentSummary, ["loggedIntervalSeconds", "loggedIntervalMinutes"]) ??
    summary.eveningLoggedSeconds;
  const paymentPauseAdjustmentSeconds =
    getAgentReportPaymentDurationSeconds(paymentSummary, ["pauseAdjustmentSeconds", "pauseAdjustmentMinutes"]) ?? 0;
  const paymentTalkedOutsideSeconds =
    getAgentReportPaymentDurationSeconds(paymentSummary, [
      "talkedOutsideIntervalSeconds",
      "talkedOutsideIntervalMinutes",
    ]) ?? summary.outsideTalkedSeconds;
  const paymentClericalOutsideSeconds =
    getAgentReportPaymentDurationSeconds(paymentSummary, [
      "clericalOutsideIntervalSeconds",
      "clericalOutsideIntervalMinutes",
    ]) ?? summary.outsideClericalSeconds;
  const paymentRateEur = getAgentReportPaymentRateEur(paymentSummary) ?? AGENT_REPORT_PAYMENT_RATE_EURO;
  const paymentSummarySeconds =
    getAgentReportPaymentDurationSeconds(paymentSummary, ["payableSeconds", "payableMinutes"]) ??
    Math.max(0, paymentLoggedIntervalSeconds - paymentPauseAdjustmentSeconds + paymentTalkedOutsideSeconds + paymentClericalOutsideSeconds);
  const paymentSummaryAmount =
    getAgentReportPaymentAmountEur(paymentSummary) ?? (paymentSummarySeconds / 3600) * paymentRateEur;
  const approvedPauseText = formatAgentReportApprovedPauseSummary(paymentSummary?.weeks);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReport() {
    setLoading(true);
    try {
      const result = await listCrmAgentReport(token, {
        from: dateBegin,
        to: dateEnd,
        agentId: agentId === "all" ? undefined : agentId,
        windowSchedule: AGENT_REPORT_WINDOW_SCHEDULE,
        hourlyRateEur: AGENT_REPORT_PAYMENT_RATE_EURO,
      });
      setRows(sortAgentReportRows(getAgentReportResponseRows(result)));
      setPauseRows(getAgentReportResponsePauseRows(result));
      setAgentOptions(result.options?.agents || result.agents || []);
      setPaymentSummary(result.paymentSummary || result.payment || null);
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca Agent Report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CrmCard title="Agent Report" className="wide-card">
      <div className="filter-grid agent-report-filter">
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

        <button type="button" className="orange small" onClick={loadReport} disabled={loading}>
          {loading ? "Se incarca..." : "Filter"}
        </button>
      </div>

      <p className="agent-payment-summary">
        <strong>Summary for payment:</strong> Logged interval RO ({formatDurationHhMmSs(paymentLoggedIntervalSeconds)})
        {" - "}
        Pause Adjustments ({formatDurationHhMmSs(paymentPauseAdjustmentSeconds)}; approved pause : {approvedPauseText})
        {" + "}
        Talked outside interval ({formatDurationHhMmSs(paymentTalkedOutsideSeconds)})
        {" + "}
        Clerical outside interval ({formatDurationHhMmSs(paymentClericalOutsideSeconds)}) ={" "}
        {formatDurationHhMmSs(paymentSummarySeconds)} * {formatAgentReportHourlyRate(paymentRateEur)} Euro ={" "}
        {formatEuroAmount(paymentSummaryAmount)}
      </p>

      <p className="green-label">
        Timezone: Romania ({AGENT_REPORT_TIMEZONE}) | interval special: L-V 18:00-22:00, sambata 11:00-17:00
      </p>

      <div className="agent-report-summary">
        <AgentReportMetric label="Logged total" seconds={summary.loggedSeconds} />
        <AgentReportMetric label="Pause total" seconds={summary.pauseSeconds} />
        <AgentReportMetric label="Talked total" seconds={summary.talkedSeconds} />
        <AgentReportMetric label="Clerical total" seconds={summary.clericalSeconds} />
        <AgentReportMetric label="Logged interval RO" seconds={summary.eveningLoggedSeconds} />
        <AgentReportMetric label="Pause interval RO" seconds={summary.eveningPauseSeconds} />
        <AgentReportMetric label="Talked interval RO" seconds={summary.eveningTalkedSeconds} />
        <AgentReportMetric label="Clerical interval RO" seconds={summary.eveningClericalSeconds} />
        <AgentReportMetric label="Logged outside interval" seconds={summary.outsideLoggedSeconds} />
        <AgentReportMetric label="Pause outside interval" seconds={summary.outsidePauseSeconds} />
        <AgentReportMetric label="Talked outside interval" seconds={summary.outsideTalkedSeconds} />
        <AgentReportMetric label="Clerical outside interval" seconds={summary.outsideClericalSeconds} />
      </div>

      <DataTable
        columns={[
          "Day",
          "Agent",
          "Logged",
          "Pause by type",
          "Talked",
          "Clerical",
          "Logged interval RO",
          "Pause interval RO by type",
          "Talked interval RO",
          "Clerical interval RO",
          "Logged outside interval",
          "Pause outside interval by type",
          "Talked outside interval",
          "Clerical outside interval",
        ]}
        rows={rows.map((row) => [
          formatAgentReportDay(row),
          formatAgentReportAgent(row),
          formatDurationHhMmSs(getAgentReportLoggedSeconds(row)),
          <PauseBreakdownCell
            key={`pause-${getAgentReportRowKey(row)}`}
            items={getAgentReportPauseBreakdown(row, pauseRows, "total")}
          />,
          formatDurationHhMmSs(getAgentReportTalkedSeconds(row)),
          formatDurationHhMmSs(getAgentReportClericalSeconds(row)),
          formatDurationHhMmSs(getAgentReportWindowLoggedSeconds(row)),
          <PauseBreakdownCell
            key={`evening-pause-${getAgentReportRowKey(row)}`}
            items={getAgentReportPauseBreakdown(row, pauseRows, "window")}
          />,
          formatDurationHhMmSs(getAgentReportWindowTalkedSeconds(row)),
          formatDurationHhMmSs(getAgentReportWindowClericalSeconds(row)),
          formatDurationHhMmSs(getAgentReportOutsideLoggedSeconds(row)),
          <PauseBreakdownCell
            key={`outside-pause-${getAgentReportRowKey(row)}`}
            items={getAgentReportPauseBreakdown(row, pauseRows, "outside")}
          />,
          formatDurationHhMmSs(getAgentReportOutsideTalkedSeconds(row)),
          formatDurationHhMmSs(getAgentReportOutsideClericalSeconds(row)),
        ])}
        loading={loading}
        minWidth={1840}
        className="agent-report-table"
      />

      <style jsx>{panelStyles}</style>
      <style jsx>{`
        .agent-report-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }
        .agent-payment-summary {
          margin: 14px 0 6px;
          border: 1px solid #b9dfc2;
          border-radius: 8px;
          background: #f4fbf6;
          color: #163c20;
          font-weight: 700;
          line-height: 1.45;
          padding: 12px 14px;
        }
        .agent-payment-summary strong {
          color: #008a1e;
          font-weight: 900;
        }
        @media (max-width: 980px) {
          .agent-report-summary {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .agent-report-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </CrmCard>
  );
}

function AgentReportMetric({ label, seconds }: { label: string; seconds: number }) {
  return (
    <div className="agent-report-metric">
      <span>{label}</span>
      <strong>{formatDurationHhMmSs(seconds)}</strong>
      <style jsx>{`
        .agent-report-metric {
          display: grid;
          gap: 4px;
          min-height: 70px;
          align-content: center;
          border: 1px solid #d6e8da;
          border-radius: 8px;
          background: #f4fbf6;
          padding: 10px 12px;
        }
        span {
          color: #34513c;
          font-size: 12px;
          font-weight: 800;
        }
        strong {
          color: #008a1e;
          font-size: 18px;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}

type AgentReportPauseBreakdownItem = { pauseType: string; seconds: number };

function PauseBreakdownCell({ items }: { items: AgentReportPauseBreakdownItem[] }) {
  if (!items.length) {
    return "0:00:00";
  }

  return (
    <div className="pause-breakdown-cell">
      {items.map((item) => (
        <div key={item.pauseType}>
          <strong>{item.pauseType}</strong>
          <span>{formatDurationHhMmSs(item.seconds)}</span>
        </div>
      ))}
      <style jsx>{`
        .pause-breakdown-cell {
          display: grid;
          gap: 4px;
          text-align: left;
        }
        div {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          line-height: 1.35;
        }
        strong {
          font-weight: 800;
        }
        span {
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

function HighLevelFunnelsPanel({ token, onError }: { token: string; onError: (message: string) => void }) {
  const [dateBegin, setDateBegin] = useState(() => getDateInputDaysAgo(30));
  const [dateEnd, setDateEnd] = useState(() => getDateInputDaysAgo(0));
  const [agentId, setAgentId] = useState("all");
  const [agentOptions, setAgentOptions] = useState<Array<{ agentId: number; agentName?: string | null }>>([]);
  const [rows, setRows] = useState<CrmHighLevelFunnelRow[]>([]);
  const [loading, setLoading] = useState(false);
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
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Nu am putut incarca high level funnels.");
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
  rowClassName,
  sortableColumns,
  minWidth,
  className,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  loading?: boolean;
  onRowClick?: (index: number) => void;
  onRowDoubleClick?: (index: number) => void;
  rowClassName?: (index: number) => string | undefined;
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
                className={[
                  onRowClick || onRowDoubleClick ? "clickable" : "",
                  rowClassName?.(index) || "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
        tbody tr.sms-answered td {
          background: #e4f6e9;
        }
        tbody tr.sms-to_be_answered td {
          background: #fff4cf;
        }
        tbody tr.sms-past_due td {
          background: #ffe1de;
        }
        tbody tr.sms-answered:hover td {
          background: #d4efdc;
        }
        tbody tr.sms-to_be_answered:hover td {
          background: #ffe9a8;
        }
        tbody tr.sms-past_due:hover td {
          background: #ffd0ca;
        }
        tbody tr td:last-child {
          background: #e5e5e5;
        }
        tbody tr.sms-answered td:last-child {
          background: #c9ebd2;
        }
        tbody tr.sms-to_be_answered td:last-child {
          background: #ffe39b;
        }
        tbody tr.sms-past_due td:last-child {
          background: #ffc6bf;
        }
        .inbound-history-table :global(table),
        .lead-history-table :global(table) {
          table-layout: fixed;
        }
        .inbound-history-table :global(th),
        .inbound-history-table :global(td),
        .lead-history-table :global(th),
        .lead-history-table :global(td) {
          white-space: normal;
          word-break: break-word;
        }
        .inbound-history-table :global(th:nth-child(1)),
        .inbound-history-table :global(td:nth-child(1)),
        .inbound-history-table :global(th:nth-child(2)),
        .inbound-history-table :global(td:nth-child(2)),
        .inbound-history-table :global(th:nth-child(3)),
        .inbound-history-table :global(td:nth-child(3)),
        .inbound-history-table :global(th:nth-child(4)),
        .inbound-history-table :global(td:nth-child(4)),
        .inbound-history-table :global(th:nth-child(6)),
        .inbound-history-table :global(td:nth-child(6)),
        .inbound-history-table :global(th:nth-child(8)),
        .inbound-history-table :global(td:nth-child(8)) {
          width: 10%;
        }
        .inbound-history-table :global(th:nth-child(5)),
        .inbound-history-table :global(td:nth-child(5)) {
          width: 30%;
        }
        .inbound-history-table :global(th:nth-child(7)),
        .inbound-history-table :global(td:nth-child(7)) {
          width: 20%;
        }
        .lead-history-table :global(th:nth-child(1)),
        .lead-history-table :global(td:nth-child(1)),
        .lead-history-table :global(th:nth-child(2)),
        .lead-history-table :global(td:nth-child(2)),
        .lead-history-table :global(th:nth-child(3)),
        .lead-history-table :global(td:nth-child(3)),
        .lead-history-table :global(th:nth-child(4)),
        .lead-history-table :global(td:nth-child(4)),
        .lead-history-table :global(th:nth-child(6)),
        .lead-history-table :global(td:nth-child(6)) {
          width: 10%;
        }
        .lead-history-table :global(th:nth-child(5)),
        .lead-history-table :global(td:nth-child(5)) {
          width: 30%;
        }
        .lead-history-table :global(th:nth-child(7)),
        .lead-history-table :global(td:nth-child(7)) {
          width: 20%;
        }
        .sales-table :global(th:first-child),
        .sales-table :global(td:first-child) {
          width: 9%;
          max-width: 90px;
          white-space: normal;
          word-break: break-word;
        }
        .agent-report-table :global(table) {
          table-layout: fixed;
        }
        .agent-report-table :global(th),
        .agent-report-table :global(td) {
          white-space: normal;
          word-break: break-word;
          vertical-align: top;
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

type AvailableRecordField = {
  key: string;
  label: string;
  value: unknown;
};

function getAvailableRecordFields(
  record: unknown,
  options: {
    labels?: Record<string, string>;
    preferredOrder?: string[];
    excludedKeys?: string[];
  } = {},
): AvailableRecordField[] {
  if (!record || typeof record !== "object") {
    return [];
  }

  const excludedKeys = new Set(options.excludedKeys || []);
  const preferredOrder = new Map((options.preferredOrder || []).map((key, index) => [key, index]));

  return Object.entries(record as Record<string, unknown>)
    .filter(([key, value]) => !excludedKeys.has(key) && hasAvailableFieldValue(value))
    .sort(([firstKey], [secondKey]) => {
      const firstOrder = preferredOrder.get(firstKey);
      const secondOrder = preferredOrder.get(secondKey);
      if (firstOrder !== undefined || secondOrder !== undefined) {
        return (firstOrder ?? Number.MAX_SAFE_INTEGER) - (secondOrder ?? Number.MAX_SAFE_INTEGER);
      }

      return firstKey.localeCompare(secondKey, undefined, { sensitivity: "base" });
    })
    .map(([key, value]) => ({
      key,
      label: options.labels?.[key] || formatFieldKeyLabel(key),
      value,
    }));
}

function hasAvailableFieldValue(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function renderAvailableFieldValue(value: unknown): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value) || (value && typeof value === "object")) {
    return <pre>{stringifyAvailableFieldValue(value)}</pre>;
  }

  return String(value ?? "");
}

function stringifyAvailableFieldValue(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatFieldKeyLabel(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  .selected-lead-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
  .selected-lead-actions .orange.small {
    min-width: 160px;
  }
  .quick-report-panel {
    display: grid;
    gap: 16px;
    margin-top: 18px;
    border: 1px solid #d6dbe8;
    background: #f8fafc;
    padding: 16px;
  }
  .quick-report-heading {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: flex-start;
    gap: 16px;
  }
  .quick-report-heading h2,
  .quick-report-subsection h3 {
    margin: 0;
    color: #111;
    line-height: 1.25;
  }
  .quick-report-heading h2 {
    font-size: 18px;
  }
  .quick-report-heading p {
    margin: 4px 0 0;
    color: #555;
    font-size: 12px;
    font-weight: 800;
    word-break: break-word;
  }
  .quick-report-message,
  .quick-report-empty {
    margin: 0;
    color: #555;
    font-size: 13px;
    font-weight: 700;
  }
  .quick-report-meta,
  .quick-report-answer-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
  }
  .quick-report-subsection {
    display: grid;
    gap: 10px;
  }
  .quick-report-subsection h3 {
    font-size: 15px;
  }
  .quick-report-results {
    display: grid;
    gap: 10px;
  }
  .quick-report-result-card {
    display: grid;
    gap: 8px;
    border: 1px solid #d6dbe8;
    background: #fff;
    padding: 12px;
  }
  .quick-report-result-card p {
    margin: 0;
    color: #111;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .quick-report-result-title {
    display: grid;
    grid-template-columns: 58px minmax(0, 1fr) max-content;
    align-items: center;
    gap: 10px;
  }
  .quick-report-result-title span {
    color: #555;
    font-size: 12px;
    font-weight: 900;
  }
  .quick-report-result-title strong {
    color: #111;
    font-size: 13px;
    line-height: 1.25;
    word-break: break-word;
  }
  .quick-report-flag {
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 11px;
    font-style: normal;
    font-weight: 900;
    line-height: 1;
    white-space: nowrap;
  }
  .quick-report-flag-red {
    background: #fee2e2;
    color: #991b1b;
  }
  .quick-report-flag-yellow {
    background: #fef3c7;
    color: #92400e;
  }
  .quick-report-flag-green {
    background: #dcfce7;
    color: #166534;
  }
  .quick-report-flag-incomplete,
  .quick-report-flag-default {
    background: #e5e7eb;
    color: #374151;
  }
  .quick-report-answer-row {
    display: grid;
    gap: 4px;
    border: 1px solid #d6dbe8;
    background: #fff;
    padding: 10px 12px;
    min-width: 0;
  }
  .quick-report-answer-row span {
    color: #555;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.3;
  }
  .quick-report-answer-row strong {
    color: #111;
    font-size: 13px;
    line-height: 1.35;
    word-break: break-word;
  }
  .job-application-panel {
    display: grid;
    gap: 22px;
  }
  .job-application-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }
  .job-application-heading h2 {
    margin: 0;
    font-size: 22px;
    color: #111;
  }
  .job-application-heading span {
    color: #555;
    font-size: 13px;
    font-weight: 800;
    word-break: break-word;
  }
  .job-application-edit-grid {
    display: grid;
    grid-template-columns: 145px minmax(180px, 1fr) 150px;
    gap: 14px;
    align-items: end;
  }
  .job-application-obs {
    grid-column: 1 / -1;
  }
  .job-application-obs textarea {
    min-height: 120px;
  }
  .available-fields-section {
    display: grid;
    gap: 10px;
  }
  .available-fields-section h3 {
    margin: 0;
    font-size: 17px;
    color: #111;
  }
  .available-fields-section p {
    margin: 0;
    color: #555;
    font-size: 13px;
    font-weight: 700;
  }
  .available-fields-grid {
    border: 1px solid #d6dbe8;
  }
  .available-field-row {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    border-top: 1px solid #d6dbe8;
    min-width: 0;
  }
  .available-field-row:first-child {
    border-top: 0;
  }
  .available-field-row > div {
    min-width: 0;
    padding: 10px 12px;
  }
  .available-field-row > div:first-child {
    background: #f6f8ff;
    border-right: 1px solid #d6dbe8;
  }
  .available-field-row span {
    display: block;
    font-weight: 800;
    word-break: break-word;
  }
  .available-field-row code {
    display: block;
    margin-top: 4px;
    color: #555;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
    white-space: normal;
    word-break: break-word;
  }
  .available-field-value {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
  }
  .available-field-value :global(pre) {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.45;
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
  .campaign-summary-important {
    color: #b00020;
    font-weight: 800;
  }
  .campaign-summary-actions {
    margin: 0 0 12px;
  }
  .sms-row {
    display: grid;
    grid-template-columns: 220px 220px minmax(140px, 1fr);
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .sms-warning {
    color: #b00020;
    font-size: 13px;
    font-weight: 800;
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
  .new-asap-row {
    width: min(710px, 100%);
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 120px minmax(180px, 1fr);
    align-items: end;
    gap: 12px;
    margin: 14px auto 0;
  }
  .new-asap-row span {
    align-self: center;
    color: #555;
    font-size: 12px;
    font-weight: 800;
  }
  .intent-filter {
    width: min(940px, 100%);
    grid-template-columns: 130px minmax(120px, 1fr) 100px minmax(150px, 1fr) 90px minmax(150px, 1fr);
  }
  .inbound-sms-filter {
    width: min(1160px, 100%);
    grid-template-columns: 140px minmax(90px, 1fr) 70px minmax(140px, 1fr) 60px minmax(150px, 1fr) minmax(190px, max-content) 100px;
  }
  .agent-report-filter {
    width: min(960px, 100%);
    grid-template-columns: 90px minmax(140px, 1fr) 70px minmax(140px, 1fr) 60px minmax(150px, 1fr) 100px;
  }
  .in-progress-filter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
  }
  .in-progress-filter input {
    width: 16px;
    height: 16px;
  }
  .inbound-history-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 12px;
  }
  .inbound-history-heading h2 {
    margin: 0;
  }
  .inbound-history-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
  .inbound-local-message {
    margin: 12px 0;
    color: #b00020;
    font-size: 13px;
    font-weight: 800;
  }
  .inbound-sms-detail {
    display: grid;
    grid-template-columns: minmax(300px, 0.9fr) minmax(520px, 1.4fr);
    gap: 24px;
    align-items: start;
    margin-top: 24px;
  }
  .inbound-selected,
  .inbound-history {
    min-width: 0;
  }
  .inbound-selected h2,
  .inbound-history h2 {
    margin: 0 0 12px;
    font-size: 18px;
    line-height: 1.25;
  }
  .inbound-selected p {
    margin: 0;
    font-size: 13px;
  }
  .inbound-message-body {
    min-height: 120px;
    max-height: 360px;
    overflow: auto;
    margin: 12px 0;
    border: 1px solid #555;
    padding: 12px;
    font-size: 13px;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .sms-transcript-item {
    border-left: 4px solid #666;
    padding: 8px 10px;
    margin-bottom: 10px;
    background: #fff;
  }
  .sms-transcript-inbound {
    border-left-color: #ff4b26;
  }
  .sms-transcript-outbound {
    border-left-color: #258a3f;
    background: #f0fbf3;
  }
  .sms-transcript-meta {
    margin-bottom: 4px;
    color: #555;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .sms-transcript-body {
    white-space: pre-wrap;
    word-break: break-word;
  }
  .inbound-selected textarea {
    width: 100%;
    min-height: 110px;
    margin: 0 0 10px;
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
    .selected-lead-actions,
    .quick-report-heading,
    .quick-report-meta,
    .quick-report-result-title,
    .quick-report-answer-grid,
    .job-application-heading,
    .job-application-edit-grid,
    .available-field-row,
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
    .new-asap-row,
    .intent-filter,
    .inbound-sms-filter,
    .agent-report-filter,
    .inbound-sms-detail,
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

function buildObservationHistory(previousObservation?: string | null, currentObservation?: string) {
  const previous = String(previousObservation || "").trim();
  const current = String(currentObservation || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!current) {
    return previous;
  }

  const timestamp = formatDateTime(new Date().toISOString()) || new Date().toISOString();
  const entry = `${timestamp} - ${current}`;
  return previous ? `${entry}\n${previous}` : entry;
}

function getInboundSmsId(sms?: CrmInboundSms | null) {
  return String(sms?.id || sms?.inboundSmsId || sms?.smsId || sms?.providerMessageId || "").trim();
}

function sortSmsTranscriptItems(left: SmsTranscriptItem, right: SmsTranscriptItem) {
  return getDateTimeValue(left.timestamp) - getDateTimeValue(right.timestamp);
}

function mergeSmsTranscriptItems(remoteRows: SmsTranscriptItem[], localRows: LocalOutboundSms[]) {
  return [
    ...remoteRows,
    ...localRows.filter((localRow) => !remoteRows.some((remoteRow) => isSameOutboundSms(remoteRow, localRow))),
  ].sort(sortSmsTranscriptItems);
}

function isSameOutboundSms(remoteRow: SmsTranscriptItem, localRow: LocalOutboundSms) {
  if (remoteRow.direction !== "outbound" || remoteRow.body.trim() !== localRow.body.trim()) {
    return false;
  }

  const remoteTimestamp = getDateTimeValue(remoteRow.timestamp);
  const localTimestamp = getDateTimeValue(localRow.timestamp);
  if (!remoteTimestamp || !localTimestamp) {
    return false;
  }

  return Math.abs(remoteTimestamp - localTimestamp) < 10 * 60 * 1000;
}

function getInboundSmsReceivedAt(sms?: CrmInboundSms | null) {
  return sms?.lastMessageAtUtc || sms?.lastSmsAtUtc || sms?.receivedAtUtc || sms?.receivedAt || sms?.createdAtUtc || null;
}

function getInboundSmsPhone(sms?: CrmInboundSms | null) {
  return String(sms?.fromPhone || sms?.phoneNumber || sms?.phone || sms?.normalizedPhone || "").trim();
}

function getInboundSmsMessage(sms?: CrmInboundSms | null) {
  return String(sms?.message || sms?.body || sms?.smsBody || "").trim();
}

function getInboundSmsPreview(sms?: CrmInboundSms | null) {
  const message = getInboundSmsMessage(sms);
  return message.length > 120 ? `${message.slice(0, 120)}...` : message;
}

function getPhoneThreadKey(phone?: string | null) {
  const value = String(phone || "").trim();
  const digits = value.replace(/\D/g, "");
  return digits || value.toLowerCase();
}

function groupInboundSmsThreads(rows: CrmInboundSms[]): InboundSmsThread[] {
  const grouped = new Map<string, CrmInboundSms[]>();

  rows.forEach((sms, index) => {
    const phone = getInboundSmsPhone(sms);
    const key = getPhoneThreadKey(phone) || `unknown-${getInboundSmsId(sms) || index}`;
    grouped.set(key, [...(grouped.get(key) || []), sms]);
  });

  return Array.from(grouped.entries())
    .map(([phoneKey, messages]) => {
      const sortedMessages = [...messages].sort(
        (left, right) => getDateTimeValue(getInboundSmsReceivedAt(right)) - getDateTimeValue(getInboundSmsReceivedAt(left)),
      );
      const lastSms = sortedMessages[0];
      const phone = getInboundSmsPhone(lastSms) || getInboundSmsPhone(messages[0]);
      const leadName = sortedMessages.map(getInboundSmsLeadName).find(Boolean) || "";

      return {
        phone,
        phoneKey,
        messages: sortedMessages,
        lastSms,
        lastAt: getInboundSmsReceivedAt(lastSms),
        status: getInboundSmsStatus(lastSms),
        leadName,
      };
    })
    .sort((left, right) => getDateTimeValue(right.lastAt) - getDateTimeValue(left.lastAt));
}

function applyClosedThreadOverrides(
  threads: InboundSmsThread[],
  overrides: Record<string, { closedAtUtc: string; agent: string }>,
) {
  return threads.map((thread) => {
    const override = overrides[thread.phoneKey];
    if (!override) {
      return thread;
    }

    const lastThreadMessageAt = getDateTimeValue(thread.lastAt);
    const closedAt = getDateTimeValue(override.closedAtUtc);
    if (lastThreadMessageAt && closedAt && lastThreadMessageAt > closedAt) {
      return thread;
    }

    return {
      ...thread,
      status: "answered" as const,
      lastSms: markInboundSmsAnswered(thread.lastSms, override.closedAtUtc, override.agent),
      messages: thread.messages.map((sms) => markInboundSmsAnswered(sms, override.closedAtUtc, override.agent)),
    };
  });
}

function markInboundSmsAnswered(sms: CrmInboundSms, answeredAtUtc: string, agent: string) {
  return {
    ...sms,
    status: "answered",
    answered: true,
    answeredAtUtc: sms.answeredAtUtc || answeredAtUtc,
    lastReplyAtUtc: sms.lastReplyAtUtc || answeredAtUtc,
    replyAgent: sms.replyAgent || agent,
  };
}

function isInboundSmsThreadInProgress(thread: InboundSmsThread) {
  return thread.status === "to_be_answered" || thread.status === "past_due";
}

function getInboundSmsThreadCount(thread: InboundSmsThread) {
  return thread.lastSms.messageCount || thread.lastSms.inboundCount || thread.messages.length;
}

function getInboundSmsLeadName(sms?: CrmInboundSms | null) {
  return String(sms?.leadName || sms?.fullName || sms?.leadId || sms?.contactId || "").trim();
}

function getInboundSmsStatus(sms?: CrmInboundSms | null): "answered" | "to_be_answered" | "past_due" {
  const status = String(sms?.status || "").trim().toLowerCase();
  if (status === "answered" || status === "to_be_answered" || status === "past_due") {
    return status;
  }

  const direction = String(sms?.lastDirection || sms?.direction || "").trim().toLowerCase();
  if (direction.includes("outbound") || direction.includes("sent") || direction.includes("manual")) {
    return "answered";
  }

  if (sms?.answered === true || sms?.answered === 1 || sms?.answered === "true" || sms?.answeredAtUtc || sms?.lastReplyAtUtc) {
    return "answered";
  }

  const receivedAt = getDateTimeValue(getInboundSmsReceivedAt(sms));
  if (receivedAt && Date.now() - receivedAt > 24 * 60 * 60 * 1000) {
    return "past_due";
  }

  return "to_be_answered";
}

function isSmsActivity(item: CrmActivity) {
  const haystack = [
    item.action,
    item.state,
    item.direction,
    item.type,
    item.eventType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("sms") || haystack.includes("text message");
}

function getActivitySmsDirection(item: CrmActivity): "inbound" | "outbound" {
  const haystack = [
    item.direction,
    item.action,
    item.state,
    item.type,
    item.eventType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("outbound") ||
    haystack.includes("manual") ||
    haystack.includes("sent") ||
    haystack.includes("reply")
  ) {
    return "outbound";
  }

  return "inbound";
}

function getActivitySmsBody(item: CrmActivity) {
  const direct = firstNonEmpty(item.message, item.body, item.smsBody, item.text, item.content);
  if (direct) {
    return direct;
  }

  return firstNonEmpty(
    item.param2,
    item.param3,
    item.param4,
    item.param5,
    looksLikePhoneValue(item.param1) ? "" : item.param1,
  );
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function firstDefined<T>(...values: Array<T | null | undefined>) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function looksLikePhoneValue(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) {
    return false;
  }

  return text.replace(/\D/g, "").length >= 9;
}

function formatInboundSmsStatusLabel(status: string) {
  switch (status) {
    case "answered":
      return "answered";
    case "past_due":
      return "past due";
    default:
      return "to be answered";
  }
}

function getDateTimeValue(value?: string | null) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatAgentLabel(agentId?: number | string | null, agentName?: string | null) {
  const name = getReadableAgentName(agentName);
  if (name) {
    return name;
  }

  return String(parseAgentId(agentId) || "");
}

function getLeadIntentTotalPreviousCalls(row: CrmLeadIntentRow) {
  const value = firstDefined(row.totalPreviousCalls, row.totalPreviousTalkedCalls, row.totalPreviousConnectedCalls);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function getLeadIntentPostIntentLastAgentId(row: CrmLeadIntentRow) {
  return firstDefined(row.postIntentLastCallAgentId, row.lastPostIntentCallAgentId, row.lastCallAgentId) ?? null;
}

function getLeadIntentPostIntentLastAgentName(row: CrmLeadIntentRow) {
  return firstNonEmpty(row.postIntentLastCallAgentName, row.lastPostIntentCallAgentName, row.lastCallAgentName);
}

function formatLeadIntentPostIntentLastAgent(row: CrmLeadIntentRow, agentNameById?: Map<number, string>) {
  const rawAgentName = getLeadIntentPostIntentLastAgentName(row);
  const agentId = parseAgentId(getLeadIntentPostIntentLastAgentId(row)) || parseAgentId(rawAgentName);
  const mappedAgentName = agentId ? agentNameById?.get(agentId) : undefined;
  const agentName = mappedAgentName || getReadableAgentName(rawAgentName);

  return agentName || String(agentId || "");
}

function getLeadIntentPostIntentLastCallTime(row: CrmLeadIntentRow) {
  return firstNonEmpty(row.postIntentLastCallTimeUtc, row.lastPostIntentCallTimeUtc, row.lastCallTimeUtc) || null;
}

function getLeadIntentPostIntentLastCallCode(row: CrmLeadIntentRow) {
  return firstDefined(row.postIntentLastCallCode, row.lastPostIntentCallCode, row.lastCallCode) ?? "";
}

function formatLeadIntentPostIntentLastCallCode(row: CrmLeadIntentRow) {
  return (
    firstNonEmpty(
      row.postIntentLastCallCodeDetails,
      row.postIntentLastCallCodeDescription,
      row.postIntentLastCallCodeName,
      row.lastPostIntentCallCodeDetails,
      row.lastPostIntentCallCodeDescription,
      row.lastPostIntentCallCodeName,
      row.lastCallCodeDetails,
    ) || getLeadIntentPostIntentLastCallCode(row)
  );
}

function formatPredictiveCampaignSummary(campaign: CrmPredictiveCampaignSummary, showDetails: boolean) {
  const queueName = campaign.campaignName || `Queue ${campaign.queueId}`;
  const completedLeads = getCompletedLeadsCount(campaign);
  const completedNoAgent = getCompletedNoAgentCount(campaign);
  const completedTalkedToAgent = getCompletedTalkedToAgentCount(campaign);
  const completedSegments =
    completedNoAgent !== null || completedTalkedToAgent !== null
      ? [
          {
            key: "completed-no-agent",
            text: `Completed - no agent: ${formatOptionalCampaignCount(completedNoAgent)}`,
            highlight: true,
          },
          {
            key: "completed-talked-agent",
            text: `Completed - talked to agent: ${formatOptionalCampaignCount(completedTalkedToAgent)}`,
            highlight: true,
          },
        ]
      : [{ key: "completed", text: `Completed: ${formatOptionalCampaignCount(completedLeads)}`, highlight: true }];
  const availableLeads = getAvailableLeadsCount(campaign);
  const compactSegments = [
    { key: "queue", text: queueName },
    { key: "total", text: `Total Leads: ${campaign.totalLeads ?? 0}`, highlight: true },
    ...completedSegments,
    { key: "not-dialled", text: `Available - not dialled: ${campaign.notDialled ?? 0}`, highlight: true },
    {
      key: "available",
      text: `Available - dialled - no agent conn: ${formatOptionalCampaignCount(availableLeads)}`,
      highlight: true,
    },
  ];

  if (!showDetails) {
    return formatCampaignSummarySegments(compactSegments);
  }

  if (!hasCalltraceCampaignSummary(campaign)) {
    return formatCampaignSummarySegments([
      ...compactSegments,
      { key: "missing", text: "Updated campaign summary metrics are not available from the API yet" },
      {
        key: "called",
        text: `Called Today: ${campaign.calledToday ?? 0} (${campaign.calledYesterday ?? 0}) Connected Today: ${campaign.connectedToday ?? 0} (${campaign.connectedYesterday ?? 0})`,
      },
    ]);
  }

  return formatCampaignSummarySegments([
    ...compactSegments,
    { key: "no-agent", text: `Dialled but No Agent: ${campaign.dialledButNoAgent ?? 0}` },
    { key: "dialler-results", text: formatTopDiallerResults(campaign.topDiallerResults) },
    { key: "to-agent", text: `DialledToAgent: ${campaign.dialledToAgent ?? 0}` },
    { key: "callcodes", text: formatTopCallCodes(campaign.topCallCodes) },
    {
      key: "called",
      text: `Called Today: ${campaign.calledToday ?? 0} (${campaign.calledYesterday ?? 0}) Connected Today: ${campaign.connectedToday ?? 0} (${campaign.connectedYesterday ?? 0})`,
    },
    { key: "dialled-times", text: formatDialledTimes(campaign) },
  ]);
}

function formatCampaignSummarySegments(
  segments: Array<{ key: string; text?: string | null; highlight?: boolean }>,
) {
  const visibleSegments = segments.filter((segment) => segment.text);

  return (
    <span className="campaign-summary-line">
      {visibleSegments.map((segment, index) => (
        <span key={segment.key}>
          {index > 0 ? " | " : ""}
          <span
            className={segment.highlight ? "campaign-summary-important" : undefined}
            style={segment.highlight ? { color: "#b00020", fontWeight: 800 } : undefined}
          >
            {segment.text}
          </span>
        </span>
      ))}
    </span>
  );
}

function formatOptionalCampaignCount(value: number | null): string | number {
  return value === null ? "n/a" : value;
}

function getCompletedLeadsCount(campaign: CrmPredictiveCampaignSummary): number | null {
  const explicit = getCampaignNumber(campaign, [
    "completed",
    "completedLeads",
    "completedLeadCount",
    "completedCount",
    "Completed",
    "CompletedLeads",
    "CompletedLeadCount",
    "CompletedCount",
  ]);
  if (explicit !== null) {
    return explicit;
  }

  const available = getAvailableLeadsCount(campaign, false);
  const total = getCampaignNumber(campaign, ["totalLeads", "TotalLeads"]);
  const notDialled = getCampaignNumber(campaign, ["notDialled", "NotDialled"]);
  if (available !== null && total !== null && notDialled !== null) {
    return Math.max(total - notDialled - available, 0);
  }

  return null;
}

function getCompletedNoAgentCount(campaign: CrmPredictiveCampaignSummary): number | null {
  const explicit = getCampaignNumber(campaign, [
    "completedNoAgent",
    "completedNoAgentCount",
    "completedWithoutAgent",
    "completedNotConnected",
    "CompletedNoAgent",
    "CompletedNoAgentCount",
    "CompletedWithoutAgent",
    "CompletedNotConnected",
  ]);
  if (explicit !== null) {
    return explicit;
  }

  const completed = getCompletedLeadsCount(campaign);
  const talkedToAgent = getCompletedTalkedToAgentCount(campaign, false);
  if (completed !== null && talkedToAgent !== null) {
    return Math.max(completed - talkedToAgent, 0);
  }

  return null;
}

function getCompletedTalkedToAgentCount(
  campaign: CrmPredictiveCampaignSummary,
  deriveFromNoAgent = true,
): number | null {
  const explicit = getCampaignNumber(campaign, [
    "completedTalkedToAgent",
    "completedTalkedToAgentCount",
    "completedWithAgent",
    "completedToAgent",
    "CompletedTalkedToAgent",
    "CompletedTalkedToAgentCount",
    "CompletedWithAgent",
    "CompletedToAgent",
  ]);
  if (explicit !== null) {
    return explicit;
  }

  if (!deriveFromNoAgent) {
    return null;
  }

  const completed = getCompletedLeadsCount(campaign);
  const noAgent = getCompletedNoAgentCount(campaign);
  if (completed !== null && noAgent !== null) {
    return Math.max(completed - noAgent, 0);
  }

  return null;
}

function getAvailableLeadsCount(
  campaign: CrmPredictiveCampaignSummary,
  deriveFromCompleted = true,
): number | null {
  const explicit = getCampaignNumber(campaign, [
    "available",
    "availableLeads",
    "availableLeadCount",
    "availableCount",
    "Available",
    "AvailableLeads",
    "AvailableLeadCount",
    "AvailableCount",
  ]);
  if (explicit !== null) {
    return explicit;
  }

  if (!deriveFromCompleted) {
    return null;
  }

  const completed = getCompletedLeadsCount(campaign);
  const total = getCampaignNumber(campaign, ["totalLeads", "TotalLeads"]);
  const notDialled = getCampaignNumber(campaign, ["notDialled", "NotDialled"]);
  if (completed !== null && total !== null && notDialled !== null) {
    return Math.max(total - notDialled - completed, 0);
  }

  return null;
}

function getCampaignNumber(campaign: CrmPredictiveCampaignSummary, keys: string[]): number | null {
  const row = campaign as Record<string, unknown>;

  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

function hasCalltraceCampaignSummary(campaign: CrmPredictiveCampaignSummary) {
  return (
    campaign.notDialled !== undefined ||
    campaign.dialledButNoAgent !== undefined ||
    campaign.dialledToAgent !== undefined ||
    campaign.dialledOneTime !== undefined ||
    campaign.topDiallerResults !== undefined
  );
}

function formatTopCallCodes(
  callCodes?: Array<{ callCode?: number | null; label?: string | null; count?: number; yesterdayCount?: number }>,
) {
  return formatGroupedCampaignCounts(
    callCodes,
    "Callcodes",
    (callCode) => callCode.label || `CallCode ${callCode.callCode ?? ""}`,
    (first, second) => (first.callCode ?? 0) - (second.callCode ?? 0),
  );
}

function formatTopDiallerResults(
  diallerResults?: Array<{ diallerResult?: number | null; label?: string | null; count?: number }>,
) {
  return formatGroupedCampaignCounts(
    diallerResults,
    "Dialler results",
    (diallerResult) => diallerResult.label || `DiallerResult ${diallerResult.diallerResult ?? ""}`,
    (first, second) => (first.diallerResult ?? 0) - (second.diallerResult ?? 0),
  );
}

function formatGroupedCampaignCounts<T extends { label?: string | null; count?: number }>(
  items: T[] | undefined,
  prefix: string,
  getLabel: (item: T) => string,
  compareTieBreak: (first: T, second: T) => number,
) {
  const sortedItems = (items || [])
    .filter((item) => (item.count ?? 0) > 0)
    .sort((first, second) => {
      const countDiff = (second.count ?? 0) - (first.count ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      const labelDiff = getLabel(first).localeCompare(getLabel(second));
      return labelDiff || compareTieBreak(first, second);
    });

  if (!sortedItems.length) {
    return "";
  }

  return `${prefix}: ${sortedItems.map((item) => `${getLabel(item)}: ${item.count ?? 0}`).join(" | ")}`;
}

function formatDialledTimes(campaign: CrmPredictiveCampaignSummary) {
  return [
    `Dialled zero times: ${campaign.dialledZeroTimes ?? 0}`,
    `1 time: ${campaign.dialledOneTime ?? 0}`,
    `2 times: ${campaign.dialledTwoTimes ?? 0}`,
    `3 times: ${campaign.dialledThreeTimes ?? 0}`,
    `4 times: ${campaign.dialledFourTimes ?? 0}`,
    `5 times: ${campaign.dialledFiveTimes ?? 0}`,
    `6 times: ${campaign.dialledSixTimes ?? 0}`,
    `7 times: ${campaign.dialledSevenTimes ?? 0}`,
    `8 times: ${campaign.dialledEightTimes ?? 0}`,
    `9 times: ${campaign.dialledNineTimes ?? 0}`,
    `10+ times: ${campaign.dialledTenPlusTimes ?? 0}`,
  ].join(" / ");
}

function getLeadContactId(lead?: CrmLead | null, intent?: CrmLeadIntentRow | null) {
  return String(
    intent?.contactId ||
      intent?.canonicalContactId ||
      intent?.leadId ||
      lead?.contactId ||
      lead?.canonicalContactId ||
      lead?.canonical?.contactId ||
      lead?.id ||
      "",
  ).trim();
}

function getLeadCanonicalContactId(lead?: CrmLead | null, intent?: CrmLeadIntentRow | null) {
  return String(
    intent?.contactId ||
      intent?.canonicalContactId ||
      lead?.contactId ||
      lead?.canonicalContactId ||
      lead?.canonical?.contactId ||
      "",
  ).trim();
}

function getLeadPhoneValue(lead?: CrmLead | null) {
  return String(lead?.phoneNumber || lead?.normalizedPhone || "").trim();
}

function getLeadPhoneValues(lead?: CrmLead | null) {
  const phones = new Set<string>();
  [lead?.phoneNumber, lead?.normalizedPhone].forEach((value) => {
    const phone = String(value || "").trim();
    if (phone) {
      phones.add(phone);
    }
  });
  (lead?.phones || []).forEach((phone) => {
    [phone.phone, phone.normalizedPhone].forEach((value) => {
      const text = String(value || "").trim();
      if (text) {
        phones.add(text);
      }
    });
  });
  return Array.from(phones);
}

function getLeadRecordId(lead?: CrmLead | null) {
  return String(lead?.id || lead?.wixId || lead?._id || lead?.leadid || "").trim();
}

function getLeadUpdateIdCandidates(
  lead?: CrmLead | null,
  intent?: CrmLeadIntentRow | null,
  preferLeadIntentIds = false,
) {
  const values = preferLeadIntentIds
    ? [
        lead?.leadid,
        intent?.leadId,
        lead?.id,
        lead?.wixId,
        lead?._id,
        intent?.interestId,
        intent?.contactId,
        intent?.canonicalContactId,
        lead?.contactId,
        lead?.canonicalContactId,
        lead?.canonical?.contactId,
      ]
    : [
        lead?.id,
        lead?.wixId,
        lead?._id,
        lead?.leadid,
      ];

  const seen = new Set<string>();
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value || seen.has(value)) {
        return false;
      }

      seen.add(value);
      return true;
    });
}

async function updateCrmLeadByCandidateIds(
  token: string,
  candidateIds: string[],
  payload: Parameters<typeof updateCrmLead>[2],
) {
  let lastError: unknown = null;

  for (const id of candidateIds) {
    try {
      return await updateCrmLead(token, id, payload);
    } catch (error) {
      lastError = error;
      if (!isLeadNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("CRM lead not found.");
}

function isLeadNotFoundError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return /lead not found|crm lead not found|not found/i.test(message);
}

function formatLeadSaveError(error: unknown, isJobApplication: boolean) {
  if (isJobApplication && isLeadNotFoundError(error)) {
    return "CRM lead not found. Pentru JobApplication, backend-ul trebuie sa accepte salvarea dupa leadId/intentId/contactId.";
  }

  return error instanceof Error ? error.message : "Nu am putut salva lead-ul.";
}

function buildLeadQuickReportParams(lead?: CrmLead | null, intent?: CrmLeadIntentRow | null) {
  return {
    leadId: firstNonEmpty(intent?.leadId, lead?.leadid, lead?.id, lead?.wixId, lead?._id),
    contactId: firstNonEmpty(intent?.contactId, lead?.contactId),
    canonicalContactId: firstNonEmpty(intent?.canonicalContactId, lead?.canonicalContactId, lead?.canonical?.contactId),
    intentId: firstNonEmpty(intent?.interestId),
    email: getLeadEmailValues(lead)[0] || getLeadEmailValue(lead),
    phone: getLeadPhoneValues(lead)[0] || getLeadPhoneValue(lead),
    serviceKey: firstNonEmpty(intent?.serviceKey, intent?.serviceDisplayName),
  };
}

function hasLeadQuickReportLookup(params: Record<string, string>) {
  return Boolean(params.leadId || params.contactId || params.canonicalContactId || params.intentId || params.email || params.phone);
}

function getQuickReportDetailsFromResponse(response: unknown): CrmQuickReportDetails | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as {
    report?: CrmQuickReportDetails | null;
    quickReport?: CrmQuickReportDetails | null;
    item?: CrmQuickReportDetails | null;
    latest?: CrmQuickReportDetails | null;
    reports?: CrmQuickReportDetails[] | null;
    items?: CrmQuickReportDetails[] | null;
  };

  return (
    record.report ||
    record.quickReport ||
    record.item ||
    record.latest ||
    record.reports?.[0] ||
    record.items?.[0] ||
    null
  );
}

function formatQuickReportDetailsError(error: unknown) {
  if (isNotFoundError(error)) {
    return "Nu am gasit raport gratuit salvat pentru acest lead sau endpointul LS nu este disponibil inca.";
  }

  return error instanceof Error ? error.message : "Nu am putut incarca raportul gratuit pentru acest lead.";
}

function getQuickReportResults(report: CrmQuickReportDetails | null) {
  if (!report) {
    return [];
  }

  const reportRecord = asQuickReportRecord(report);
  const faza0Record = asQuickReportRecord(reportRecord?.faza0);
  const internalRecord = asQuickReportRecord(reportRecord?.internal);
  const candidates = [
    report.faza0Results,
    report.results,
    faza0Record?.results,
    faza0Record?.faza0Results,
    internalRecord?.faza0Results,
    reportRecord?.faza0ResultRows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const normalized = candidate
        .map((item) => normalizeQuickReportResult(item))
        .filter((item): item is CrmQuickReportResult => Boolean(item));
      if (normalized.length) {
        return normalized;
      }
    }
  }

  return [];
}

function normalizeQuickReportResult(value: unknown): CrmQuickReportResult | null {
  const record = asQuickReportRecord(value);
  if (!record) {
    return null;
  }

  const code = firstNonEmpty(
    quickReportString(record.code),
    quickReportString(record.Code),
    quickReportString(record.checkCode),
    quickReportString(record.resultCode),
  );
  const title = firstNonEmpty(
    quickReportString(record.title),
    quickReportString(record.Title),
    quickReportString(record.name),
    quickReportString(record.checkName),
  );
  const flag = firstNonEmpty(
    quickReportString(record.flag),
    quickReportString(record.Flag),
    quickReportString(record.status),
    quickReportString(record.risk),
  );
  const output = firstNonEmpty(
    quickReportString(record.output),
    quickReportString(record.Output),
    quickReportString(record.result),
    quickReportString(record.resultText),
    quickReportString(record.description),
  );

  if (!code && !title && !output) {
    return null;
  }

  return {
    code,
    title,
    flag,
    output,
    rawAnswer: asQuickReportRecord(record.rawAnswer) || asQuickReportRecord(record.rawAnswers),
  };
}

function getQuickReportFaza0Answers(report: CrmQuickReportDetails | null) {
  if (!report) {
    return {};
  }

  const reportRecord = asQuickReportRecord(report);
  const answersRecord = asQuickReportRecord(report.answers);
  const faza0Record = asQuickReportRecord(reportRecord?.faza0);

  return (
    firstQuickReportRecord(
      report.faza0Answers,
      answersRecord?.existingFaza0Answers,
      answersRecord?.faza0Answers,
      faza0Record?.answers,
      faza0Record?.faza0Answers,
      reportRecord?.existingFaza0Answers,
    ) || {}
  );
}

function getQuickReportInternalAnswers(report: CrmQuickReportDetails | null) {
  if (!report) {
    return {};
  }

  const reportRecord = asQuickReportRecord(report);
  const internalRecord = asQuickReportRecord(report.internal);

  return (
    firstQuickReportRecord(
      report.internalAnswers,
      internalRecord?.answers,
      internalRecord?.internalAnswers,
      reportRecord?.crmInternalAnswers,
      reportRecord?.internalCrmAnswers,
    ) || {}
  );
}

function getLabeledAnswerRows(
  answers: Record<string, unknown>,
  labels: Record<string, string>,
): Array<{ label: string; value: string }> {
  const extraKeys = Object.keys(answers).filter((key) => !labels[key]);
  return [...Object.keys(labels), ...extraKeys]
    .map((key) => ({
      label: labels[key] || humanizeQuickReportKey(key),
      value: formatQuickReportAnswerValue(key, answers[key]),
    }))
    .filter((row) => row.value);
}

function formatQuickReportAnswerValue(key: string, value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Da" : "Nu";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatQuickReportAnswerValue(key, item)).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const text = String(value).trim();
  if (!text) {
    return "";
  }

  return QUICK_REPORT_VALUE_LABELS[key]?.[text] || (text === "yes" ? "Da" : text === "no" ? "Nu" : text);
}

function getQuickReportReference(report: CrmQuickReportDetails) {
  return firstNonEmpty(report.reportId, report.id, report.leadId) || "fara ID";
}

function getQuickReportDate(report: CrmQuickReportDetails) {
  return firstNonEmpty(report.submittedAtUtc, report.createdAtUtc, report.updatedAtUtc);
}

function formatQuickReportFlag(flag?: string | null) {
  const normalized = normalizeQuickReportFlag(flag);
  if (normalized === "red") {
    return "Rosu";
  }
  if (normalized === "yellow") {
    return "Galben";
  }
  if (normalized === "green") {
    return "Verde";
  }
  if (normalized === "incomplete") {
    return "Necompletat";
  }

  return quickReportString(flag) || "Rezultat";
}

function quickReportFlagClass(flag?: string | null) {
  return `quick-report-flag quick-report-flag-${normalizeQuickReportFlag(flag) || "default"}`;
}

function normalizeQuickReportFlag(flag?: string | null) {
  const text = quickReportString(flag).toLowerCase();
  if (text === "rosu" || text === "red") {
    return "red";
  }
  if (text === "galben" || text === "yellow") {
    return "yellow";
  }
  if (text === "verde" || text === "green") {
    return "green";
  }
  if (text === "necompletat" || text === "incomplete") {
    return "incomplete";
  }

  return "";
}

function firstQuickReportRecord(...values: unknown[]) {
  for (const value of values) {
    const record = asQuickReportRecord(value);
    if (record && Object.keys(record).length) {
      return record;
    }
  }

  return null;
}

function asQuickReportRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function quickReportString(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function humanizeQuickReportKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLeadEmailValue(lead?: CrmLead | null) {
  return String(lead?.email || "").trim();
}

function getLeadStatusUpdateEmail(lead?: CrmLead | null) {
  const primaryEmail = getLeadEmailValue(lead);
  return isEmailLookupValue(primaryEmail) ? primaryEmail : getLeadEmailValues(lead)[0] || "";
}

function getLeadEmailValues(lead?: CrmLead | null) {
  const emails = new Set<string>();
  [lead?.email, lead?.secondaryemail, lead?.emailLeads, lead?.emailAsap].forEach((value) => {
    String(value || "")
      .split(/[;,]/)
      .map((item) => normalizeLookupEmail(item))
      .filter(isEmailLookupValue)
      .forEach((email) => emails.add(email));
  });
  return Array.from(emails);
}

function getLeadLookupValue(lead?: CrmLead | null) {
  return getLeadPhoneValue(lead) || getLeadEmailValue(lead);
}

function buildLeadIntentLookup(lead?: CrmLead | null) {
  const phone = getLeadPhoneValue(lead);
  const email = getLeadStatusUpdateEmail(lead);
  return phone ? { phone } : { email };
}

function lookupMatchesLead(lookup: string, lead?: CrmLead | null) {
  if (!lookup || !lead) {
    return false;
  }

  if (isEmailLookupValue(lookup)) {
    const lookupEmail = normalizeLookupEmail(lookup);
    return getLeadEmailValues(lead).some((email) => email === lookupEmail);
  }

  const lookupPhone = normalizeLookupPhone(lookup);
  if (!lookupPhone) {
    return false;
  }

  return getLeadPhoneValues(lead).some((phone) => {
    const leadPhone = normalizeLookupPhone(phone);
    if (!leadPhone) {
      return false;
    }
    return leadPhone === lookupPhone || (
      leadPhone.length >= 6 &&
      lookupPhone.length >= 6 &&
      leadPhone.slice(-6) === lookupPhone.slice(-6)
    );
  });
}

function getLeadLastContactValue(lead?: CrmLead | null, intent?: CrmLeadIntentRow | null) {
  return (
    intent?.lastCallTimeUtc ||
    intent?.contactTimeUtc ||
    lead?.dataUrmatorContact ||
    lead?.updatedAtUtc ||
    lead?.leadDate ||
    null
  );
}

function buildLeadHistoryParams(
  lead: CrmLead,
  intent?: CrmLeadIntentRow | null,
  lookupOverride?: string,
) {
  const lookup = String(lookupOverride || "").trim();
  const contactId = getLeadContactId(lead, intent);
  const defaultPhone = getLeadPhoneValue(lead);
  const defaultEmail = getLeadEmailValue(lead);
  const params: { contactId?: string; phone?: string; email?: string; limit: number } = {
    limit: 500,
  };

  if (lookup) {
    const lookupBelongsToSelectedLead = lookupMatchesLead(lookup, lead);
    if (lookupBelongsToSelectedLead && contactId) {
      params.contactId = contactId;
    }

    if (isEmailLookupValue(lookup)) {
      params.email = lookup;
      if (lookupBelongsToSelectedLead && defaultPhone) {
        params.phone = defaultPhone;
      }
    } else {
      params.phone = lookup;
      if (lookupBelongsToSelectedLead && defaultEmail) {
        params.email = defaultEmail;
      }
    }
    return params;
  }

  if (contactId) {
    params.contactId = contactId;
  }

  if (defaultPhone) {
    params.phone = defaultPhone;
  }
  if (defaultEmail) {
    params.email = defaultEmail;
  }

  return params;
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

function getSaleKey(sale: CrmSale) {
  return String(sale.id || sale.wixId || sale._id || sale.sourceRecordId || sale.phone || sale.email || "").trim();
}

function buildSaleHistoryParams(sale: CrmSale) {
  const sourceRecordId = String(sale.sourceRecordId || "").trim();
  const sourceSystem = String(sale.sourceSystem || (sourceRecordId ? "stripe" : "")).trim();
  const saleId = String(sale.id || sale.wixId || sale._id || "").trim();
  const phone = sale.normalizedPhone || sale.phone || "";
  const email = sale.email || "";
  const historyWindow = buildSaleHistoryWindow(sale);
  const windowParams = {
    dateBegin: historyWindow.dateBegin,
    dateEnd: historyWindow.dateEnd,
    occurredFromUtc: historyWindow.occurredFromUtc,
    occurredToUtc: historyWindow.occurredToUtc,
    fromUtc: historyWindow.occurredFromUtc,
    toUtc: historyWindow.occurredToUtc,
    createdFromUtc: historyWindow.occurredFromUtc,
    createdToUtc: historyWindow.occurredToUtc,
  };

  if (sourceSystem && sourceRecordId) {
    return {
      sourceSystem,
      sourceRecordId,
      ...windowParams,
      limit: 150,
    };
  }

  if (saleId) {
    return {
      saleId,
      ...windowParams,
      limit: 150,
    };
  }

  return {
    phone,
    email,
    ...windowParams,
    limit: 50,
  };
}

async function loadSaleActivityHistoryFallback(token: string, sale: CrmSale) {
  const params = buildSaleActivityHistoryFallbackParams(sale);
  if (!params) {
    return null;
  }

  const result = await searchCrmActivity(token, params);
  const activities = result.activities || result.items || [];
  const events = buildSaleHistoryEventsFromActivities(activities, sale);

  return {
    sale,
    events,
    total: events.length,
    limit: params.limit,
  };
}

function buildSaleActivityHistoryFallbackParams(sale: CrmSale) {
  const phone = firstNonEmpty(sale.normalizedPhone, sale.phone);
  const email = firstNonEmpty(sale.email);

  if (!phone && !email) {
    return null;
  }

  return {
    phone: phone || undefined,
    email: email || undefined,
    limit: 500,
  };
}

function buildSaleHistoryEventsFromActivities(activities: CrmActivity[], sale: CrmSale): CrmSaleHistoryEvent[] {
  const historyWindow = buildSaleHistoryWindow(sale);
  const from = getDateTimeValue(historyWindow.occurredFromUtc);
  const to = getDateTimeValue(historyWindow.occurredToUtc);

  return activities
    .filter((activity) => {
      const timestamp = getDateTimeValue(getActivityTimestamp(activity));
      if (!timestamp) {
        return true;
      }
      if (from && timestamp < from) {
        return false;
      }
      if (to && timestamp > to) {
        return false;
      }
      return true;
    })
    .map((activity, index) => ({
      eventId: activity.eventId || `activity-${getActivityTimestamp(activity) || index}-${index}`,
      eventType: inferSaleActivityEventType(activity),
      occurredAtUtc: getActivityTimestamp(activity),
      title: formatSaleActivityTitle(activity),
      description: formatSaleActivityDescription(activity),
      metadata: {
        agentId: firstDefined(activity.agentId, null),
        agentName: firstNonEmpty(activity.agentName, activity.agent),
        callCodeDetails: firstNonEmpty(activity.state, activity.param1),
      },
    }))
    .sort((first, second) => getDateTimeValue(first.occurredAtUtc) - getDateTimeValue(second.occurredAtUtc));
}

function getActivityTimestamp(activity: CrmActivity) {
  return activity.timestamp || activity.occurredAtUtc || activity.createdAtUtc || activity.updatedAtUtc || null;
}

function inferSaleActivityEventType(activity: CrmActivity) {
  const haystack = [activity.eventType, activity.type, activity.action, activity.state, activity.direction]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("call") || haystack.includes("dial")) {
    return "dialler_call";
  }
  if (haystack.includes("sms") || haystack.includes("text message")) {
    return "sms";
  }
  if (haystack.includes("email")) {
    return "email";
  }

  return activity.eventType || activity.type || "activity";
}

function formatSaleActivityTitle(activity: CrmActivity) {
  return firstNonEmpty(activity.action, activity.state, activity.type, activity.eventType) || "Activity";
}

function formatSaleActivityDescription(activity: CrmActivity) {
  return firstNonEmpty(
    activity.message,
    activity.body,
    activity.smsBody,
    activity.text,
    activity.content,
    activity.param2,
    activity.param3,
    activity.param4,
    activity.param5,
  );
}

function getDialerFirstCallDate(sale: CrmSale) {
  return readSaleStringField(sale, [
    "dialerownerCallDateUtc",
    "dialerOwnerCallDateUtc",
    "dialerownerCallDate",
    "dialerOwnerCallDate",
    "dialerownerCallTimeUtc",
    "dialerOwnerCallTimeUtc",
    "dialerownerAtUtc",
    "dialerOwnerAtUtc",
    "dialerFirstCallDateUtc",
    "dialerfirstCallDateUtc",
    "dialerFirstCallDate",
    "dialerfirstCallDate",
    "dialerFirstCallTimeUtc",
    "dialerfirstCallTimeUtc",
    "dialerFirstCallAtUtc",
    "dialerfirstCallAtUtc",
    "dialerFirstAtUtc",
    "dialerfirstAtUtc",
    "firstDialerCallAtUtc",
    "firstDialerCallDateUtc",
    "firstDialerCallDate",
    "firstDiallerCallAtUtc",
    "firstDiallerCallDateUtc",
    "firstCallAtUtc",
    "firstCallDateUtc",
    "dialerFirstDate",
  ]);
}

function getDialerLastCallDate(sale: CrmSale) {
  return readSaleStringField(sale, [
    "dialerlastCallDateUtc",
    "dialerLastCallDateUtc",
    "dialerlastCallDate",
    "dialerLastCallDate",
    "dialerlastCallTimeUtc",
    "dialerLastCallTimeUtc",
    "dialerlastAtUtc",
    "dialerLastAtUtc",
    "dialerlastCallAtUtc",
    "dialerLastCallAtUtc",
    "lastDialerCallAtUtc",
    "lastDialerCallDateUtc",
    "lastDialerCallDate",
    "lastDiallerCallAtUtc",
    "lastDiallerCallDateUtc",
    "lastCallAtUtc",
    "lastCallDateUtc",
    "dialerLastDate",
  ]);
}

function readSaleStringField(sale: CrmSale, keys: string[]) {
  const fields = sale as Record<string, unknown>;

  for (const key of keys) {
    const value = formatSaleFieldValue(fields[key]);
    if (value) {
      return value;
    }
  }

  const caseInsensitiveFields = new Map(
    Object.entries(fields).map(([key, value]) => [key.toLowerCase(), value]),
  );
  for (const key of keys) {
    const value = formatSaleFieldValue(caseInsensitiveFields.get(key.toLowerCase()));
    if (value) {
      return value;
    }
  }

  return "";
}

function formatSaleFieldValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function formatDialerAgentWithDate(agent?: string | null, callDate?: string | null) {
  const name = String(agent || "").trim();
  if (!name) {
    return "";
  }

  const formattedDate = formatDateTime(callDate);
  return formattedDate ? `${name} (${formattedDate})` : name;
}

function buildSaleHistoryWindow(sale: CrmSale) {
  const saleDate = getSaleHistoryStartDate(sale);
  if (!saleDate) {
    return {
      dateBegin: "",
      dateEnd: "",
      occurredFromUtc: "",
      occurredToUtc: "",
    };
  }

  const endDate = new Date(saleDate);
  endDate.setDate(endDate.getDate() + 30);
  const now = new Date();
  const cappedEndDate = endDate > now ? now : endDate;

  return {
    dateBegin: getLocalDateKey(saleDate.toISOString()),
    dateEnd: getLocalDateKey(cappedEndDate.toISOString()),
    occurredFromUtc: saleDate.toISOString(),
    occurredToUtc: cappedEndDate.toISOString(),
  };
}

function getSaleHistoryStartDate(sale: CrmSale) {
  const value = sale.createdAtUtc || sale.wixCreatedDateUtc;
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatSaleHistoryError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "History request timed out after 20 seconds. Try again or narrow the sales filter.";
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "History request timed out after 20 seconds. Try again or narrow the sales filter.";
  }

  return error instanceof Error ? error.message : "Nu am putut incarca istoricul vanzarii.";
}

function isNotFoundError(error: unknown) {
  if (error && typeof error === "object" && "status" in error && Number(error.status) === 404) {
    return true;
  }

  return error instanceof Error && /not found/i.test(error.message);
}

function formatSourceRecord(sourceSystem?: string | null, sourceRecordId?: string | null) {
  const system = String(sourceSystem || "").trim();
  const record = String(sourceRecordId || "").trim();
  if (system && record) {
    return `${system}: ${record}`;
  }

  return system || record;
}

function getSaleHistoryEventClass(eventType?: string | null) {
  switch (String(eventType || "").trim()) {
    case "lead_created":
      return "type-lead";
    case "lead_intent":
      return "type-intent";
    case "contact_service":
      return "type-service";
    case "sale":
      return "type-sale";
    case "dialler_call":
      return "type-call";
    case "sms":
      return "type-sms";
    case "email":
      return "type-email";
    default:
      return "type-default";
  }
}

function getSaleHistoryEventIcon(eventType?: string | null) {
  switch (String(eventType || "").trim()) {
    case "lead_created":
      return "LC";
    case "lead_intent":
      return "LI";
    case "contact_service":
      return "CS";
    case "sale":
      return "SA";
    case "dialler_call":
      return "DC";
    case "sms":
      return "SMS";
    case "email":
      return "EM";
    default:
      return "EV";
  }
}

function formatEventType(eventType?: string | null) {
  return String(eventType || "Event")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSaleHistoryMetadata(event: CrmSaleHistoryEvent) {
  const metadata = event.metadata || {};
  const items: string[] = [];

  if (metadata.agentId || metadata.agentName) {
    items.push(`Agent: ${formatAgentLabel(Number(metadata.agentId) || undefined, metadata.agentName) || metadata.agentName || metadata.agentId}`);
  }
  if (metadata.callCode || metadata.callCodeDetails) {
    items.push(`Call code: ${[metadata.callCode, metadata.callCodeDetails].filter(Boolean).join(" - ")}`);
  }
  if (metadata.callTraceId) {
    items.push(`Trace: ${metadata.callTraceId}`);
  }
  if (metadata.amountTotalMajor !== undefined && metadata.amountTotalMajor !== null) {
    items.push(`Amount: ${formatPounds(Number(metadata.amountTotalMajor))}`);
  }
  if (metadata.serviceDisplayName || metadata.serviceKey) {
    items.push(`Service: ${metadata.serviceDisplayName || metadata.serviceKey}`);
  }
  if (metadata.campaignName) {
    items.push(`Campaign: ${metadata.campaignName}`);
  }
  if (metadata.sourceSystem || metadata.sourceRecordId) {
    items.push(`Source: ${formatSourceRecord(metadata.sourceSystem, metadata.sourceRecordId)}`);
  }

  return items;
}

function getDateInputDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

type AgentReportSummary = {
  loggedSeconds: number;
  pauseSeconds: number;
  talkedSeconds: number;
  clericalSeconds: number;
  eveningLoggedSeconds: number;
  eveningPauseSeconds: number;
  eveningTalkedSeconds: number;
  eveningClericalSeconds: number;
  outsideLoggedSeconds: number;
  outsidePauseSeconds: number;
  outsideTalkedSeconds: number;
  outsideClericalSeconds: number;
};

function getAgentReportResponseRows(response: {
  rows?: CrmAgentReportRow[];
  daily?: CrmAgentReportRow[];
  items?: CrmAgentReportRow[];
}) {
  return response.rows || response.daily || response.items || [];
}

function getAgentReportResponsePauseRows(response: {
  pauseRows?: CrmAgentReportPauseBreakdownRow[];
  pauses?: CrmAgentReportPauseBreakdownRow[];
}) {
  return response.pauseRows || response.pauses || [];
}

function formatAgentReportShortDate(value: string) {
  const match = value.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return match ? `${match[2]}.${match[1]}` : value;
}

function formatAgentReportWeekLabel(start: string, end: string) {
  const startMatch = start.match(/^\d{4}-(\d{2})-(\d{2})$/);
  const endMatch = end.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!startMatch || !endMatch) {
    return `${formatAgentReportShortDate(start)} - ${formatAgentReportShortDate(end)}`;
  }

  if (startMatch[1] === endMatch[1]) {
    return `${startMatch[2]}-${endMatch[2]}.${endMatch[1]}`;
  }

  return `${startMatch[2]}.${startMatch[1]}-${endMatch[2]}.${endMatch[1]}`;
}

const AGENT_REPORT_LOGGED_KEYS = [
  "loggedSeconds",
  "loggedMinutes",
  "loggedTimeSeconds",
  "loggedTimeMinutes",
  "totalLoggedSeconds",
  "totalLoggedMinutes",
];

const AGENT_REPORT_PAUSE_KEYS = [
  "pauseSeconds",
  "pauseMinutes",
  "pauseTimeSeconds",
  "pauseTimeMinutes",
  "totalPauseSeconds",
  "totalPauseMinutes",
];

const AGENT_REPORT_TALKED_KEYS = [
  "talkedSeconds",
  "talkedMinutes",
  "talkedTimeSeconds",
  "talkedTimeMinutes",
  "totalTalkedSeconds",
  "totalTalkedMinutes",
];

const AGENT_REPORT_CLERICAL_KEYS = [
  "clericalSeconds",
  "clericalMinutes",
  "clericalTimeSeconds",
  "clericalTimeMinutes",
  "totalClericalSeconds",
  "totalClericalMinutes",
];

const AGENT_REPORT_WINDOW_LOGGED_KEYS = [
  "windowLoggedSeconds",
  "windowLoggedMinutes",
  "eveningLoggedSeconds",
  "eveningLoggedMinutes",
  "eveningLoggedTimeSeconds",
  "eveningLoggedTimeMinutes",
  "logged1822Seconds",
  "logged1822Minutes",
  "logged18To22Seconds",
  "logged18To22Minutes",
];

const AGENT_REPORT_WINDOW_PAUSE_KEYS = [
  "windowPauseSeconds",
  "windowPauseMinutes",
  "pauseEveningSeconds",
  "pauseEveningMinutes",
  "eveningPauseSeconds",
  "eveningPauseMinutes",
  "eveningPauseTimeSeconds",
  "eveningPauseTimeMinutes",
  "pause1822Seconds",
  "pause1822Minutes",
  "pause18To22Seconds",
  "pause18To22Minutes",
];

const AGENT_REPORT_WINDOW_TALKED_KEYS = [
  "windowTalkedSeconds",
  "windowTalkedMinutes",
  "eveningTalkedSeconds",
  "eveningTalkedMinutes",
  "eveningTalkedTimeSeconds",
  "eveningTalkedTimeMinutes",
  "talked1822Seconds",
  "talked1822Minutes",
  "talked18To22Seconds",
  "talked18To22Minutes",
];

const AGENT_REPORT_WINDOW_CLERICAL_KEYS = [
  "windowClericalSeconds",
  "windowClericalMinutes",
  "eveningClericalSeconds",
  "eveningClericalMinutes",
  "eveningClericalTimeSeconds",
  "eveningClericalTimeMinutes",
  "clerical1822Seconds",
  "clerical1822Minutes",
  "clerical18To22Seconds",
  "clerical18To22Minutes",
];

function summarizeAgentReportRows(rows: CrmAgentReportRow[]): AgentReportSummary {
  return rows.reduce<AgentReportSummary>(
    (summary, row) => ({
      loggedSeconds: summary.loggedSeconds + getAgentReportLoggedSeconds(row),
      pauseSeconds: summary.pauseSeconds + getAgentReportPauseSeconds(row),
      talkedSeconds: summary.talkedSeconds + getAgentReportTalkedSeconds(row),
      clericalSeconds: summary.clericalSeconds + getAgentReportClericalSeconds(row),
      eveningLoggedSeconds: summary.eveningLoggedSeconds + getAgentReportWindowLoggedSeconds(row),
      eveningPauseSeconds: summary.eveningPauseSeconds + getAgentReportWindowPauseSeconds(row),
      eveningTalkedSeconds: summary.eveningTalkedSeconds + getAgentReportWindowTalkedSeconds(row),
      eveningClericalSeconds: summary.eveningClericalSeconds + getAgentReportWindowClericalSeconds(row),
      outsideLoggedSeconds: summary.outsideLoggedSeconds + getAgentReportOutsideLoggedSeconds(row),
      outsidePauseSeconds: summary.outsidePauseSeconds + getAgentReportOutsidePauseSeconds(row),
      outsideTalkedSeconds: summary.outsideTalkedSeconds + getAgentReportOutsideTalkedSeconds(row),
      outsideClericalSeconds: summary.outsideClericalSeconds + getAgentReportOutsideClericalSeconds(row),
    }),
    {
      loggedSeconds: 0,
      pauseSeconds: 0,
      talkedSeconds: 0,
      clericalSeconds: 0,
      eveningLoggedSeconds: 0,
      eveningPauseSeconds: 0,
      eveningTalkedSeconds: 0,
      eveningClericalSeconds: 0,
      outsideLoggedSeconds: 0,
      outsidePauseSeconds: 0,
      outsideTalkedSeconds: 0,
      outsideClericalSeconds: 0,
    },
  );
}

function sortAgentReportRows(rows: CrmAgentReportRow[]) {
  return [...rows].sort((left, right) => {
    const dateDiff = getAgentReportDayTime(right) - getAgentReportDayTime(left);
    if (dateDiff) {
      return dateDiff;
    }

    return formatAgentReportAgent(left).localeCompare(formatAgentReportAgent(right), undefined, {
      sensitivity: "base",
    });
  });
}

function getAgentReportDayTime(row: CrmAgentReportRow) {
  const value = getAgentReportDayValue(row);
  if (!value) {
    return 0;
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatAgentReportDay(row: CrmAgentReportRow) {
  const value = getAgentReportDayValue(row);
  if (!value) {
    return "";
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  }

  return formatDate(value) || value;
}

function getAgentReportDayValue(row: {
  day?: string | null;
  date?: string | null;
  reportDate?: string | null;
}) {
  return firstNonEmpty(row.day, row.date, row.reportDate);
}

function formatAgentReportAgent(row: {
  agentId?: string | number | null;
  agentName?: string | null;
}) {
  const name = getReadableAgentName(row.agentName);
  if (name) {
    return name;
  }

  const agentId = parseAgentId(row.agentId);
  return agentId ? String(agentId) : String(row.agentId || "").trim();
}

function getAgentReportRowKey(row: CrmAgentReportRow) {
  return `${getAgentReportDayValue(row) || "day"}-${formatAgentReportAgent(row) || "agent"}`;
}

function getAgentReportLoggedSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_LOGGED_KEYS);
}

function getAgentReportPauseSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_PAUSE_KEYS);
}

function getAgentReportTalkedSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_TALKED_KEYS);
}

function getAgentReportClericalSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_CLERICAL_KEYS);
}

function getAgentReportWindowLoggedSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_WINDOW_LOGGED_KEYS);
}

function getAgentReportWindowPauseSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_WINDOW_PAUSE_KEYS);
}

function getAgentReportWindowTalkedSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_WINDOW_TALKED_KEYS);
}

function getAgentReportWindowClericalSeconds(row: CrmAgentReportRow) {
  return getAgentReportSeconds(row, AGENT_REPORT_WINDOW_CLERICAL_KEYS);
}

function getAgentReportOutsideLoggedSeconds(row: CrmAgentReportRow) {
  return getAgentReportOutsideSeconds(getAgentReportLoggedSeconds(row), getAgentReportWindowLoggedSeconds(row));
}

function getAgentReportOutsidePauseSeconds(row: CrmAgentReportRow) {
  return getAgentReportOutsideSeconds(getAgentReportPauseSeconds(row), getAgentReportWindowPauseSeconds(row));
}

function getAgentReportOutsideTalkedSeconds(row: CrmAgentReportRow) {
  return getAgentReportOutsideSeconds(getAgentReportTalkedSeconds(row), getAgentReportWindowTalkedSeconds(row));
}

function getAgentReportOutsideClericalSeconds(row: CrmAgentReportRow) {
  return getAgentReportOutsideSeconds(getAgentReportClericalSeconds(row), getAgentReportWindowClericalSeconds(row));
}

function getAgentReportOutsideSeconds(totalSeconds: number, windowSeconds: number) {
  return Math.max(0, totalSeconds - windowSeconds);
}

function getAgentReportSeconds(row: CrmAgentReportRow, keys: string[]) {
  for (const key of keys) {
    const value = readAgentReportField(row, key);
    const seconds = coerceReportDurationSeconds(value, key);
    if (seconds !== null) {
      return seconds;
    }
  }

  return 0;
}

function readAgentReportField(row: CrmAgentReportRow, key: string) {
  const fields = row as Record<string, unknown>;
  if (fields[key] !== undefined && fields[key] !== null) {
    return fields[key];
  }

  const loweredKey = key.toLowerCase();
  const matchingEntry = Object.entries(fields).find(([fieldKey]) => fieldKey.toLowerCase() === loweredKey);
  return matchingEntry ? matchingEntry[1] : undefined;
}

function coerceReportDurationSeconds(value: unknown, keyHint = ""): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    return keyHint.toLowerCase().includes("minute") ? value * 60 : value;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    return keyHint.toLowerCase().includes("minute") ? numeric * 60 : numeric;
  }

  const colonParts = text.split(":").map((part) => Number(part));
  if (colonParts.length === 2 && colonParts.every((part) => Number.isFinite(part))) {
    return colonParts[0] * 3600 + colonParts[1] * 60;
  }
  if (colonParts.length === 3 && colonParts.every((part) => Number.isFinite(part))) {
    return colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
  }

  const hours = Number(text.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+(?:\.\d+)?)\s*m/i)?.[1] || 0);
  const seconds = Number(text.match(/(\d+(?:\.\d+)?)\s*s/i)?.[1] || 0);
  if (hours || minutes || seconds) {
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

function coerceReportNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const numeric = Number(String(value).trim().replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function getAgentReportPaymentDurationSeconds(
  paymentSummary: CrmAgentReportPaymentSummary | null,
  keys: string[],
) {
  if (!paymentSummary) {
    return null;
  }

  for (const key of keys) {
    const value = readAgentReportPaymentField(paymentSummary, key);
    const seconds = coerceReportDurationSeconds(value, key);
    if (seconds !== null) {
      return seconds;
    }
  }

  return null;
}

function getAgentReportPaymentRateEur(paymentSummary: CrmAgentReportPaymentSummary | null) {
  if (!paymentSummary) {
    return null;
  }

  return coerceReportNumber(readAgentReportPaymentField(paymentSummary, "hourlyRateEur"));
}

function getAgentReportPaymentAmountEur(paymentSummary: CrmAgentReportPaymentSummary | null) {
  if (!paymentSummary) {
    return null;
  }

  return coerceReportNumber(readAgentReportPaymentField(paymentSummary, "amountEur"));
}

function readAgentReportPaymentField(paymentSummary: CrmAgentReportPaymentSummary, key: string) {
  const fields = paymentSummary as Record<string, unknown>;
  if (fields[key] !== undefined && fields[key] !== null) {
    return fields[key];
  }

  const loweredKey = key.toLowerCase();
  const matchingEntry = Object.entries(fields).find(([fieldKey]) => fieldKey.toLowerCase() === loweredKey);
  return matchingEntry ? matchingEntry[1] : undefined;
}

function formatAgentReportApprovedPauseSummary(paymentWeeks: CrmAgentReportPaymentSummary["weeks"] | undefined) {
  if (paymentWeeks?.length) {
    const items = paymentWeeks
      .map((week) => {
        const hours =
          coerceReportNumber(week.approvedPauseHours) ??
          secondsToHours(coerceReportDurationSeconds(week.approvedPauseSeconds, "seconds"));
        if (hours === null || hours <= 0) {
          return null;
        }

        const start = firstNonEmpty(week.weekStart, week.start);
        const end = firstNonEmpty(week.weekEnd, week.end);
        const label =
          (start && end ? formatAgentReportWeekLabel(start, end) : "") ||
          firstNonEmpty(week.label, week.weekLabel) ||
          start ||
          "";

        return `${formatAgentReportApprovedHours(hours)} for week ${label || "selected"}`;
      })
      .filter((item): item is string => Boolean(item));

    return items.length ? items.join("; ") : "0h";
  }

  return "0h";
}

function secondsToHours(value: number | null) {
  return value === null ? null : value / 3600;
}

function formatAgentReportApprovedHours(value: number) {
  const hours = Number.isInteger(value) ? String(value) : value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  return `${hours}h`;
}

function formatAgentReportHourlyRate(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

type AgentReportPauseBreakdownMode = "total" | "window" | "outside";

function getAgentReportPauseBreakdown(
  row: CrmAgentReportRow,
  pauseRows: CrmAgentReportPauseBreakdownRow[],
  mode: AgentReportPauseBreakdownMode,
): AgentReportPauseBreakdownItem[] {
  if (mode === "outside") {
    return subtractAgentReportPauseBreakdowns(
      getAgentReportPauseBreakdown(row, pauseRows, "total"),
      getAgentReportPauseBreakdown(row, pauseRows, "window"),
    );
  }

  const pauseRowsBreakdown = getAgentReportPauseRowsBreakdown(row, pauseRows, mode);
  if (pauseRowsBreakdown.length) {
    return pauseRowsBreakdown;
  }

  const keys = mode === "window"
    ? ["eveningPauseBreakdown", "eveningPausesByType", "pauseBreakdown1822"]
    : ["pauseBreakdown", "pausesByType", "pauseTypes"];

  for (const key of keys) {
    const breakdown = normalizeAgentReportPauseBreakdown(readAgentReportField(row, key));
    if (breakdown.length) {
      return breakdown;
    }
  }

  const totalSeconds = mode === "window" ? getAgentReportWindowPauseSeconds(row) : getAgentReportPauseSeconds(row);

  return totalSeconds > 0 ? [{ pauseType: "Total", seconds: totalSeconds }] : [];
}

function getAgentReportPauseRowsBreakdown(
  row: CrmAgentReportRow,
  pauseRows: CrmAgentReportPauseBreakdownRow[],
  mode: Exclude<AgentReportPauseBreakdownMode, "outside">,
) {
  const items = pauseRows
    .filter((pauseRow) => agentReportPauseRowMatches(row, pauseRow))
    .map((pauseRow) => {
      const pauseType = firstNonEmpty(pauseRow.pauseType, pauseRow.type, pauseRow.label) || "Fara tip";
      const seconds = mode === "window" ? getPauseItemWindowSeconds(pauseRow) : getPauseItemSeconds(pauseRow);
      return seconds !== null && seconds > 0 ? { pauseType, seconds } : null;
    })
    .filter((item): item is { pauseType: string; seconds: number } => Boolean(item));

  return items.sort((left, right) => left.pauseType.localeCompare(right.pauseType, undefined, { sensitivity: "base" }));
}

function subtractAgentReportPauseBreakdowns(
  totalItems: AgentReportPauseBreakdownItem[],
  windowItems: AgentReportPauseBreakdownItem[],
) {
  const byType = new Map<string, AgentReportPauseBreakdownItem>();

  for (const item of totalItems) {
    const key = normalizePauseBreakdownTypeKey(item.pauseType);
    const existing = byType.get(key);
    if (existing) {
      existing.seconds += item.seconds;
    } else {
      byType.set(key, { pauseType: item.pauseType, seconds: item.seconds });
    }
  }

  for (const item of windowItems) {
    const key = normalizePauseBreakdownTypeKey(item.pauseType);
    const existing = byType.get(key);
    if (existing) {
      existing.seconds -= item.seconds;
    }
  }

  return Array.from(byType.values())
    .map((item) => ({ ...item, seconds: Math.max(0, item.seconds) }))
    .filter((item) => item.seconds > 0)
    .sort((left, right) => left.pauseType.localeCompare(right.pauseType, undefined, { sensitivity: "base" }));
}

function normalizePauseBreakdownTypeKey(value: string) {
  return value.trim().toLowerCase() || "fara tip";
}

function agentReportPauseRowMatches(row: CrmAgentReportRow, pauseRow: CrmAgentReportPauseBreakdownRow) {
  const rowDay = normalizeAgentReportDayKey(getAgentReportDayValue(row));
  const pauseDay = normalizeAgentReportDayKey(getAgentReportDayValue(pauseRow));
  if (rowDay && pauseDay && rowDay !== pauseDay) {
    return false;
  }

  const rowAgentId = parseAgentId(row.agentId);
  const pauseAgentId = parseAgentId(pauseRow.agentId);
  if (rowAgentId && pauseAgentId) {
    return rowAgentId === pauseAgentId;
  }

  const rowAgentName = formatAgentReportAgent(row).toLowerCase();
  const pauseAgentName = formatAgentReportAgent(pauseRow).toLowerCase();
  if (rowAgentName && pauseAgentName) {
    return rowAgentName === pauseAgentName;
  }

  return Boolean(rowDay && pauseDay);
}

function normalizeAgentReportDayKey(value: string) {
  if (!value) {
    return "";
  }

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.trim().toLowerCase();
  }

  return date.toISOString().slice(0, 10);
}

function normalizeAgentReportPauseBreakdown(value: unknown) {
  const rows: Array<{ pauseType: string; seconds: number }> = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeAgentReportPauseItem(item);
      if (normalized) {
        rows.push(normalized);
      }
    }
  } else if (value && typeof value === "object") {
    for (const [pauseType, durationValue] of Object.entries(value as Record<string, unknown>)) {
      const seconds =
        durationValue && typeof durationValue === "object"
          ? getPauseItemSeconds(durationValue as CrmAgentReportPauseBreakdownRow)
          : coerceReportDurationSeconds(durationValue, pauseType);
      if (seconds !== null && seconds > 0) {
        rows.push({ pauseType: pauseType || "Fara tip", seconds });
      }
    }
  }

  return rows.sort((left, right) => left.pauseType.localeCompare(right.pauseType, undefined, { sensitivity: "base" }));
}

function normalizeAgentReportPauseItem(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as CrmAgentReportPauseBreakdownRow;
  const pauseType = firstNonEmpty(item.pauseType, item.type, item.label) || "Fara tip";
  const seconds = getPauseItemSeconds(item);

  return seconds !== null && seconds > 0 ? { pauseType, seconds } : null;
}

function getPauseItemSeconds(item: CrmAgentReportPauseBreakdownRow) {
  return (
    coerceReportDurationSeconds(item.pauseSeconds, "seconds") ??
    coerceReportDurationSeconds(item.seconds, "seconds") ??
    coerceReportDurationSeconds(item.durationSeconds, "seconds") ??
    coerceReportDurationSeconds(item.pauseMinutes, "minutes") ??
    coerceReportDurationSeconds(item.minutes, "minutes") ??
    coerceReportDurationSeconds(item.durationMinutes, "minutes") ??
    coerceReportDurationSeconds(item.duration, "duration")
  );
}

function getPauseItemWindowSeconds(item: CrmAgentReportPauseBreakdownRow) {
  return (
    coerceReportDurationSeconds(item.windowPauseSeconds, "seconds") ??
    coerceReportDurationSeconds(item.pauseWindowSeconds, "seconds") ??
    coerceReportDurationSeconds(item.pause1822Seconds, "seconds") ??
    coerceReportDurationSeconds(item.pause18To22Seconds, "seconds") ??
    coerceReportDurationSeconds(item.eveningPauseSeconds, "seconds") ??
    coerceReportDurationSeconds(item.windowPauseMinutes, "minutes") ??
    coerceReportDurationSeconds(item.pauseWindowMinutes, "minutes") ??
    coerceReportDurationSeconds(item.pause1822Minutes, "minutes") ??
    coerceReportDurationSeconds(item.pause18To22Minutes, "minutes") ??
    coerceReportDurationSeconds(item.eveningPauseMinutes, "minutes")
  );
}

function formatDurationHhMmSs(value: number) {
  const totalSeconds = Math.max(0, Math.round(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatEuroAmount(value: number) {
  return `${value.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Euro`;
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
