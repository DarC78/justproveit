import { FormEvent, useState } from "react";
import { BookingActionResult, changeScheduledBooking, ScheduledCallRow } from "@/lib/crmAdmin";

const londonDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });
const londonTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export default function BookingActions({ token, booking, onChanged }: {
  token: string; booking: ScheduledCallRow; onChanged: (result: BookingActionResult) => void;
}) {
  const [mode, setMode] = useState<"reschedule" | "cancel" | null>(null);
  const [date, setDate] = useState(() => londonDate.format(new Date(booking.appointmentAtUtc)));
  const [time, setTime] = useState(() => londonTime.format(new Date(booking.appointmentAtUtc)));
  const [requestId, setRequestId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function open(action: "reschedule" | "cancel") { setMode(action); setRequestId(crypto.randomUUID()); setError(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!mode || saving) return;
    setSaving(true); setError("");
    try {
      const result = await changeScheduledBooking(token, booking, mode, { requestId,
        ...(mode === "reschedule" ? { appointmentDate: date, appointmentTime: time } : {}) });
      setMode(null); onChanged(result);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Modificarea nu a putut fi salvata. Reincarca lista inainte de a reincerca."); }
    finally { setSaving(false); }
  }
  return <div className="booking-actions">
    {!mode ? <div className="buttons">
      <button type="button" onClick={() => open("reschedule")}>Reprogrameaza</button>
      <button type="button" className="delete" onClick={() => open("cancel")}>Delete book</button>
    </div> : <form onSubmit={save} aria-label={mode === "reschedule" ? "Reprogramare" : "Anulare programare"}>
      <strong>{mode === "reschedule" ? "Reprogrameaza (ora UK)" : "Anulezi aceasta programare?"}</strong>
      {mode === "reschedule" && <div className="date-time">
        <label>Data noua<input type="date" required min={londonDate.format(new Date())} disabled={saving} value={date}
          onChange={event => { setDate(event.target.value); setRequestId(crypto.randomUUID()); setError(""); }} /></label>
        <label>Ora UK<input type="time" required disabled={saving} value={time}
          onChange={event => { setTime(event.target.value); setRequestId(crypto.randomUUID()); setError(""); }} /></label>
      </div>}
      <p>{mode === "reschedule" ? "Clientul primeste emailul cu noua data si ora. Reminderele vechi se anuleaza." : "Programarea si mesajele email/WhatsApp de confirmare sau reminder netrimise vor fi anulate."}</p>
      {booking.intentType === "CALENDLY" && <p className="provider-note">Actiunea modifica programarea in CRM. Notificarile trimise direct de Calendly nu sunt controlate de CRM.</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <div className="buttons">
        <button type="submit" disabled={saving}>{saving ? "Se salveaza..." : mode === "reschedule" ? "Confirma si trimite email" : "Confirma Delete book"}</button>
        <button type="button" disabled={saving} onClick={() => { setMode(null); setError(""); }}>Renunta</button>
      </div>
    </form>}
    <style jsx>{`
      .booking-actions { margin-top: 10px; font-size: 11px; }
      .buttons { display: flex; flex-wrap: wrap; gap: 7px; }
      button { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; background: white; color: #123c92; cursor: pointer; font-size: 11px; }
      .delete { color: #b42318; } button:disabled { opacity: .5; cursor: default; }
      form { background: white; border: 1px solid #dce3ee; padding: 12px; border-radius: 6px; }
      strong { font-size: 12px; } p { font-size: 11px; line-height: 1.5; margin: 9px 0; }
      .date-time { display: grid; gap: 8px; margin: 10px 0; }
      label { display: grid; gap: 4px; } input { min-width: 0; width: 100%; box-sizing: border-box; padding: 7px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; }
      .error { color: #b42318; } .provider-note { color: #855a0b; }
    `}</style>
  </div>;
}
