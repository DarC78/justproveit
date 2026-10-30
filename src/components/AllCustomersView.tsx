import ContactActions from "./ContactActions";
import Link from "next/link";
import {FormEvent,useEffect,useState} from "react";
import {CustomerFilters,CustomerPage,CustomerScope,CUSTOMER_PAGE_SIZE,loadCustomerPage,RecordKind,callcodeText,contactActionNotice} from "@/lib/allCustomers";
import PhoneHistoryModal from "./PhoneHistoryModal";
import BookingActions from "./BookingActions";
import {ScheduledCallRow} from "@/lib/crmAdmin";
import {bookingActionNotice} from "@/lib/bookedCalls";
const initialFilters:CustomerFilters={name:"",phone:"",email:""};
const clock=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"short"});
const time=(value:string|null)=>value&&Number.isFinite(Date.parse(value))?clock.format(new Date(value)):"—";

export function CustomersSection({token,scope,title,description,kind="customers",refreshKey=0,onChanged}:{token:string;scope:CustomerScope;title:string;description:string;kind?:RecordKind;refreshKey?:number;onChanged?:()=>void}) {
  const noun=kind==="leads"?"leads":"customers";
  const [filters,setFilters]=useState(initialFilters),[applied,setApplied]=useState(initialFilters);
  const [page,setPage]=useState(0),[revision,setRevision]=useState(0);
  const [report,setReport]=useState<CustomerPage|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [history,setHistory]=useState<ScheduledCallRow|null>(null),[notice,setNotice]=useState("");
  useEffect(()=>{
    const controller=new AbortController();
    Promise.resolve().then(async()=>{
      if(controller.signal.aborted)return;
      setLoading(true);setError("");setReport(null);
      try{const data=await loadCustomerPage(token,scope,applied,page,controller.signal,kind);if(!controller.signal.aborted)setReport(data);}
      catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to load CRM records.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    });return()=>controller.abort();
  },[token,scope,applied,page,revision,kind,refreshKey]);
  function apply(event:FormEvent){event.preventDefault();setLoading(true);setError("");setReport(null);setPage(0);setApplied({...filters});}
  return <section className="customer-section" aria-labelledby={`${kind}-${scope}-title`}>
    <h2 id={`${kind}-${scope}-title`}>{title}</h2><p>{description}</p>
    <form onSubmit={apply} className="filters">
      {(["name","phone","email"] as const).map(field=><label key={field}>{field[0].toUpperCase()+field.slice(1)}<input type="search" value={filters[field]} onChange={e=>setFilters({...filters,[field]:e.target.value})}/></label>)}
      <button type="submit">Apply filters</button><button type="button" onClick={()=>{setFilters(initialFilters);setApplied({...initialFilters});setPage(0);setLoading(true);setReport(null);}}>Clear</button>
      <button type="button" onClick={()=>setRevision(n=>n+1)} disabled={loading}>Refresh</button>
    </form>
    {notice&&<p role="status">{notice}</p>}
    <div aria-live="polite" aria-busy={loading}>
      {loading?<p className="status">Loading {noun}...</p>:error?<p className="error" role="alert">{error}</p>:report&&<>
        {report.warnings?.map(warning=><p className="warning" key={warning}>{warning}</p>)}
        <p className="count">{report.total} {noun} · {report.rows.length?`${page*CUSTOMER_PAGE_SIZE+1}–${page*CUSTOMER_PAGE_SIZE+report.rows.length}`:"0"} shown</p>
        {!report.rows.length?<p className="status">No matching {noun}.</p>:<div className="table-scroll" tabIndex={0} role="region" aria-label={title}><table>
          <thead><tr>{["Name","Phone number","Email",kind==="leads"?"Became a lead":"Became a customer","Latest inbound contact","Call booked for (UK)","First call (UK)","Last call (UK)","Number of calls","First callcode","Last callcode","Latest WhatsApp message","Booking actions"].map(label=><th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{report.rows.map(row=><tr key={row.contactId}>
            <th scope="row">{row.phone?<Link href={{pathname:"/crmdispatch",query:{phone:row.phone}}}>{row.name||(kind==="leads"?"Lead":"Customer")}</Link>:row.name||(kind==="leads"?"Lead":"Customer")}</th>
            <td>{row.phone?row.booking?<button type="button" className="text-link" onClick={()=>setHistory(row.booking)}>{row.phone}</button>:<Link href={{pathname:"/admin/crm",query:{tab:"details",phone:row.phone}}}>{row.phone}</Link>:"—"}</td>
            <td>{row.email||"—"}</td><td>{time(row.createdAtUtc)}</td>
            <td>{row.lastInbound?<><strong>{row.lastInbound.channel}</strong><small>{time(row.lastInbound.atUtc)} · {row.lastInbound.source||"Source unavailable"}</small><p className="message">{row.lastInbound.text}</p></>:"No inbound contact recorded"}</td>
            <td>{row.booking?time(row.booking.appointmentAtUtc):"No booking"}</td><td>{time(row.firstCallAtUtc)}</td><td>{time(row.lastCallAtUtc)}</td>
            <td>{row.callCount??"Unavailable"}</td><td>{callcodeText(row.firstCallCode)}</td><td>{callcodeText(row.lastCallCode)}</td>
            <td>{row.lastWhatsApp?<><strong>{row.lastWhatsApp.direction==="inbound"?"Customer":"Us"}</strong><small>{time(row.lastWhatsApp.atUtc)} · {row.lastWhatsApp.source||"Source unavailable"}</small><p className="message">{row.lastWhatsApp.text}</p></>:"No WhatsApp message recorded"}</td>
            <td>{(row.actionContactId||(kind==="leads"?row.contactId:row.booking?.contactId))&&<ContactActions token={token} contactId={(row.actionContactId||(kind==="leads"?row.contactId:row.booking?.contactId))!} name={row.name} phone={row.phone} onChanged={result=>{setNotice(contactActionNotice(result));setRevision(n=>n+1);onChanged?.();}}/>}{row.booking?<BookingActions token={token} booking={row.booking} onChanged={result=>{setNotice(bookingActionNotice(result));setRevision(n=>n+1);}} onBusinessMarked={()=>setRevision(n=>n+1)} onSolved={()=>{setNotice("Booking marked solved on WhatsApp.");setRevision(n=>n+1);onChanged?.();}}/>:"—"}</td>
          </tr>)}</tbody>
        </table></div>}
        <nav aria-label={`${title} pagination`} className="pagination"><button type="button" disabled={page===0} onClick={()=>{setLoading(true);setReport(null);setPage(p=>p-1);}}>Previous</button>
          <span>Page {page+1} of {Math.max(1,Math.ceil(report.total/CUSTOMER_PAGE_SIZE))}</span>
          <button type="button" disabled={(page+1)*CUSTOMER_PAGE_SIZE>=report.total} onClick={()=>{setLoading(true);setReport(null);setPage(p=>p+1);}}>Next</button></nav>
      </>}
    </div>
    {history&&<PhoneHistoryModal token={token} booking={history} onClose={()=>setHistory(null)}/>}
    <style jsx>{`
      .customer-section{margin:24px 0 40px;color:#344054}h2{font-size:23px;color:#17376e;margin:0 0 8px}p{font-size:13px;line-height:1.5;margin:0}
      .filters{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:18px 0}label{display:grid;gap:6px;font-size:13px;font-weight:700}
      input,button{border:1px solid #cbd5e1;border-radius:5px;padding:9px 12px;background:white;font:inherit}button{color:#143b92;cursor:pointer;font-size:13px;font-weight:700}button:disabled{opacity:.5;cursor:default}
      .table-scroll{overflow-x:auto;border:1px solid #dce3ee;border-radius:7px}table{width:100%;min-width:1700px;border-collapse:collapse;font-size:12px;text-align:left}thead{background:#eef3fb;color:#17376e}
      th,td{padding:14px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;min-width:110px}tbody th{min-width:160px}tbody tr:hover{background:#f8fafc}
      small{display:block;font-size:11px;color:#667085;margin:5px 0}.message{white-space:pre-wrap;overflow-wrap:anywhere;min-width:220px;max-height:150px;overflow:auto}
      .status,.error{padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}.error{color:#b42318}.warning{padding:12px;background:#fff7e4}.count{margin:12px 0;font-weight:700}
      .pagination{display:flex;align-items:center;gap:16px;margin-top:16px;font-size:13px}.text-link{border:0;padding:0;background:none;text-decoration:underline}
    `}</style>
  </section>;
}
export default function AllCustomersView({token}:{token:string}) {
  const [revision,setRevision]=useState(0);
  return <section><h1 className="text-3xl font-bold mt-7">AllCustomersView</h1><p className="mt-2 text-sm text-slate-600">Customer records and inbound contact · All times are UK time</p>
    <CustomersSection token={token} refreshKey={revision} onChanged={()=>setRevision(n=>n+1)} scope="inbound" title="Customers who contacted us" description="OZ clients with at least one received email, WhatsApp message or inbound call. CRM leads who are not clients are excluded."/>
    <CustomersSection token={token} refreshKey={revision} onChanged={()=>setRevision(n=>n+1)} scope="all" title="All customers" description="All OZ clients, including clients without bookings or inbound contact. One row per email; phone is used when email is missing. 50 clients per page."/>
  </section>;
}
