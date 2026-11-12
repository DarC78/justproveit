import {useEffect,useRef,useState} from 'react';
import {sendManualCrmSms} from '@/lib/crmAdmin';
export default function SmsReplyComposer({token,phone,name,onSent}:{token:string;phone:string;name?:string;onSent?:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),running=useRef(false);
 const [open,setOpen]=useState(false),[text,setText]=useState(''),[review,setReview]=useState(false),[sending,setSending]=useState(false),[attempted,setAttempted]=useState(false),[error,setError]=useState(''),[accepted,setAccepted]=useState(false);
 useEffect(()=>{if(open&&!dialog.current?.open)dialog.current?.showModal();},[open]);
 const close=()=>{if(sending)return;dialog.current?.close();setOpen(false);trigger.current?.focus();};
 async function send(){if(running.current||attempted||!review||!text.trim())return;running.current=true;setSending(true);setAttempted(true);setError('');
  try{const result=await sendManualCrmSms(token,{phone,message:text.trim()});if(result.success!==true||typeof result.providerMessageId!=='string'||!result.providerMessageId.trim())throw Error('The SMS provider receipt could not be verified.');setAccepted(true);onSent?.();}
  catch(e){setError((e instanceof Error?e.message:'SMS sending could not be confirmed.')+' Check the SMS history before sending again. No automatic retry was made.');}
  finally{running.current=false;setSending(false);}
 }
 return <div className="sms-reply">
  <button ref={trigger} type="button" className="reply-trigger" onClick={()=>{setText('');setReview(false);setAttempted(false);setAccepted(false);setError('');setOpen(true);}}>Reply via SMS</button>
  {open&&<dialog ref={dialog} aria-label="Reply via SMS" onCancel={e=>{e.preventDefault();close();}}>
   <h3>Reply via SMS</h3><p className="recipient">{name&&<strong>{name}<br/></strong>}To: <strong>{phone}</strong></p>
   {!accepted&&!attempted&&(!review?<form onSubmit={e=>{e.preventDefault();if(text.trim())setReview(true);}}><label>SMS message<textarea autoFocus required maxLength={1600} rows={6} value={text} onChange={e=>setText(e.target.value)}/></label><small>{text.length}/1600 characters</small><div className="buttons"><button type="submit" className="primary" disabled={!text.trim()}>Review SMS</button><button type="button" onClick={close}>Cancel</button></div></form>:<><p>Review the recipient and message before sending.</p><div className="preview">{text.trim()}</div><div className="buttons"><button type="button" className="primary" onClick={()=>void send()}>Send SMS</button><button type="button" onClick={()=>setReview(false)}>Edit message</button><button type="button" onClick={close}>Cancel</button></div></>)}
   {sending&&<p role="status">Sending SMS…</p>}
   {accepted&&<p role="status" className="success">Accepted by the SMS provider. Delivery is not yet confirmed.</p>}
   {error&&<p role="alert">{error}</p>}
   {attempted&&<button type="button" disabled={sending} onClick={close}>Close</button>}
  </dialog>}
  <style jsx>{`
   .sms-reply{margin-top:12px}.reply-trigger{border-color:#f9a8d4;color:#9d174d;background:#fff1f2;font-weight:650}button{padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:white;font:inherit;font-size:12px;color:#334155;cursor:pointer}button:hover:not(:disabled){box-shadow:0 1px 4px #102a5620}button:focus-visible,textarea:focus-visible{outline:3px solid #fbcfe8;outline-offset:2px}button:disabled{opacity:.5;cursor:default}.primary{background:#be185d;border-color:#be185d;color:white}
   dialog{box-sizing:border-box;width:min(560px,calc(100vw - 32px));max-height:85vh;overflow:auto;border:1px solid #f9a8d4;border-radius:12px;padding:24px;color:#344054;box-shadow:0 20px 60px #102a5640}dialog::backdrop{background:#10213d80}h3{margin:0 0 12px;font-size:21px;color:#831843}.recipient{margin:0 0 18px;font-size:14px;overflow-wrap:anywhere}label{display:grid;gap:8px;font-size:14px;font-weight:600}textarea{box-sizing:border-box;width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:7px;resize:vertical;font:inherit;line-height:1.6}.buttons{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}small{display:block;margin-top:6px;color:#64748b;font-size:12px}.preview{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6;border:1px solid #fbcfe8;border-radius:8px;padding:14px;background:#fff1f2}p[role=alert]{color:#b42318;line-height:1.6}.success{color:#166534;line-height:1.6}
  `}</style>
 </div>;
}
