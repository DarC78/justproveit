# Manual pension chatbot start

**Start Simulare** appears beside Reply on WhatsApp in the shared contact actions, including InboundContacts and Lead Pipeline. It requires an explicit confirmation of the displayed name and phone. The authenticated POST to `/justproveit/admin/crm/contacts/{id}/start-simulation` includes the phone, a stable request UUID and `confirm:true`.

The backend validates the saved contact alias, records the agent decision and schedules the existing pension chatbot. The UI distinguishes a scheduled start from an already active interview and never claims the WhatsApp message was sent. Retries retain the same UUID. The action does not solve the lead or create a booking. Existing answers are retained; stopped/opted-out contacts and unresolved deliveries require review. A human takeover can be explicitly returned to the chatbot; later human activity stops it normally.

Current behavior and message catalogue: backend `docs/pension-qualification-test.md`. Checks: `node --test tests/contact-start-simulation.test.cjs tests/contact-actions.test.cjs`, TypeScript and the production build.
