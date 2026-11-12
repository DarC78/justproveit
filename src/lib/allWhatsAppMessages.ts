import {API_BASE_URL} from './auth';
import type {PipelineControlView} from './leadPipelineControls';
export type WhatsAppMessageRow=PipelineControlView&{id:string;messageKey:string;contactId:string;name:string;phone:string;email:string|null;atUtc:string;message:string;messageType:string;agent:string|null;source:string;channel?:'mediatel'|'agents'|'sms';pipelineStatus:string;done:{atUtc:string;actor:string|null;messageAtUtc:string;source:string}|null};
export type WhatsAppMessageReport={rows:WhatsAppMessageRow[];total:number;offset:number;limit:number;asOfUtc:string;warnings:string[]};
export type WhatsAppMessageFilters={search:string;from:string;to:string;completion:'all'|'pending'|'done';channel:'all'|'mediatel'|'agents'|'sms';offset:number};
const endpoint=()=>`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/all-messages`;
export async function getAllWhatsAppMessages(token:string,filters:WhatsAppMessageFilters,signal?:AbortSignal):Promise<WhatsAppMessageReport>{
 const query=new URLSearchParams({...filters,offset:String(filters.offset)});
 const response=await fetch(`${endpoint()}?${query}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal});const data=await response.json();
 if(!response.ok)throw Error(data.error?.message||'Unable to load incoming messages.');
 if(!Array.isArray(data.rows)||!Number.isSafeInteger(data.total)||data.total<0||data.offset!==filters.offset||data.limit!==50)throw Error('Invalid message list response.');return data;
}
export async function markWhatsAppMessageDone(token:string,row:Pick<WhatsAppMessageRow,'contactId'|'messageKey'>){
 const response=await fetch(endpoint(),{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:'done',contactId:row.contactId,messageKey:row.messageKey}),cache:'no-store'});const data=await response.json();
 if(!response.ok)throw Error(data.error?.message||'Unable to mark this event done.');
 if(!data.success||String(data.contactId).toLowerCase()!==row.contactId.toLowerCase()||data.messageKey!==row.messageKey||!Number.isFinite(Date.parse(data.done?.atUtc)))throw Error('Event completion could not be verified. Refresh before retrying.');return data;
}
