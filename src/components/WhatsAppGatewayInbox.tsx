import WhatsAppGatewayOperations from './WhatsAppGatewayOperations';
import {useEffect,useRef,useState} from 'react';
import {gatewayCapabilities,gatewayHistory,gatewayInbox,gatewayLink,gatewayTargets,GatewayMessage,GatewayTarget} from '@/lib/whatsappGateway';
import type {PhoneHistoryEvent} from '@/lib/crmAdmin';
import {PhoneHistoryTimeline} from './PhoneHistoryModal';
const message=(error:unknown)=>error instanceof Error?error.message:'Unable to load WhatsApp messages.';
const time=(value:string)=>new Date(value).toLocaleString('en-GB',{timeZone:'Europe/London'});
export function GatewayHistory({token,kind,id,name}:{token:string;kind:'customer'|'contact';id:string;name:string}){
 const[open,setOpen]=useState(false),[events,setEvents]=useState<PhoneHistoryEvent[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(!open)return;let active=true;Promise.resolve().then(()=>{if(!active)return null;setEvents(null);setError('');return gatewayHistory(token,kind,id);}).then(result=>{if(active&&result)setEvents(result.events);}).catch(e=>{if(active)setError(message(e));});return()=>{active=false;};},[token,kind,id,open]);
 return <><button type="button" onClick={()=>setOpen(true)}>WhatsApp history</button>{open&&<dialog open aria-label={`WhatsApp history for ${name}`} style={{position:'fixed',inset:'8%',zIndex:60,overflow:'auto',padding:24,border:'1px solid #94a3b8',background:'white',maxHeight:'84vh'}}><button type="button" onClick={()=>setOpen(false)}>Close</button><h2>{name} · Self-hosted WhatsApp</h2><p>Received messages · Newest first · UK time · Sending disabled</p>{error?<p role="alert">{error}</p>:events===null?<p role="status">Loading…</p>:events.length?<PhoneHistoryTimeline events={events}/>:<p>No linked messages.</p>}</dialog>}</>;
}
function ReviewMessage({token,row,onSaved}:{token:string;row:GatewayMessage;onSaved:()=>void}){
 const[query,setQuery]=useState(''),[targets,setTargets]=useState<GatewayTarget[]>([]),[selected,setSelected]=useState<GatewayTarget|null>(null),[reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 // Keep the same request ID on an uncertain retry. A changed action gets a new ID.
 const saving=useRef(false);
 const attempt=useRef<{key:string;id:string}|null>(null);
 async function save(unlink=false){
  if(saving.current||reason.trim().length<3||!unlink&&!selected)return;
  const body={expectedVersion:row.version,targetKind:unlink?null:selected!.kind,targetId:unlink?null:selected!.id,reason:reason.trim()};
  const key=JSON.stringify(body);if(attempt.current?.key!==key)attempt.current={key,id:crypto.randomUUID()};
  saving.current=true;setBusy(true);setError('');try{await gatewayLink(token,row.id,{...body,requestId:attempt.current.id});onSaved();}catch(e){setError(message(e));}finally{saving.current=false;setBusy(false);}
 }
 async function search(){setError('');setSelected(null);setTargets([]);try{setTargets((await gatewayTargets(token,query)).rows);}catch(e){setError(message(e));}}
 return <article style={{border:'1px solid #cbd5e1',borderRadius:8,padding:18,margin:'16px 0'}}>
  <p><strong>{row.phone||'Unresolved WhatsApp identity'}</strong> · {time(row.atUtc)} · {row.state}</p><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{row.text}</p><p>Review reason: {row.reason.replaceAll('_',' ')} · Account: {row.accountId}</p>
  {row.state==='matched'&&<><p>Linked to {row.customerId?'customer':'contact'} {row.customerId||row.contactId}</p><GatewayHistory token={token} kind={row.customerId?'customer':'contact'} id={(row.customerId||row.contactId)!} name="Linked record"/></>}
  {row.state!=='ignored'&&<fieldset disabled={busy}><legend>Confirm the existing CRM record</legend><p>Search by name, email or phone. Check the record before linking. A link changes only this message’s history.</p>
   <label>Search <input value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);setTargets([]);}}/></label><button type="button" disabled={query.trim().length<2} onClick={search}>Find records</button>
   {targets.map(target=><label key={target.kind+target.id} style={{display:'block',padding:6}}><input type="radio" name={'target-'+row.id} checked={selected?.id===target.id&&selected.kind===target.kind} onChange={()=>setSelected(target)}/>{target.name} · {target.kind} · {target.email||'no email'} · {target.phone||'no phone'} · {target.id}</label>)}
   <label style={{display:'block'}}>Verification note <input maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="How did you verify this person?"/></label>
   {selected&&<p>Confirm: this message belongs to {selected.name} ({selected.kind}, {selected.id}).</p>}
   <button type="button" disabled={!selected||reason.trim().length<3} onClick={()=>save()}>Confirm link to selected record</button>{row.state==='matched'&&<button type="button" disabled={reason.trim().length<3} onClick={()=>save(true)}>Unlink and return to review</button>}
  </fieldset>}{busy&&<p role="status">Saving…</p>}{error&&<p role="alert">{error} Refresh the inbox if the record changed.</p>}
 </article>;
}
export default function WhatsAppGatewayInbox({token}:{token:string}){
 const[enabled,setEnabled]=useState<boolean|null>(null),[scope,setScope]=useState(''),[state,setState]=useState('review'),[offset,setOffset]=useState(0),[rows,setRows]=useState<GatewayMessage[]>([]),[total,setTotal]=useState(0),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;gatewayCapabilities(token).then(result=>{if(active){setEnabled(result.enabled);setScope(result.environment||'');if(!result.enabled)setLoading(false);}}).catch(e=>{if(active){setError(message(e));setLoading(false);}});return()=>{active=false;};},[token]);
 useEffect(()=>{if(!enabled)return;let active=true;Promise.resolve().then(()=>{if(!active)return null;setLoading(true);setError('');return gatewayInbox(token,state,offset);}).then(result=>{if(active&&result){setRows(result.rows);setTotal(result.total);}}).catch(e=>{if(active)setError(message(e));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[token,enabled,state,offset,revision]);
 return <section style={{maxWidth:1100,margin:'24px auto'}}><h1>WhatsApp inbox{scope==='test'?' · Test CRM':''}</h1><p>Received messages from the paired gateway account. Gateway sending and automatic replies are disabled. Receiving or linking a message does not advance service stages or trigger tasks.</p>
  {enabled&&<WhatsAppGatewayOperations token={token}/>}
  {enabled===false&&<p>This CRM has not enabled the self-hosted WhatsApp inbox.</p>}{enabled&&<><label>Show <select value={state} onChange={e=>{setState(e.target.value);setOffset(0);setRows([]);}}><option value="review">Needs review</option><option value="matched">Linked to CRM</option></select></label> <button type="button" onClick={()=>setRevision(n=>n+1)} disabled={loading}>Refresh inbox</button></>}
  {loading&&<p role="status">Loading…</p>}{error&&<p role="alert">{error}</p>}{enabled&&!loading&&!error&&<><p>{total} messages · UK time</p>{rows.map(row=><ReviewMessage key={row.id+':'+row.version} token={token} row={row} onSaved={()=>setRevision(n=>n+1)}/>)}{!rows.length&&<p>No messages in this view.</p>}<button type="button" disabled={offset===0} onClick={()=>setOffset(n=>Math.max(0,n-50))}>Previous</button><button type="button" disabled={offset+50>=total} onClick={()=>setOffset(n=>n+50)}>Next</button></>}
 </section>;
}
