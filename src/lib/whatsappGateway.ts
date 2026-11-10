import {fetchJson} from './auth';
import type {PhoneHistoryEvent} from './crmAdmin';
export type GatewayMessage={id:string;accountId:string;atUtc:string;text:string;messageType:string;state:'review'|'matched'|'ignored';reason:string;phone:string|null;contactId:string|null;customerId:string|null;version:number};
export type GatewayTarget={kind:'contact'|'customer';id:string;name:string;email?:string|null;phone?:string|null};
const base='/justproveit/admin/crm/whatsapp-gateway';
function request<T>(token:string,path:string,init:RequestInit={}){return fetchJson<T>(`${base}${path}`,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},cache:'no-store'});}
export const gatewayCapabilities=(token:string)=>request<{enabled:boolean;environment?:string;sendingEnabled?:boolean;automaticReplies?:boolean}>(token,'/capabilities');
export const gatewayInbox=(token:string,state:string,offset=0)=>request<{rows:GatewayMessage[];total:number}>(token,`/inbox?state=${encodeURIComponent(state)}&offset=${offset}`);
export const gatewayTargets=(token:string,query:string)=>request<{rows:GatewayTarget[]}>(token,`/targets?q=${encodeURIComponent(query)}`);
export const gatewayHistory=(token:string,kind:'contact'|'customer',id:string)=>request<{targetKind:'contact'|'customer';targetId:string;phone?:string|null;events:PhoneHistoryEvent[]}>(token,`/history/${kind}/${encodeURIComponent(id)}`);
export const gatewayLink=(token:string,id:string,body:{requestId:string;expectedVersion:number;targetKind:'contact'|'customer'|null;targetId:string|null;reason:string})=>request<GatewayMessage>(token,`/inbox/${encodeURIComponent(id)}/link`,{method:'POST',body:JSON.stringify(body)});

export const gatewaySummaries=(token:string,items:Array<{kind:'contact'|'customer';id:string}>,signal?:AbortSignal)=>request<{summaries:Record<string,Extract<PhoneHistoryEvent,{kind:'whatsapp'}>|null>}>(token,'/summaries',{method:'POST',body:JSON.stringify({items}),signal});
export type GatewayOperations={status:null|{connection:string;unknown_outcomes:number;callback_pending:number;callback_failures:number;observed_at:string;backup:{state:'ok'|'failed'|'never';last_verified_at:string|null}};receivedAtUtc:string|null;alerts:Array<{code:string;severity:'warning'|'critical';message:string}>};
export const gatewayOperations=(token:string)=>request<GatewayOperations>(token,'/operations');
export const gatewayCalls=(token:string)=>request<{rows:PhoneHistoryEvent[];coverage:string}>(token,'/calls');
