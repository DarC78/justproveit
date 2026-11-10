import {useEffect,useRef,useState} from "react";
import {CrmLead,findCrmLeadByPhone,getContactPhoneHistory} from "@/lib/crmAdmin";
import LeadPhoneHistory from "./LeadPhoneHistory";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function canonicalHistoryContact(lead:CrmLead|null){return [lead?.contactId,lead?.canonicalContactId,lead?.canonical?.contactId].find(x=>typeof x==="string"&&uuid.test(x))||null;}
function phoneKey(value:string){let n=value.replace(/\D/g,"");if(n.startsWith("00"))n=n.slice(2);if(n.startsWith("0")&&[10,11].includes(n.length))n=(n.length===10?"40":"44")+n.slice(1);return n;}
export default function LeadDetailsPhoneHistory({token,lead}:{token:string;lead:CrmLead}){
 const phones=[lead.phoneNumber,lead.normalizedPhone,...(lead.phones||[]).flatMap(p=>[p.phone,p.normalizedPhone])].filter((p):p is string=>typeof p==="string"&&phoneKey(p).length>=6).filter((p,i,all)=>all.findIndex(x=>phoneKey(x)===phoneKey(p))===i);
 const [target,setTarget]=useState<{id:string;phone:string|null}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");const generation=useRef(0),firstButton=useRef<HTMLButtonElement>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>()=>{generation.current++;},[]);
 useEffect(()=>{if(!target)return;const element=dialog.current;if(!element)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';element.showModal();return()=>{element.close();document.body.style.overflow=previous;};},[target]);
 async function open(phone:string){const request=++generation.current;setBusy(true);setError("");setTarget(null);
  try{let id=canonicalHistoryContact(lead);
   if(!id){const found=(await findCrmLeadByPhone(token,phone)).lead;const numbers=[found?.phoneNumber,found?.normalizedPhone,...(found?.phones||[]).flatMap(p=>[p.phone,p.normalizedPhone])];
    if(!numbers.some(n=>typeof n==="string"&&phoneKey(n)===phoneKey(phone)))throw Error("No exact CRM contact match was found for this phone number.");id=canonicalHistoryContact(found);
   }
   if(!id)throw Error("This lead has no linked CRM contact for conversation history.");
   const history=await getContactPhoneHistory(token,id);if(history.contactId.toLowerCase()!==id.toLowerCase())throw Error("The history does not match this lead.");
   if(generation.current===request)setTarget({id,phone:history.phone||null});
  }catch(cause){if(generation.current===request)setError(cause instanceof Error?cause.message:"History could not be loaded. Please retry.");}
  finally{if(generation.current===request)setBusy(false);}
 }
 function collapse(){generation.current++;setTarget(null);setBusy(false);setError("");firstButton.current?.focus();}
 return <div>
  {phones.length?phones.map((phone,i)=><span key={phoneKey(phone)} style={{display:"block",marginBottom:4}}><button ref={i===0?firstButton:undefined} type="button" disabled={busy} onClick={()=>void open(phone)} aria-label={`Open lead history for ${phone}`} style={{border:0,padding:0,background:"transparent",color:"#123c92",textDecoration:"underline",font:"inherit",fontWeight:700,cursor:"pointer"}}>{phone}</button></span>):<span>No phone number recorded</span>}
  {busy&&<p role="status">Loading lead history... <button type="button" onClick={collapse}>Cancel</button></p>}
  {error&&<p role="alert">{error}</p>}
  {target&&<dialog ref={dialog} aria-label="Lead conversation history" onCancel={event=>{event.preventDefault();collapse();}} onClick={event=>{if(event.target===event.currentTarget)collapse();}} style={{position:"fixed",inset:0,margin:"auto",width:"80vw",height:"80vh",maxWidth:"none",maxHeight:"none",border:"1px solid #cbd5e1",borderRadius:12,padding:24,background:"#f8fafc",overflowY:"auto"}}><LeadPhoneHistory token={token} contactId={target.id} phone={target.phone} name={lead.fullName||"Lead"} onCollapse={collapse}/></dialog>}
 </div>;
}
