import {FormEvent,useEffect,useRef,useState} from 'react';
import {ContactActionResult,ContactBookingContext,loadContactBooking,bookContactCall} from '@/lib/allCustomers';
const localDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
const localTime=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const label=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
export default function ContactBookCall({token,contactId,name,disabled,onBooked}:{token:string;contactId:string;name:string;disabled?:boolean;onBooked:(result:ContactActionResult)=>void}){
 const [open,setOpen]=useState(false),[context,setContext]=useState<ContactBookingContext|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [date,setDate]=useState(''),[time,setTime]=useState('10:00'),[selected,setSelected]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),busy=useRef(false),request=useRef('');
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 async function start(){
  if(busy.current)return;setOpen(true);setLoading(true);setContext(null);setError('');request.current=crypto.randomUUID();
  try{const value=await loadContactBooking(token,contactId);if(value.contactId.toLowerCase()!==contactId.toLowerCase()||!Array.isArray(value.bookings))throw Error('Leadul nu a putut fi verificat.');setContext(value);
   const first=value.bookings[0],now=new Date(),fallback=new Date(now);if(localTime.format(now)>='10:00')fallback.setUTCDate(fallback.getUTCDate()+1);setSelected(first?.id||'');setDate(first&&new Date(first.appointmentAtUtc)>now?localDate.format(new Date(first.appointmentAtUtc)):localDate.format(fallback));setTime(first&&new Date(first.appointmentAtUtc)>now?localTime.format(new Date(first.appointmentAtUtc)):'10:00');
  }catch(cause){setError(cause instanceof Error?cause.message:'Programarile nu au putut fi incarcate.');}finally{setLoading(false);}
 }
 async function save(event:FormEvent){event.preventDefault();if(busy.current||!context?.phone)return;busy.current=true;setSaving(true);setError('');
  try{const booking=context.bookings.find(b=>b.id===selected);const result=await bookContactCall(token,contactId,{requestId:request.current,appointmentDate:date,appointmentTime:time,expectedPhone:context.phone,expectedBookingId:booking?.id||null,expectedAppointmentAtUtc:booking?.appointmentAtUtc||null});setOpen(false);onBooked(result);}
  catch(cause){setError(cause instanceof Error?cause.message:'Programarea nu a putut fi confirmata.');}finally{busy.current=false;setSaving(false);}
 }
 function change(){request.current=crypto.randomUUID();setError('');}
 return <><button type="button" disabled={disabled||saving||loading} onClick={()=>void start()}>Book a Call</button>
 {open&&<dialog ref={dialog} aria-label={`Book a Call pentru ${name}`} onCancel={event=>{if(saving)event.preventDefault();else setOpen(false);}}>
  <form onSubmit={save}><h3>Book a Call</h3><p>{name}</p>
   {loading&&<p role="status">Se incarca programarile...</p>}
   {context&&<><p>{context.phone||'Leadul nu are un numar de telefon valid.'}</p>
    {context.bookings.length>0?<label>Programarea de modificat<select value={selected} disabled={saving} onChange={e=>{setSelected(e.target.value);change();}}>{context.bookings.map(b=><option key={b.id} value={b.id}>{label.format(new Date(b.appointmentAtUtc))} UK {b.serviceName}</option>)}</select></label>:<p>Se va crea o programare noua.</p>}
    <label>Data (UK)<input type="date" required min={localDate.format(new Date())} value={date} disabled={saving} onChange={e=>{setDate(e.target.value);change();}}/></label>
    <label>Ora UK<input type="time" required min="10:00" value={time} disabled={saving} onChange={e=>{setTime(e.target.value);change();}}/></label>
    <p>Toate orele sunt in fusul Marii Britanii. Programarile noi incep de la 10:00. Confirmarile si reminderele folosesc fluxul existent; mesajele vechii programari se anuleaza la reprogramare.</p>
    <button type="submit" disabled={saving||loading||!context.phone}>{saving?'Se salveaza...':context.bookings.length?'Confirma reprogramarea':'Confirma programarea'}</button>
   </>}
   {error&&<p role="alert">{error}</p>}
   <button type="button" disabled={saving} onClick={()=>setOpen(false)}>Renunta</button>
  </form>
  <style jsx>{`dialog{border:1px solid #cbd5e1;border-radius:12px;padding:24px;width:min(520px,calc(100vw - 32px));max-height:90vh;overflow:auto;color:#344054}dialog::backdrop{background:#10213d80}h3{font-size:21px;color:#17376e}label{display:grid;gap:6px;margin:12px 0;font-weight:600}input,select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #94a3b8;border-radius:6px}p{font-size:13px;line-height:1.6}button{margin:8px 8px 0 0;padding:8px 12px;border:1px solid #cbd5e1;border-radius:5px;background:white;cursor:pointer}button:disabled{opacity:.5}[role=alert]{color:#b42318}`}</style>
 </dialog>}</>;
}
