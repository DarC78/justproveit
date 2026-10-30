# WhatsApp replies in scheduled-call history

PhoneHistoryModal now has a multiline reply composer immediately after the final WhatsApp/call record. The draft remains after provider rejection. Sending disables duplicate submission, and uncertain HTTP outcomes retain the same request UUID for a safe status check. Booking-keyed dialogs and recipient checks prevent drafts crossing between leads.

The frontend calls POST /api/justproveit/admin/crm/scheduled-calls/{id}/whatsapp/replies on the canonical CRM backend. This route requires existing tenant/CRM authorization and resolves the recipient from the booking; expectedPhone is a consistency check, not an arbitrary destination. Text must contain 1 to 4096 characters.

The LaunchingStack backend reserves a processing record in crm.WhatsAppOutboundMessages before contacting Meta. A transaction, range lock, and existing unique tenant/reference index prevent duplicate sends for the same request UUID. Changed content with the same UUID is rejected. It uses the existing configured application WhatsApp sender and text integration, without automatic templates or queue-worker retries. Meta acceptance is displayed separately from delivery. A network timeout or missing provider ID leaves an uncertain processing attempt for investigation rather than resending.

The phone history now includes failed and processing replies without provider IDs, with authoritative delivery/error state preferred over mirrored messages. Meta error 131047 is explained as a closed 24-hour reply window. Existing webhook processing updates later sent/delivered/read/failed states. While the dialog is open and visible, the frontend refreshes history every 15 seconds without hiding the composer or discarding the draft.

Validation: frontend production build, TypeScript/ESLint, focused composer behavior tests, and backend authorization/idempotency/failure/history tests. Deploy both repositories through their GitHub workflows. Deployment verification must not send real lead messages without explicit recipient and content authorization.
