import {Fragment,useEffect,useState,useRef} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import LeadPhoneHistory from './LeadPhoneHistory';
import LeadPipelineRowActions from './LeadPipelineRowActions';
import PipelineLeadControls from './PipelineLeadControls';
import type {PipelineControlView} from '@/lib/leadPipelineControls';
import ScheduledCallsTable from './ScheduledCallsTable';
import {nextActionRowStyle,useLeadNoteSummaries} from '@/lib/leadNotes';
import type {ScheduledCallRow} from '@/lib/crmAdmin';
const statuses=['newLead','SimulationInProgress','SimulationDone','ScheduledCall','AgreedToBuy','ToAdrian','clients'] as const;
type Status=typeof statuses[number];
type Row=PipelineControlView&{manualPriority?:boolean;contactId:string;name:string;phone:string|null;email:string|null;source:string;service:string;createdAtUtc:string;pipelineStatus:Status;operationalStatus:string|null;meaningfulCallAtUtc:string|null;agreedAtUtc:string|null;documentReceivedAtUtc?:string|null;scheduledCallAtUtc?:string|null;scheduledCallStatus?:string|null;simulationStartedAtUtc:string|null;simulationDeliveredAtUtc:string|null;lastInboundAtUtc?:string|null;lastActivityAtUtc?:string|null;purchases?:{saleId:string|null;service:string;label:string;purchasedAtUtc:string|null}[];nextActionDate?:string|null;priority?:number;priorityLabel?:string;priorityAtUtc?:string|null;priorityDate?:string|null;nextContactDate?:string|null;scheduleSection?:'selectedDay'|'unresolved'|'future';booking?:ScheduledCallRow|null};
type Report={refreshIntervalSeconds?:number;stale?:boolean;counts:Record<Status,number>;purchasedServices?:{value:string;label:string}[];scheduledDate?:string;warnings?:string[];cohortTotal:number;filteredCohortTotal?:number;sources?:string[];total:number;limit:number;offset:number;asOfUtc:string;cohortStartUtc:string;rows:Row[]};
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string|null)=>value?clock.format(new Date(value)):'—';
const priorityColors:Record<number,string|undefined>={0:'#fff1f2',1:'#fecaca',2:'#fecaca',3:'#dcfce7',4:'#dcfce7',5:undefined};
const clientPriorityColors:Record<number,string>={0:'#fecaca',1:'#fecaca',2:'#fef3c7',3:'#dbeafe'};
const descriptions:Record<Status,string>={newLead:'No recorded meaningful call, simulation progress or outcome.',SimulationInProgress:'Simulation answers started; results not confirmed delivered.',SimulationDone:'Recorded meaningful call, or WhatsApp simulation results delivered; retained when the lead contacts us again.',ScheduledCall:'Has a recorded past or future call booking, unless the lead qualifies for AgreedToBuy, ToAdrian or clients.',AgreedToBuy:'VA_CUMPARA or PROGRAMARE_CONSULTATIE, or manually assigned; retained until purchase or explicit closure.',ToAdrian:'Files/photos received from the lead, or manually assigned for Adrian. Manual stage assignments take precedence.',clients:'Clients with call or WhatsApp activity in the past 60 days. Car-finance-only clients are excluded; mixed-service clients are included.'};
export default function LeadPipelinePanel({token,userId='default'}:{token:string;userId?:string}) {
 const [status,setStatus]=useState<Status|''>(''),[search,setSearch]=useState(''),[applied,setApplied]=useState(''),[page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [source,setSource]=useState(''),[inboundDays,setInboundDays]=useState(0),[restoredKey,setRestoredKey]=useState('');
 const [showEnded,setShowEnded]=useState(false);
 const [showFutureScheduled,setShowFutureScheduled]=useState(false),[showBookedCalls,setShowBookedCalls]=useState(false);
 const storageKey=`proveit.crm.leadPipeline.filters.v1:${userId}`;
 const [report,setReport]=useState<Report|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[history,setHistory]=useState<string|null>(null);
 const [reportQuery,setReportQuery]=useState('');const previousQuery=useRef('');
 const [notice,setNotice]=useState('');
 const [purchasedService,setPurchasedService]=useState('');
 const [scheduledDate,setScheduledDate]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
 const pageSize=status==='ScheduledCall'?25:30;
 const activeQuery=JSON.stringify([userId,status,scheduledDate,purchasedService,source,inboundDays,showFutureScheduled,showBookedCalls,showEnded,applied,page]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')setRevision(n=>n+1);},30000);return()=>clearInterval(timer);},[]);
 const notes=useLeadNoteSummaries(token,(report?.rows||[]).map(row=>({id:row.contactId,kind:'contact'})));
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;let saved:{status?:unknown;purchasedService?:unknown;source?:unknown;inboundDays?:unknown;showFutureScheduled?:unknown;showEnded?:unknown;showBookedCalls?:unknown}={};try{saved=JSON.parse(window.localStorage.getItem(storageKey)||'{}')||{};}catch{/* Storage is optional. */}
  setStatus(statuses.includes(saved.status as Status)?saved.status as Status:'');setPurchasedService(typeof saved.purchasedService==='string'&&saved.purchasedService.length<=150?saved.purchasedService:'');setSource(typeof saved.source==='string'&&saved.source.length<=120?saved.source:'');setInboundDays(typeof saved.inboundDays==='number'&&Number.isInteger(saved.inboundDays)&&saved.inboundDays>=0&&saved.inboundDays<=365?saved.inboundDays:0);setShowFutureScheduled(saved.showFutureScheduled===true);setShowBookedCalls(saved.showBookedCalls===true);setShowEnded(saved.showEnded===true);setPage(0);setRestoredKey(storageKey);
 });return()=>{active=false;};},[storageKey]);
 const persist=(next:{status:Status|'';source:string;inboundDays:number;purchasedService?:string;showFutureScheduled?:boolean;showEnded?:boolean;showBookedCalls?:boolean})=>{try{window.localStorage.setItem(storageKey,JSON.stringify({...next,showEnded:next.showEnded??showEnded,purchasedService:next.purchasedService??purchasedService,showFutureScheduled:next.showFutureScheduled??showFutureScheduled,showBookedCalls:next.showBookedCalls??showBookedCalls}));}catch{/* Keep filters usable when storage is disabled. */}};
 useEffect(()=>{const controller=new AbortController();
  if(restoredKey!==storageKey)return;
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const query=new URLSearchParams({status,source,inboundDays:String(inboundDays),showFutureScheduled:String(showFutureScheduled),showEnded:String(showEnded),showBookedCalls:String(showBookedCalls),search:applied,offset:String(page*pageSize)});
  if(status==='ScheduledCall')query.set('scheduledDate',scheduledDate);
  if(status==='clients')query.set('purchasedService',purchasedService);
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError('');if(previousQuery.current!==activeQuery){setHistory(null);previousQuery.current=activeQuery;}return fetch(`${base.replace(/\/+$/,'')}/justproveit/admin/crm/lead-pipeline?${query}`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal,cache:'no-store'});})
   .then(async response=>{if(!response)return null;const body=await response.json();if(!response.ok)throw Error(body.error?.message||'Unable to load lead pipeline.');return body as Report;})
   .then(data=>{if(!controller.signal.aborted&&data){if(page>0&&page*pageSize>=data.total){setPage(Math.max(0,Math.ceil(data.total/pageSize)-1));return;}setReport(data);setReportQuery(activeQuery);}}).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Unable to load lead pipeline.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[token,status,scheduledDate,purchasedService,source,inboundDays,showFutureScheduled,showBookedCalls,showEnded,applied,page,pageSize,revision,restoredKey,storageKey,activeQuery]);
 const choose=(value:Status|'')=>{setStatus(value);setPage(0);persist({status:value,source,inboundDays});};
 const changeSource=(value:string)=>{setSource(value);setPage(0);persist({status,source:value,inboundDays});};
 const changeDays=(value:string)=>{const days=value===''?0:Number(value);if(!Number.isInteger(days)||days<0||days>365)return;setInboundDays(days);setPage(0);persist({status,source,inboundDays:days});};
 const sources=[...new Set([...(report?.sources||[]),...(source?[source]:[])])];
 const priorityView=['AgreedToBuy','ToAdrian','clients'].includes(status);
 const pipelineChanged=(message:string)=>{setNotice(message);setRevision(n=>n+1);};
 return <section className="pipeline-panel">
  <h1>Lead Pipeline — activity in the last 60 days</h1>
  <p className="pipeline-intro">Contacts with any call outcome or incoming/outgoing WhatsApp message in the past 60 days, regardless of when they first became a lead. Car-finance-only clients and known internal identities are excluded. Other clients appear in clients; contact and enquiry statuses are preserved.</p>
  <div className="pipeline-tabs" role="group" aria-label="Pipeline status shortcuts">
   <button className="pipeline-tab" type="button" onClick={()=>choose('')} aria-pressed={!status}>All: <strong className="pipeline-count">{report?.filteredCohortTotal??report?.cohortTotal??'…'}</strong></button>
   {statuses.map(s=><button className="pipeline-tab" key={s} type="button" onClick={()=>choose(s)} aria-pressed={status===s} title={descriptions[s]}>{s}: <strong className="pipeline-count">{report?.counts[s]??'…'}</strong></button>)}
  </div>
  {status&&<p className="pipeline-status-description">{descriptions[status]}</p>}
  <form className="pipeline-filters" onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(0);}}>
   {status==='ScheduledCall'&&<label className="pipeline-field">ScheduledDate<input className="pipeline-control" aria-label="ScheduledDate" type="date" value={scheduledDate} onChange={e=>{if(e.target.value){setScheduledDate(e.target.value);setPage(0);}}}/></label>}
   {status==='clients'&&<label className="pipeline-field">Purchased service<select className="pipeline-control" aria-label="Purchased service" value={purchasedService} onChange={e=>{setPurchasedService(e.target.value);setPage(0);persist({status,source,inboundDays,purchasedService:e.target.value});}}><option value="">All purchased services</option>{[...(report?.purchasedServices||[]),...(purchasedService&&!report?.purchasedServices?.some(s=>s.value===purchasedService)?[{value:purchasedService,label:purchasedService}]:[])].map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>}
   <label className="pipeline-field">Lead source <select className="pipeline-control" aria-label="Lead source" value={source} onChange={e=>changeSource(e.target.value)}><option value="">All sources</option>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="pipeline-field">Pipeline status <select className="pipeline-control" aria-label="Pipeline status" value={status} onChange={e=>choose(e.target.value as Status|'')}><option value="">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="pipeline-field">Inbound contact in the last X days <input className="pipeline-control" aria-label="Inbound contact in the last X days" type="number" min={1} max={365} step={1} placeholder="N/A" value={inboundDays||''} onChange={e=>changeDays(e.target.value)}/></label>
   <label className="pipeline-field">Name, email or phone <input className="pipeline-control" value={search} onChange={e=>setSearch(e.target.value)} maxLength={320}/></label>
   <div className="pipeline-filter-actions"><button className="pipeline-button pipeline-button-primary" type="submit">Search</button><button className="pipeline-button" type="button" onClick={()=>{setSearch('');setApplied('');setStatus('');setSource('');setInboundDays(0);setShowFutureScheduled(false);setShowBookedCalls(false);setShowEnded(false);setPurchasedService('');setPage(0);persist({status:'',source:'',inboundDays:0,purchasedService:'',showFutureScheduled:false,showBookedCalls:false,showEnded:false});}}>Clear</button>
   <button className="pipeline-button" type="button" disabled={loading} onClick={()=>setRevision(x=>x+1)}>Refresh</button></div>
   <label className="pipeline-checkbox"><input type="checkbox" aria-label="Show Leads Scheduled in the future" checked={showFutureScheduled} onChange={e=>{const checked=e.target.checked;setShowFutureScheduled(checked);setPage(0);persist({status,source,inboundDays,showFutureScheduled:checked});}}/>Show Leads Scheduled in the future<span className="pipeline-checkbox-help">Unchecked hides future next-contact dates and Next Action Dates in every stage. In ScheduledCall, the selected day appears first, then older unresolved calls. Checked also includes later bookings. Today follows UK time.</span></label>
   <label className="pipeline-checkbox"><input type="checkbox" aria-label="Show ended leads" checked={showEnded} onChange={e=>{setShowEnded(e.target.checked);setPage(0);persist({status,source,inboundDays,showEnded:e.target.checked});}}/>Show ended leads</label>
  </form>
  <p className="pipeline-filter-help"><small>Filters are saved for your account in this browser. N/A applies no inbound filter. A number includes inbound calls (including missed calls) or incoming WhatsApp messages; SMS, email and outbound messages do not qualify.</small></p>
  <details className="pipeline-rules"><summary>Classification rules</summary><ul>{statuses.map(s=><li key={s}><strong>{s}</strong>: {descriptions[s]}</li>)}</ul><p>Priority: manual assignments, then clients (purchased), ToAdrian, AgreedToBuy → ScheduledCall → SimulationDone → SimulationInProgress → newLead. Unanswered calls, voicemail, no audio, default/invalid callcodes and calls without a connected agent do not count as meaningful. WhatsApp results must have a delivery/read confirmation for the final result message.</p></details>
  {status==='clients'&&<p className="pipeline-filter-help">P0: incoming contact awaiting response (red). P1: Next Action Date today or overdue (red). P2: no Next Action Date (yellow). P3: future Next Action Date (blue). Mark event as handled acknowledges the current incoming event.</p>}
  {notice&&<p role="status">{notice}</p>}{notes.error&&<p role="alert">{notes.error}</p>}
  {error?<p role="alert">{error}</p>:!report||reportQuery!==activeQuery?<p role="status">Loading lead pipeline…</p>:report&&<>
   {report.refreshIntervalSeconds&&<p className="pipeline-filter-help">Call and message data refreshes in the background about once a minute. Stage, handled, ended and Next Action Date changes are checked live.{loading?' Checking for updates…':''}</p>}
   <p>{report.total} {status==='ScheduledCall'?'scheduled calls':status==='clients'?'clients':'leads'} matching these filters · Updated {at(report.asOfUtc)} UK time</p>
   {status==='ScheduledCall'&&!report.rows.length&&<p>No calls match the selected date range and filters.</p>}
   {report.warnings?.map(w=><p key={w}>{w}</p>)}
   {status==='ScheduledCall'?<>
    <p className="pipeline-filter-help">Selected day first, then older unresolved scheduled calls. 25 calls per page.</p>
    {(['selectedDay','unresolved','future'] as const).map(section=>{const rows=report.rows.filter(row=>(row.scheduleSection||'selectedDay')===section);if(!rows.length)return null;return <section key={section} aria-label={section==='selectedDay'?'Calls for selected day':section==='unresolved'?'Older unresolved scheduled calls':'Future scheduled calls'}>
     <h2>{section==='selectedDay'?'Scheduled calls ? '+scheduledDate:section==='unresolved'?'Older unresolved scheduled calls':'Future scheduled calls'}</h2>
     <ScheduledCallsTable token={token} pipeline showCallDate renderExtraActions={booking=>{const row=rows.find(r=>r.booking?.intentId===booking.intentId);return row?<PipelineLeadControls token={token} row={row} onChanged={pipelineChanged}/>:null;}} rows={rows.flatMap(row=>row.booking?[{...row.booking,leadSource:row.source}]:[])} onChanged={pipelineChanged}/>
    </section>;})}
   </>:<div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{[...(priorityView?['Date / time (UK)']:[]),'Lead','Phone','Email',...(status==='clients'?['Purchased services / purchase date']:[]),'Actions'].map(h=><th key={h} style={{padding:10,textAlign:'left',background:'#edf3fc'}}>{h}</th>)}</tr></thead><tbody>
    {report.rows.map(row=>{const key='contact:'+row.contactId.toLowerCase(),date=report.refreshIntervalSeconds?row.nextActionDate:notes.summaries[key]?notes.summaries[key].nextActionDate:row.nextActionDate,noteStyle=nextActionRowStyle(date),futureStyle=date&&noteStyle?.backgroundColor==='#dbeafe'?noteStyle:undefined;return <Fragment key={row.contactId}><tr style={{borderBottom:'1px solid #dae2ee',...(status==='clients'?{backgroundColor:clientPriorityColors[row.priority??2]}:futureStyle||((priorityView||row.manualPriority)?{backgroundColor:priorityColors[row.priority??5]}:noteStyle))}}>
     {priorityView&&<td className="pipeline-priority-date"><time dateTime={row.priorityAtUtc||row.priorityDate||undefined}>{row.priorityAtUtc?at(row.priorityAtUtc):row.priorityDate?row.priorityDate.split('-').reverse().join('/')+' \u00b7 No time set':at(null)}</time><br/><strong>P{row.priority??5}</strong><br/><small>{row.priorityLabel||'No higher-priority condition'}</small></td>}
     <td style={{padding:10}}><strong>{row.name||'Unnamed lead'}</strong><br/><small>Received: {at(row.createdAtUtc)}</small></td>
     <td><button className="pipeline-phone-link" type="button" title="Open lead history" onClick={()=>setHistory(history===row.contactId?null:row.contactId)} aria-expanded={history===row.contactId}>{row.phone||'Open history'}</button></td><td>{row.email||'—'}</td>
     {status==='clients'&&<td style={{padding:10,minWidth:220}}>{row.purchases?.map((p,index)=><div key={p.saleId||index}><strong>{p.label}</strong><br/><small>Purchased: {at(p.purchasedAtUtc)}</small></div>)}</td>}
     <td style={{padding:10,minWidth:300}}><LeadPipelineRowActions token={token} row={row} noteSummary={notes.summaries['contact:'+row.contactId.toLowerCase()]} onNoteSaved={()=>{notes.refresh();setRevision(n=>n+1);}} onChanged={pipelineChanged}/></td>
    </tr>{history===row.contactId&&<tr><td colSpan={4+Number(priorityView)+Number(status==='clients')}><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name} onCollapse={()=>setHistory(null)}/></td></tr>}</Fragment>;})}
    {!report.rows.length&&<tr><td colSpan={4+Number(priorityView)+Number(status==='clients')}>No leads match these filters.</td></tr>}
   </tbody></table></div>}
   <div className="pipeline-pagination"><button className="pipeline-button" type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(report.total/pageSize))}</span><button className="pipeline-button" type="button" disabled={(page+1)*pageSize>=report.total} onClick={()=>setPage(p=>p+1)}>Next</button></div>
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
   .pipeline-panel .pipeline-phone-link{background:none;border:0;padding:0;color:#143b92;text-decoration:underline;text-underline-offset:2px;font:inherit;font-weight:600;cursor:pointer}
   .pipeline-panel .pipeline-phone-link:hover{color:#0a245c}
   .pipeline-panel .pipeline-phone-link:focus-visible{outline:2px solid #2563eb;outline-offset:3px}
   .pipeline-panel .pipeline-priority-date{min-width:200px;padding:10px;vertical-align:top}.pipeline-panel .pipeline-priority-date time{font-size:15px;font-weight:700;color:#143b92}.pipeline-panel .pipeline-priority-date small{display:block;max-width:240px;font-size:12px;line-height:1.5}
   .pipeline-panel .pipeline-pagination{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:18px;font-size:13px}
   @media(max-width:1250px){.pipeline-panel .pipeline-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.pipeline-panel .pipeline-filter-actions{grid-column:1/-1}}
   @media(max-width:600px){.pipeline-panel .pipeline-filters{grid-template-columns:minmax(0,1fr);padding:14px}.pipeline-panel .pipeline-filter-actions .pipeline-button{flex:1}.pipeline-panel h1{font-size:25px}.pipeline-panel .pipeline-tab{flex:1;justify-content:center}}
  `}</style>
 </section>;
}
