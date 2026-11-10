import {Fragment,useEffect,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import LeadPhoneHistory from './LeadPhoneHistory';
const statuses=['newLead','SimulationInProgress','SimulationDone','AgreedToBuy'] as const;
type Status=typeof statuses[number];
type Row={contactId:string;name:string;phone:string|null;email:string|null;source:string;service:string;createdAtUtc:string;pipelineStatus:Status;operationalStatus:string|null;meaningfulCallAtUtc:string|null;agreedAtUtc:string|null;simulationStartedAtUtc:string|null;simulationDeliveredAtUtc:string|null;lastInboundAtUtc?:string|null};
type Report={counts:Record<Status,number>;cohortTotal:number;filteredCohortTotal?:number;sources?:string[];total:number;limit:number;offset:number;asOfUtc:string;cohortStartUtc:string;rows:Row[]};
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
const at=(value:string|null)=>value?clock.format(new Date(value)):'—';
const descriptions:Record<Status,string>={newLead:'No meaningful call in the past 30 days and no simulation progress or outcome.',SimulationInProgress:'Simulation answers started; results not confirmed delivered.',SimulationDone:'Meaningful call in the past 30 days, or WhatsApp simulation results delivered.',AgreedToBuy:'VA_CUMPARA or PROGRAMARE_CONSULTATIE; retained until purchase or explicit closure.'};
export default function LeadPipelinePanel({token,userId='default'}:{token:string;userId?:string}) {
 const [status,setStatus]=useState<Status|''>(''),[search,setSearch]=useState(''),[applied,setApplied]=useState(''),[page,setPage]=useState(0),[revision,setRevision]=useState(0);
 const [source,setSource]=useState(''),[inboundDays,setInboundDays]=useState(0),[restoredKey,setRestoredKey]=useState('');
 const storageKey=`proveit.crm.leadPipeline.filters.v1:${userId}`;
 const [report,setReport]=useState<Report|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[history,setHistory]=useState<string|null>(null);
 useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(!active)return;let saved:{status?:unknown;source?:unknown;inboundDays?:unknown}={};try{saved=JSON.parse(window.localStorage.getItem(storageKey)||'{}')||{};}catch{/* Storage is optional. */}
  setStatus(statuses.includes(saved.status as Status)?saved.status as Status:'');setSource(typeof saved.source==='string'&&saved.source.length<=120?saved.source:'');setInboundDays(typeof saved.inboundDays==='number'&&Number.isInteger(saved.inboundDays)&&saved.inboundDays>=0&&saved.inboundDays<=365?saved.inboundDays:0);setPage(0);setRestoredKey(storageKey);
 });return()=>{active=false;};},[storageKey]);
 const persist=(next:{status:Status|'';source:string;inboundDays:number})=>{try{window.localStorage.setItem(storageKey,JSON.stringify(next));}catch{/* Keep filters usable when storage is disabled. */}};
 useEffect(()=>{const controller=new AbortController();
  if(restoredKey!==storageKey)return;
  const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
  const query=new URLSearchParams({status,source,inboundDays:String(inboundDays),search:applied,offset:String(page*30)});
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError('');setHistory(null);return fetch(`${base.replace(/\/+$/,'')}/justproveit/admin/crm/lead-pipeline?${query}`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal,cache:'no-store'});})
   .then(async response=>{if(!response)return null;const body=await response.json();if(!response.ok)throw Error(body.error?.message||'Unable to load lead pipeline.');return body as Report;})
   .then(data=>{if(!controller.signal.aborted&&data)setReport(data);}).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Unable to load lead pipeline.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[token,status,source,inboundDays,applied,page,revision,restoredKey,storageKey]);
 const choose=(value:Status|'')=>{setStatus(value);setPage(0);persist({status:value,source,inboundDays});};
 const changeSource=(value:string)=>{setSource(value);setPage(0);persist({status,source:value,inboundDays});};
 const changeDays=(value:string)=>{const days=value===''?0:Number(value);if(!Number.isInteger(days)||days<0||days>365)return;setInboundDays(days);setPage(0);persist({status,source,inboundDays:days});};
 const sources=[...new Set([...(report?.sources||[]),...(source?[source]:[])])];
 return <section style={{padding:'20px 0',color:'#18365b'}}>
  <h1>Lead Pipeline — last 60 days</h1>
  <p>Leads first received in the past 60 days. Existing clients and known internal identities are excluded. Status is calculated automatically; contact and enquiry statuses are preserved.</p>
  <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'18px 0'}}>
   <button type="button" onClick={()=>choose('')} aria-pressed={!status}>All: {report?.filteredCohortTotal??report?.cohortTotal??'…'}</button>
   {statuses.map(s=><button key={s} type="button" onClick={()=>choose(s)} aria-pressed={status===s} title={descriptions[s]} style={{padding:12,border:'1px solid #bbcae1',borderRadius:8,background:status===s?'#dbeafe':'#f7f9fc',color:'#18365b'}}><strong>{s}: {report?.counts[s]??'…'}</strong></button>)}
  </div>
  {status&&<p>{descriptions[status]}</p>}
  <form onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(0);}} style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
   <label>Lead source <select aria-label="Lead source" value={source} onChange={e=>changeSource(e.target.value)}><option value="">All sources</option>{sources.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label>Pipeline status <select aria-label="Pipeline status" value={status} onChange={e=>choose(e.target.value as Status|'')}><option value="">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label>Inbound contact in the last X days <input aria-label="Inbound contact in the last X days" type="number" min={1} max={365} step={1} placeholder="N/A" value={inboundDays||''} onChange={e=>changeDays(e.target.value)} style={{width:90}}/></label>
   <label>Name, email or phone <input value={search} onChange={e=>setSearch(e.target.value)} maxLength={320}/></label>
   <button type="submit">Search</button><button type="button" onClick={()=>{setSearch('');setApplied('');setStatus('');setSource('');setInboundDays(0);setPage(0);persist({status:'',source:'',inboundDays:0});}}>Clear</button>
   <button type="button" disabled={loading} onClick={()=>setRevision(x=>x+1)}>Refresh</button>
  </form>
  <p><small>Filters are saved for your account in this browser. N/A applies no inbound filter. A number includes inbound calls (including missed calls) or incoming WhatsApp messages; SMS, email and outbound messages do not qualify.</small></p>
  <details><summary>Classification rules</summary><ul>{statuses.map(s=><li key={s}><strong>{s}</strong>: {descriptions[s]}</li>)}</ul><p>Priority: AgreedToBuy → SimulationDone → SimulationInProgress → newLead. Unanswered calls, voicemail, no audio, default/invalid callcodes and calls without a connected agent do not count as meaningful. WhatsApp results must have a delivery/read confirmation for the final result message.</p></details>
  {error?<p role="alert">{error}</p>:loading?<p role="status">Loading lead pipeline…</p>:report&&<>
   <p>{report.total} leads matching these filters · Updated {at(report.asOfUtc)} UK time</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Lead','Phone','Email','Service / source','Pipeline status','Evidence'].map(h=><th key={h} style={{padding:10,textAlign:'left',background:'#edf3fc'}}>{h}</th>)}</tr></thead><tbody>
    {report.rows.map(row=><Fragment key={row.contactId}><tr style={{borderBottom:'1px solid #dae2ee'}}>
     <td style={{padding:10}}><strong>{row.name||'Unnamed lead'}</strong><br/><small>Received: {at(row.createdAtUtc)}</small></td>
     <td><button type="button" onClick={()=>setHistory(history===row.contactId?null:row.contactId)} aria-expanded={history===row.contactId}>{row.phone||'Open history'}</button></td><td>{row.email||'—'}</td>
     <td>{row.service}<br/><small>{row.source}</small></td><td><strong>{row.pipelineStatus}</strong><br/><small>Operational: {row.operationalStatus||'—'}</small></td>
     <td>{row.lastInboundAtUtc&&<div>Last inbound: {at(row.lastInboundAtUtc)}</div>}{row.agreedAtUtc&&<div>Agreed: {at(row.agreedAtUtc)}</div>}{row.meaningfulCallAtUtc&&<div>Meaningful call: {at(row.meaningfulCallAtUtc)}</div>}{row.simulationDeliveredAtUtc&&<div>Results delivered: {at(row.simulationDeliveredAtUtc)}</div>}{row.simulationStartedAtUtc&&<div>Simulation started: {at(row.simulationStartedAtUtc)}</div>}</td>
    </tr>{history===row.contactId&&<tr><td colSpan={6}><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name} onCollapse={()=>setHistory(null)}/></td></tr>}</Fragment>)}
    {!report.rows.length&&<tr><td colSpan={6}>No leads match these filters.</td></tr>}
   </tbody></table></div>
   <div style={{display:'flex',gap:16,alignItems:'center',marginTop:16}}><button type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(report.total/30))}</span><button type="button" disabled={(page+1)*30>=report.total} onClick={()=>setPage(p=>p+1)}>Next</button></div>
  </>}
 </section>;
}
