import {Fragment,useEffect,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import LeadPhoneHistory from './LeadPhoneHistory';
import ContactActions from './ContactActions';
import BookingActions from './BookingActions';
import {contactActionNotice} from '@/lib/allCustomers';
import {bookingActionNotice} from '@/lib/bookedCalls';
import {nextActionRowStyle,useLeadNoteSummaries} from '@/lib/leadNotes';
import type {ScheduledCallRow} from '@/lib/crmAdmin';
const statuses=['newLead','SimulationInProgress','SimulationDone','AgreedToBuy'] as const;
type Status=typeof statuses[number];
type Row={contactId:string;name:string;phone:string|null;email:string|null;source:string;service:string;createdAtUtc:string;pipelineStatus:Status;operationalStatus:string|null;meaningfulCallAtUtc:string|null;agreedAtUtc:string|null;simulationStartedAtUtc:string|null;simulationDeliveredAtUtc:string|null;lastInboundAtUtc?:string|null;nextContactDate?:string|null;booking?:ScheduledCallRow|null};
type Report={counts:Record<Status,number>;cohortTotal:number;filteredCohortTotal?:number;sources?:string[];total:number;limit:number;offset:number;asOfUtc:string;cohortStartUtc:string;rows:Row[]};
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string|null)=>value?clock.format(new Date(value)):'—';
const descriptions:Record<Status,string>={newLead:'No meaningful call in the past 30 days and no simulation progress or outcome.',SimulationInProgress:'Simulation answers started; results not confirmed delivered.',SimulationDone:'Meaningful call in the past 30 days, or WhatsApp simulation results delivered.',AgreedToBuy:'VA_CUMPARA or PROGRAMARE_CONSULTATIE; retained until purchase or explicit closure.'};
export default function LeadPipelinePanel({token,userId='default'}:{token:string;userId?:string}) {
 const [status,setStatus]=useState<Status|''>(''),[search,setSearch]=useState(''),[applied,setApplied]=useState(''),[page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [source,setSource]=useState(''),[inboundDays,setInboundDays]=useState(0),[restoredKey,setRestoredKey]=useState('');
 const [showFutureScheduled,setShowFutureScheduled]=useState(false);
 const storageKey=`proveit.crm.leadPipeline.filters.v1:${userId}`;
 const [report,setReport]=useState<Report|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[history,setHistory]=useState<string|null>(null);
 const [notice,setNotice]=useState('');
 const notes=useLeadNoteSummaries(token,(report?.rows||[]).map(row=>({id:row.contactId,kind:'contact'})));
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;let saved:{status?:unknown;source?:unknown;inboundDays?:unknown;showFutureScheduled?:unknown}={};try{saved=JSON.parse(window.localStorage.getItem(storageKey)||'{}')||{};}catch{/* Storage is optional. */}
  setStatus(statuses.includes(saved.status as Status)?saved.status as Status:'');setSource(typeof saved.source==='string'&&saved.source.length<=120?saved.source:'');setInboundDays(typeof saved.inboundDays==='number'&&Number.isInteger(saved.inboundDays)&&saved.inboundDays>=0&&saved.inboundDays<=365?saved.inboundDays:0);setShowFutureScheduled(saved.showFutureScheduled===true);setPage(0);setRestoredKey(storageKey);
 });return()=>{active=false;};},[storageKey]);
 const persist=(next:{status:Status|'';source:string;inboundDays:number;showFutureScheduled?:boolean})=>{try{window.localStorage.setItem(storageKey,JSON.stringify({...next,showFutureScheduled:next.showFutureScheduled??showFutureScheduled}));}catch{/* Keep filters usable when storage is disabled. */}};
 useEffect(()=>{const controller=new AbortController();
  if(restoredKey!==storageKey)return;
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const query=new URLSearchParams({status,source,inboundDays:String(inboundDays),showFutureScheduled:String(showFutureScheduled),search:applied,offset:String(page*30)});
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError('');setHistory(null);return fetch(`${base.replace(/\/+$/,'')}/justproveit/admin/crm/lead-pipeline?${query}`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal,cache:'no-store'});})
   .then(async response=>{if(!response)return null;const body=await response.json();if(!response.ok)throw Error(body.error?.message||'Unable to load lead pipeline.');return body as Report;})
   .then(data=>{if(!controller.signal.aborted&&data)setReport(data);}).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Unable to load lead pipeline.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[token,status,source,inboundDays,showFutureScheduled,applied,page,revision,restoredKey,storageKey]);
 const choose=(value:Status|'')=>{setStatus(value);setPage(0);persist({status:value,source,inboundDays});};
 const changeSource=(value:string)=>{setSource(value);setPage(0);persist({status,source:value,inboundDays});};
 const changeDays=(value:string)=>{const days=value===''?0:Number(value);if(!Number.isInteger(days)||days<0||days>365)return;setInboundDays(days);setPage(0);persist({status,source,inboundDays:days});};
 const sources=[...new Set([...(report?.sources||[]),...(source?[source]:[])])];
 return <section className="pipeline-panel">
  <h1>Lead Pipeline — last 60 days</h1>
  <p className="pipeline-intro">Leads first received in the past 60 days. Existing clients and known internal identities are excluded. Status is calculated automatically; contact and enquiry statuses are preserved.</p>
  <div className="pipeline-tabs" role="group" aria-label="Pipeline status shortcuts">
   <button className="pipeline-tab" type="button" onClick={()=>choose('')} aria-pressed={!status}>All: <strong className="pipeline-count">{report?.filteredCohortTotal??report?.cohortTotal??'…'}</strong></button>
   {statuses.map(s=><button className="pipeline-tab" key={s} type="button" onClick={()=>choose(s)} aria-pressed={status===s} title={descriptions[s]}>{s}: <strong className="pipeline-count">{report?.counts[s]??'…'}</strong></button>)}
  </div>
  {status&&<p className="pipeline-status-description">{descriptions[status]}</p>}
  <form className="pipeline-filters" onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(0);}}>
   <label className="pipeline-field">Lead source <select className="pipeline-control" aria-label="Lead source" value={source} onChange={e=>changeSource(e.target.value)}><option value="">All sources</option>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="pipeline-field">Pipeline status <select className="pipeline-control" aria-label="Pipeline status" value={status} onChange={e=>choose(e.target.value as Status|'')}><option value="">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="pipeline-field">Inbound contact in the last X days <input className="pipeline-control" aria-label="Inbound contact in the last X days" type="number" min={1} max={365} step={1} placeholder="N/A" value={inboundDays||''} onChange={e=>changeDays(e.target.value)}/></label>
   <label className="pipeline-field">Name, email or phone <input className="pipeline-control" value={search} onChange={e=>setSearch(e.target.value)} maxLength={320}/></label>
   <div className="pipeline-filter-actions"><button className="pipeline-button pipeline-button-primary" type="submit">Search</button><button className="pipeline-button" type="button" onClick={()=>{setSearch('');setApplied('');setStatus('');setSource('');setInboundDays(0);setShowFutureScheduled(false);setPage(0);persist({status:'',source:'',inboundDays:0,showFutureScheduled:false});}}>Clear</button>
   <button className="pipeline-button" type="button" disabled={loading} onClick={()=>setRevision(x=>x+1)}>Refresh</button></div>
   <label className="pipeline-checkbox"><input type="checkbox" aria-label="Show Leads Scheduled in the future" checked={showFutureScheduled} onChange={e=>{const checked=e.target.checked;setShowFutureScheduled(checked);setPage(0);persist({status,source,inboundDays,showFutureScheduled:checked});}}/>Show Leads Scheduled in the future<span className="pipeline-checkbox-help">Includes future contact dates and Next Action Dates. Today follows UK time.</span></label>
  </form>
  <p className="pipeline-filter-help"><small>Filters are saved for your account in this browser. N/A applies no inbound filter. A number includes inbound calls (including missed calls) or incoming WhatsApp messages; SMS, email and outbound messages do not qualify.</small></p>
  <details className="pipeline-rules"><summary>Classification rules</summary><ul>{statuses.map(s=><li key={s}><strong>{s}</strong>: {descriptions[s]}</li>)}</ul><p>Priority: AgreedToBuy → SimulationDone → SimulationInProgress → newLead. Unanswered calls, voicemail, no audio, default/invalid callcodes and calls without a connected agent do not count as meaningful. WhatsApp results must have a delivery/read confirmation for the final result message.</p></details>
  {notice&&<p role="status">{notice}</p>}{notes.error&&<p role="alert">{notes.error}</p>}
  {error?<p role="alert">{error}</p>:loading?<p role="status">Loading lead pipeline…</p>:report&&<>
   <p>{report.total} leads matching these filters · Updated {at(report.asOfUtc)} UK time</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Lead','Phone','Email','Service / source','Pipeline status','Evidence','Actions'].map(h=><th key={h} style={{padding:10,textAlign:'left',background:'#edf3fc'}}>{h}</th>)}</tr></thead><tbody>
    {report.rows.map(row=><Fragment key={row.contactId}><tr style={{borderBottom:'1px solid #dae2ee',...nextActionRowStyle(notes.summaries['contact:'+row.contactId.toLowerCase()]?.nextActionDate)}}>
     <td style={{padding:10}}><strong>{row.name||'Unnamed lead'}</strong><br/><small>Received: {at(row.createdAtUtc)}</small></td>
     <td><button type="button" onClick={()=>setHistory(history===row.contactId?null:row.contactId)} aria-expanded={history===row.contactId}>{row.phone||'Open history'}</button></td><td>{row.email||'—'}</td>
     <td>{row.service}<br/><small>{row.source}</small></td><td><strong>{row.pipelineStatus}</strong><br/><small>Operational: {row.operationalStatus||'—'}</small></td>
     <td>{row.nextContactDate&&<div>Next contact: {row.nextContactDate.split('-').reverse().join('/')}</div>}{row.lastInboundAtUtc&&<div>Last inbound: {at(row.lastInboundAtUtc)}</div>}{row.agreedAtUtc&&<div>Agreed: {at(row.agreedAtUtc)}</div>}{row.meaningfulCallAtUtc&&<div>Meaningful call: {at(row.meaningfulCallAtUtc)}</div>}{row.simulationDeliveredAtUtc&&<div>Results delivered: {at(row.simulationDeliveredAtUtc)}</div>}{row.simulationStartedAtUtc&&<div>Simulation started: {at(row.simulationStartedAtUtc)}</div>}</td>
     <td style={{padding:10,minWidth:300}}><ContactActions token={token} contactId={row.contactId} name={row.name} phone={row.phone} noteSummary={notes.summaries['contact:'+row.contactId.toLowerCase()]} onNoteSaved={()=>{notes.refresh();setRevision(n=>n+1);}} onChanged={result=>{setNotice(contactActionNotice(result));setRevision(n=>n+1);}}/>
      {row.booking&&<BookingActions key={row.booking.intentId+':'+row.booking.appointmentAtUtc} token={token} booking={row.booking} onChanged={result=>{setNotice(bookingActionNotice(result));setRevision(n=>n+1);}} onBusinessMarked={()=>setRevision(n=>n+1)} onSolved={()=>{setNotice('Booking marked solved on WhatsApp.');setRevision(n=>n+1);}}/>}
     </td>
    </tr>{history===row.contactId&&<tr><td colSpan={7}><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name} onCollapse={()=>setHistory(null)}/></td></tr>}</Fragment>)}
    {!report.rows.length&&<tr><td colSpan={7}>No leads match these filters.</td></tr>}
   </tbody></table></div>
   <div className="pipeline-pagination"><button className="pipeline-button" type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(report.total/30))}</span><button className="pipeline-button" type="button" disabled={(page+1)*30>=report.total} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </>}
  <style>{`
   .pipeline-panel{padding:24px 0;color:#344054}
   .pipeline-panel h1{font-size:30px;line-height:1.25;font-weight:700;color:#17376e;margin:0 0 8px}
   .pipeline-panel .pipeline-intro{font-size:14px;line-height:1.6;margin:0;color:#667085;max-width:1100px}
   .pipeline-panel .pipeline-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 16px}
   .pipeline-panel .pipeline-tab,.pipeline-panel .pipeline-button{box-sizing:border-box;min-height:42px;border:1px solid #cbd5e1;border-radius:6px;padding:9px 14px;background:#fff;color:#143b92;font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s}
   .pipeline-panel .pipeline-tab{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
   .pipeline-panel .pipeline-count{display:inline-flex;align-items:center;justify-content:center;min-width:27px;border-radius:4px;padding:2px 6px;background:#eef3fb;font-size:12px}
   .pipeline-panel .pipeline-tab[aria-pressed=true],.pipeline-panel .pipeline-button-primary{background:#143b92;border-color:#143b92;color:#fff}
   .pipeline-panel .pipeline-tab[aria-pressed=true] .pipeline-count{background:rgba(255,255,255,.18);color:#fff}
   .pipeline-panel .pipeline-button:hover:not(:disabled),.pipeline-panel .pipeline-tab:hover{border-color:#143b92;background:#eef3fb}
   .pipeline-panel .pipeline-button-primary:hover:not(:disabled),.pipeline-panel .pipeline-tab[aria-pressed=true]:hover{background:#102f77;color:#fff}
   .pipeline-panel .pipeline-button:disabled{opacity:.5;cursor:default}
   .pipeline-panel .pipeline-control:focus-visible,.pipeline-panel .pipeline-button:focus-visible,.pipeline-panel .pipeline-tab:focus-visible{outline:2px solid #2563eb;outline-offset:3px}
   .pipeline-panel .pipeline-status-description{border-left:3px solid #143b92;padding:9px 12px;margin:0 0 16px;background:#f4f7fc;font-size:13px;line-height:1.5}
   .pipeline-panel .pipeline-filters{display:grid;grid-template-columns:minmax(170px,1fr) minmax(185px,1fr) minmax(190px,.9fr) minmax(210px,1.3fr) auto;align-items:end;gap:14px;padding:18px;margin:0 0 10px;background:#f8fafc;border:1px solid #dce3ee;border-radius:8px}
   .pipeline-panel .pipeline-field{display:grid;gap:7px;min-width:0;font-size:12px;line-height:1.4;font-weight:600;color:#344054}
   .pipeline-panel .pipeline-control{box-sizing:border-box;display:block;width:100%;height:42px;min-width:0;margin:0;border:1px solid #cbd5e1;border-radius:5px;padding:9px 11px;background:#fff;color:#344054;font:inherit;font-size:14px;font-weight:400}
   .pipeline-panel .pipeline-control::placeholder{color:#98a2b3}
   .pipeline-panel .pipeline-filter-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
   .pipeline-panel .pipeline-checkbox{grid-column:1/-1;display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:13px;font-weight:600;color:#344054;cursor:pointer}
   .pipeline-panel .pipeline-checkbox input{width:17px;height:17px;margin:0;accent-color:#143b92;cursor:pointer}
   .pipeline-panel .pipeline-checkbox input:focus-visible{outline:2px solid #2563eb;outline-offset:3px}
   .pipeline-panel .pipeline-checkbox-help{font-size:12px;font-weight:400;color:#667085}
   .pipeline-panel .pipeline-filter-help{margin:0 0 14px;max-width:1100px;color:#667085;line-height:1.5}
   .pipeline-panel .pipeline-filter-help small{font-size:12px}
   .pipeline-panel .pipeline-rules{font-size:13px;line-height:1.6;margin:0 0 18px;color:#667085}
   .pipeline-panel .pipeline-rules summary{cursor:pointer;color:#17376e;font-weight:600}
   .pipeline-panel .pipeline-rules ul{padding-left:20px;list-style:disc;margin:10px 0}
   .pipeline-panel .pipeline-pagination{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:18px;font-size:13px}
   @media(max-width:1250px){.pipeline-panel .pipeline-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pipeline-panel .pipeline-filter-actions{grid-column:1/-1}}
   @media(max-width:600px){.pipeline-panel .pipeline-filters{grid-template-columns:minmax(0,1fr);padding:14px}.pipeline-panel .pipeline-filter-actions .pipeline-button{flex:1}.pipeline-panel h1{font-size:25px}.pipeline-panel .pipeline-tab{flex:1;justify-content:center}}
  `}</style>
 </section>;
}
