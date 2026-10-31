import {FormEvent, useEffect, useRef, useState} from "react";
import {sendScheduledWhatsAppReply, WhatsAppReplyResult, ComposerRequest, ComposerTemplate, getComposerTemplates} from "@/lib/crmAdmin";

export default function WhatsAppReplyComposer({token,intentId,phone,onSent}:{token:string;intentId:string;phone:string;onSent:()=>void}) {
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [result,setResult]=useState<WhatsAppReplyResult|null>(null);
  const [error,setError]=useState("");
  const attempt=useRef<ComposerRequest|null>(null);
  const busy=useRef(false);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const [templates,setTemplates]=useState<ComposerTemplate[]>([]),[templateError,setTemplateError]=useState("");
  const [selected,setSelected]=useState(""),[values,setValues]=useState<Record<string,string>>({}),[headerUrl,setHeaderUrl]=useState("");
  useEffect(()=>{let active=true;getComposerTemplates(token).then(result=>{if(active)setTemplates(result.templates);}).catch(()=>{if(active)setTemplateError("Unable to load approved Meta templates. Free text is still available.");});return()=>{active=false;};},[token]);
  const template=templates.find(item=>item.name+":"+item.language===selected);
  const fields:Array<{key:string;label:string}>=[];
  for(const component of template?.components||[]){
    const type=component.type.toLowerCase();
    for(const name of [...new Set([...(component.text||"").matchAll(/\{\{(\w+)\}\}/g)].map(match=>match[1]))])fields.push({key:type+":"+name,label:type+" ? "+name});
    for(const [index,button] of (component.buttons||[]).entries())if(button.url?.includes("{{"))fields.push({key:"button:"+index,label:"Button "+(index+1)+" value"});
  }
  const media=template?.components.find(c=>c.type==="HEADER"&&["IMAGE","VIDEO","DOCUMENT"].includes(c.format||""));
  const valid=template?fields.every(field=>!!values[field.key]?.trim())&&(!media||/^https:\/\//i.test(headerUrl)):!!text.trim();
  const preview=template?.components.filter(c=>c.text).map(c=>(c.text||"").replace(/\{\{(\w+)\}\}/g,(match,name)=>values[c.type.toLowerCase()+":"+name]||match)).join("\n\n");
  const unresolved=!!attempt.current&&(!!error||result?.status==="processing");
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy.current||(!attempt.current&&!valid))return;
    busy.current=true;setSending(true);setError("");
    const current=attempt.current||{requestId:crypto.randomUUID(),...(template?{templateName:template.name,templateLanguage:template.language,parameters:values,headerUrl}:{text:text.trim()})};
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
    <label htmlFor="whatsapp-template">Meta template</label>
    <select id="whatsapp-template" value={selected} disabled={sending||unresolved} onChange={event=>{setSelected(event.target.value);setValues({});setHeaderUrl("");setResult(null);setError("");}}>
      <option value="">Free text message</option>{templates.map(item=><option key={item.name+":"+item.language} value={item.name+":"+item.language}>{item.name} ({item.language})</option>)}
    </select>
    {templateError&&<p role="alert" className="failure">{templateError}</p>}
    {fields.map(field=><label key={field.key}>{field.label}<input maxLength={1024} disabled={sending||unresolved} value={values[field.key]||""} onChange={event=>setValues({...values,[field.key]:event.target.value})}/></label>)}
    {media&&<label>{media.format} attachment URL<input type="url" disabled={sending||unresolved} value={headerUrl} placeholder="https://..." onChange={event=>setHeaderUrl(event.target.value)}/></label>}
    <label htmlFor="whatsapp-reply">Reply on WhatsApp</label>
    <p className="help">Send to {phone}. WhatsApp may reject replies outside the 24-hour window after the client’s last message.</p>
    <textarea id="whatsapp-reply" rows={4} maxLength={4096} value={template?preview:text} disabled={sending||unresolved||!!template}
      onChange={event=>{setText(event.target.value);setResult(null);setError("");}} placeholder="Type your WhatsApp reply…" />
    <div className="actions"><small>{template?"Approved template preview":text.length+"/4096"}</small><button type="submit" disabled={sending||(!unresolved&&!valid)}>
      {sending?"Sending…":unresolved?"Check send status":"Send WhatsApp"}</button></div>
    {error?<p role="alert" className="failure">{error}</p>:result&&<p role={result.status==="failed"?"alert":"status"} className={result.status==="failed"?"failure":"feedback"}>
      {result.status==="failed"?result.errorMessage||"WhatsApp could not deliver the reply. Your text has been kept.":
        result.status==="processing"?result.errorMessage||"The send is still being confirmed. Check its status before sending again.":
        result.status==="accepted"?"WhatsApp accepted the reply. Delivery is not yet confirmed; the history updates automatically.":`WhatsApp reply: ${result.status}.`}
    </p>}
    <style jsx>{`
      form{margin-top:24px;padding:18px;background:white;border:1px solid #cbd5e1;border-radius:9px}
      label{display:block;font-weight:700;color:#17376e}.help{font-size:12px;color:#667085;line-height:1.5}
      select,input{box-sizing:border-box;width:100%;padding:10px;border:1px solid #94a3b8;border-radius:6px;margin:6px 0 12px;font:inherit}label{font-size:13px}
      textarea{display:block;box-sizing:border-box;width:100%;resize:vertical;padding:12px;border:1px solid #94a3b8;border-radius:6px;font:inherit;color:#344054;background:white}
      textarea:focus{outline:2px solid #315fba;outline-offset:2px}.actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}
      small{color:#667085}button{background:#176c43;color:white;border:0;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer}
      button:disabled{opacity:.5;cursor:default}.failure{color:#b42318;font-size:14px;white-space:pre-wrap}.feedback{font-size:14px;color:#17376e}
    `}</style>
  </form>;
}
