import {useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
export default function ProposeWhatsAppAnswer({token,contactId,disabled,onProposed,onBusyChange}:{token:string;contactId:string;disabled?:boolean;onProposed:(text:string)=>void;onBusyChange:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const flight=useRef(false);
 async function propose(){
  if(disabled||flight.current)return;flight.current=true;setBusy(true);setError('');onBusyChange(true);
  try{
   const base=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL).replace(/\/+$/,'');
   const r=await fetch(base+'/justproveit/admin/crm/contacts/'+encodeURIComponent(contactId)+'/proposed-reply',{method:'POST',headers:{Authorization:'Bearer '+token},cache:'no-store'}),d=await r.json();
   if(!r.ok)throw Error(d.error?.message||'Unable to propose an answer.');
   if(!d.success||String(d.contactId).toLowerCase()!==contactId.toLowerCase()||typeof d.text!=='string'||!d.text.trim()||d.text.length>4096)throw Error('Unable to verify the proposed answer. Please try again.');
   onProposed(d.text);
  }catch(e){setError(e instanceof Error?e.message:'Unable to propose an answer.');}
  finally{flight.current=false;setBusy(false);onBusyChange(false);}
 }
 return <span><button type="button" disabled={disabled||busy} onClick={()=>void propose()}>{busy?'Proposing...':'Propose an answer'}</button>{error&&<span role="alert">{error}</span>}<style jsx>{`button{border:1px solid #cbd5e1;border-radius:4px;padding:7px 9px;background:white;color:#123c92;cursor:pointer;font-size:12px;font-weight:600}button:disabled{opacity:.5;cursor:default}[role=alert]{display:block;color:#b42318;font-size:13px}`}</style></span>;
}
