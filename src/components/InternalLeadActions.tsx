import {FormEvent,useEffect,useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import {ContactActionResult} from '@/lib/allCustomers';
import type {LeadNoteSummary} from '@/lib/leadNotes';
type Note={id:string;kind:'note'|'end';text:string;actor:string|null;atUtc:string;nextActionDate?:string|null};
const displayDate=(date:string)=>date.split('-').reverse().join('/');
export default function InternalLeadActions({token,contactId,name,disabled,onChanged,allowEnd=true,recordKind='contact',summary,onNoteSaved}:{token:string;contactId:string;name:string;disabled?:boolean;onChanged:(result:ContactActionResult)=>void;allowEnd?:boolean;recordKind?:'contact'|'customer';summary?:LeadNoteSummary;onNoteSaved?:()=>void}){
 const [mode,setMode]=useState<'note'|'end'|null>(null),[text,setText]=useState(''),[notes,setNotes]=useState<Note[]>([]),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),busy=useRef(false),request=useRef('');
 const [nextActionDate,setNextActionDate]=useState(''),[currentDate,setCurrentDate]=useState<string|null>(summary?.nextActionDate||null),[loaded,setLoaded]=useState(false),[dateEdited,setDateEdited]=useState(false);
 useEffect(()=>{if(summary)setCurrentDate(summary.nextActionDate);},[summary]);
 const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
 const url=`${base.replace(/\/+$/,'')}/justproveit/admin/crm/${recordKind==='customer'?'customers':'contacts'}/${encodeURIComponent(contactId)}/internal`;
 useEffect(()=>{if(mode)dialog.current?.showModal();},[mode]);
 async function open(next:'note'|'end'){
  setMode(next);setText('');setError('');setNotice('');setNotes([]);setLoading(true);setLoaded(false);setDateEdited(false);request.current=crypto.randomUUID();
  try{const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}),data=await r.json();if(!r.ok)throw Error(data.error?.message||'Unable to load comments.');if((recordKind==='customer'?data.recordId:data.contactId)?.toLowerCase()!==contactId.toLowerCase()||!Array.isArray(data.notes)||!Object.hasOwn(data,'nextActionDate'))throw Error('Datele comentariilor nu au putut fi verificate. Reîncărcați.');setNotes(data.notes);setNextActionDate(data.nextActionDate||'');setCurrentDate(data.nextActionDate||null);setLoaded(true);}
  catch(e){setError(e instanceof Error?e.message:'Unable to load comments.');}finally{setLoading(false);}
 }
 async function save(e:FormEvent){e.preventDefault();if(busy.current||!text.trim()||loading||!loaded)return;busy.current=true;setSaving(true);setError('');
  try{const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action:mode,text:text.trim(),requestId:request.current,...(mode==='note'&&dateEdited?{nextActionDate:nextActionDate||null}:{})})}),data=await r.json();
   if(!r.ok)throw Error(data.error?.message||'Unable to save.');if(!data.success||data.action!==mode||(recordKind==='customer'?data.recordId:data.contactId)?.toLowerCase()!==contactId.toLowerCase()||!data.note||(mode==='end'&&!data.closed)||(mode==='note'&&dateEdited&&(data.nextActionDate||null)!==(nextActionDate||null)))throw Error('Save result could not be verified. Retry the same request.');
   if(mode==='end'){setMode(null);onChanged(data);}else{setNotes(current=>current.some(n=>n.id===data.note.id)?current:[...current,data.note]);setCurrentDate(data.nextActionDate||null);setNextActionDate(data.nextActionDate||'');setDateEdited(false);setText('');request.current=crypto.randomUUID();setNotice('Comentariu salvat.');onNoteSaved?.();}
  }catch(e){setError(e instanceof Error?e.message:'Unable to save.');}finally{busy.current=false;setSaving(false);}
 }
 return <>{allowEnd&&<button type="button" disabled={disabled||saving||loading} onClick={()=>void open('end')}>End lead</button>}<button type="button" disabled={disabled||saving||loading} onClick={()=>void open('note')}>Add comment{summary?.noteCount?` (${summary.noteCount})`:''}</button>{currentDate&&<small className="next-action">Next Action Date: {displayDate(currentDate)}</small>}
 {mode&&<dialog ref={dialog} aria-label={mode==='end'?'End lead':'Internal comments'} onCancel={e=>{if(saving)e.preventDefault();else setMode(null);}}><form onSubmit={save}>
 <h3>{mode==='end'?'End lead':'Internal comments'}</h3><p>{name}</p><p>Doar pentru echipa noastră. Nu se trimite niciun mesaj clientului.</p>
 {loading?<p role="status">Se încarcă...</p>:<ul>{[...notes].reverse().map(n=><li key={n.id}><strong>{n.kind==='end'?'Motiv închidere':'Comentariu'}</strong> · {n.actor||'CRM user'} · {new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'}).format(new Date(n.atUtc))}<p className="note">{n.text}</p>{n.nextActionDate&&<p>Next Action Date: {displayDate(n.nextActionDate)}</p>}</li>)}</ul>}
 <label>{mode==='end'?'Motivul închiderii (obligatoriu)':'Comentariu intern'}<textarea required maxLength={4096} rows={5} value={text} disabled={saving||loading} onChange={e=>{setText(e.target.value);request.current=crypto.randomUUID();setError('');setNotice('');}}/></label>
 {mode==='note'&&<label>Next Action Date (opțional)<input type="date" value={nextActionDate} disabled={saving||loading||!loaded} onChange={e=>{setNextActionDate(e.target.value);setDateEdited(true);request.current=crypto.randomUUID();setError('');setNotice('');}}/><small>Data la care trebuie reluată o acțiune pe acest lead. Goliți câmpul pentru a șterge data curentă.</small></label>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <button type="submit" disabled={saving||loading||!loaded||!text.trim()}>{saving?'Se salvează...':mode==='end'?'Confirm End lead':'Save comment'}</button><button type="button" disabled={saving} onClick={()=>setMode(null)}>Cancel</button>
 </form></dialog>}
 <style jsx>{`.next-action{display:block;flex-basis:100%;font-size:12px;color:#475569;margin:4px 0}input[type=date]{border:1px solid #94a3b8;border-radius:6px;padding:8px;font:inherit}button{border:1px solid #cbd5e1;border-radius:4px;padding:7px 9px;background:white;color:#123c92;cursor:pointer;font-size:12px;font-weight:600}button:disabled{opacity:.5;cursor:default}dialog{border:1px solid #dce3ee;border-radius:12px;padding:24px;width:min(560px,calc(100vw - 32px));max-height:90vh;overflow:auto;color:#344054}dialog::backdrop{background:#10213d80}h3{font-size:21px;font-weight:600}p{margin:8px 0;font-size:13px}label{display:grid;gap:8px;font-weight:600}textarea{border:1px solid #94a3b8;border-radius:6px;padding:10px;resize:vertical}li{padding:10px 0;border-bottom:1px solid #eee;font-size:12px}.note{white-space:pre-wrap;overflow-wrap:anywhere}ul{margin:12px 0}dialog button{margin:12px 8px 0 0}[role=alert]{color:#b42318}`}</style></>;
}
