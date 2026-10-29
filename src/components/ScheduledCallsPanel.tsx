import {useEffect,useState} from "react";
import ScheduledCallsTable from "./ScheduledCallsTable";
import {listAttentionCrmCalls,listScheduledCrmCalls,AttentionCallsResponse,ScheduledCallsResponse} from "@/lib/crmAdmin";

const londonDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"});

export default function ScheduledCallsPanel({token}:{token:string}) {
  const [date,setDate]=useState(()=>londonDate.format(new Date()));
  const [days,setDays]=useState(7);
  const [report,setReport]=useState<ScheduledCallsResponse|null>(null);
  const [attention,setAttention]=useState<AttentionCallsResponse|null>(null);
  const [error,setError]=useState("");const [attentionError,setAttentionError]=useState("");
  const [loading,setLoading]=useState(true);const [attentionLoading,setAttentionLoading]=useState(true);
  const [refresh,setRefresh]=useState(0);const [notice,setNotice]=useState("");

  useEffect(()=>{
    const controller=new AbortController();
    Promise.resolve().then(async()=>{
      if(controller.signal.aborted)return;setLoading(true);setError("");
      try{const result=await listScheduledCrmCalls(token,date,controller.signal);
        if(result.date!==date||!Array.isArray(result.rows))throw new Error("The schedule response could not be verified. Please refresh.");
        if(!controller.signal.aborted)setReport(result);
      }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Unable to load scheduled calls.");}
      finally{if(!controller.signal.aborted)setLoading(false);}
    });return()=>controller.abort();
  },[token,date,refresh]);

  useEffect(()=>{
    const controller=new AbortController();
    Promise.resolve().then(async()=>{
      if(controller.signal.aborted)return;setAttentionLoading(true);setAttentionError("");
      try{const result=await listAttentionCrmCalls(token,days,controller.signal);
        if(result.lookbackDays!==days||!Array.isArray(result.rows))throw new Error("The Attention response could not be verified. Please refresh.");
        if(!controller.signal.aborted)setAttention(result);
      }catch(cause){if(!controller.signal.aborted)setAttentionError(cause instanceof Error?cause.message:"Unable to load Attention calls.");}
      finally{if(!controller.signal.aborted)setAttentionLoading(false);}
    });return()=>controller.abort();
  },[token,days,refresh]);

  function changed(message:string){setNotice(message);setRefresh(value=>value+1);}
  const rows=report?.date===date?report.rows:[];
  const attentionRows=attention?.lookbackDays===days?attention.rows:[];
  return <section className="scheduled-calls">
    <div className="heading"><div><h1>Scheduled calls</h1><p>Manual and Calendly bookings · All times are UK time</p></div>
      <button type="button" disabled={loading||attentionLoading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button></div>
    {notice&&<p role="status" className="notice">{notice}</p>}

    <section className="attention" aria-labelledby="attention-heading">
      <div className="heading"><div><h2 id="attention-heading">Attention</h2><p>Appointments due in the past {days} days, including earlier today.</p></div>
        <label>Past days<select value={days} onChange={event=>setDays(Number(event.target.value))}>
          {[1,3,7,14,30,60,90].map(value=><option key={value} value={value}>{value} {value===1?"day":"days"}</option>)}
        </select></label></div>
      <p className="note">Needs attention if there is no meaningful call and no WhatsApp Business mark, or if the latest Mediatel WhatsApp message is from the client. A meaningful call requires a valid outcome and more than 60 seconds of agent talk time on or after the appointment day.</p>
      <div aria-live="polite" aria-busy={attentionLoading}>
        {attentionLoading?<p className="status">Loading Attention calls...</p>:attentionError?<p role="alert" className="error">{attentionError}</p>:<>
          {attention?.warnings?.map(warning=><p className="warning" key={warning}>{warning}</p>)}
          <p className="count">{attentionRows.length} {attentionRows.length===1?"call needs":"calls need"} attention</p>
          {attentionRows.length?<ScheduledCallsTable token={token} rows={attentionRows} attention onChanged={changed}/>:<p className="status">No calls need attention in this period.</p>}
        </>}
      </div>
    </section>

    <div className="heading daily-heading"><h2>Scheduled calls by date</h2><label>Date<input type="date" value={date} onChange={event=>{if(event.target.value)setDate(event.target.value);}}/></label></div>
    <div aria-live="polite" aria-busy={loading}>
      {loading?<p className="status">Loading scheduled calls...</p>:error?<p role="alert" className="error">{error}</p>:<>
        {report?.warnings?.map(warning=><p className="warning" key={warning}>{warning}</p>)}
        <p className="count">{rows.length} {rows.length===1?"scheduled call":"scheduled calls"} on {date.split("-").reverse().join("/")}</p>
        {rows.length?<ScheduledCallsTable token={token} rows={rows} onChanged={changed}/>:<p className="status">No calls are booked for this date.</p>}
        <p className="note">Sent means a successful send or provider acceptance is recorded for this booking. Queued messages are not counted as sent. Agent conversations exclude voicemail and other non-conversation outcomes. Dialler membership shows the current state.</p>
      </>}
    </div>
    <style jsx>{`
      .scheduled-calls{margin:28px 0 70px;color:#344054}.heading{display:flex;align-items:end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:18px}
      h1{font-size:30px;margin:0 0 8px;color:#333}h2{font-size:23px;margin:0 0 8px;color:#17376e}p{font-size:13px;line-height:1.5;margin:0}
      label{display:grid;gap:6px;font-size:13px;font-weight:700}input,select,button{border:1px solid #cbd5e1;border-radius:5px;padding:9px 12px;background:white;font:inherit}
      button{color:#143b92;cursor:pointer;font-size:13px;font-weight:700}button:disabled{opacity:.5;cursor:default}.count{font-weight:700;margin:14px 0 12px}
      .status,.error{padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px}.error{color:#b42318}
      .warning{padding:12px;background:#fff7e4;margin-bottom:12px}.notice{padding:12px;background:#e5f4e9;color:#196a35;margin-bottom:12px}
      .attention{border:1px solid #eed8b6;background:#fffcf6;border-radius:8px;padding:18px;margin-bottom:32px}.note{margin:12px 0 14px;color:#667085;max-width:1100px}.daily-heading{margin-top:28px}
      @media(max-width:600px){.heading{align-items:start}.attention{padding:12px}}
    `}</style>
  </section>;
}
