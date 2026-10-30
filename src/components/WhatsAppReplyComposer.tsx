import {FormEvent, useEffect, useRef, useState} from "react";
import {sendScheduledWhatsAppReply, WhatsAppReplyResult} from "@/lib/crmAdmin";

export default function WhatsAppReplyComposer({token,intentId,phone,onSent}:{token:string;intentId:string;phone:string;onSent:()=>void}) {
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [result,setResult]=useState<WhatsAppReplyResult|null>(null);
  const [error,setError]=useState("");
  const attempt=useRef<{requestId:string;text:string}|null>(null);
  const busy=useRef(false);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const unresolved=!!attempt.current&&(!!error||result?.status==="processing");
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy.current||!text.trim())return;
    busy.current=true;setSending(true);setError("");
    const current=attempt.current||{requestId:crypto.randomUUID(),text:text.trim()};
    attempt.current=current;
    try {
      const response=await sendScheduledWhatsAppReply(token,intentId,{...current,expectedPhone:phone});
      if(!mounted.current)return;
      setResult(response);
      if(["accepted","sent","delivered","read"].includes(response.status)) {
        setText("");attempt.current=null;
      } else if(response.status==="failed") {
        attempt.current=null;
      }
      onSent();
    } catch(cause) {
      if(mounted.current)setError((cause instanceof Error?cause.message:"Unable to confirm the send.")+" Use Check send status to safely check the same request; do not create another copy.");
    } finally {busy.current=false;if(mounted.current)setSending(false);}
  }
  return <form onSubmit={submit} aria-label="Reply on WhatsApp">
    <label htmlFor="whatsapp-reply">Reply on WhatsApp</label>
    <p className="help">Send to {phone}. WhatsApp may reject replies outside the 24-hour window after the client’s last message.</p>
    <textarea id="whatsapp-reply" rows={4} maxLength={4096} value={text} disabled={sending||unresolved}
      onChange={event=>{setText(event.target.value);setResult(null);setError("");}} placeholder="Type your WhatsApp reply…" />
    <div className="actions"><small>{text.length}/4096</small><button type="submit" disabled={sending||!text.trim()}>
      {sending?"Sending…":unresolved?"Check send status":"Send WhatsApp"}</button></div>
    {error?<p role="alert" className="failure">{error}</p>:result&&<p role={result.status==="failed"?"alert":"status"} className={result.status==="failed"?"failure":"feedback"}>
      {result.status==="failed"?result.errorMessage||"WhatsApp could not deliver the reply. Your text has been kept.":
        result.status==="processing"?result.errorMessage||"The send is still being confirmed. Check its status before sending again.":
        result.status==="accepted"?"WhatsApp accepted the reply. Delivery is not yet confirmed; the history updates automatically.":`WhatsApp reply: ${result.status}.`}
    </p>}
    <style jsx>{`
      form{margin-top:24px;padding:18px;background:white;border:1px solid #cbd5e1;border-radius:9px}
      label{display:block;font-weight:700;color:#17376e}.help{font-size:12px;color:#667085;line-height:1.5}
      textarea{display:block;box-sizing:border-box;width:100%;resize:vertical;padding:12px;border:1px solid #94a3b8;border-radius:6px;font:inherit;color:#344054;background:white}
      textarea:focus{outline:2px solid #315fba;outline-offset:2px}.actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}
      small{color:#667085}button{background:#176c43;color:white;border:0;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer}
      button:disabled{opacity:.5;cursor:default}.failure{color:#b42318;font-size:14px;white-space:pre-wrap}.feedback{font-size:14px;color:#17376e}
    `}</style>
  </form>;
}
