# CRM dispatcher

Open `/crmdispatch?phone=447440526630`. CRM authentication is required; login preserves the dispatch URL.

The dispatcher first calls the authenticated `GET /justproveit/admin/crm/dispatch?phone=...` endpoint. An exact indexed phone lookup returns only name, email and phone, which are displayed immediately. It avoids the full CRM lead read model and all history/list pagination. The existing unique tenant/normalized-phone index and an email lookup covering index support this query. Contact requests have a 4.5-second client deadline and SQL requests a 3.5-second query deadline; failures show Retry rather than empty contact details. Browser loading, login and network time still affect overall latency.

After displaying the contact, the page calls the same endpoint with `routing=true`. A bounded EXISTS query checks whether a manual booking for any service, or a SimulatorPensie intent, was created within the last 30 days. If so, it redirects to `/ro/calculator-varsta-pensionare` with URL-encoded name, email and phone. Closed/cancelled and reserved records count. Appointment dates do not replace creation dates.

Other contacts see the CRM list, currently just **Simulator Pensie Internationala**, using the prefilled link. Unknown exact numbers get the same choice with empty name/email and the supplied phone. Suffix-only matches cannot supply another person's details. UK local numbers and `00` international prefixes are normalized. Routing errors retain the displayed contact and offer Retry.

Backend deployment creates the email index and runs `node scripts/verify-crm-dispatch.mjs`, which checks three database lookup timings against five seconds without logging contact data. Initial live database verification: first contact lookup 936 ms, subsequent lookups 113 ms; routing 107–125 ms. These are database-path measurements, not authenticated browser timings.

Validation: backend `npm test`, frontend `node --test tests/crm-dispatch.test.cjs`, `npm run build`.
