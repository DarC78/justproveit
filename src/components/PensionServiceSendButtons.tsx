import {useRef,useState} from 'react';
import {sendPensionServiceLink} from '@/lib/crmAdmin';
type Channel='email'|'whatsapp'|'sms';
type Props={service:string;serviceName:string;contact:{email:string;phone:string};token?:string|null};
const labels:Record<Channel,string>={email:'Email',whatsapp:'WhatsApp',sms:'SMS'};
export default function PensionServiceSendButtons({service,serviceName,contact,token}:Props){
 const [feedback,setFeedback]=useState<Partial<Record<Channel,{recipient:string;text:string;done:boolean}>>>({});
 const [busy,setBusy]=useState<Channel|null>(null);
 const inFlight=useRef(false);
 async function send(channel:Channel){
  if(inFlight.current||!token)return;
  inFlight.current=true;setBusy(channel);
  const recipient=(channel==='email'?contact.email:contact.phone).trim();
  const storageKey=`pension-service:${service}:${channel}:${recipient.toLowerCase()}`;
  try{
   const prior=sessionStorage.getItem(storageKey);
   let attempt:{id:string;status?:string;created:number}|null=null;
   try{attempt=prior?JSON.parse(prior):null;}catch{/* Start a new explicit send. */}
   if(attempt?.status==='accepted'||attempt?.status==='queued'){
    setFeedback(old=>({...old,[channel]:{recipient,text:attempt?.status==='accepted'?'Trimitere deja acceptată.':'Mesajul este deja în coadă.',done:true}}));return;
   }
   if(attempt&&Date.now()-attempt.created>23*3600000)throw Error('Cererea anterioară este veche. Verificați istoricul trimiterilor înainte de o nouă trimitere.');
   attempt=attempt||{id:crypto.randomUUID(),created:Date.now()};
   sessionStorage.setItem(storageKey,JSON.stringify(attempt));
   const result=await sendPensionServiceLink(token,{service,channel,email:contact.email,phone:contact.phone,requestId:attempt.id});
   const status=result.status?.toLowerCase();
   const accepted=['accepted','sent','delivered','read'].includes(status),queued=['queued','processing','to_send','retry'].includes(status);
   if(!accepted&&!queued)throw Error(result.errorMessage||'Trimiterea nu a fost confirmată. Verificați istoricul mesajelor.');
   sessionStorage.setItem(storageKey,JSON.stringify({...attempt,status:accepted?'accepted':'queued'}));
   setFeedback(old=>({...old,[channel]:{recipient,text:accepted?'Trimitere acceptată de furnizor.':channel==='whatsapp'?'WhatsApp pus în coadă. Livrarea mesajului text necesită o conversație activă în ultimele 24 de ore.':'SMS pus în coadă pentru trimitere.',done:true}}));
  }catch(error){setFeedback(old=>({...old,[channel]:{recipient,text:error instanceof Error?error.message:'Trimiterea nu a fost confirmată.',done:false}}));}
  finally{inFlight.current=false;setBusy(null);}
 }
 return <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
  <p className="font-semibold">Trimite linkul de cumpărare</p>
  <div className="flex flex-wrap gap-2">{(['email','whatsapp','sms'] as Channel[]).map(channel=>{
   const recipient=(channel==='email'?contact.email:contact.phone).trim();
   const done=feedback[channel]?.recipient===recipient&&feedback[channel]?.done;
   return <button type="button" key={channel} disabled={!token||!recipient||!!busy||done} onClick={()=>void send(channel)} aria-label={`Trimite linkul pentru ${serviceName} prin ${labels[channel]}`} className="rounded-lg border border-emerald-700 px-3 py-2 font-bold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{busy===channel?'Se trimite…':labels[channel]}</button>;
  })}</div>
  {!token&&<p className="text-xs text-slate-600">Autentificați-vă în CRM pentru a trimite mesaje.</p>}
  <p data-clarity-mask="True" className="break-all text-xs text-slate-600">Email: {contact.email||'completați adresa în secțiunea de contact'}<br/>Telefon: {contact.phone||'completați numărul cu prefix internațional'}</p>
  <div role="status" aria-live="polite">{(['email','whatsapp','sms'] as Channel[]).map(channel=>feedback[channel]?.recipient===(channel==='email'?contact.email:contact.phone).trim()&&<p key={channel} className={`mt-1 text-xs ${feedback[channel]?.done?'text-emerald-800':'text-red-700'}`}>{labels[channel]}: {feedback[channel]?.text}</p>)}</div>
 </div>;
}
