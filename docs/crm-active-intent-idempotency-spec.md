# CRM Active Intent Idempotency Backend Spec

## Objective

Stop creating duplicate active lead intents for the same person when repeated inbound events arrive.

Current problem examples:

- A person leaves their phone number to be called and an `ASAP` intent is created.
- The same person sends 10 SMS messages and 10 more intents are created.
- Similar duplication can happen for missed calls and WhatsApp messages.

Required behavior:

- `ASAP`, `SMS`, `MISSED_CALL`, and `WHATSAPP` inbound events must not create a new intent if the same person already has an active intent.
- `CALENDLY` is the exception: create one intent/event for every Calendly booking received.

## Deployment Target

This logic belongs in the backend repository that owns JustProveIt CRM intent creation and inbound webhook/API routes.

Official frontend API host:

- `https://launchingstack-func-dev.azurewebsites.net/api`

Question the backend/API that owns these routes and event handlers:

- `POST /justproveit/admin/crm/leads`
- `GET /justproveit/admin/crm/lead-intents`
- website or Meta/Facebook lead handlers that create `ASAP` intents
- inbound SMS handlers
- missed-call handlers
- WhatsApp inbound handlers
- Calendly webhook handlers

The frontend repository does not contain the central SMS, missed-call, WhatsApp, or Calendly intent creation code.

## Required Business Rule

When an inbound event is about to create a lead intent:

1. Resolve or create the canonical contact.
2. Normalize all identity fields available on the event:
   - canonical contact id
   - contact id
   - normalized phone
   - normalized email
3. If the incoming intent type is `CALENDLY`, always create the new intent/event.
4. If the incoming intent type is one of:
   - `ASAP`
   - `SMS`
   - `MISSED_CALL`
   - `WHATSAPP`
   then first look for an existing active intent for the same person.
5. If an active intent exists, do not insert a new intent row. Return or log the existing intent id.
6. Still store the underlying communication/event where applicable:
   - save SMS message in the SMS/message table
   - save WhatsApp message in the WhatsApp/message table
   - save missed-call activity
   - save the repeated contact-request activity
7. Update the existing active intent with a fresh `updatedAtUtc` or `lastInboundAtUtc` if those fields exist.

## Active Intent Definition

Treat an intent as active when:

- `closedAtUtc IS NULL`
- and its status is not terminal.

Use the backend's existing canonical status rules where available. Suggested terminal statuses include:

- `closed`
- `completed`
- `converted`
- `cancelled`
- `not_interested`
- `not_qualified`
- `duplicate`

Do not treat a Calendly row specially during the active-intent lookup for non-Calendly sources. If the same person already has an active Calendly intent and then sends an SMS, the SMS should not create a second active CRM intent. The SMS message itself should still be recorded.

## Matching Scope

Match by person, preferably in this order:

1. canonical contact id
2. contact id
3. normalized phone
4. normalized email

If the inbound event has a service or service group, match active intents for the same service group when possible. For example:

- `simulator pensie`
- `SIMULATOR_PENSIE`
- `SIMULATOR_PENSII`
- service display names containing `simulator pensie`

If the service cannot be determined from the inbound event, use any active intent for the same person as the blocker.

## Source-Specific Rules

### ASAP

If a person already has an active intent, do not create another `ASAP` row.

Return a response similar to:

```json
{
  "success": true,
  "created": false,
  "deduped": true,
  "intentId": "existing-intent-id"
}
```

### SMS

Always store the SMS message.

Only create an `SMS` intent if the person has no active intent.

If an active intent exists, attach/log the SMS activity against the existing contact/intent where possible.

### Missed Calls

Always store/update missed-call activity.

Only create a `MISSED_CALL` intent if the person has no active intent.

If an active intent exists, update missed-call metadata on the existing contact/intent where possible.

### WhatsApp

Always store the WhatsApp message.

Only create a `WHATSAPP` intent if the person has no active intent.

If an active intent exists, attach/log the WhatsApp activity against the existing contact/intent where possible.

### Calendly

Do not dedupe Calendly bookings.

Each Calendly booking received must create its own Calendly intent/event, even if the same person already has an active `ASAP`, `SMS`, `MISSED_CALL`, `WHATSAPP`, or `CALENDLY` intent.

This preserves the business requirement that repeated Calendly bookings are visible as distinct events.

## Concurrency Requirement

This must be safe under race conditions. Two SMS messages arriving at the same time must not create two intents.

Implement the lookup and insert inside a transaction with a per-person lock, for example:

- SQL Server `sp_getapplock` keyed by tenant + normalized identity + service group
- or an equivalent database lock/upsert strategy
- or a filtered unique index if the schema can represent the active-person/service uniqueness reliably

Suggested lock key:

`justproveit:lead-intent:<service-group-or-any>:<canonical-contact-id-or-normalized-phone-or-email>`

## Suggested Helper

Create one shared backend helper and route all non-Calendly intent creation through it:

```ts
async function createLeadIntentUnlessActive(input) {
  const contact = await resolveCanonicalContact(input);

  if (normalizeIntentType(input.interestType) === "CALENDLY") {
    return createLeadIntent({ ...input, contactId: contact.id });
  }

  return withPersonIntentLock(contact, input.serviceGroup, async () => {
    const activeIntent = await findActiveIntentForPerson({
      tenantKey: input.tenantKey,
      contactId: contact.id,
      normalizedPhone: contact.normalizedPhone || input.normalizedPhone,
      normalizedEmail: contact.normalizedEmail || input.normalizedEmail,
      serviceGroup: input.serviceGroup,
    });

    if (activeIntent) {
      await recordInboundActivity(input, contact, activeIntent);
      await touchLeadIntent(activeIntent.id, {
        lastInboundAtUtc: input.occurredAtUtc || new Date().toISOString(),
      });

      return {
        success: true,
        created: false,
        deduped: true,
        intent: activeIntent,
      };
    }

    const intent = await createLeadIntent({ ...input, contactId: contact.id });
    return {
      success: true,
      created: true,
      deduped: false,
      intent,
    };
  });
}
```

## Observability

Add safe logs that do not expose full phone numbers, full email addresses, SMS text, or WhatsApp message bodies.

Example:

`[lead-intents] deduped inbound SMS activeIntent=123 service=simulator_pensie phoneLast6=123456`

Metrics to track:

- created intents by type
- deduped events by type
- Calendly created count
- skipped/deduped count for SMS, missed calls, WhatsApp, ASAP

## Backfill / Cleanup

Do not delete historical duplicate rows automatically without a separate reviewed migration.

Recommended optional cleanup:

1. Identify duplicate active non-Calendly intents by contact/service.
2. Keep the oldest active intent open.
3. Mark newer duplicates as closed or duplicate, preserving audit fields.
4. Do not collapse Calendly rows.

## Acceptance Criteria

- If a person with no active intent leaves a phone number, one `ASAP` intent is created.
- If the same person leaves the phone number again while the first intent is active, no second `ASAP` intent is created.
- If the same person sends 10 SMS messages while an active intent exists, zero new SMS lead-intent rows are created, but all SMS messages are still stored.
- If the same person has no active intent and sends an SMS, one active intent is created.
- If the same person has an active intent and then has missed calls, no duplicate missed-call intents are created, but missed-call activity is still updated/stored.
- If the same person has an active intent and sends WhatsApp messages, no duplicate WhatsApp intents are created, but WhatsApp messages are still stored.
- If the same person books 3 Calendly appointments, 3 Calendly intent/event rows are created.
- If the same person has an active `ASAP` intent and books a Calendly appointment, the Calendly booking still creates a Calendly row.
- Concurrent duplicate SMS/missed-call/WhatsApp events cannot create duplicate active intents.

## Verification Queries

After deploying, test with one known phone number.

1. Send or simulate one SMS event.
2. Send or simulate nine more SMS events for the same phone.
3. Verify only one active non-Calendly intent exists for that person/service.
4. Verify all 10 SMS messages or activities are present.
5. Simulate two missed calls for the same phone.
6. Verify no new active intent is created.
7. Simulate two WhatsApp messages for the same phone.
8. Verify no new active intent is created.
9. Send three Calendly test bookings for the same phone/email.
10. Verify three Calendly rows/events are created.
