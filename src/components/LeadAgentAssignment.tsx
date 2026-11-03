import {useRef,useState} from "react";
import {assignCrmLead,LeadAssignment} from "@/lib/crmAdmin";
export default function LeadAgentAssignment({token,contactId,assignment,onChanged}:{token:string;contactId:string;assignment?:LeadAssignment|null;onChanged:(message:string)=>void}){
 const [agent,setAgent]=useState(""),[saved,setSaved]=useState<LeadAssignment|null>(null),[pending,setPending]=useState(false),[error,setError]=useState("");
 const busy=useRef(false),owner=assignment||saved;
 async function assign(){
  if(busy.current||!agent||owner)return;
  busy.current=true;setPending(true);setError("");
  try{const result=await assignCrmLead(token,contactId,agent);setSaved(result.assignment);onChanged(`Lead asignat: ${result.assignment.agent}.`);}
  catch(cause){setError(cause instanceof Error?cause.message:"Asignarea nu a putut fi salvată.");}
  finally{busy.current=false;setPending(false);}
 }
 if(owner)return <span className="font-semibold" title={`Asignat la ${owner.assignedAtUtc}`}>{owner.agent}</span>;
 return <div className="min-w-36"><select aria-label="Agent" className="border rounded p-2 w-full" value={agent} disabled={pending} onChange={e=>setAgent(e.target.value)}><option value="">Selectează agentul</option>{["Daniel","Andreea","Elena","Georgiana","Adrian"].map(name=><option key={name}>{name}</option>)}</select><button type="button" className="border rounded p-2 mt-2" disabled={!agent||pending} onClick={assign}>{pending?"Se asignează…":"Asignează"}</button>{error&&<p role="alert" className="text-red-800 mt-2">{error} Reîncărcați lista pentru a verifica asignarea.</p>}</div>;
}
