import {FormEvent,useEffect,useRef,useState} from "react";
import {ContactAction,ContactActionResult,runContactAction} from "@/lib/allCustomers";

export default function ContactActions({token,contactId,name,phone,onChanged}:{token:string;contactId:string;name:string;phone:string|null;onChanged:(result:ContactActionResult)=>void}) {
 const [reply,setReply]=useState(false),[text,setText]=useState("");
 const [saving,setSaving]=useState<ContactAction|null>(null),[error,setError]=useState("");
 const [request,setRequest]=useState<{action:ContactAction;id:string}|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const inFlight=useRef(false);
 useEffect(()=>{if(reply)dialog.current?.showModal();},[reply]);
 async function act(action:ContactAction){
  if(inFlight.current||(action==="reply"&&!text.trim()))return;
  inFlight.current=true;
  const id=request?.action===action?request.id:crypto.randomUUID();setRequest({action,id});setSaving(action);setError("");
  try {
   const result=await runContactAction(token,contactId,action,{requestId:id,...(action==="reply"?{text:text.trim()}:{})});
   setReply(false);setText("");setRequest(null);onChanged(result);
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save this action.");}
  finally{inFlight.current=false;setSaving(null);}
 }
 function send(event:FormEvent){event.preventDefault();void act("reply");}
 return <div className="contact-actions">
  <div className="buttons">
   <button type="button" disabled={!!saving||!phone} onClick={()=>{setReply(true);setError("");}}>Reply on WhatsApp</button>
   <button type="button" disabled={!!saving} onClick={()=>void act("solve")}>{saving==="solve"?"Solving":"Solve"}</button>
   <button type="button" disabled={!!saving||!phone} onClick={()=>void act("asap")}>{saving==="asap"?"Scheduling":"New ASAP"}</button>
  </div>
  {error&&!reply&&<p role="alert">{error}</p>}
  {reply&&<dialog ref={dialog} aria-label={`Reply to ${name||phone} on WhatsApp`} onCancel={event=>{if(saving)event.preventDefault();else setReply(false);}}>
   <form onSubmit={send}>
    <h3>Reply on WhatsApp</h3><p className="recipient">{name} · {phone}</p>
    <label>Message<textarea autoFocus required maxLength={4096} rows={8} value={text} disabled={!!saving}
     onChange={event=>{setText(event.target.value);setRequest(null);setError("");}}/></label>
    <p className="hint">Your reply will be queued on WhatsApp and this lead will be marked solved.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="buttons"><button type="submit" disabled={!!saving||!text.trim()}>{saving?"Sending":"Send & solve"}</button>
     <button type="button" disabled={!!saving} onClick={()=>setReply(false)}>Cancel</button></div>
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
