import {useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
export default function ScheduleWhatsAppReply({token,contactId,phone,text,pictureId,onScheduled,onLockChange,disabled}:{token:string;contactId:string;phone:string|null;text:string;pictureId?:string;disabled?:boolean;onScheduled:()=>void;onLockChange:(locked:boolean)=>void}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[at,setAt]=useState<string|null>(null);
 const flight=useRef(false),request=useRef<{requestId:string;text:string;expectedPhone:string;pictureId?:string}|null>(null);
 const url=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL).replace(/\/+$/,'')+'/justproveit/admin/crm/contacts/'+encodeURIComponent(contactId)+'/scheduled-replies';
 async function schedule(){
  if(flight.current||disabled||!phone||(!request.current&&!text.trim()&&!pictureId))return;
  flight.current=true;setBusy(true);setError('');setAt(null);onLockChange(true);
  const body=request.current||{requestId:crypto.randomUUID(),text:text.trim(),expectedPhone:phone,...(pictureId?{pictureId}:{})};request.current=body;
  try{
   const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'}),data=await r.json();
   if(!r.ok)throw Error(data.error?.message||'Unable to confirm scheduling. Retry the same message.');
   if(!data.success||data.action!=='schedule-reply'||String(data.contactId).toLowerCase()!==contactId.toLowerCase()||!data.messageId||!Number.isFinite(Date.parse(data.scheduledAtUtc)))throw Error('Scheduling could not be verified. Retry the same message.');
   setAt(data.scheduledAtUtc);request.current=null;onLockChange(false);
   window.dispatchEvent(new CustomEvent('crm-scheduled-reply',{detail:{contactId}}));onScheduled();
  }catch(e){setError(e instanceof Error?e.message:'Scheduling could not be confirmed. Retry the same message.');}
  finally{flight.current=false;setBusy(false);}
 }
 return <span className="schedule-control"><button type="button" className="schedule-reply" disabled={disabled||busy||!phone||(!request.current&&!text.trim()&&!pictureId)} onClick={()=>void schedule()} title="Schedule the message above for business hours: Mon-Fri 09:00-20:00, Saturday 09:00-15:00, London time. During open hours it is released as soon as possible.">{busy?'Scheduling...':request.current?'Retry same message':'Schedule Reply'}</button>{error&&<span role="alert">{error} Retry scheduling before sending another copy.</span>}{at&&<span role="status">Scheduled for {new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'}).format(new Date(at))} (London). Pending release.</span>}<style jsx>{`button{border:1px solid #991b1b;border-radius:4px;padding:7px 9px;background:#b91c1c;color:white;cursor:pointer;font-size:12px;font-weight:600}button:disabled{opacity:.5;cursor:default}.schedule-control{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px}.schedule-control span{font-size:13px;max-width:440px}[role=alert]{color:#b42318}[role=status]{color:#17376e}`}</style></span>;
}
