import {API_BASE_URL} from './auth';
export type WhatsAppDraft={id:string;contactId:string;phone:string;text:string;status:string;error:string|null;contextHash:string;createdAtUtc:string};
export type DraftSendResult={draftId:string;contactId:string;status:string;providerMessageId:string|null;errorCode:string|null;errorMessage:string|null};
async function draftRequest<T>(token:string,path:string,body:unknown,signal?:AbortSignal):Promise<T>{
 const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
 const response=await fetch(`${base.replace(/\/+$/,"")}/justproveit/admin/crm/whatsapp-drafts/${path}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Unable to load or send this draft.');return data;
}
export function listWhatsAppDrafts(token:string,contactIds:string[],signal?:AbortSignal){return draftRequest<{drafts:WhatsAppDraft[]}>(token,'list',{contactIds},signal);}
export function sendWhatsAppDraft(token:string,draft:WhatsAppDraft,text:string){return draftRequest<DraftSendResult>(token,`${encodeURIComponent(draft.id)}/send`,{text});}
