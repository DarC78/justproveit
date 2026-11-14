import GatewayMessageMedia from './GatewayMessageMedia';
import SmsReplyComposer from './SmsReplyComposer';
import {Fragment,useEffect,useState} from 'react';
import {getAllWhatsAppMessages,type IncomingMessage,type WhatsAppMessageRow,type WhatsAppMessageReport} from '@/lib/allWhatsAppMessages';
import {useLeadNoteSummaries} from '@/lib/leadNotes';
import LeadPipelineRowActions from './LeadPipelineRowActions';
import LeadPhoneHistory from './LeadPhoneHistory';
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string)=>clock.format(new Date(value));
export function IncomingMessageBatch({token,row,onChanged}:{token:string;row:WhatsAppMessageRow;onChanged:(message:string)=>void}){
 const items:IncomingMessage[]=row.messages?.length?row.messages:[{messageKey:row.messageKey,atUtc:row.atUtc,message:row.message,messageType:row.messageType,channel:row.channel==='mixed'?undefined:row.channel,source:row.source,phone:row.phone,agent:row.agent,gatewayMedia:row.gatewayMedia,reaction:row.reaction}];
 const lastSms=new Map<string,number>();items.forEach((m,i)=>{if(m.channel==='sms')lastSms.set(m.phone,i);});
 return <div><p className="batch-summary">{items.length} incoming {items.length===1?'event':'events'}{row.lastReplyAtUtc?<> since our reply on <time dateTime={row.lastReplyAtUtc}>{at(row.lastReplyAtUtc)}</time></>:'. No earlier reply recorded.'}</p>
  <div className="message-batch">{items.map((m,index)=><article key={m.messageKey} data-channel={m.channel||'mediatel'} className={m.channel==='sms'?'incoming-message sms-message':'incoming-message'}>
   <header><time dateTime={m.atUtc}>{at(m.atUtc)}</time><span>{m.source}</span></header><p>{m.message}</p>
   {m.messageType!=='text'&&m.channel!=='call'&&!m.gatewayMedia&&!m.reaction&&<small>Type: {m.messageType}. Open the lead history to view available media.</small>}
   <GatewayMessageMedia token={token} media={m.gatewayMedia} reaction={m.reaction}/>{m.channel==='sms'&&lastSms.get(m.phone)===index&&<SmsReplyComposer token={token} phone={m.phone} name={row.name} onSent={()=>onChanged('SMS accepted by the provider. Delivery is not yet confirmed.')}/>}
  </article>)}</div>
  <style jsx>{`.batch-summary{margin:0 0 9px;font-size:11px;color:#64748b}.message-batch{display:grid;gap:9px;max-height:480px;overflow:auto;min-width:300px}.incoming-message{padding:11px 13px;border:1px solid #dce3ee;border-left:3px solid #4f7ac5;border-radius:8px;background:#f8faff}.sms-message{background:#fff1f2;border-color:#fecdd3;border-left-color:#db2777}header{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;font-size:11px;color:#475569}header time{font-weight:700}header span{font-weight:600}.incoming-message p{margin:7px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55}small{display:block;margin-top:6px;color:#64748b}`}</style>
 </div>;
}
export default function AllWhatsAppMessagesPanel({token}:{token:string}){
 const [search,setSearch]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[completion,setCompletion]=useState<'all'|'pending'|'done'>('all');
 const [channel,setChannel]=useState<'all'|'mediatel'|'agents'|'sms'|'call'>('all');
 const [filters,setFilters]=useState({search:'',from:'',to:'',completion:'all' as 'all'|'pending'|'done',channel:'all' as typeof channel}),[offset,setOffset]=useState(0),[revision,setRevision]=useState(0),[history,setHistory]=useState<string|null>(null);
 const [report,setReport]=useState<WhatsAppMessageReport|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const notes=useLeadNoteSummaries(token,(report?.rows||[]).map(row=>({id:row.contactId,kind:'contact'})));
 useEffect(()=>{const controller=new AbortController();
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError('');setReport(null);return getAllWhatsAppMessages(token,{...filters,offset},controller.signal);}).then(r=>{if(r&&!controller.signal.aborted){if(offset>0&&offset>=r.total){setOffset(Math.max(0,Math.floor(Math.max(0,r.total-1)/50)*50));return;}setReport(r);}}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to load messages.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[token,filters,offset,revision]);
 const changed=(message:string)=>{setNotice(message);setRevision(v=>v+1);};
 return <section aria-label="InboundContacts">
  <h2>InboundContacts</h2><p>One row per CRM lead, combining incoming WhatsApp and SMS messages and inbound calls that did not reach an agent since our latest confirmed reply. Each message shows its date and time in the UK. Filters select conversations; the complete incoming batch stays visible. Actions are the same as Lead Pipeline.</p>
  <form className="wa-filters" onSubmit={e=>{e.preventDefault();setOffset(0);setHistory(null);setFilters({search:search.trim(),from,to,completion,channel});}}>
   <label>Lead, phone, email, message or agent<input value={search} maxLength={320} onChange={e=>setSearch(e.target.value)}/></label>
   <label>Latest incoming from<input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/></label><label>Latest incoming to<input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></label>
   <label>Channel<select aria-label="Message channel" value={channel} onChange={e=>setChannel(e.target.value as typeof channel)}><option value="all">All channels</option><option value="mediatel">WhatsApp Mediatel</option><option value="agents">WhatsApp Agenti</option><option value="sms">SMS</option><option value="call">Inbound calls without agent</option></select></label>
   <label>Event completion<select aria-label="Event completion" value={completion} onChange={e=>setCompletion(e.target.value as typeof completion)}><option value="all">All events</option><option value="pending">Pending</option><option value="done">Done</option></select></label>
   <button type="submit">Search</button><button type="button" onClick={()=>{setSearch('');setFrom('');setTo('');setCompletion('all');setChannel('all');setOffset(0);setHistory(null);setFilters({search:'',from:'',to:'',completion:'all',channel:'all'});}}>Clear</button><button type="button" disabled={loading} onClick={()=>setRevision(v=>v+1)}>Refresh</button>
  </form>
  {notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}{notes.error&&<p role="alert">{notes.error}</p>}{loading&&<p role="status">Loading incoming conversations…</p>}
  {report&&<><p>{report.total} incoming conversations · Updated {at(report.asOfUtc)} UK time</p>{report.warnings?.map(w=><p key={w} role="status">{w}</p>)}
   <div style={{overflowX:'auto'}}><table><thead><tr>{['Date','CRM Lead','Phone','Email','Message','LeadStatus','Agent','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
    {report.rows.map(row=><Fragment key={row.id}><tr style={{background:row.channel==='sms'?'#fff1f2':row.done?'#f0fdf4':undefined,borderLeft:row.channel==='sms'?'4px solid #db2777':undefined}}>
     <td><time dateTime={row.atUtc}>{at(row.atUtc)}</time><br/><small>{row.source}</small></td>
     <td><button type="button" aria-expanded={history===row.id} onClick={()=>setHistory(history===row.id?null:row.id)}>{row.name}</button></td><td>{row.phone}</td><td>{row.email||'—'}</td>
     <td style={{minWidth:320,maxWidth:540}}><IncomingMessageBatch token={token} row={row} onChanged={changed}/></td>
     <td>{row.pipelineStatus}{row.manualStage&&<small style={{display:'block'}}>Manual assignment</small>}</td><td>{row.agent||'Unassigned / not recorded'}</td>
     <td><LeadPipelineRowActions token={token} row={row} noteSummary={notes.summaries['contact:'+row.contactId.toLowerCase()]} onNoteSaved={()=>{notes.refresh();setRevision(v=>v+1);}} onChanged={changed}/>{row.done&&<small>Incoming batch marked handled{row.done.actor?` by ${row.done.actor}`:''}.</small>}</td>
    </tr>{history===row.id&&<tr><td colSpan={8}><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name} onCollapse={()=>setHistory(null)}/></td></tr>}</Fragment>)}
    {!report.rows.length&&<tr><td colSpan={8}>No incoming events match these filters.</td></tr>}
   </tbody></table></div>
   <div className="wa-pagination"><button type="button" disabled={!offset||loading} onClick={()=>{setHistory(null);setOffset(n=>Math.max(0,n-50));}}>Previous</button><span>Page {Math.floor(offset/50)+1} of {Math.max(1,Math.ceil(report.total/50))}</span><button type="button" disabled={offset+50>=report.total||loading} onClick={()=>{setHistory(null);setOffset(n=>n+50);}}>Next</button></div>
  </>}
  <style jsx>{`table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px;text-align:left;vertical-align:top;border-bottom:1px solid #dce3ee}th{background:#edf3fc;white-space:nowrap}.wa-filters{display:flex;gap:10px;align-items:end;flex-wrap:wrap;padding:14px;background:#f8fafc;margin:12px 0}.wa-filters label{display:grid;gap:5px;font-size:12px;font-weight:600}button,input,select{padding:8px;border:1px solid #cbd5e1;border-radius:5px}button{background:white;color:#123c92;cursor:pointer;font-weight:600}button:disabled{opacity:.5;cursor:default}.wa-pagination{display:flex;gap:12px;align-items:center;margin:14px 0}p[role=alert]{color:#b42318}small{color:#64748b}`}</style>
 </section>;
}
