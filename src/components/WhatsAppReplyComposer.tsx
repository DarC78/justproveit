import SendComposerSms from './SendComposerSms';
import {API_BASE_URL} from '@/lib/auth';
import ScheduleWhatsAppReply from './ScheduleWhatsAppReply';
import UploadWhatsAppPicture,{type UploadedWhatsAppPicture} from './UploadWhatsAppPicture';
import {FormEvent, useEffect, useId, useRef, useState} from "react";
import {sendContactWhatsAppReply,sendScheduledWhatsAppReply, WhatsAppReplyResult, ComposerRequest, ComposerTemplate, AgentMessageTemplate, getComposerAgentTemplates, getComposerTemplates,getWhatsAppReplyRouting,WhatsAppReplyRouting} from "@/lib/crmAdmin";

export default function WhatsAppReplyComposer({token,intentId,contactId,phone,onSent,onSmsSent}:{token:string;intentId?:string;contactId?:string;phone:string;name?:string;onSent:(result:WhatsAppReplyResult)=>void;onSmsSent?:()=>void}) {
  const fieldId=useId();
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const [picture,setPicture]=useState<UploadedWhatsAppPicture|null>(null),[uploading,setUploading]=useState(false);
  const [proposing,setProposing]=useState(false);
  const [scheduleLocked,setScheduleLocked]=useState(false);
  const [smsLocked,setSmsLocked]=useState(false);
  const [result,setResult]=useState<WhatsAppReplyResult|null>(null);
  const [error,setError]=useState("");
  const [routing,setRouting]=useState<WhatsAppReplyRouting|null>(null),[routingError,setRoutingError]=useState(''),[routingRevision,setRoutingRevision]=useState(0);
  useEffect(()=>{let active=true;setRouting(null);setRoutingError('');getWhatsAppReplyRouting(token,contactId?'contact':'booking',contactId||intentId!).then(value=>{if(active)setRouting(value);}).catch(()=>{if(active)setRoutingError('Unable to check the latest WhatsApp channel. Refresh the reply channel before sending.');});return()=>{active=false;};},[token,contactId,intentId,routingRevision]);
  const attempt=useRef<ComposerRequest|null>(null);
  const busy=useRef(false);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const [templates,setTemplates]=useState<ComposerTemplate[]>([]),[templateError,setTemplateError]=useState("");
  const [selected,setSelected]=useState(""),[values,setValues]=useState<Record<string,string>>({}),[headerUrl,setHeaderUrl]=useState("");
  useEffect(()=>{let active=true;getComposerTemplates(token).then(result=>{if(active)setTemplates(result.templates);}).catch(()=>{if(active)setTemplateError("Unable to load approved Meta templates. Free text is still available.");});return()=>{active=false;};},[token]);
  const [agentTemplates,setAgentTemplates]=useState<AgentMessageTemplate[]>([]),[agentTemplateError,setAgentTemplateError]=useState("");
  useEffect(()=>{let active=true;setAgentTemplates([]);setAgentTemplateError("");getComposerAgentTemplates(token).then(result=>{if(active){setAgentTemplates(result.templates);setAgentTemplateError(result.error?(result.templates.some(item=>item.body)?"Numele din Mediatel nu este disponibil. Completați manual semnătura în mesaj.":result.error):"");}}).catch(()=>{if(active)setAgentTemplateError("Unable to load agent templates. Free text is still available.");});return()=>{active=false;};},[token]);
  const template=templates.find(item=>item.name+":"+item.language===selected);
  const fields:Array<{key:string;label:string}>=[];
  for(const component of template?.components||[]){
    const type=component.type.toLowerCase();
    for(const name of [...new Set([...(component.text||"").matchAll(/\{\{(\w+)\}\}/g)].map(match=>match[1]))])fields.push({key:type+":"+name,label:type+" ? "+name});
    for(const [index,button] of (component.buttons||[]).entries())if(button.url?.includes("{{"))fields.push({key:"button:"+index,label:"Button "+(index+1)+" value"});
  }
  const media=template?.components.find(c=>c.type==="HEADER"&&["IMAGE","VIDEO","DOCUMENT"].includes(c.format||""));
  const selectedAgent=agentTemplates.find(item=>"agent:"+item.id===selected);
  const missingSignature=!template&&(text.includes("[Numele agentului]")||!!selectedAgent&&!selectedAgent.text&&text.trim().endsWith("O zi bună,"));
  const valid=!missingSignature&&(template?fields.every(field=>!!values[field.key]?.trim())&&(!media||/^https:\/\//i.test(headerUrl)):picture?text.trim().length<=1024:!!text.trim());
  const preview=template?.components.filter(c=>c.text).map(c=>(c.text||"").replace(/\{\{(\w+)\}\}/g,(match,name)=>values[c.type.toLowerCase()+":"+name]||match)).join("\n\n");
  const unresolved=!!attempt.current&&(!!error||result?.status==="processing"||result?.status==='queued');
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy.current||uploading||scheduleLocked||smsLocked||(!attempt.current&&!valid))return;
    busy.current=true;setSending(true);setError("");
    const current=attempt.current||{requestId:crypto.randomUUID(),...(template?{templateName:template.name,templateLanguage:template.language,parameters:values,headerUrl}:{text:text.trim(),...(picture?{pictureId:picture.pictureId}:{})})};
    attempt.current=current;
    try {
      const response=await (contactId?sendContactWhatsAppReply(token,contactId,{...current,expectedPhone:phone}):sendScheduledWhatsAppReply(token,intentId!,{...current,expectedPhone:phone}));
      if(!mounted.current)return;
      setResult(response);
      if(["accepted","sent","delivered","read"].includes(response.status)) {
        setText("");setPicture(null);attempt.current=null;
      } else if(response.status==="failed") {
        attempt.current=null;
      }
      onSent(response);
    } catch(cause) {
      if(mounted.current)setError((cause instanceof Error?cause.message:"Unable to confirm the send.")+" Use Check send status to safely check the same request; do not create another copy.");
    } finally {busy.current=false;if(mounted.current)setSending(false);}
  }
  async function propose(){
    if(busy.current||uploading||scheduleLocked||smsLocked||unresolved||(!contactId&&!intentId))return;
    busy.current=true;setProposing(true);setError("");
    try{
      const base=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL).replace(/\/+$/,'');
      const r=await fetch(base+'/justproveit/admin/crm/'+(contactId?'contacts':'scheduled-calls')+'/'+encodeURIComponent(contactId||intentId!)+'/proposed-reply',{method:'POST',headers:{Authorization:'Bearer '+token},cache:'no-store'}),data=await r.json();
      if(!r.ok)throw Error(data.error?.message||'Unable to propose an answer.');
      if(!data.success||String(contactId?data.contactId:data.intentId).toLowerCase()!==String(contactId||intentId).toLowerCase()||typeof data.text!=='string'||!data.text.trim()||data.text.length>4096)throw Error('Unable to verify the proposed answer. Please try again.');
      if(mounted.current){setText(data.text);setSelected("");setValues({});setHeaderUrl("");setResult(null);}
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Unable to propose an answer.');}
    finally{busy.current=false;if(mounted.current)setProposing(false);}
  }
  return <section className="reply-composer"><form id={fieldId+"-form"} onSubmit={submit} aria-label="Reply on WhatsApp">
    <label htmlFor={fieldId+"-template"}>Templates</label>
    <select id={fieldId+"-template"} value={selected} disabled={uploading||!!picture||proposing||sending||scheduleLocked||smsLocked||unresolved} onChange={event=>{setSelected(event.target.value);const agent=agentTemplates.find(item=>"agent:"+item.id===event.target.value);if(agent)setText(agent.text||(agent.body?agent.body+"\n\nO zi bună,\n[Numele agentului]":""));setValues({});setHeaderUrl("");setResult(null);setError("");}}>
      <option value="">Free text message</option>{agentTemplates.map(item=><option disabled={!item.text&&!item.body} key={"agent:"+item.id} value={"agent:"+item.id}>{item.name}</option>)}{templates.map(item=><option disabled={routing?.channel==='agents'} key={item.name+":"+item.language} value={item.name+":"+item.language}>Meta - {item.name} ({item.language})</option>)}
    </select>
    {agentTemplateError&&<p role="status" className="help">{agentTemplateError}</p>}
    {templateError&&<p role="alert" className="failure">{templateError}</p>}
    {fields.map(field=><label key={field.key}>{field.label}<input maxLength={1024} disabled={proposing||sending||scheduleLocked||smsLocked||unresolved} value={values[field.key]||""} onChange={event=>setValues({...values,[field.key]:event.target.value})}/></label>)}
    {media&&<label>{media.format} attachment URL<input type="url" disabled={proposing||sending||scheduleLocked||smsLocked||unresolved} value={headerUrl} placeholder="https://..." onChange={event=>setHeaderUrl(event.target.value)}/></label>}
    <label htmlFor={fieldId+"-reply"}>Reply on WhatsApp</label>
    <p className="help">Send to {phone}. {routing?<>Reply channel: <strong>{routing.channelLabel}</strong>. {routing.reason==='mediatel_window_closed'||routing.reason==='no_open_mediatel_window'?'The Mediatel 24-hour window is closed. The first WhatsApp Agenti reply adds an introduction only if your message has no greeting.':'Uses the channel of the latest incoming WhatsApp message.'} {!routing.available&&'WhatsApp Agenti is not available yet. Please contact an administrator.'}</>:routingError?'Reply channel could not be verified.':'Checking the latest reply channel...'} The channel is checked again when you send.</p>
    {routingError&&<p role="alert" className="failure">{routingError}</p>}

    {missingSignature&&<p className="help">Înlocuiți [Numele agentului] cu numele dumneavoastră înainte de trimitere sau programare.</p>}
    <textarea id={fieldId+"-reply"} rows={10} maxLength={picture?1024:4096} value={template?preview:text} disabled={uploading||proposing||sending||scheduleLocked||smsLocked||unresolved||!!template}
      onChange={event=>{setText(event.target.value);setResult(null);setError("");}} placeholder="Type your WhatsApp reply…" />
    </form><div className="actions"><small>{template?"Approved template preview":text.length+'/'+(picture?1024:4096)}</small><div className="send-actions"><button type="submit" form={fieldId+"-form"} disabled={uploading||proposing||sending||scheduleLocked||smsLocked||(!unresolved&&(!valid||!routing?.available||Boolean(template&&routing.channel==='agents')))}>
      {sending?"Sending…":unresolved?"Check send status":"Send WhatsApp"}</button>{contactId&&<ScheduleWhatsAppReply token={token} contactId={contactId} phone={phone} text={text} pictureId={picture?.pictureId} disabled={smsLocked||uploading||proposing||sending||unresolved||!!template||!valid} onLockChange={setScheduleLocked} onScheduled={()=>{setText("");setPicture(null);setResult(null);setError("");}}/>}{(contactId||intentId)&&<button type="button" disabled={uploading||proposing||sending||scheduleLocked||smsLocked||unresolved} onClick={()=>void propose()}>{proposing?"Proposing...":"Propose an answer"}</button>}<UploadWhatsAppPicture token={token} contactId={contactId} intentId={intentId} phone={phone} picture={picture} disabled={proposing||sending||scheduleLocked||smsLocked||unresolved||!!template} onBusyChange={setUploading} onChange={value=>{setPicture(value);setResult(null);setError('');}}/><SendComposerSms token={token} contactId={contactId} intentId={intentId} phone={phone} text={template?preview||'':text} disabled={uploading||proposing||sending||scheduleLocked||unresolved||Boolean(template&&fields.some(field=>!values[field.key]?.trim()))||missingSignature} onLockChange={setSmsLocked} onSent={()=>{setText('');setSelected('');setValues({});setHeaderUrl('');setResult(null);setError('');onSmsSent?.();}}/></div></div>
    <button type="button" disabled={proposing||sending} onClick={()=>setRoutingRevision(n=>n+1)}>Refresh reply channel</button>
    {error?<p role="alert" className="failure">{error}</p>:result&&<p role={result.status==="failed"?"alert":"status"} className={result.status==="failed"?"failure":"feedback"}>
      {result.status==="failed"?result.errorMessage||"WhatsApp could not deliver the reply. Your text has been kept.":
        result.status==='queued'?"Queued for WhatsApp Agenti. It has not been confirmed sent yet. Check send status to follow the same request.":result.status==="processing"?result.errorMessage||"The send is still being confirmed. Check its status before sending again.":
        result.status==="accepted"?"WhatsApp accepted the reply. Delivery is not yet confirmed; the history updates automatically.":`WhatsApp reply: ${result.status}.`}
    </p>}
    <style jsx>{`
      .reply-composer{margin-top:24px;padding:18px;background:white;border:1px solid #cbd5e1;border-radius:9px}
      label{display:block;font-weight:700;color:#17376e}.help{font-size:12px;color:#667085;line-height:1.5}
      select,input{box-sizing:border-box;width:100%;padding:10px;border:1px solid #94a3b8;border-radius:6px;margin:6px 0 12px;font:inherit}label{font-size:13px}
      textarea{display:block;box-sizing:border-box;width:100%;resize:vertical;padding:12px;border:1px solid #94a3b8;border-radius:6px;font:inherit;color:#344054;background:white}
      textarea:focus{outline:2px solid #315fba;outline-offset:2px}.send-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.actions{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:10px}
      small{color:#667085}button{background:#176c43;color:white;border:0;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer}
      button:disabled{opacity:.5;cursor:default}.failure{color:#b42318;font-size:14px;white-space:pre-wrap}.feedback{font-size:14px;color:#17376e}
    `}</style>
  </section>;
}
