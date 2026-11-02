import {Fragment,useEffect,useState} from "react";
import ScheduledCallsTable from "./ScheduledCallsTable";
import ContactActions from "./ContactActions";
import LeadPhoneHistory from "./LeadPhoneHistory";
import {contactActionNotice} from "@/lib/allCustomers";
import {AttentionContact,CrmAttentionResponse,listCrmAttention} from "@/lib/crmAdmin";
const phoneKey=(value:string|null)=>{let digits=(value||'').replace(/\D/g,"").replace(/^00/,"");if(digits.startsWith("0")&&[10,11].includes(digits.length))digits=(digits.length===11?"44":"40")+digits.slice(1);return digits;};
const clock=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"short"});
const time=(at:string|null)=>at?clock.format(new Date(at)):"—";
function ContactTable({token,rows,onChanged}:{token:string;rows:AttentionContact[];onChanged:(notice:string)=>void}){
 const [historyId,setHistoryId]=useState<string|null>(null);
 return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr>{["Nume","Telefon","Programarea anterioară (UK)","Ultimul contact primit","Acțiuni"].map(label=><th key={label} className="p-3">{label}</th>)}</tr></thead>
 <tbody>{rows.map(row=><Fragment key={row.contactId}><tr className="border-b align-top"><th scope="row" className="p-3">{row.name||"Client"}</th>
 <td className="p-3"><button type="button" className="text-blue-800 underline" disabled={phoneKey(row.phone)!==phoneKey(row.primaryPhone)} title={phoneKey(row.phone)!==phoneKey(row.primaryPhone)?"Contact primit pe un număr secundar":"Deschide istoricul"} aria-expanded={historyId===row.contactId} onClick={()=>setHistoryId(historyId===row.contactId?null:row.contactId)}>{row.phone||"Istoric"}</button></td>
 <td className="p-3">{time(row.appointmentAtUtc)}</td><td className="p-3"><strong>{row.channel==="call"?"Apel primit":"WhatsApp primit"}</strong><p>{time(row.atUtc)}</p><p className="whitespace-pre-wrap break-words max-w-lg mt-2">{row.text||(row.channel==="whatsapp"?"Mesaj fără text / atașament":"")}</p></td>
 <td className="p-3">{phoneKey(row.phone)===phoneKey(row.primaryPhone)?<ContactActions token={token} contactId={row.contactId} name={row.name} phone={row.phone} onChanged={result=>onChanged(contactActionNotice(result))}/>:<a className="text-blue-800 underline" href={`/admin/crm/?tab=details&phone=${encodeURIComponent(row.phone||"")}`}>Deschide lead-ul — contact pe un număr secundar</a>}</td></tr>
 {historyId===row.contactId&&<tr><td colSpan={5} className="p-4"><LeadPhoneHistory token={token} contactId={row.contactId} phone={row.phone} name={row.name}/></td></tr>}
 </Fragment>)}</tbody></table></div>;
}
export default function AttentionPanel({token}:{token:string}){
 const [report,setReport]=useState<CrmAttentionResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const [days,setDays]=useState(7),[revision,setRevision]=useState(0),[notice,setNotice]=useState("");
 useEffect(()=>{const controller=new AbortController();
 Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setLoading(true);setError("");setReport(null);return listCrmAttention(token,days,controller.signal);}).then(result=>{if(!result||controller.signal.aborted)return;if(result.lookbackDays!==days||!Array.isArray(result.overdue)||!Array.isArray(result.returned)||!Array.isArray(result.other))throw Error("Răspunsul Attention nu a putut fi verificat.");if(!controller.signal.aborted)setReport(result);}).catch(cause=>{if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Nu am putut încărca Attention.");}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
 return()=>controller.abort();},[token,days,revision]);
 function changed(message:string){setNotice(message);setRevision(n=>n+1);}
 return <section className="my-7 text-slate-700"><div className="flex justify-between flex-wrap gap-4 items-end mb-5"><div><h1 className="text-3xl font-bold">Attention</h1><p className="mt-2 text-sm">Contacte care necesită atenție · Toate orele sunt exprimate în fusul orar al Marii Britanii.</p></div>
 <div className="flex gap-3 items-end"><label className="text-sm">Perioadă<select className="block border rounded p-2" value={days} onChange={e=>setDays(Number(e.target.value))}>{[1,3,7,14,30,60,90].map(n=><option key={n} value={n}>Ultimele {n} zile</option>)}</select></label><button type="button" className="border rounded p-2" disabled={loading} onClick={()=>setRevision(n=>n+1)}>Refresh</button></div></div>
 {notice&&<p role="status" className="p-3 bg-green-50 mb-4">{notice}</p>}
 <div aria-live="polite" aria-busy={loading}>{loading?<p className="p-5 bg-slate-50">Se încarcă Attention…</p>:error?<p role="alert" className="p-4 text-red-800">{error}</p>:report&&<>
 <section className="mb-9"><h2 className="text-xl font-bold mb-2">1. Programări restante, încă active ({report.overdue.length})</h2><p className="text-sm mb-4">Programări de acum cel puțin o oră, fără apel meaningful sau rezolvare înregistrată.</p>{report.overdue.length?<ScheduledCallsTable token={token} rows={report.overdue} attention onChanged={changed}/>:<p>Nu există programări restante care necesită atenție.</p>}</section>
 <section className="mb-9"><h2 className="text-xl font-bold mb-2">2. Clienți reveniți după programare ({report.returned.length})</h2><p className="text-sm mb-4">Mesaje WhatsApp sau apeluri primite după o programare din trecut, care încă așteaptă răspuns.</p>{report.returned.length?<ContactTable token={token} rows={report.returned} onChanged={changed}/>:<p>Nu există reveniri care așteaptă răspuns.</p>}</section>
 <section className="mb-9"><h2 className="text-xl font-bold mb-2">3. Alte lead-uri care ne-au contactat ({report.other.length})</h2><p className="text-sm mb-4">Lead-uri fără o programare anterioară, cu un mesaj WhatsApp sau un apel primit care încă așteaptă răspuns.</p>{report.other.length?<ContactTable token={token} rows={report.other} onChanged={changed}/>:<p>Nu există alte contacte care așteaptă răspuns.</p>}</section>
 <p className="text-xs text-slate-500">Actualizat: {time(report.asOfUtc)}. O conversație meaningful, un răspuns trimis sau o rezolvare ulterioară contactului primit îl scot din secțiunile 2 și 3. Un contact nou îl poate readuce.</p>
 </>}</div></section>;
}
