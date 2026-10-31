import {useRef,useState} from 'react';
import {WhatsAppDraft,sendWhatsAppDraft} from '@/lib/whatsappDrafts';
export default function WhatsAppDraftRow({token,draft,onSent}:{token:string;draft:WhatsAppDraft;onSent:()=>void}){
 const [text,setText]=useState(draft.text),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const [status,setStatus]=useState(draft.status),[feedback,setFeedback]=useState(draft.error||'');
 const busy=useRef(false),attempt=useRef<string|null>(draft.status==='Ready'?null:draft.text);
 const ready=status==='Ready';const failed=['failed','Failed'].includes(status);const accepted=['accepted','sent','delivered','read'].includes(status);
 async function send(){
  if(busy.current||!text.trim()||failed||accepted)return;
  busy.current=true;setSaving(true);setError('');const exact=attempt.current??text.trim();attempt.current=exact;
  try{const result=await sendWhatsAppDraft(token,draft,exact);setStatus(result.status);setFeedback(result.errorMessage||'');
   if(result.providerMessageId&&['accepted','sent','delivered','read'].includes(result.status)){setFeedback('WhatsApp accepted the message. Delivery is not yet confirmed.');onSent();}
  }catch(cause){setError((cause instanceof Error?cause.message:'Unable to confirm this send.')+' Check this same draft before sending another copy.');}
  finally{busy.current=false;setSaving(false);}
 }
 return <tr className="draft-row"><td colSpan={4}/><td colSpan={8}>
  <div className="draft"><label htmlFor={`draft-${draft.id}`}>Suggested WhatsApp reply <span>Review before sending</span></label>
   <div className="editor"><textarea id={`draft-${draft.id}`} rows={3} maxLength={4096} value={text} disabled={saving||!ready||attempt.current!==null} onChange={event=>setText(event.target.value)}/>
   <button type="button" onClick={()=>void send()} disabled={saving||failed||accepted||!text.trim()}>{saving?'Please wait…':ready&&!attempt.current?'Send Now':'Check status'}</button></div>
   {error&&<p role="alert">{error}</p>}{feedback&&<p role={failed?'alert':'status'}>{feedback}</p>}
   {!ready&&!accepted&&!feedback&&<p role="status">Send status: {status}. Check this attempt before sending another message.</p>}
  </div>
 </td><td/>
 <style jsx>{`.draft-row td{padding:0 12px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top}.draft{padding:12px;background:#f0f8f2;border:1px solid #b8d9c1;border-radius:6px}label{display:block;font-size:12px;font-weight:700;color:#17376e;margin-bottom:7px}span{font-weight:400;color:#667085;margin-left:12px}.editor{display:flex;gap:10px;align-items:start}textarea{box-sizing:border-box;flex:1;min-width:0;border:1px solid #94a3b8;border-radius:5px;padding:10px;font:inherit;line-height:1.5;resize:vertical;background:white;color:#344054}button{border:1px solid #176c43;border-radius:5px;padding:10px 14px;color:white;background:#176c43;font-weight:700;cursor:pointer;white-space:nowrap}button:disabled{opacity:.5;cursor:default}p{margin:8px 0 0;font-size:12px;color:#9b2c20}@media(max-width:600px){.editor{flex-direction:column}textarea{width:100%}}`}</style>
 </tr>;
}
