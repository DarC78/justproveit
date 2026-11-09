import WhatsAppReplyComposer from "@/components/WhatsAppReplyComposer";
import {useEffect,useRef,useState} from "react";
import {getPhoneHistoryImage,getCrmStripeHistory,CrmStripeEvent,getCrmEmailHistory,getCrmEmailBody,CrmEmailBody,CrmEmailEvent,getScheduledPhoneHistory,PhoneHistoryEvent,ScheduledCallRow,ScheduledPhoneHistory,CallTranscription} from "@/lib/crmAdmin";

const clock=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"medium"});
function dateTime(value:string|null){const at=Date.parse(value||"");return Number.isFinite(at)?clock.format(at):"Time unavailable";}
function duration(value:number|null){if(value==null)return "Unavailable";const total=Math.max(0,Math.round(value));return `${Math.floor(total/60)}m ${String(total%60).padStart(2,"0")}s`;}
function phoneKey(phone:string){let digits=phone.replace(/\D/g,"");if(digits.startsWith("00"))digits=digits.slice(2);
  if(digits.startsWith("0")&&digits.length===11)digits="44"+digits.slice(1);
  else if(digits.startsWith("0")&&digits.length===10)digits="40"+digits.slice(1);return digits;}

export function CallTranscriptRow({item}:{item:CallTranscription}) {
  const [expanded,setExpanded]=useState(false);
  const waiting=item.status==="awaiting_audio"||item.status==="pending";
  return <section aria-label="Call transcription" style={{borderTop:"1px solid #cbd5e1",marginTop:14,paddingTop:12}}>
    <strong>Call summary</strong>
    {item.summary?<p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{item.summary}</p>:
      <p>{item.status==="budget_paused"?"Transcription paused by the USD 30 spending limit. Contact the administrator before resuming.":waiting?"Waiting for a playable recording.":item.status==="processing"||item.status==="transcribed"?"Transcription and summary are being prepared.":item.status==="ineligible"?"This call is no longer eligible for automatic transcription.":"Transcription needs review. The recording has not been marked as transcribed."}</p>}
    {item.transcript&&<><button type="button" aria-expanded={expanded} aria-controls={`transcript-${item.recordingId}`} onClick={()=>setExpanded(value=>!value)}
      style={{background:"white",border:"1px solid #94a3b8",borderRadius:5,padding:"7px 11px",cursor:"pointer",color:"#17376e"}}>{expanded?"Hide full transcript":"View full transcript"}</button>
      {expanded&&<div id={`transcript-${item.recordingId}`} style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",marginTop:12,lineHeight:1.65}}>{item.transcript}</div>}</>}
  </section>;
}

type ImageTarget={token:string;kind:"contact"|"booking";id:string};
export function WhatsAppHistoryImage({target,messageId,name}:{target:ImageTarget;messageId:string;name:string}){
 const holder=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false),[url,setUrl]=useState(""),[error,setError]=useState(""),[expanded,setExpanded]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{if(typeof IntersectionObserver==="undefined"){queueMicrotask(()=>setVisible(true));return;}const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:"200px"});if(holder.current)observer.observe(holder.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!visible)return;const controller=new AbortController();let objectUrl="";
  Promise.resolve().then(()=>{if(controller.signal.aborted)return null;setError("");setUrl("");return getPhoneHistoryImage(target.token,target.kind,target.id,messageId,controller.signal);}).then(blob=>{if(controller.signal.aborted||!blob)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);}).catch(()=>{if(!controller.signal.aborted)setError("Fotografia nu poate fi încărcată. Este posibil să nu mai fie disponibilă în WhatsApp.");});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[visible,target.token,target.kind,target.id,messageId,attempt]);
 return <div ref={holder} style={{marginTop:12,minHeight:70}}>{error?<p role="status">{error} <button type="button" onClick={()=>setAttempt(n=>n+1)}>Reîncearcă</button></p>:url?<><button type="button" aria-label="Mărește fotografia WhatsApp" onClick={()=>setExpanded(true)} style={{border:0,background:"transparent",cursor:"zoom-in",padding:0}}><img src={url} alt={name} style={{display:"block",maxWidth:"100%",maxHeight:260,borderRadius:8,objectFit:"contain"}}/></button>{expanded&&<dialog open aria-label="Fotografie WhatsApp" style={{position:"fixed",inset:0,zIndex:10000,maxWidth:"95vw",maxHeight:"95vh",overflow:"auto"}} onKeyDown={event=>{if(event.key==="Escape")setExpanded(false);}}><button type="button" autoFocus onClick={()=>setExpanded(false)}>Închide</button><img src={url} alt={name} style={{display:"block",maxWidth:"85vw",maxHeight:"80vh",objectFit:"contain"}}/></dialog>}</>:<p role="status">Se încarcă fotografia…</p>}</div>;
}


export function EmailHistoryRecord({item,target}:{item:CrmEmailEvent;target:ImageTarget}){
 const [expanded,setExpanded]=useState(false),[body,setBody]=useState<CrmEmailBody|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const loadBody=async()=>{if(loading)return;setLoading(true);setError("");try{setBody(await getCrmEmailBody(target.token,target.kind,target.id,item.id));}catch{setError("The original email is unavailable. Try again or open the source mailbox.");}finally{setLoading(false);}};
 const open=()=>{setExpanded(current=>!current);if(!expanded&&!body&&!loading)void loadBody();};
 const frame=body?.html?"<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none';\">"+body.html:"";
 return <section><button type="button" aria-expanded={expanded} onClick={()=>void open()} style={{border:0,background:"transparent",padding:"8px 0",color:"#17376e",fontWeight:700,textAlign:"left",cursor:"pointer",overflowWrap:"anywhere"}}>{expanded?"Hide:":"View:"} {item.subject}</button>
 {expanded&&<div><p style={{fontSize:12}}>From: {item.from}<br/>Source: {item.mailbox==="system"?"ProveIt system email":item.mailbox}</p>{loading?<p role="status">Loading email...</p>:error?<p role="alert">{error} <button type="button" onClick={()=>void loadBody()}>Retry</button></p>:body&&<><p style={{fontSize:12}}>To: {body.to.join(", ")}</p>{body.html?<iframe title={item.subject} sandbox="" referrerPolicy="no-referrer" srcDoc={frame} style={{width:"100%",height:500,border:"1px solid #cbd5e1",background:"white"}}/>:<pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontFamily:"inherit",lineHeight:1.6}}>{body.text||"No message body was stored."}</pre>}</>}</div>}
 </section>;
}

export function StripeHistoryRecord({item}:{item:CrmStripeEvent}) {
 let amount="";
 if(item.amount!=null&&item.currency){try{const fmt=new Intl.NumberFormat("en-GB",{style:"currency",currency:item.currency});const digits=fmt.resolvedOptions().maximumFractionDigits??2;amount=fmt.format(item.amount/(10**digits));}catch{amount=String(item.amount)+" minor units "+item.currency;}}
 return <section><p style={{fontWeight:700}}>{item.label}{amount?" - "+amount:""}</p>{item.status&&<p>Status: {item.status}</p>}<p style={{fontSize:12,overflowWrap:"anywhere"}}>Reference: {item.reference}</p></section>;
}

export function PhoneHistoryTimeline({events,imageTarget}:{events:PhoneHistoryEvent[];imageTarget?:ImageTarget}) {
  const [stripeEvents,setStripeEvents]=useState<CrmStripeEvent[]>([]),[stripeCursor,setStripeCursor]=useState<string|null>(null),[stripeError,setStripeError]=useState(""),[stripeLoading,setStripeLoading]=useState(false);
  const stripeTarget=useRef(imageTarget);stripeTarget.current=imageTarget;
  useEffect(()=>{setStripeEvents([]);setStripeCursor(null);setStripeError("");if(!imageTarget)return;const controller=new AbortController();let loading=false,initialized=false;
    const refresh=async()=>{if(loading)return;loading=true;try{const result=await getCrmStripeHistory(imageTarget.token,imageTarget.kind,imageTarget.id,null,controller.signal);if(!controller.signal.aborted){setStripeEvents(current=>[...new Map([...current,...result.items].map(e=>[e.id,e])).values()]);if(!initialized){setStripeCursor(result.nextCursor);initialized=true;}setStripeError("");}}catch{if(!controller.signal.aborted)setStripeError("Stripe history is unavailable. Other interactions remain visible.");}finally{loading=false;}};
    void refresh();const interval=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},60000);return()=>{controller.abort();clearInterval(interval);};
  },[imageTarget?.token,imageTarget?.kind,imageTarget?.id]);
  const olderStripe=async()=>{if(!imageTarget||!stripeCursor)return;const target=imageTarget;setStripeLoading(true);try{const result=await getCrmStripeHistory(target.token,target.kind,target.id,stripeCursor);if(stripeTarget.current?.id!==target.id||stripeTarget.current?.kind!==target.kind||stripeTarget.current?.token!==target.token)return;setStripeEvents(current=>[...new Map([...current,...result.items].map(e=>[e.id,e])).values()]);setStripeCursor(result.nextCursor);setStripeError("");}catch{setStripeError("Older Stripe events could not be loaded. Please retry.");}finally{setStripeLoading(false);}};
  const emailInitialized=useRef(false);const [emailPending,setEmailPending]=useState(false);
  const [emails,setEmails]=useState<CrmEmailEvent[]>([]),[emailCursor,setEmailCursor]=useState<string|null>(null),[emailError,setEmailError]=useState(""),[emailLoading,setEmailLoading]=useState(false);
  useEffect(()=>{emailInitialized.current=false;setEmails([]);setEmailPending(false);setEmailCursor(null);setEmailError("");if(!imageTarget)return;const controller=new AbortController();let loading=false;
    const refresh=async()=>{if(loading)return;loading=true;try{const result=await getCrmEmailHistory(imageTarget.token,imageTarget.kind,imageTarget.id,null,controller.signal);if(!controller.signal.aborted){setEmails(current=>[...new Map([...current,...result.items].map(e=>[e.id,e])).values()]);if(!emailInitialized.current){setEmailCursor(result.nextCursor);emailInitialized.current=true;}setEmailError("");setEmailPending(Boolean(result.systemArchivePending));}}catch{if(!controller.signal.aborted)setEmailError("Email history is unavailable. Calls and WhatsApp history remain visible.");}finally{loading=false;}};
    void refresh();const interval=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},60000);return()=>{controller.abort();clearInterval(interval);};
  },[imageTarget?.token,imageTarget?.kind,imageTarget?.id]);
  const olderEmails=async()=>{if(!imageTarget||!emailCursor)return;setEmailLoading(true);try{const result=await getCrmEmailHistory(imageTarget.token,imageTarget.kind,imageTarget.id,emailCursor);setEmails(current=>[...new Map([...current,...result.items].map(e=>[e.id,e])).values()]);setEmailCursor(result.nextCursor);setEmailError("");}catch{setEmailError("Older emails could not be loaded. Please retry.");}finally{setEmailLoading(false);}};
  const ordered=[...events,...emails,...stripeEvents].sort((a,b)=>{const left=Date.parse(a.atUtc||''),right=Date.parse(b.atUtc||'');return (Number.isFinite(right)?right:-Infinity)-(Number.isFinite(left)?left:-Infinity)||a.id.localeCompare(b.id,undefined,{numeric:true});});
  return <>{stripeError&&<p role="status">{stripeError}</p>}{emailPending&&<p role="status">Older system emails are being verified in the background and will appear here automatically.</p>}{emailError&&<p role="status">{emailError}</p>}<ol className="timeline" aria-label="Calls, WhatsApp messages and emails, newest first">
    {ordered.map(event=><li key={event.id} className={event.kind==="stripe"?"stripe":event.kind==="email"?`email ${event.direction}`:event.kind==="call"?"call":event.direction}>
      <article>
        <div className="event-heading"><strong>{event.kind==="stripe"?`Stripe - ${event.source==="proveit"?"ProveIt":"JustProveIt"}`:event.kind==="email"?"Email":event.kind==="call"?"Phone call":event.direction==="inbound"?"WhatsApp · Client":"WhatsApp · ProveIt"}</strong>
          <time dateTime={event.atUtc||undefined}>{dateTime(event.atUtc)}</time></div>
        {event.kind==="stripe"?<StripeHistoryRecord item={event}/>:event.kind==="email"?imageTarget?<EmailHistoryRecord key={imageTarget.id+event.id} item={event} target={imageTarget}/>:<p>{event.subject}</p>:event.kind==="whatsapp"?<><p className="author">{event.author}{event.source?` · ${event.source}`:""}{event.messageType!=="text"?` · ${event.messageType}`:""}</p>{(!event.image||!event.text.startsWith("[Mesaj "))&&<p className="body">{event.text}</p>}{event.image&&imageTarget&&<WhatsAppHistoryImage target={imageTarget} messageId={event.id} name={event.image.name}/>}{event.direction==="outbound"&&event.status!=="recorded"&&<p className={event.status==="failed"?"delivery failure":"delivery"} role={event.status==="failed"?"alert":undefined}>Status: {event.status==="accepted"?"Accepted by WhatsApp (delivery not confirmed)":event.status}{event.errorMessage?` ? ${event.errorMessage}`:""}</p>}</>
          : <><p className="resolution">{event.resolution}{event.callCode!=null?` · Callcode ${event.callCode}`:""}</p>
            <dl><div><dt>Agent</dt><dd>{event.agent}</dd></div><div><dt>Call type</dt><dd>{event.callType}</dd></div>
              <div><dt>Total duration</dt><dd>{duration(event.durationSeconds)}</dd></div><div><dt>Agent talk time</dt><dd>{duration(event.talkSeconds)}</dd></div>
              <div><dt>Ended</dt><dd>{event.endedAtUtc?dateTime(event.endedAtUtc):"Unavailable"}</dd></div></dl>
              {event.transcriptions?.map(item=><CallTranscriptRow key={item.recordingId} item={item}/>)}</>}
      </article>
    </li>)}
    <style jsx>{`
      .timeline{list-style:none;margin:0;padding:0;display:grid;gap:16px}li{border:1px solid #dce3ee;border-radius:9px;padding:16px;min-width:0}
      .inbound{background:white;margin-right:8%}.outbound{background:#e4f4ea;margin-left:8%}.call{background:#edf3ff;border-left:4px solid #315fba}.email{background:#fff9db;border-color:#eadb9a}.stripe{background:#f3efff;border-left:4px solid #7861bd}
      .event-heading{display:flex;align-items:start;justify-content:space-between;gap:14px;font-size:14px}time{font-size:12px;white-space:nowrap;color:#526077}
      .author{font-size:11px;color:#667085;margin:6px 0}.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65;margin:10px 0 0}
      .delivery{font-size:12px;font-weight:600;margin:12px 0 0}.failure{color:#b42318}.resolution{font-weight:700;color:#17376e;font-size:14px;margin:10px 0}dl{display:flex;flex-wrap:wrap;gap:12px 28px;margin:0;font-size:12px}dt{color:#667085}dd{margin:4px 0 0;font-weight:600}
      @media(max-width:600px){.event-heading{display:grid;gap:6px}.inbound{margin-right:2%}.outbound{margin-left:2%}li{padding:12px}}
    `}</style>
  </ol>{stripeCursor&&<button type="button" disabled={stripeLoading} onClick={()=>void olderStripe()}>{stripeLoading?"Loading Stripe events...":"Load older Stripe events"}</button>}{emailCursor&&<button type="button" disabled={emailLoading} onClick={()=>void olderEmails()}>{emailLoading?"Loading emails...":"Load older emails"}</button>}</>;
}

export default function PhoneHistoryModal({token,booking,onClose}:{token:string;booking:ScheduledCallRow;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [history,setHistory]=useState<ScheduledPhoneHistory|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    element.showModal();
    return()=>{element.close();document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    Promise.resolve().then(async()=>{
      if(controller.signal.aborted)return;setLoading(true);setError("");
      try{const result=await getScheduledPhoneHistory(token,booking.intentId,controller.signal,refresh>0);
        if(result.intentId.toLowerCase()!==booking.intentId.toLowerCase()||phoneKey(result.phone)!==phoneKey(booking.phone||"")||!Array.isArray(result.events))
          throw new Error("The history does not match this phone number. Reload the schedule.");
        if(!controller.signal.aborted)setHistory(result);
      }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to load the phone history.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    });return()=>controller.abort();
  },[token,booking.intentId,booking.phone,refresh]);
  useEffect(()=>{
    const controller=new AbortController();let active=false;
    const interval=setInterval(async()=>{
      if(document.visibilityState!=="visible"||active)return;active=true;
      try{const value=await getScheduledPhoneHistory(token,booking.intentId,controller.signal,true);
        if(!controller.signal.aborted&&value.intentId.toLowerCase()===booking.intentId.toLowerCase()&&phoneKey(value.phone)===phoneKey(booking.phone||""))setHistory(value);
      }catch{/* Keep the existing timeline and draft; manual Refresh exposes read errors. */}
      finally{active=false;}
    },15000);
    return()=>{controller.abort();clearInterval(interval);};
  },[token,booking.intentId,booking.phone]);
  const matched=history&&history.intentId.toLowerCase()===booking.intentId.toLowerCase()&&phoneKey(history.phone)===phoneKey(booking.phone||"");
  return <dialog ref={dialog} aria-labelledby="phone-history-title" aria-describedby="phone-history-description"
    onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="window">
      <header><div><h2 id="phone-history-title">Calls, WhatsApp &amp; email history</h2><p>{booking.name||"Client"} · {booking.phone}</p></div>
        <div className="controls"><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button>
          <button type="button" onClick={onClose} aria-label="Close phone history">Close</button></div></header>
      <p id="phone-history-description" className="description">Full recorded history for this number · Newest first · All times UK. Queued WhatsApp messages are not shown as sent.</p>
      <div className="content" aria-busy={loading} aria-live="polite">
        {process.env.NEXT_PUBLIC_CRM_READ_ONLY_PREVIEW!=='true'&&booking.phone&&<WhatsAppReplyComposer key={booking.intentId+booking.phone} token={token} intentId={booking.intentId} phone={booking.phone} onSent={()=>setRefresh(value=>value+1)}/>}
        {loading&&!matched?<p className="status">Loading the full WhatsApp conversation and call history...</p>:!matched&&error?<p role="alert" className="error">{error}</p>:matched&&history&&<>
          {error&&<p role="alert" className="error">{error}</p>}<p className="totals">{history.whatsAppMessages} WhatsApp messages · {history.calls} calls</p>
          <PhoneHistoryTimeline events={history.events} imageTarget={{token,kind:"booking",id:booking.intentId}}/>
        </>}
      </div>
    </div>
    <style jsx>{`
      dialog{position:fixed;inset:0;margin:auto;width:80vw;height:80vh;max-width:none;max-height:none;padding:0;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#344054;box-shadow:0 24px 80px #0005;overflow:hidden}
      dialog::backdrop{background:rgba(15,23,42,.58)}.window{height:100%;display:flex;flex-direction:column;min-height:0;text-align:left}
      header{display:flex;justify-content:space-between;align-items:start;gap:18px;background:white;border-bottom:1px solid #dce3ee;padding:20px 24px;flex-shrink:0}
      h2{font-size:22px;color:#17376e;margin:0 0 7px}header p{font-size:14px;margin:0;overflow-wrap:anywhere}.controls{display:flex;gap:8px}
      button{border:1px solid #cbd5e1;border-radius:5px;background:white;color:#123c92;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer}
      button:disabled{opacity:.5;cursor:default}.description{font-size:12px;line-height:1.5;margin:0;padding:12px 24px;border-bottom:1px solid #e2e8f0;flex-shrink:0;color:#667085}
      .content{overflow-y:auto;padding:18px 24px;flex:1;min-height:0}.totals{font-weight:700;font-size:13px;margin:0 0 16px}.status,.error{font-size:14px;padding:16px;background:white;border-radius:7px}.error{color:#b42318}
      @media(max-width:600px){header{padding:14px;flex-wrap:wrap}h2{font-size:18px}.content{padding:14px}.description{padding:10px 14px}}
    `}</style>
  </dialog>;
}
