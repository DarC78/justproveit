import type { ScheduledCallRow } from "./crmAdmin";
import { API_BASE_URL } from "./auth";
export type CustomerScope="inbound"|"all";
export type CustomerFilters={name:string;phone:string;email:string};
export type CustomerRow={
  contactId:string;name:string;phone:string|null;email:string|null;createdAtUtc:string|null;
  lastInbound:{channel:"email"|"whatsapp"|"call";atUtc:string;source:string|null;text:string|null}|null;
  booking:ScheduledCallRow|null;
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
export async function loadCustomerPage(token:string,scope:CustomerScope,filters:CustomerFilters,page:number,signal:AbortSignal):Promise<CustomerPage> {
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/customers?${customerPageQuery(scope,filters,page)}`,{headers:{Authorization:`Bearer ${token}`},signal});
  if(response.status===404||response.status===501)throw new Error("The customer data service is not available yet. This view requires the customer inbox API.");
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||"Unable to load customers.");
  if(data.scope!==scope||data.limit!==CUSTOMER_PAGE_SIZE||data.offset!==page*CUSTOMER_PAGE_SIZE||!Array.isArray(data.rows)||data.rows.length>CUSTOMER_PAGE_SIZE||!Number.isInteger(data.total)||data.total<0)
    throw new Error("The customer response could not be verified. Please refresh.");
  return data;
}
