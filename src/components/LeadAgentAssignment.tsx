import {useRef,useState} from "react";
import {assignCrmLead,LeadAssignment,CalledAgent} from "@/lib/crmAdmin";
const fold=(name:string)=>name.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
export function associatedAgentNames(assignment:LeadAssignment|null|undefined,calledAgents:CalledAgent[]){
 const names=[...new Map(calledAgents.map(agent=>[fold(agent.agent),agent.agent])).values()];
 // Two dialler agents share Georgiana's first name; keep the unspecific manual assignment.
 if(assignment){const exact=names.some(name=>fold(name)===fold(assignment.agent)),firstNameMatches=names.filter(name=>fold(name).split(' ')[0]===fold(assignment.agent));if(!exact&&(firstNameMatches.length!==1||fold(assignment.agent)==='georgiana'))names.unshift(assignment.agent);}
 return names;
}
export default function LeadAgentAssignment({token,contactId,assignment,calledAgents=[],onChanged}:{token:string;contactId:string;assignment?:LeadAssignment|null;calledAgents?:CalledAgent[];onChanged:(message:string)=>void}){
 const [agent,setAgent]=useState(""),[saved,setSaved]=useState<LeadAssignment|null>(null),[pending,setPending]=useState(false),[error,setError]=useState("");
 const busy=useRef(false),owner=assignment||saved;
 async function assign(){
  if(busy.current||!agent||owner)return;
  busy.current=true;setPending(true);setError("");
  try{const result=await assignCrmLead(token,contactId,agent);setSaved(result.assignment);onChanged(`Lead asignat: ${result.assignment.agent}.`);}
  catch(cause){setError(cause instanceof Error?cause.message:"Asignarea nu a putut fi salvată.");}
  finally{busy.current=false;setPending(false);}
 }
 const names=associatedAgentNames(owner,calledAgents);
 const agents=names.length?<ul aria-label="Agenți asociați" className="font-semibold mb-2 space-y-1">{names.map(name=><li key={name} title={calledAgents.some(a=>a.agent===name)?'Agent asociat prin istoricul apelurilor'+(owner?`; asignare manuală: ${owner.agent}`:''):owner?`Asignat la ${owner.assignedAtUtc}`:undefined}>{name}</li>)}</ul>:null;
 if(owner)return agents;
 return <div className="min-w-36">{agents}<select aria-label="Agent" className="border rounded p-2 w-full" value={agent} disabled={pending} onChange={e=>setAgent(e.target.value)}><option value="">Selectează agentul</option>{["Daniel","Andreea","Elena","Georgiana","Adrian"].map(name=><option key={name}>{name}</option>)}</select><button type="button" className="border rounded p-2 mt-2" disabled={!agent||pending} onClick={assign}>{pending?"Se asignează…":"Asignează"}</button>{error&&<p role="alert" className="text-red-800 mt-2">{error} Reîncărcați lista pentru a verifica asignarea.</p>}</div>;
}
