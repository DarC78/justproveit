import type { CrmLeadIntentResponse, CrmLeadIntentRow } from "./crmAdmin";
import type { BookingActionResult } from "./crmAdmin";

export function visibleScheduledCalls<T extends {meaningfulCallsSinceAppointment: number | null; onWhatsAppBusiness: boolean}>(rows: T[], showFinished: boolean) {
  return showFinished ? rows : rows.filter(row => !(Number(row.meaningfulCallsSinceAppointment) > 0 || row.onWhatsAppBusiness));
}

export function bookingActionNotice(result: BookingActionResult) {
  if (result.action === "dialler") return "Booking solved. Number added back to the ASAP / SimulatorPensie dialler.";
  if (result.action === "cancel") return "Programarea si mesajele netrimise aferente au fost anulate.";
  const email = result.emailQueued ? "Email: in coada de trimitere." : "Email omis: adresa lipsa sau invalida.";
  const whatsApp = result.whatsAppQueued ? "WhatsApp text: in coada de trimitere." : "WhatsApp omis: telefon lipsa sau invalid.";
  return `Programare reprogramata. ${email} ${whatsApp} Reminderele vechi au fost anulate.`;
}

const londonDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
});
export const bookedCallTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function bookedCallsForDate(bookings: CrmLeadIntentRow[], date: string) {
  return bookings.filter((booking) => {
    const timestamp = Date.parse(booking.contactTimeUtc || "");
    return Number.isFinite(timestamp) && londonDate.format(timestamp) === date
      && !["cancelled", "canceled"].includes(String(booking.intentStatus || "").trim().toLowerCase());
  }).sort((a, b) => Date.parse(a.contactTimeUtc!) - Date.parse(b.contactTimeUtc!));
}

// The existing API paginates by creation date, so read every booking page before
// filtering by appointment day. Some service categories require an explicit scope.
export async function loadBookedCalls(
  loadPage: (params: Record<string, string | number | boolean>) => Promise<CrmLeadIntentResponse>,
  cancelled: () => boolean,
) {
  const scopedServices = new Set<string>();
  async function loadType(intent: string, service?: string) {
    const rows: CrmLeadIntentRow[] = [];
    let offset = 0;
    while (!cancelled()) {
      const result = await loadPage({
        intent, closed: "all", includeReserved: true, limit: 300, offset,
        ...(service ? { service } : {}),
      });
      for (const option of result.options?.services || []) {
        if (["BOOKCALL", "INBOUNDSMS", "MISSEDCALL", "MISSEDCALLS", "JOBAPPLICATIONS"]
          .includes(option.serviceKey.toUpperCase().replace(/[ _-]/g, ""))) scopedServices.add(option.serviceKey);
      }
      const page = result.rows || result.items || [];
      rows.push(...page);
      offset += page.length;
      if (offset >= result.total) break;
      if (!page.length) throw new Error("Lista programarilor este incompleta. Reincarca lista.");
    }
    return rows;
  }
  const groups = await Promise.all([loadType("MANUAL_BOOK"), loadType("CALENDLY")]);
  // Include bookings in service categories omitted by the API's default view.
  for (const service of scopedServices) {
    if (cancelled()) break;
    groups.push(...await Promise.all([loadType("MANUAL_BOOK", service), loadType("CALENDLY", service)]));
  }
  const seen = new Set<string>();
  return groups.flat().filter((row) => {
    if (!row.interestId) return true;
    if (seen.has(row.interestId)) return false;
    seen.add(row.interestId);
    return true;
  });
}
