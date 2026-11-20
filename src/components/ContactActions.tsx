import ProposeWhatsAppAnswer from './ProposeWhatsAppAnswer';
import UploadWhatsAppPicture,{type UploadedWhatsAppPicture} from './UploadWhatsAppPicture';
import {sendContactWhatsAppReply} from '@/lib/crmAdmin';
import {FormEvent,useEffect,useRef,useState} from "react";
import {ContactAction,ContactActionResult,runContactAction} from "@/lib/allCustomers";
import ContactBookCall from './ContactBookCall';
import ContactIdentityEditor from './ContactIdentityEditor';
import LeadPrivateWorkspace from './LeadPrivateWorkspace';
import ContactBookAdrian from './ContactBookAdrian';
import ContactStartSimulation from './ContactStartSimulation';
import InternalLeadActions from './InternalLeadActions';
import type {LeadNoteSummary} from '@/lib/leadNotes';

export default function ContactActions({token,contactId,name,phone,onChanged,internalLead=false,noteSummary,onNoteSaved}:{internalLead?:boolean;token:string;contactId:string;name:string;phone:string|null;onChanged:(result:ContactActionResult)=>void;noteSummary?:LeadNoteSummary;onNoteSaved?:()=>void}) {
 const [reply,setReply]=useState(false),[text,setText]=useState("");
 const [proposing,setProposing]=useState(false);
 const [picture,setPicture]=useState<UploadedWhatsAppPicture|null>(null),[uploading,setUploading]=useState(false);
 const [saving,setSaving]=useState<ContactAction|null>(null),[error,setError]=useState("");
 const [request,setRequest]=useState<{action:ContactAction;id:string}|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const inFlight=useRef(false);
 useEffect(()=>{if(reply)dialog.current?.showModal();},[reply]);
 async function act(action:ContactAction){
  if(uploading||proposing||inFlight.current||(action==="reply"&&!text.trim()&&!picture))return;
  inFlight.current=true;
  const id=request?.action===action?request.id:crypto.randomUUID();setRequest({action,id});setSaving(action);setError("");
  try {
   if(action==='reply'&&picture){const result=await sendContactWhatsAppReply(token,contactId,{requestId:id,pictureId:picture.pictureId,text:text.trim(),expectedPhone:phone!});if(result.status==='failed'){setRequest(null);throw Error(result.errorMessage||'Picture delivery failed.');}if(!['accepted','sent','delivered','read'].includes(result.status)){setError('Picture queued or delivery is still being confirmed. Use Check send status before sending again.');return;}setPicture(null);setReply(false);setText('');setRequest(null);onChanged({success:true,action:'reply',contactId,solved:false,whatsAppQueued:true});return;}
   const result=await runContactAction(token,contactId,action,{requestId:id,...(action==="reply"?{text:text.trim()}:{})});
   setReply(false);setText("");setRequest(null);onChanged(result);
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save this action.");}
  finally{inFlight.current=false;setSaving(null);}
 }
 function send(event:FormEvent){event.preventDefault();void act("reply");}
 return <div className="contact-actions">
  <div className="buttons">
   <button type="button" disabled={!!saving||!phone} onClick={()=>{setReply(true);setError("");}}>Reply on WhatsApp</button>
   <ContactStartSimulation token={token} contactId={contactId} name={name} phone={phone} disabled={!!saving||proposing} onChanged={onChanged}/>
   {!internalLead&&<button type="button" disabled={!!saving||proposing} onClick={()=>void act("solve")}>{saving==="solve"?"Solving":"Solve"}</button>}
   <InternalLeadActions token={token} contactId={contactId} name={name} disabled={!!saving||proposing} onChanged={onChanged} allowEnd={internalLead} summary={noteSummary} onNoteSaved={onNoteSaved}/>
   <button type="button" disabled={!!saving||!phone} onClick={()=>void act("asap")}>{saving==="asap"?"Scheduling":"New ASAP"}</button>
   <ContactBookCall token={token} contactId={contactId} name={name||phone||'Lead'} disabled={!!saving||!phone} onBooked={onChanged}/>
   <ContactIdentityEditor token={token} contactId={contactId} disabled={!!saving||proposing} onChanged={()=>onChanged({success:true,action:'identity',contactId,solved:false})}/>
   <LeadPrivateWorkspace token={token} contactId={contactId} name={name}/>
   <ContactBookAdrian token={token} contactId={contactId} name={name||phone||'Lead'} disabled={!!saving||proposing} onBooked={()=>onChanged({success:true,action:'book-adrian',contactId,solved:false})}/>
  </div>
  {error&&!reply&&<p role="alert">{error}</p>}
  {reply&&<dialog ref={dialog} aria-label={`Reply to ${name||phone} on WhatsApp`} onCancel={event=>{if(saving||proposing)event.preventDefault();else setReply(false);}}>
   <form onSubmit={send}>
    <h3>Reply on WhatsApp</h3><p className="recipient">{name} · {phone}</p>
    <label>Message<textarea autoFocus required={!picture} maxLength={picture?1024:4096} rows={8} value={text} disabled={uploading||!!saving||proposing||!!(picture&&request)}
     onChange={event=>{setText(event.target.value);setRequest(null);setError("");}}/></label>
    <p className="hint">{picture?'The picture will be sent with the message above as an optional caption.':'Your reply will be queued on WhatsApp and this lead will be marked solved.'}</p>
    {error&&<p role="alert">{error}</p>}
    <div className="buttons"><button type="submit" disabled={uploading||!!saving||proposing||(!picture&&!text.trim())||!!(picture&&text.length>1024)}>{saving?'Sending...':picture?(request?'Check send status':'Send WhatsApp'):'Send & solve'}</button>
     <ProposeWhatsAppAnswer token={token} contactId={contactId} disabled={uploading||!!saving||!!request} onBusyChange={setProposing} onProposed={value=>{setText(value);setRequest(null);setError("");}}/>
     <UploadWhatsAppPicture token={token} contactId={contactId} phone={phone} picture={picture} disabled={!!saving||proposing||!!request} onBusyChange={setUploading} onChange={value=>{setPicture(value);setRequest(null);setError('');}}/>
     <button type="button" disabled={uploading||!!saving||proposing} onClick={()=>setReply(false)}>Cancel</button></div>
   </form>
  </dialog>}
  <style jsx>{`
   .contact-actions{margin:0 0 10px}.buttons{display:flex;flex-wrap:wrap;gap:7px}
   button{border:1px solid #cbd5e1;border-radius:4px;padding:7px 9px;background:white;color:#123c92;cursor:pointer;font-size:12px;font-weight:600}
   button:disabled{opacity:.5;cursor:default}p[role=alert]{color:#b42318;max-width:300px;margin:8px 0}
   dialog{box-sizing:border-box;border:1px solid #dce3ee;border-radius:12px;padding:24px;width:min(520px,calc(100vw - 32px));max-height:90vh;overflow:auto;box-shadow:0 20px 60px #102a5640;color:#344054}
   dialog::backdrop{background:#10213d80}h3{font-size:21px;color:#17376e;margin:0 0 8px}.recipient{font-size:13px;margin:0 0 20px;overflow-wrap:anywhere}
   label{display:grid;gap:8px;font-size:14px;font-weight:600}textarea{width:100%;box-sizing:border-box;resize:vertical;border:1px solid #94a3b8;border-radius:6px;padding:12px;font:inherit;line-height:1.6}
   .hint{font-size:12px;line-height:1.6;margin:12px 0 18px}
  `}</style>
 </div>;
}
