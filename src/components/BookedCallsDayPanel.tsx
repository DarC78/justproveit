import { useEffect, useState } from "react";
import { ScheduledCallRow, listScheduledCrmCalls } from "@/lib/crmAdmin";
import { bookedCallTime } from "@/lib/bookedCalls";
import BookingCallHistory from "./BookingCallHistory";

export default function BookedCallsDayPanel({ token, date, revision }: {
  token: string; date: string; revision: number;
}) {
  const [bookings, setBookings] = useState<ScheduledCallRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const hasDate = Boolean(date);

  useEffect(() => {
    if (!hasDate) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return [];
      setLoading(true);
      setError("");
      return listScheduledCrmCalls(token, date).then(result => {
        if (result.date !== date || !Array.isArray(result.rows)) throw new Error("Lista programarilor nu a putut fi verificata.");
        return result.rows;
      });
    })
      .then((rows) => { if (!cancelled) setBookings(rows); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Nu am putut incarca programarile."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, hasDate, date, revision, refresh]);

  const dayBookings = bookings;

  return (
    <aside aria-label="Programarile zilei">
      <div className="heading">
        <h2>Apeluri programate</h2>
        {hasDate && <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>Reincarca</button>}
      </div>
      <p className="date">{date ? date.split("-").reverse().join("/") : "Alege data programarii"} · Ora UK</p>
      <div aria-live="polite" aria-busy={loading}>
        {!hasDate ? <p>Selecteaza o data pentru a vedea apelurile rezervate.</p>
          : loading ? <p>Se incarca programarile...</p>
          : error ? <p role="alert" className="error">{error}</p>
          : !dayBookings.length ? <p>Nu exista apeluri programate pentru aceasta zi.</p>
          : <>
            <p className="count">{dayBookings.length} {dayBookings.length === 1 ? "apel programat" : "apeluri programate"}</p>
            <ol>
              {dayBookings.map((booking) => (
                <li key={booking.intentId}>
                  <time dateTime={booking.appointmentAtUtc}>{bookedCallTime.format(new Date(booking.appointmentAtUtc))}</time>
                  <div>
                    <strong>{booking.name || "Client"}{booking.phone ? ` — ${booking.phone}` : ""}</strong>
                    <span>{booking.serviceName || booking.intentType}</span>
                    <BookingCallHistory booking={booking} />
                  </div>
                </li>
              ))}
            </ol>
          </>}
      </div>
      <style jsx>{`
        aside { border: 1px solid #dce3ee; border-radius: 8px; padding: 20px; background: #f7f9fd; color: #333; }
        .heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        h2 { margin: 0; font-size: 19px; font-weight: 800; }
        button { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 9px; background: white; color: #123c92; cursor: pointer; font-size: 12px; }
        button:disabled { opacity: .5; cursor: default; }
        p { font-size: 13px; line-height: 1.5; }
        .date { margin: 8px 0 18px; color: #526077; }
        .count { font-weight: 700; }
        .error { color: #b42318; }
        ol { padding: 0; margin: 0; list-style: none; }
        li { display: flex; gap: 16px; padding: 13px 0; border-top: 1px solid #dce3ee; }
        time { color: #123c92; font-weight: 800; font-size: 18px; font-variant-numeric: tabular-nums; }
        strong, span { display: block; overflow-wrap: anywhere; }
        strong { font-size: 13px; }
        span { margin-top: 4px; font-size: 12px; color: #526077; }
      `}</style>
    </aside>
  );
}
