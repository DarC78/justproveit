# CRM dispatcher

Open `/crmdispatch?phone=447440526630`. CRM authentication is required; login preserves the dispatch URL.

The page uses the existing canonical CRM read APIs (`leads/by-phone` and `lead-intents`). It checks open and closed intents, includes reserved records, and paginates. A manual booking for any service, or a SimulatorPensie intent, created within the last 30 days redirects to `/ro/calculator-varsta-pensionare` with URL-encoded `name`, `email`, and `phone`. Cancelled/closed records still count as historical intents. Appointment dates do not replace intent creation dates in this rule.

Other contacts see the CRM list, currently just **Simulator Pensie Internationala**, using the same prefilled link. Unknown numbers get the same choice with empty name/email and the supplied phone. Lookup failures show Retry rather than being treated as no matching intent. Full phone/contact matches are required; suffix-only matches cannot supply another person's details. UK local numbers and `00` international prefixes are normalized.

Validation: `node --test tests/crm-dispatch.test.cjs`, `npm run build`.
