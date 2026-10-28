import { useEffect, useState } from "react";
import { getScheduledWhatsAppConversation, ScheduledCallRow, ScheduledWhatsAppConversation } from "@/lib/crmAdmin";

const clock = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export default function BookingWhatsAppConversation({ token, booking, date, onClose }: {
  token: string; booking: ScheduledCallRow; date: string; onClose: () => void;
}) {
  const [conversation, setConversation] = useState<ScheduledWhatsAppConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setLoading(true); setError("");
      try {
        const result = await getScheduledWhatsAppConversation(token, booking.intentId, date, controller.signal);
        if (result.date !== date || result.intentId.toLowerCase() !== booking.intentId.toLowerCase() || !Array.isArray(result.messages)) {
          throw new Error("Discutia primita nu corespunde programarii selectate.");
        }
        if (!controller.signal.aborted) setConversation(result);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Nu am putut incarca discutia.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    });
    return () => controller.abort();
  }, [token, booking.intentId, date, refresh]);

  return <aside id="booking-whatsapp-conversation" aria-label="Discutia WhatsApp din ziua programarii">
    <div className="heading"><h2>Discutie WhatsApp</h2><button type="button" onClick={onClose} aria-label="Inchide discutia WhatsApp">Inchide</button></div>
    <h3>{booking.name || "Client"}</h3>
    <p className="meta">{booking.phone || "Telefon indisponibil"}<br />{date.split("-").reverse().join("/")} · Ora UK</p>
    <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Reincarca discutia</button>
    <div aria-live="polite" aria-busy={loading}>
      {loading ? <p>Se incarca discutia...</p> : error ? <p role="alert" className="error">{error}</p>
        : conversation && <>
          <p className="totals">Client: {conversation.clientMessages ?? "indisponibil"} · Noi: {conversation.teamMessages ?? "indisponibil"}</p>
          {!booking.phone ? <p>Istoricul este indisponibil fara un numar de telefon.</p>
            : !conversation.messages.length ? <p>Nu exista mesaje WhatsApp in aceasta zi.</p>
            : <ol className="messages" aria-label="Mesaje in ordine cronologica">
              {conversation.messages.map(message => <li key={message.id} className={message.direction}>
                <div className="message-heading"><strong>{message.direction === "inbound" ? "Client" : "Noi"}</strong>
                  <time dateTime={message.atUtc}>{clock.format(new Date(message.atUtc))}</time></div>
                <p className="body">{message.text}</p>
              </li>)}
            </ol>}
        </>}
    </div>
    <style jsx>{`
      aside { min-width: 0; padding: 20px; border: 1px solid #cbded6; border-radius: 8px; background: #f5faf7; color: #344054; }
      .heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
      h2 { margin: 0; font-size: 18px; } h3 { font-size: 14px; overflow-wrap: anywhere; margin: 16px 0 5px; }
      p { font-size: 12px; line-height: 1.6; } .meta { color: #526077; margin: 0 0 12px; }
      button { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 9px; background: white; color: #123c92; cursor: pointer; font-size: 12px; }
      button:disabled { opacity: .5; cursor: default; } .error { color: #b42318; } .totals { font-weight: 700; }
      .messages { list-style: none; padding: 0; margin: 14px 0 0; max-height: 680px; overflow-y: auto; }
      li { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
      .inbound { background: white; margin-right: 20px; } .outbound { background: #dcf3e4; margin-left: 20px; }
      .message-heading { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; }
      time { color: #526077; } .body { white-space: pre-wrap; overflow-wrap: anywhere; margin: 7px 0 0; }
    `}</style>
  </aside>;
}
