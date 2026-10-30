import type { ScheduledCallRow } from "./crmAdmin";
import { API_BASE_URL } from "./auth";
export type RecordKind="customers"|"leads";
export type CustomerScope="inbound"|"all";
export type CustomerFilters={name:string;phone:string;email:string};
export type CustomerRow={
  contactId:string;name:string;phone:string|null;email:string|null;createdAtUtc:string|null;
  lastInbound:{channel:"email"|"whatsapp"|"call";atUtc:string;source:string|null;text:string|null}|null;
  booking:ScheduledCallRow|null;
  actionContactId?:string|null;intentStatus?:string|null;
  firstCallAtUtc:string|null;lastCallAtUtc:string|null;callCount:number|null;
  firstCallCode:string|number|null;lastCallCode:string|number|null;
  lastWhatsApp:{atUtc:string;direction:"inbound"|"outbound";source:string|null;text:string}|null;
};
export type CustomerPage={scope:CustomerScope;rows:CustomerRow[];total:number;limit:number;offset:number;warnings?:string[]};
export const CUSTOMER_PAGE_SIZE=50;
export function customerPageQuery(scope:CustomerScope,filters:CustomerFilters,page:number) {
  if(!Number.isInteger(page)||page<0)throw new Error("Invalid customer page.");
  return new URLSearchParams({scope,name:filters.name.trim(),phone:filters.phone.trim(),email:filters.email.trim(),limit:String(CUSTOMER_PAGE_SIZE),offset:String(page*CUSTOMER_PAGE_SIZE)});
}
export async function loadCustomerPage(token:string,scope:CustomerScope,filters:CustomerFilters,page:number,signal:AbortSignal,kind:RecordKind="customers"):Promise<CustomerPage> {
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/${kind==="leads"?"leads-view":"customers"}?${customerPageQuery(scope,filters,page)}`,{headers:{Authorization:`Bearer ${token}`},signal});
  if(response.status===404||response.status===501)throw new Error("The CRM data service is not available yet. Please try again after deployment.");
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||"Unable to load CRM records.");
  if(data.scope!==scope||data.limit!==CUSTOMER_PAGE_SIZE||data.offset!==page*CUSTOMER_PAGE_SIZE||!Array.isArray(data.rows)||data.rows.length>CUSTOMER_PAGE_SIZE||!Number.isInteger(data.total)||data.total<0)
    throw new Error("The CRM response could not be verified. Please refresh.");
  return data;
}

export type ContactAction="reply"|"solve"|"asap";
export type ContactActionResult={success:boolean;action:ContactAction;contactId:string;solved:boolean;whatsAppQueued?:boolean;messageId?:string|null;replayed?:boolean;intentId?:string|null;dialler?:{attempted:boolean;success:boolean;error?:string|null}|null};
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
 if(result.action==="reply")return "WhatsApp reply queued. Lead marked solved.";
 if(result.action==="solve")return "Lead marked solved.";
 return result.dialler?.success?"Lead scheduled as ASAP / SimulatorPensie.":"ASAP / SimulatorPensie intent created. Dialler enrollment is not confirmed; check the lead details.";
}
