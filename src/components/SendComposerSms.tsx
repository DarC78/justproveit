import {useRef,useState} from 'react';
import {sendCrmComposerSms} from '@/lib/crmAdmin';

export default function SendComposerSms({token,contactId,intentId,phone,text,disabled,onLockChange,onSent}:{token:string;contactId?:string;intentId?:string;phone:string|null;text:string;disabled?:boolean;onLockChange:(locked:boolean)=>void;onSent:()=>void}){
 const running=useRef(false),attempt=useRef<{requestId:string;text:string;expectedPhone:string}|null>(null);
 const [busy,setBusy]=useState(false),[pending,setPending]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(false);
 async function send(){
  if(running.current||!phone||(!attempt.current&&(disabled||!text.trim()||text.trim().length>1600)))return;
  running.current=true;setBusy(true);setNotice('');onLockChange(true);
  const payload=attempt.current||{requestId:crypto.randomUUID(),text:text.trim(),expectedPhone:phone};attempt.current=payload;
  try{
   const result=await sendCrmComposerSms(token,contactId?'contact':'booking',contactId||intentId!,payload);
   if(result.status==='accepted'&&result.providerMessageId){attempt.current=null;setPending(false);setError(false);setNotice('SMS accepted by the provider. Delivery is not yet confirmed; see the lead history.');onLockChange(false);onSent();}
   else if(result.status==='failed'){attempt.current=null;setPending(false);setError(true);setNotice(result.errorMessage||'SMS failed. Your text has been kept.');onLockChange(false);}
   else{setPending(true);setError(true);setNotice('SMS delivery is not confirmed. Check SMS status to follow the same request; do not send another copy.');}
  }catch{setPending(true);setError(true);setNotice('Unable to confirm SMS delivery. Check SMS status to follow the same request; do not send another copy.');}
  finally{running.current=false;setBusy(false);}
 }
 return <span className="sms-action"><button type="button" disabled={busy||(!pending&&(disabled||!phone||!text.trim()||text.trim().length>1600))} onClick={()=>void send()} title="Send the text above by SMS (up to 1600 characters). Attachments are not sent by SMS.">{busy?'Sending SMS...':pending?'Check SMS status':'Send SMS'}</button>{notice&&<span role={error?'alert':'status'}>{notice}</span>}<style jsx>{`
 .sms-action{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px}button{background:#facc15;color:#422006;border:1px solid #eab308;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer}button:disabled{opacity:.5;cursor:default}span[role]{max-width:420px;font-size:12px;color:#344054}
 `}</style></span>;
}
