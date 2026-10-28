import { useEffect, useState } from "react";
import Link from "next/link";
import BookingCallHistory from "./BookingCallHistory";
import BookingActions from "./BookingActions";
import { listScheduledCrmCalls, ScheduledCallsResponse } from "@/lib/crmAdmin";

const londonDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
});
const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short",
});
const londonTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
function dateTime(value: string | null) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? londonDateTime.format(timestamp) : "Unavailable";
}
function YesNo({ value }: { value: boolean | null }) {
  return <span className={value === true ? "yes" : value === false ? "no" : "unknown"}>
    {value === true ? "Yes" : value === false ? "No" : "Unavailable"}
    <style jsx>{`
      span { display: inline-block; border-radius: 20px; padding: 3px 9px; font-weight: 700; font-size: 12px; }
      .yes { background: #e5f4e9; color: #196a35; }
      .no { background: #fff2d6; color: #855a0b; }
      .unknown { color: #667085; }
    `}</style>
  </span>;
}

export default function ScheduledCallsPanel({ token }: { token: string }) {
  const [date, setDate] = useState(() => londonDate.format(new Date()));
  const [report, setReport] = useState<ScheduledCallsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true); setError("");
      try {
        const result = await listScheduledCrmCalls(token, date, controller.signal);
        if (result.date !== date || !Array.isArray(result.rows)) throw new Error("The schedule response could not be verified. Please refresh.");
        if (!controller.signal.aborted) setReport(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load scheduled calls.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    });
    return () => controller.abort();
  }, [token, date, refresh]);

  const rows = report?.date === date ? report.rows : [];
  return <section className="scheduled-calls">
    <div className="heading">
      <div><h1>Scheduled calls</h1><p>Manual and Calendly bookings · All times are UK time</p></div>
      <div className="controls">
        <label>Date<input type="date" value={date} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label>
        <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
      </div>
    </div>
    <div aria-live="polite" aria-busy={loading}>
      {notice && <p role="status" className="notice">{notice}</p>}
      {loading ? <p className="status">Loading scheduled calls...</p>
        : error ? <p role="alert" className="error">{error}</p>
        : <>
          {report?.warnings?.map(warning => <p className="warning" key={warning}>{warning}</p>)}
          <p className="count">{rows.length} {rows.length === 1 ? "scheduled call" : "scheduled calls"} on {date.split("-").reverse().join("/")}</p>
          {!rows.length ? <p className="status">No calls are booked for this date.</p> : <div className="table-scroll" tabIndex={0} role="region" aria-label="Scheduled calls table">
            <table>
              <thead><tr>
                <th scope="col">Call time (UK)</th><th scope="col">Name</th><th scope="col">Phone number</th>
                <th scope="col">Became a lead</th><th scope="col">Call booked on</th>
                <th scope="col">Booking email sent</th><th scope="col">Booking WhatsApp sent</th>
                <th scope="col">Reminder email sent</th><th scope="col">Reminder WhatsApp sent</th>
                <th scope="col">Manual calls that day</th><th scope="col">Agent conversations that day</th><th scope="col">On dialler now</th>
                <th scope="col">Apeluri din ziua programarii si dupa / callcoduri</th>
                <th scope="col">WhatsApp client in ziua programarii</th><th scope="col">WhatsApp noi in ziua programarii</th>
                <th scope="col">Actiuni programare</th>
              </tr></thead>
              <tbody>{rows.map(row => <tr key={row.intentId}>
                <td><time dateTime={row.appointmentAtUtc}>{londonTime.format(new Date(row.appointmentAtUtc))}</time></td>
                <th scope="row">{row.phone ? <Link href={{ pathname: "/admin/crm", query: { tab: "details", phone: row.phone } }}>{row.name || "Client"}</Link> : row.name || "Client"}
                  <small>{row.intentType === "MANUAL_BOOK" ? "Manual booking" : "Calendly"}{row.serviceName ? ` · ${row.serviceName}` : ""}</small></th>
                <td className="phone">{row.phone || "Unavailable"}</td>
                <td>{dateTime(row.leadCreatedAtUtc)}</td><td>{dateTime(row.bookedAtUtc)}</td>
                <td><YesNo value={row.bookingEmailSent} /></td><td><YesNo value={row.bookingWhatsAppSent} /></td>
                <td><YesNo value={row.reminderEmailSent} /></td><td><YesNo value={row.reminderWhatsAppSent} /></td>
                <td className="number">{row.manualCallsToday ?? "Unavailable"}</td><td className="number">{row.agentConversationsToday ?? "Unavailable"}</td>
                <td><YesNo value={row.onDialler} /></td>
                <td className="history"><BookingCallHistory booking={row} /></td>
                <td className="number">{row.whatsAppClientMessages ?? "Unavailable"}</td>
                <td className="number">{row.whatsAppTeamMessages ?? "Unavailable"}</td>
                <td className="history"><BookingActions token={token} booking={row} onChanged={result => {
                  setNotice(result.action === "reschedule" ? "Programare reprogramata. Emailul este in coada de trimitere; reminderele vechi au fost anulate." : "Programarea si mesajele netrimise aferente au fost anulate.");
                  setRefresh(value => value + 1);
                }} /></td>
              </tr>)}</tbody>
            </table>
          </div>}
          <p className="note">Sent means a successful send or provider acceptance is recorded for this booking. Queued messages are not counted as sent. Agent conversations exclude voicemail and other non-conversation outcomes. Dialler membership shows the current state.</p>
        </>}
    </div>
    <style jsx>{`
      .scheduled-calls { margin: 28px 0 70px; color: #344054; }
      .heading { display: flex; align-items: end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 24px; }
      h1 { font-size: 30px; margin: 0 0 8px; color: #333; }
      p { font-size: 13px; line-height: 1.5; margin: 0; }
      .controls { display: flex; gap: 12px; align-items: end; }
      label { display: grid; gap: 6px; font-size: 13px; font-weight: 700; }
      input, button { border: 1px solid #cbd5e1; border-radius: 5px; padding: 9px 12px; background: white; font: inherit; }
      button { color: #143b92; cursor: pointer; font-size: 13px; font-weight: 700; }
      button:disabled { opacity: .5; cursor: default; }
      .count { font-weight: 700; margin-bottom: 12px; }
      .status, .error { padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
      .error { color: #b42318; }
      .warning { padding: 12px; background: #fff7e4; margin-bottom: 12px; }
      .notice { padding: 12px; background: #e5f4e9; color: #196a35; margin-bottom: 12px; }
      .table-scroll { overflow-x: auto; border: 1px solid #dce3ee; border-radius: 7px; }
      table { width: 100%; min-width: 1550px; border-collapse: collapse; font-size: 12px; text-align: left; }
      thead { background: #eef3fb; color: #17376e; }
      th, td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      thead th { min-width: 100px; font-size: 11px; line-height: 1.5; }
      tbody th { min-width: 175px; font-weight: 700; }
      tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
      tbody tr:hover { background: #f8fafc; }
      small { display: block; font-size: 11px; color: #667085; font-weight: 400; margin-top: 5px; }
      time { color: #143b92; font-size: 17px; font-weight: 800; }
      .phone { white-space: nowrap; }
      .history { min-width: 240px; }
      .number { text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; }
      .note { margin-top: 14px; color: #667085; max-width: 1000px; }
      @media(max-width: 600px) { .heading { align-items: start; } .controls { width: 100%; } }
    `}</style>
  </section>;
}
