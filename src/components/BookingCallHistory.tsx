import type { ScheduledCallRow } from "@/lib/crmAdmin";

export default function BookingCallHistory({ booking }: { booking: ScheduledCallRow }) {
  const count = booking.callsSinceAppointmentDay;
  return <div className="call-history">
    <p className={count == null ? "unknown" : count > 0 ? "called" : "uncalled"}>
      {count == null ? "Istoric apeluri indisponibil" : count > 0
        ? `Apelat: Da · ${count} ${count === 1 ? "apel" : "apeluri"}` : "Apelat: Nu · 0 apeluri"}
    </p>
    {count != null && count > 0 && <ul aria-label="Toate callcodurile">
      {(booking.callCodesSinceAppointmentDay || []).map(code => <li key={code.callCode ?? "unknown"}>
        {code.callCode == null ? "Fara callcode" : `Callcode ${code.callCode}`}
        {code.description ? ` — ${code.description}` : ""} × {code.count}
      </li>)}
    </ul>}
    <small>Din ziua programarii, inclusiv dupa · Ora UK</small>
    <style jsx>{`
      .call-history { margin-top: 8px; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
      p { margin: 0; font-weight: 700; font-size: 12px; }
      .called { color: #196a35; } .uncalled { color: #855a0b; } .unknown { color: #667085; }
      ul { list-style: none; margin: 4px 0; padding: 0; }
      li { margin-top: 3px; } small { display: block; color: #667085; font-size: 10px; font-weight: 400; }
    `}</style>
  </div>;
}
