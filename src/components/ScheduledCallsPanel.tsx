import {useEffect,useState} from "react";
import ScheduledCallsTable from "./ScheduledCallsTable";
import {visibleScheduledCalls} from "@/lib/bookedCalls";
import {listScheduledCrmCalls,ScheduledCallsResponse} from "@/lib/crmAdmin";

const londonDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"});

export default function ScheduledCallsPanel({token}:{token:string}) {
  const [date,setDate]=useState(()=>londonDate.format(new Date()));
  const [showFinished,setShowFinished]=useState(true);
  const [report,setReport]=useState<ScheduledCallsResponse|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
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

  function changed(message:string){setNotice(message);setRefresh(value=>value+1);}
  const dayRows=report?.date===date?report.rows:[];
  const rows=visibleScheduledCalls(dayRows,showFinished);
  return <section className="scheduled-calls">
    <div className="heading"><div><h1>Scheduled calls</h1><p>Manual and Calendly bookings · All times are UK time</p></div>
      <button type="button" disabled={loading} onClick={()=>setRefresh(value=>value+1)}>Refresh</button></div>
    {notice&&<p role="status" className="notice">{notice}</p>}

    <div className="heading daily-heading"><h2>Scheduled calls by date</h2><div className="daily-controls">
      <label className="finished-filter"><input type="checkbox" checked={showFinished} onChange={event=>setShowFinished(event.target.checked)}/>Show finished leads</label>
      <label>Date<input type="date" value={date} onChange={event=>{if(event.target.value)setDate(event.target.value);}}/></label>
    </div></div>
    <p className="note">Finished means a valid agent call on or after the appointment day, or an On WhatsApp Business mark. Voicemail, no answer, no audio, default and invalid callcodes do not count as contacted.</p>
    <div aria-live="polite" aria-busy={loading}>
      {loading?<p className="status">Loading scheduled calls...</p>:error?<p role="alert" className="error">{error}</p>:<>
        {report?.warnings?.map(warning=><p className="warning" key={warning}>{warning}</p>)}
        <p className="count">{rows.length} {rows.length===1?"scheduled call":"scheduled calls"} on {date.split("-").reverse().join("/")}{!showFinished?` (${dayRows.length} total)`:""}</p>
        {rows.length?<ScheduledCallsTable token={token} rows={rows} onChanged={changed}/>:<p className="status">{dayRows.length?"All clients booked for this date have been contacted.":"No calls are booked for this date."}</p>}
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
      .note{margin:12px 0 14px;color:#667085;max-width:1100px}.daily-heading{margin-top:28px}
      .daily-controls{display:flex;align-items:end;gap:20px;flex-wrap:wrap}.finished-filter{display:flex;align-items:center;gap:8px;padding:10px 0;cursor:pointer}.finished-filter input{width:17px;height:17px;margin:0;padding:0;border:0;flex-shrink:0;accent-color:#143b92;cursor:pointer}
      @media(max-width:600px){.heading{align-items:start}}
    `}</style>
  </section>;
}
