import {useEffect,useRef,useState} from 'react';
import {getCallsToListen,getCallListeningAudio,setCallListeningLabel,type CallsToListenReport} from '@/lib/crmAdmin';
import {CallTranscriptRow} from './PhoneHistoryModal';
import LeadPhoneHistory from './LeadPhoneHistory';
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string|null)=>value&&Number.isFinite(Date.parse(value))?clock.format(new Date(value))+' UK':'Time unavailable';
export function ListeningAudio({token,contactId,callId,recordingId}:{token:string;contactId:string;callId:string;recordingId:number}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const controller=useRef<AbortController|null>(null),objectUrl=useRef('');
 useEffect(()=>{setUrl('');setError('');setBusy(false);return()=>{controller.current?.abort();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current='';};},[token,contactId,callId,recordingId]);
 async function load(){controller.current?.abort();const request=new AbortController();controller.current=request;setBusy(true);setError('');try{const blob=await getCallListeningAudio(token,contactId,callId,recordingId,request.signal);if(request.signal.aborted)return;objectUrl.current=URL.createObjectURL(blob);setUrl(objectUrl.current);}catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:'Recording unavailable.');}finally{if(!request.signal.aborted)setBusy(false);}}
 return <div>{url?<audio aria-label={'Call recording '+recordingId} controls autoPlay preload="metadata" src={url}/>:<button className="pipeline-button" type="button" disabled={busy} onClick={()=>void load()}>{busy?'Loading recording...':'Listen to recording'}</button>}{error&&<p role="alert">{error}</p>}</div>;
}
export default function CallsToListenPanel({token,onCount}:{token:string;onCount?:(count:number)=>void}){
 const [report,setReport]=useState<CallsToListenReport|null>(null),[error,setError]=useState(''),[page,setPage]=useState(0),[search,setSearch]=useState(''),[applied,setApplied]=useState(''),[revision,setRevision]=useState(0),[saving,setSaving]=useState(''),[history,setHistory]=useState<string|null>(null);
 const countCallback=useRef(onCount);countCallback.current=onCount;const pending=useRef<Record<string,string>>({});
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')setRevision(n=>n+1);},30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{const c=new AbortController();setError('');void getCallsToListen(token,page*20,applied,c.signal).then(data=>{if(c.signal.aborted)return;if(!data.rows.length&&page>0){setPage(p=>p-1);return;}setReport(data);countCallback.current?.(data.totalLeads);}).catch(()=>{if(!c.signal.aborted)setError('Unable to load marked calls. Please refresh.');});return()=>c.abort();},[token,page,applied,revision]);
 async function clear(contactId:string,callId:string){const key=contactId+':'+callId;setSaving(key);setError('');pending.current[key]??=crypto.randomUUID();try{await setCallListeningLabel(token,'contact',contactId,callId,{requestId:pending.current[key],marked:false});delete pending.current[key];setRevision(n=>n+1);window.dispatchEvent(new Event('crm-call-listening-changed'));}catch{setError('Unable to confirm the label change. Refresh or retry.');}finally{setSaving('');}}
 return <section aria-label="Calls to be listened" style={{marginTop:20}}>
  <h2>Calls to be listened</h2><p>Marked calls are grouped by lead. The label leaves the lead’s normal flow unchanged. Transcripts are prepared automatically within the configured spending limit.</p>
  <form onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(0);}}><label>Search lead name <input value={search} maxLength={200} onChange={e=>setSearch(e.target.value)}/></label> <button className="pipeline-button" type="submit">Search</button> <button className="pipeline-button" type="button" onClick={()=>setRevision(n=>n+1)}>Refresh</button></form>
  {error&&<p role="alert">{error}</p>}{!report&&!error&&<p role="status">Loading marked calls...</p>}
  {report&&<><p>{report.totalLeads} leads · {report.totalCalls} marked calls</p>{report.rows.map(lead=><section key={lead.contactId} style={{border:'1px solid #cbd5e1',borderRadius:8,padding:16,margin:'16px 0'}}>
   <h3>{lead.name}</h3><p>{lead.phone}</p><button className="pipeline-button" type="button" onClick={()=>setHistory(history===lead.contactId?null:lead.contactId)}>{history===lead.contactId?'Hide lead history':'Open lead history'}</button>
   {history===lead.contactId&&<LeadPhoneHistory token={token} contactId={lead.contactId} phone={lead.phone} name={lead.name} onCollapse={()=>setHistory(null)}/>}
   {lead.calls.map(call=><article key={call.callId} style={{borderTop:'1px solid #e2e8f0',marginTop:16,paddingTop:14}}><strong>To be listened · Call {call.callId}</strong><p>{at(call.atUtc)} · {call.agent||'Agent unavailable'} · {call.callcode||'Callcode unavailable'}</p><small>Marked {at(call.mark.atUtc)}{call.mark.actor?' by '+call.mark.actor:''}</small>
    <p><button className="pipeline-button" type="button" disabled={!!saving} onClick={()=>void clear(lead.contactId,call.callId)}>{saving===lead.contactId+':'+call.callId?'Saving...':'Remove from listening list'}</button></p>
    {!call.available?<p>Call is no longer linked to this lead. Its label can be removed.</p>:!call.recordings.length?<p>Recording not available yet. Transcription will wait for a recording.</p>:call.recordings.map(recording=><section key={recording.recordingId} style={{padding:'12px 0'}}><p>Recording {recording.recordingId}{recording.durationMs?' · '+Math.round(recording.durationMs/1000)+' seconds':''}</p>
     <ListeningAudio token={token} contactId={lead.contactId} callId={call.callId} recordingId={recording.recordingId}/>
     {recording.transcription?<CallTranscriptRow item={recording.transcription}/>:<p>Transcription queued. Waiting for the recording worker.</p>}
    </section>)}
   </article>)}
  </section>)}{!report.rows.length&&<p>No calls are marked to be listened.</p>}<div className="pipeline-pagination"><button className="pipeline-button" type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(report.totalLeads/20))}</span><button className="pipeline-button" type="button" disabled={(page+1)*20>=report.totalLeads} onClick={()=>setPage(p=>p+1)}>Next</button></div></>}
 </section>;
}
