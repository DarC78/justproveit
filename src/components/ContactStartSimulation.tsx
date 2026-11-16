import {FormEvent,useEffect,useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import type {ContactActionResult} from '@/lib/allCustomers';

export default function ContactStartSimulation({token,contactId,name,phone,disabled,onChanged}:{token:string;contactId:string;name:string;phone:string|null;disabled?:boolean;onChanged:(result:ContactActionResult)=>void}){
 const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),busy=useRef(false),requestId=useRef('');
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 async function start(e:FormEvent){
  e.preventDefault();if(busy.current||!phone)return;busy.current=true;setSaving(true);setError('');requestId.current||=crypto.randomUUID();
  try{
   const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL;
   const response=await fetch(`${base.replace(/\/+$/,'')}/justproveit/admin/crm/contacts/${encodeURIComponent(contactId)}/start-simulation`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requestId:requestId.current,phone,confirm:true})});
   const result=await response.json();if(!response.ok)throw Error(result.error?.message||'Pornirea nu a putut fi confirmata. Reincercati aceeasi cerere.');
   if(!result.success||result.action!=='start-simulation'||result.contactId.toLowerCase()!==contactId.toLowerCase()||!['scheduled','already-active'].includes(result.status)||result.sent!==false)throw Error('Rezultatul nu a putut fi verificat. Reincercati aceeasi cerere.');
   setNotice(result.status==='already-active'?'Chatbotul este deja activ. Nu am programat o pornire noua.':'Pornirea simularii a fost programata. Mesajul va fi procesat de chatbot conform programului sau; trimiterea nu este inca confirmata.');
   setOpen(false);requestId.current='';onChanged({success:true,action:'start-simulation',contactId,solved:false});
  }catch(e){setError(e instanceof Error?e.message:'Pornirea nu a putut fi confirmata.');}finally{busy.current=false;setSaving(false);}
 }
 return <><button type="button" disabled={disabled||saving||!phone} onClick={()=>{setOpen(true);setNotice('');setError('');}}>Start Simulare</button>
 {notice&&<p role="status">{notice}</p>}
 {open&&<dialog ref={dialog} aria-label="Start Simulare" onCancel={e=>{if(saving)e.preventDefault();else setOpen(false);}}><form onSubmit={start}>
 <h3>Start Simulare</h3><p>{name} · {phone}</p>
 <p>Confirmati pornirea chatbotului de simulare pensie pentru acest numar? Chatbotul va trimite urmatoarea intrebare si va continua automat conversatia, pastrand raspunsurile deja salvate.</p>
 <p>Daca discutia a fost preluata de un agent, aceasta actiune o preda inapoi chatbotului. O conversatie oprita de client sau o trimitere neconfirmata necesita verificare si nu va fi repornita.</p>
 {error&&<p role="alert">{error}</p>}
 <button type="submit" disabled={saving}>{saving?'Se programeaza...':'Confirma Start Simulare'}</button><button type="button" disabled={saving} onClick={()=>setOpen(false)}>Cancel</button>
 </form></dialog>}
 <style jsx>{`button{border:1px solid #cbd5e1;border-radius:4px;padding:7px 9px;background:white;color:#123c92;cursor:pointer;font-size:12px;font-weight:600}button:disabled{opacity:.5;cursor:default}dialog{border:1px solid #dce3ee;border-radius:12px;padding:24px;width:min(520px,calc(100vw - 32px));color:#344054}dialog::backdrop{background:#10213d80}h3{font-size:21px;margin:0 0 12px}p{font-size:13px;line-height:1.6;max-width:520px}dialog button{margin:12px 8px 0 0}[role=alert]{color:#b42318}[role=status]{flex-basis:100%;color:#123c92}`}</style></>;
}
