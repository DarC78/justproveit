import type { ScheduledCallRow } from "./crmAdmin";
import {gatewaySummaries} from "./whatsappGateway";
import {mergeGatewaySummary} from "./whatsappGatewayMerge";
import { API_BASE_URL } from "./auth";
export type RecordKind="customers"|"leads";
export type CustomerScope="inbound"|"all";
export type CustomerFilters={name:string;phone:string;email:string;service?:string;status?:string;inboundDays?:number;customerFrom?:string;customerTo?:string};
export type CustomerRow={
  contactId:string;name:string;phone:string|null;email:string|null;createdAtUtc:string|null;
  agentHistory?:{lastBeforePurchase:{agentId:number;name:string;atUtc:string;endedAtUtc:string}|null;recentAgents:Array<{agentId:number;name:string;lastSpokeAtUtc:string}>};
  lastInbound:{channel:"email"|"whatsapp"|"call";atUtc:string;source:string|null;text:string|null}|null;
  booking:ScheduledCallRow|null;
  actionContactId?:string|null;intentStatus?:string|null;
  firstCallAtUtc:string|null;lastCallAtUtc:string|null;callCount:number|null;
  firstCallCode:string|number|null;lastCallCode:string|number|null;
  lastWhatsApp:{atUtc:string;direction:"inbound"|"outbound";source:string|null;text:string}|null;
};
export type CustomerPage={scope:CustomerScope;rows:CustomerRow[];total:number;limit:number;offset:number;warnings?:string[];services?:Array<{value:string;label:string}>;statuses?:Array<{value:string;label:string}>};
export const CUSTOMER_PAGE_SIZE=50;
export function customerPageQuery(scope:CustomerScope,filters:CustomerFilters,page:number,pageSize=CUSTOMER_PAGE_SIZE) {
  if(!Number.isInteger(page)||page<0)throw new Error("Invalid customer page.");
  const dates:Record<string,string>={};
  for(const field of ['customerFrom','customerTo'] as const)if(filters[field])dates[field]=filters[field]!;
  if(filters.customerFrom&&filters.customerTo&&filters.customerFrom>filters.customerTo)throw new Error('Customer date From must be on or before To.');
  return new URLSearchParams({...dates,...(filters.service!==undefined?{service:filters.service,status:filters.status||''}:{}),...(filters.inboundDays?{inboundDays:String(filters.inboundDays)}:{}),scope,name:filters.name.trim(),phone:filters.phone.trim(),email:filters.email.trim(),limit:String(pageSize),offset:String(page*pageSize)});
}
export async function loadCustomerPage(token:string,scope:CustomerScope,filters:CustomerFilters,page:number,signal:AbortSignal,kind:RecordKind="customers",pageSize=CUSTOMER_PAGE_SIZE):Promise<CustomerPage> {
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/${kind==="leads"?"leads-view":"customers"}?${customerPageQuery(scope,filters,page,pageSize)}`,{headers:{Authorization:`Bearer ${token}`},signal});
  if(response.status===404||response.status===501)throw new Error("The CRM data service is not available yet. Please try again after deployment.");
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||"Unable to load CRM records.");
  if(data.scope!==scope||data.limit!==pageSize||data.offset!==page*pageSize||!Array.isArray(data.rows)||data.rows.length>pageSize||!Number.isInteger(data.total)||data.total<0)
    throw new Error("The CRM response could not be verified. Please refresh.");
  if(process.env.NEXT_PUBLIC_WHATSAPP_GATEWAY_CRM==='true'&&data.rows.length){
    const targetKind=kind==='leads'?'contact':'customer';
    const result=await gatewaySummaries(token,data.rows.map((row:CustomerRow)=>({kind:targetKind,id:row.contactId})),signal);
    data.rows=data.rows.map((row:CustomerRow)=>mergeGatewaySummary(row,result.summaries[targetKind+':'+row.contactId.toLowerCase()]));
  }
  return data;
}

export type ContactAction="reply"|"solve"|"asap";
export type ContactActionResult={success:boolean;action:ContactAction|'book'|'end';contactId:string;solved:boolean;whatsAppQueued?:boolean;messageId?:string|null;replayed?:boolean;intentId?:string|null;appointmentAtUtc?:string;mode?:'created'|'rescheduled';dialler?:{attempted:boolean;success:boolean;queued?:boolean;commandId?:string|null;error?:string|null}|null};
export type ContactBookingContext={contactId:string;name:string;phone:string|null;serviceKey:string|null;bookings:Array<{id:string;appointmentAtUtc:string;serviceName:string}>};
export type ContactBookingInput={requestId:string;appointmentDate:string;appointmentTime:string;confirmEarlyAppointment?:boolean;expectedPhone:string;expectedBookingId:string|null;expectedAppointmentAtUtc:string|null};
async function bookingRequest<T>(token:string,contactId:string,payload?:ContactBookingInput):Promise<T>{
 const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
 const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/contacts/${encodeURIComponent(contactId)}/book-call`,{method:payload?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{}),cache:'no-store'});
 const result=await response.json();if(!response.ok)throw Error(result.error?.message||'Programarea nu a putut fi confirmata. Reincercati aceeasi cerere.');return result;
}
export const loadContactBooking=(token:string,contactId:string)=>bookingRequest<ContactBookingContext>(token,contactId);
export async function bookContactCall(token:string,contactId:string,payload:ContactBookingInput){
 const result=await bookingRequest<ContactActionResult>(token,contactId,payload);
 if(!result.success||result.action!=='book'||result.contactId.toLowerCase()!==contactId.toLowerCase()||!result.intentId||!result.appointmentAtUtc)throw Error('Rezultatul programarii nu a putut fi verificat. Reincercati aceeasi cerere.');return result;
}
export async function runContactAction(token:string,contactId:string,action:ContactAction,payload:{requestId:string;text?:string}):Promise<ContactActionResult> {
 const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
 const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/contacts/${encodeURIComponent(contactId)}/actions`,{
  method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({action,...payload})});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error?.message||"Unable to save this action. Retry with the same message to avoid duplicates.");
 if(!data.success||data.action!==action||String(data.contactId).toLowerCase()!==contactId.toLowerCase()||(action!=="asap"&&!data.solved)||(action==="reply"&&!data.whatsAppQueued))
  throw new Error("The action result could not be verified. Refresh before trying again.");
 return data;
}
export function callcodeText(value:string|number|null|undefined) {
 return typeof value==="string"&&value.trim()&&!/^-?\d+$/.test(value.trim())?value:"Unavailable";
}

export function contactActionNotice(result:ContactActionResult) {
 if(result.action==='end')return 'Lead closed. Motivul a fost salvat intern.';
 if(result.action==='book')return `${result.mode==='rescheduled'?'Programare modificata':'Programare creata'}: ${result.appointmentAtUtc?new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'}).format(new Date(result.appointmentAtUtc)):''} (ora UK).`;
 if(result.action==="reply")return "WhatsApp reply queued. Lead marked solved.";
 if(result.action==="solve")return "Lead marked solved.";
 if(result.dialler?.queued)return "ASAP intent created. Dialler enrollment queued; awaiting confirmation.";
 return result.dialler?.success?"Lead scheduled as ASAP / SimulatorPensie.":"ASAP / SimulatorPensie intent created. Dialler enrollment is not confirmed; check the lead details.";
}
