import {useEffect,useState} from 'react';
import {API_BASE_URL} from './auth';
export type NoteTarget={id:string;kind:'contact'|'customer'};
export type LeadNoteSummary={nextActionDate:string|null;noteCount:number};
export const noteTargetKey=(target:NoteTarget)=>target.kind+':'+target.id.toLowerCase();
export function useLeadNoteSummaries(token:string,targets:NoteTarget[]){
 const key=JSON.stringify([...new Map(targets.map(t=>[noteTargetKey(t),t])).values()]);
 const [summaries,setSummaries]=useState<Record<string,LeadNoteSummary>>({}),[revision,setRevision]=useState(0),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController(),items=JSON.parse(key) as NoteTarget[];
  if(!items.length)return()=>controller.abort();
  const base=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL).replace(/\/+$/,'');
  Promise.resolve().then(async()=>{if(controller.signal.aborted)return;setError('');try{const combined:Record<string,LeadNoteSummary>={};for(let offset=0;offset<items.length;offset+=200){if(controller.signal.aborted)return;const r=await fetch(base+'/justproveit/admin/crm/contacts/internal-summaries',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({items:items.slice(offset,offset+200)}),cache:'no-store',signal:controller.signal}),data=await r.json();if(!r.ok||!data.summaries||typeof data.summaries!=='object')throw Error(data.error?.message||'Nu am putut încărca datele următoarelor acțiuni.');Object.assign(combined,data.summaries);}if(!controller.signal.aborted)setSummaries(combined);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Datele comentariilor sunt indisponibile.');}});
  return()=>controller.abort();
 },[token,key,revision]);
 return {summaries,error,refresh:()=>setRevision(n=>n+1)};
}
