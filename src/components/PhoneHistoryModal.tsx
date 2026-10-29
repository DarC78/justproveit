import {useEffect,useRef,useState} from "react";
import {getScheduledPhoneHistory,PhoneHistoryEvent,ScheduledCallRow,ScheduledPhoneHistory} from "@/lib/crmAdmin";

const clock=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"medium"});
function dateTime(value:string|null){const at=Date.parse(value||"");return Number.isFinite(at)?clock.format(at):"Time unavailable";}
function duration(value:number|null){if(value==null)return "Unavailable";const total=Math.max(0,Math.round(value));return `${Math.floor(total/60)}m ${String(total%60).padStart(2,"0")}s`;}
function phoneKey(phone:string){let digits=phone.replace(/\D/g,"");if(digits.startsWith("00"))digits=digits.slice(2);
  if(digits.startsWith("0")&&digits.length===11)digits="44"+digits.slice(1);
  else if(digits.startsWith("0")&&digits.length===10)digits="40"+digits.slice(1);return digits;}

export function PhoneHistoryTimeline({events}:{events:PhoneHistoryEvent[]}) {
  return <ol className="timeline" aria-label="WhatsApp messages and calls, oldest first">
    {events.map(event=><li key={event.id} className={event.kind==="call"?"call":event.direction}>
      <article>
        <div className="event-heading"><strong>{event.kind==="call"?"Phone call":event.direction==="inbound"?"WhatsApp · Client":"WhatsApp · ProveIt"}</strong>
          <time dateTime={event.atUtc||undefined}>{dateTime(event.atUtc)}</time></div>
        {event.kind==="whatsapp"?<><p className="author">{event.author}{event.messageType!=="text"?` · ${event.messageType}`:""}</p><p className="body">{event.text}</p></>
          : <><p className="resolution">{event.resolution}{event.callCode!=null?` · Callcode ${event.callCode}`:""}</p>
            <dl><div><dt>Agent</dt><dd>{event.agent}</dd></div><div><dt>Call type</dt><dd>{event.callType}</dd></div>
              <div><dt>Total duration</dt><dd>{duration(event.durationSeconds)}</dd></div><div><dt>Agent talk time</dt><dd>{duration(event.talkSeconds)}</dd></div>
              <div><dt>Ended</dt><dd>{event.endedAtUtc?dateTime(event.endedAtUtc):"Unavailable"}</dd></div></dl></>}
      </article>
    </li>)}
    <style jsx>{`
      .timeline{list-style:none;margin:0;padding:0;display:grid;gap:16px}li{border:1px solid #dce3ee;border-radius:9px;padding:16px;min-width:0}
      .inbound{background:white;margin-right:8%}.outbound{background:#e4f4ea;margin-left:8%}.call{background:#edf3ff;border-left:4px solid #315fba}
      .event-heading{display:flex;align-items:start;justify-content:space-between;gap:14px;font-size:14px}time{font-size:12px;white-space:nowrap;color:#526077}
      .author{font-size:11px;color:#667085;margin:6px 0}.body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.65;margin:10px 0 0}
      .resolution{font-weight:700;color:#17376e;font-size:14px;margin:10px 0}dl{display:flex;flex-wrap:wrap;gap:12px 28px;margin:0;font-size:12px}dt{color:#667085}dd{margin:4px 0 0;font-weight:600}
      @media(max-width:600px){.event-heading{display:grid;gap:6px}.inbound{margin-right:2%}.outbound{margin-left:2%}li{padding:12px}}
    `}</style>
  </ol>;
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
      if(controller.signal.aborted)return;setLoading(true);setError("");setHistory(null);
      try{const result=await getScheduledPhoneHistory(token,booking.intentId,controller.signal);
        if(result.intentId.toLowerCase()!==booking.intentId.toLowerCase()||phoneKey(result.phone)!==phoneKey(booking.phone||"")||!Array.isArray(result.events))
          throw new Error("The history does not match this phone number. Reload the schedule.");
        if(!controller.signal.aborted)setHistory(result);
      }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to load the phone history.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    });return()=>controller.abort();
  },[token,booking.intentId,booking.phone,refresh]);
  return <dialog ref={dialog} aria-labelledby="phone-history-title" aria-describedby="phone-history-description"
    onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="window">
      <header><div><h2 id="phone-history-title">WhatsApp &amp; call history</h2><p>{booking.name||"Client"} · {booking.phone}</p></div>
        <div className="controls"><button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button>
          <button type="button" onClick={onClose} aria-label="Close phone history">Close</button></div></header>
      <p id="phone-history-description" className="description">Full recorded history for this number · Oldest first · All times UK. Queued WhatsApp messages are not shown as sent.</p>
      <div className="content" aria-busy={loading} aria-live="polite">
        {loading?<p className="status">Loading the full WhatsApp conversation and call history...</p>:error?<p role="alert" className="error">{error}</p>:history&&<>
          <p className="totals">{history.whatsAppMessages} WhatsApp messages · {history.calls} calls</p>
          {history.events.length?<PhoneHistoryTimeline events={history.events}/>:<p className="status">No recorded WhatsApp messages or calls were found for this number.</p>}
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
