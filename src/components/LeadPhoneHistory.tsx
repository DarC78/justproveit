import {useEffect,useState} from "react";
import {ContactPhoneHistory,getContactPhoneHistory} from "@/lib/crmAdmin";
import {PhoneHistoryTimeline,HistoryPagination} from "./PhoneHistoryModal";
import WhatsAppReplyComposer from "./WhatsAppReplyComposer";

function phoneKey(value:string){let digits=value.replace(/\D/g,"");if(digits.startsWith("00"))digits=digits.slice(2);if(digits.startsWith("0")&&[10,11].includes(digits.length))digits=(digits.length===11?"44":"40")+digits.slice(1);return digits;}

export default function LeadPhoneHistory({token,contactId,phone,name,onReplied,onCollapse}:{token:string;contactId:string;phone:string|null;name:string;onReplied?:()=>void;onCollapse?:()=>void}) {
 const [history,setHistory]=useState<ContactPhoneHistory|null>(null);
 const [page,setPage]=useState(0);
 useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)setPage(0);});return()=>{active=false;};},[contactId,phone]);
 const [loading,setLoading]=useState(!!phone),[error,setError]=useState(""),[revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!phone)return;
  const controller=new AbortController();
  Promise.resolve().then(()=>{
   if(controller.signal.aborted)return null;
   setLoading(true);setError("");
   return getContactPhoneHistory(token,contactId,controller.signal,revision>0,page);
  }).then(result=>{
   if(!result||controller.signal.aborted)return;
   if(result.contactId.toLowerCase()!==contactId.toLowerCase()||phoneKey(result.phone)!==phoneKey(phone)||!Array.isArray(result.events))throw new Error("The history does not match this lead. Refresh the search results.");
   if(!controller.signal.aborted)setHistory(result);
  }).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to load history.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[token,contactId,phone,revision,page]);
 return <section aria-label={`History for ${name||phone||"lead"}`}>
  <header><div><h3>Calls, WhatsApp &amp; email history</h3><p>{name||"Lead"} · {phone||"No phone number recorded"} · Newest first · UK time</p></div>
   <div className="history-controls">
    {phone&&<button type="button" disabled={loading} onClick={()=>setRevision(n=>n+1)}>Refresh history</button>}
    {onCollapse&&<button type="button" onClick={onCollapse}>Restrânge istoricul</button>}
   </div></header>
  {!phone?<><p>Add a phone number to view calls and WhatsApp messages.</p><PhoneHistoryTimeline events={[]} imageTarget={{token,kind:"contact",id:contactId}}/></>:<>
   <WhatsAppReplyComposer key={contactId+phone} token={token} contactId={contactId} phone={phone} onSent={result=>{setRevision(n=>n+1);if(['accepted','sent','delivered','read'].includes(result.status))onReplied?.();}}/>
   <div aria-live="polite" aria-busy={loading}>
    {loading&&<p role="status">Loading history…</p>}
    {error&&<p role="alert">{error}</p>}
    {history&&history.contactId.toLowerCase()===contactId.toLowerCase()&&phoneKey(history.phone)===phoneKey(phone)&&<><p>On this page: {history.whatsAppMessages} WhatsApp messages · {history.calls} calls</p>
     {history.pageSize===25&&<HistoryPagination page={page} hasMore={Boolean(history.hasMore)} loading={loading} onPage={setPage}/>}
     {history.warnings?.map(w=><p role="status" key={w}>{w}</p>)}
     <PhoneHistoryTimeline events={history.events} paged={history.pageSize===25} imageTarget={{token,kind:"contact",id:contactId}}/>
     {history.pageSize===25&&<HistoryPagination page={page} hasMore={Boolean(history.hasMore)} loading={loading} onPage={setPage}/>}</>}
   </div>
  </>}
  <style jsx>{`
   .history-controls{display:flex;flex-wrap:wrap;gap:8px}
   section{max-width:1100px;min-width:0;color:#344054}header{display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:16px}h3{font-size:17px;margin:0 0 6px;color:#17376e}p{font-size:13px;line-height:1.5;margin:8px 0 14px}button{background:white;border:1px solid #cbd5e1;border-radius:5px;padding:8px 12px;color:#143b92;cursor:pointer}button:disabled{opacity:.5}[role=alert]{color:#b42318}
  `}</style>
 </section>;
}
