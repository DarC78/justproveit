import {Fragment,useEffect,useRef,useState} from 'react';
import {getAllWhatsAppMessages,markWhatsAppMessageDone,type WhatsAppMessageRow,type WhatsAppMessageReport} from '@/lib/allWhatsAppMessages';
import {savePipelineControl,type ManualPipelineStage,type PipelineControlInput} from '@/lib/leadPipelineControls';
import LeadPhoneHistory from './LeadPhoneHistory';
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string)=>clock.format(new Date(value));
export function WhatsAppMessageActions({token,row,onChanged}:{token:string;row:WhatsAppMessageRow;onChanged:(message:string)=>void}){
 const [stage,setStage]=useState<ManualPipelineStage|''>(row.manualStage?.stage||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<PipelineControlInput|null>(null),running=useRef(false);
 useEffect(()=>{setStage(row.manualStage?.stage||'');pending.current=null;setError('');},[row.contactId,row.pipelineVersion,row.manualStage?.stage]);
 async function save(action:'done'|'stage'){
  if(running.current)return;running.current=true;setBusy(true);setError('');
  try{
   if(action==='done'){await markWhatsAppMessageDone(token,row);onChanged('This WhatsApp event is marked done. Other messages and the lead status are unchanged.');}
   else{const input=pending.current||{action:'stage',requestId:crypto.randomUUID(),expectedVersion:row.pipelineVersion||0,stage:stage||null};pending.current=input;await savePipelineControl(token,row.contactId,input);pending.current=null;onChanged(stage?`Lead status assigned to ${stage}.`:'Automatic Lead Pipeline classification restored.');}
  }catch(e){setError(e instanceof Error?e.message:'Unable to save. Refresh and retry.');}
  finally{running.current=false;setBusy(false);}
 }
 return <div style={{display:'grid',gap:8,minWidth:215}}>
  {row.done?<small>Done {at(row.done.atUtc)}{row.done.actor?` by ${row.done.actor}`:''}</small>:<button type="button" disabled={busy} onClick={()=>void save('done')}>Mark The Event Done</button>}
  <label style={{display:'grid',gap:4}}>Lead status<select aria-label={`Lead status for ${row.name}`} value={stage} disabled={busy||Boolean(row.ended)} onChange={e=>{setStage(e.target.value as ManualPipelineStage|'');pending.current=null;setError('');}}><option value="">Automatic</option><option value="AgreedToBuy">AgreedToBuy</option><option value="ToAdrian">ToAdrian</option></select></label>
  <button type="button" disabled={busy||Boolean(row.ended)} onClick={()=>void save('stage')}>Change Lead Status</button>
  {row.ended&&<small>This lead is ended. Reopen it in Lead Pipeline to change its status.</small>}
  {error&&<p role="alert" style={{color:'#b42318',maxWidth:280}}>{error}</p>}
 </div>;
}
export default function AllWhatsAppMessagesPanel({token}:{token:string}){
 const [search,setSearch]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[completion,setCompletion]=useState<'all'|'pending'|'done'>('all');
 const [filters,setFilters]=useState({search:'',from:'',to:'',completion:'all' as 'all'|'pending'|'done'}),[offset,setOffset]=useState(0),[revision,setRevision]=useState(0),[history,setHistory]=useState<string|null>(null);
 const [report,setReport]=useState<WhatsAppMessageReport|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{const controller=new AbortController();
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError('');setReport(null);return getAllWhatsAppMessages(token,{...filters,offset},controller.signal);}).then(r=>{if(r&&!controller.signal.aborted)setReport(r);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load messages.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[token,filters,offset,revision]);
 const changed=(message:string)=>{setNotice(message);setRevision(v=>v+1);};
 return <section aria-label="AllWhatsAppMessages">
  <h2>AllWhatsAppMessages</h2><p>Incoming messages linked to CRM leads, from WhatsApp Mediatel and WhatsApp Agenti. Dates use UK time. Marking an event done acknowledges only that message; it does not send a reply, close the lead or clear its pipeline alerts.</p>
  <form className="wa-filters" onSubmit={e=>{e.preventDefault();setOffset(0);setHistory(null);setFilters({search:search.trim(),from,to,completion});}}>
   <label>Lead, phone, email, message or agent<input value={search} maxLength={320} onChange={e=>setSearch(e.target.value)}/></label>
   <label>From<input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></label>
   <label>Event completion<select value={completion} onChange={e=>setCompletion(e.target.value as typeof completion)}><option value="all">All events</option><option value="pending">Pending</option><option value="done">Done</option></select></label>
   <button type="submit">Search</button><button type="button" onClick={()=>{setSearch('');setFrom('');setTo('');setCompletion('all');setOffset(0);setHistory(null);setFilters({search:'',from:'',to:'',completion:'all'});}}>Clear</button><button type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}>Refresh</button>
  </form>
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}{loading&&<p role="status">Loading incoming WhatsApp messages…</p>}
  {report&&<><p>{report.total} incoming message events · Updated {at(report.asOfUtc)} UK time</p>{report.warnings?.map(w=><p key={w} role="status">{w}</p>)}
   <div style={{overflowX:'auto'}}><table><thead><tr>{['Date','CRM Lead','Phone','Email','Message','LeadStatus','Agent','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
    {report.rows.map(row=><Fragment key={row.id}><tr style={{background:row.done?'#f0fdf4':undefined}}>
     <td><time dateTime={row.atUtc}>{at(row.atUtc)}</time><br/><small>{row.source}</small></td>
     <td><button type="button" aria-expanded={history===row.id} onClick={()=>setHistory(history===row.id?null:row.id)}>{row.name}</button></td><td>{row.phone}</td><td>{row.email||'—'}</td>
     <td style={{minWidth:280,maxWidth:500,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{row.message}{row.messageType!=='text'&&<small style={{display:'block'}}>Type: {row.messageType}. Open the lead history to view available media.</small>}</td>
     <td>{row.pipelineStatus}{row.manualStage&&<small style={{display:'block'}}>Manual assignment</small>}</td><td>{row.agent||'Unassigned / not recorded'}</td>
     <td><WhatsAppMessageActions token={token} row={row} onChanged={changed}/></td>
    </tr>{history===row.id&&<tr><td colSpan={8}><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name} onCollapse={()=>setHistory(null)}/></td></tr>}</Fragment>)}
    {!report.rows.length&&<tr><td colSpan={8}>No incoming WhatsApp messages match these filters.</td></tr>}
   </tbody></table></div>
   <div className="wa-pagination"><button type="button" disabled={!offset||loading} onClick={()=>{setHistory(null);setOffset(n=>Math.max(0,n-50));}}>Previous</button><span>Page {Math.floor(offset/50)+1} of {Math.max(1,Math.ceil(report.total/50))}</span><button type="button" disabled={offset+50>=report.total||loading} onClick={()=>{setHistory(null);setOffset(n=>n+50);}}>Next</button></div>
  </>}
  <style jsx>{`table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px;text-align:left;vertical-align:top;border-bottom:1px solid #dce3ee}th{background:#edf3fc;white-space:nowrap}.wa-filters{display:flex;gap:10px;align-items:end;flex-wrap:wrap;padding:14px;background:#f8fafc;margin:12px 0}.wa-filters label{display:grid;gap:5px;font-size:12px;font-weight:600}button,input,select{padding:8px;border:1px solid #cbd5e1;border-radius:5px}button{background:white;color:#123c92;cursor:pointer;font-weight:600}button:disabled{opacity:.5;cursor:default}.wa-pagination{display:flex;gap:12px;align-items:center;margin:14px 0}p[role=alert]{color:#b42318}small{color:#64748b}`}</style>
 </section>;
}
