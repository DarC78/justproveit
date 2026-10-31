import type { CrmLead, CrmLeadIntentResponse, CrmLeadIntentRow } from "./crmAdmin";

export function dispatchPhone(value: string) {
  const trimmed=value.trim();
  if(!/^[+\d\s().-]+$/.test(trimmed)) return "";
  let digits=trimmed.replace(/\D/g, "");
  if(digits.startsWith("00")) digits=digits.slice(2);
  if(digits.length===11 && digits.startsWith("0")) digits=`44${digits.slice(1)}`;
  return /^\d{8,15}$/.test(digits)?digits:"";
}

export function dispatchPhoneFromQuery(query: Record<string, string | string[] | undefined>) {
  for (const key of ['phone_leads', 'phone_dnis', 'phone_ani', 'phone']) {
    const value=query[key];
    // Repeated parameters are ambiguous; only accept a single value per key.
    const phone=typeof value==='string'?dispatchPhone(value):'';
    if(phone) return phone;
  }
  return '';
}

function matchesPhone(lead: CrmLead | null | undefined, phone: string) {
  return [lead?.normalizedPhone,lead?.phoneNumber,...(lead?.phones||[]).flatMap(p=>[p.normalizedPhone,p.phone])]
    .some(value=>value && dispatchPhone(value)===phone);
}
const key=(value?: string|null)=>String(value||"").toLowerCase().replace(/[^a-z0-9]/g, "");
export function qualifyingDispatchIntent(row: CrmLeadIntentRow, now: number) {
  const created=Date.parse(row.createdAtUtc||"");
  return Number.isFinite(created) && created>=now-30*86400000 && created<=now
    && (key(row.interestType)==="manualbook" || ["simulatorpensie","simulatorpensii","simularepensii","simularepensie"]
      .includes(key(row.serviceKey)));
}
export function calculatorDispatchUrl(lead: CrmLead | null, phone: string) {
  const query=new URLSearchParams({name:lead?.fullName||"",email:lead?.email||lead?.secondaryemail||"",phone});
  return `/ro/calculator-varsta-pensionare?${query}`;
}

export async function resolveCrmDispatch(phone: string, deps: {
  findLead: (phone: string)=>Promise<{lead: CrmLead|null}>;
  listIntents: (params: Record<string,string|number|boolean>)=>Promise<CrmLeadIntentResponse>;
  now?: number;
}) {
  const normalized=dispatchPhone(phone);
  if(!normalized) throw new Error("Numar de telefon invalid.");
  const {lead:found}=await deps.findLead(normalized);
  // Never trust a suffix-only phone match to identify a person.
  let lead=matchesPhone(found,normalized)?found:null;
  const now=deps.now??Date.now();
  let automatic=false;
  const extraServices=new Set<string>();
  async function load(closed: boolean, service="all") {
    let offset=0;
    while(true) {
      const response=await deps.listIntents({phone:normalized,createdLastDays:30,statusBucket:"both",toBeContacted:"oricand",
        intent:"all",service,language:"all",lastCallAgentId:"all",closed,includeReserved:true,limit:300,offset});
      for(const option of response.options?.services||[]) {
        if(["bookcall","inboundsms","missedcall","missedcalls","jobapplications"].includes(key(option.serviceKey))) extraServices.add(option.serviceKey);
      }
      const rows=response.rows||response.items||[];
      for(const row of rows) {
        const sameContact=lead && [row.contactId,row.canonicalContactId,row.lead?.contactId,row.lead?.canonicalContactId]
          .some(id=>id && [lead?.contactId,lead?.canonicalContactId].some(contactId=>contactId?.toLowerCase()===id.toLowerCase()));
        if(!sameContact && !matchesPhone(row.lead,normalized)) continue;
        if(!lead && row.lead) lead=row.lead;
        if(qualifyingDispatchIntent(row,now)) automatic=true;
      }
      offset+=rows.length;
      if(offset>=response.total) break;
      if(!rows.length) throw new Error("Lista de intentii este incompleta. Reincearca.");
    }
  }
  await load(false);await load(true);
  for(const service of extraServices) {await load(false,service);await load(true,service);}
  return {lead,phone:normalized,automatic,url:calculatorDispatchUrl(lead,normalized)};
}
