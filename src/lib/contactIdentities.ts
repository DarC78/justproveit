import {API_BASE_URL} from './auth';
export type ContactIdentity={id:string;name:string;phones:string[];emails:string[]};
export type IdentityConflict={current:ContactIdentity;other:ContactIdentity;email:string;phone:string;reviewToken:string};
export type IdentityInput={requestId:string;email:string;phone:string};
export async function contactIdentities(token:string,id:string,input?:IdentityInput&{action:'add'|'unify';otherContactId?:string;reviewToken?:string;confirmSamePerson?:boolean}){
 const r=await fetch(`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/contacts/${encodeURIComponent(id)}/identities`,{method:input?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(input?{'Content-Type':'application/json'}:{})},...(input?{body:JSON.stringify(input)}:{}),cache:'no-store'});
 const data=await r.json();if(r.status===409&&data.action==='conflict'&&String(data.contactId).toLowerCase()===id.toLowerCase()&&Array.isArray(data.conflicts))return data as {action:'conflict';conflicts:IdentityConflict[]};
 if(!r.ok)throw Error(data.error?.message||'Unable to update contact details.');
 if(String(data.contactId||data.id).toLowerCase()!==id.toLowerCase())throw Error('Contact details could not be verified. Refresh before retrying.');
 return data as ContactIdentity&{action?:'added'|'linked';conflicts?:IdentityConflict[]};
}
