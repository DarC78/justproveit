# CRM Admin New ASAP Intent Backend Spec

## Context

The frontend CRM page at:

`https://www.justproveit.co.uk/admin/crm/?tab=all`

now shows a `New ASAP` action when an admin search returns exactly one lead. The action lets an agent create a fresh `ASAP` lead intent against that existing lead/contact for the selected service.

## Required Endpoint

`POST /justproveit/admin/crm/lead-intents`

Authorization:

`Authorization: Bearer <admin-token>`

Content-Type:

`application/json`

## Request Body

The frontend sends:

```json
{
  "leadId": "optional-existing-lead-id",
  "contactId": "optional-canonical-contact-id",
  "email": "customer@example.com",
  "phone": "07700111222",
  "interestType": "ASAP",
  "serviceKey": "simulator pensie",
  "source": "crm_admin_all_leads",
  "agent": "Agent Name"
}
```

At least one of `leadId`, `contactId`, `email`, or `phone` should identify an existing lead/contact.

## Behaviour

- Require CRM/admin authentication.
- Accept only `interestType = "ASAP"` for this endpoint initially.
- Resolve the existing canonical contact/lead by `contactId`, then `leadId`, then normalized phone/email.
- Do not create a duplicate lead/contact if the existing person can be resolved.
- Create a new open lead intent row attached to the resolved contact/lead.
- Set the selected `serviceKey` on the new intent.
- Set `source = "crm_admin_all_leads"` or preserve the provided source.
- Store `agent` on the intent/audit trail if supported.
- Copy available lead details such as name, phone, email, and language onto the returned `lead`/`intent` shape in the same format used by `GET /justproveit/admin/crm/lead-intents`.
- Expose the new intent in `GET /justproveit/admin/crm/lead-intents?intent=ASAP` and normal `statusBucket=nocall` views.
- Add an audit/activity event visible through `/justproveit/admin/crm/activity` for the same email/contact/phone.
- If existing ASAP creation normally queues the person for dialling for that service, use the same behaviour here. If not, this endpoint should still create the manual-call ASAP intent.

## Success Response

```json
{
  "success": true,
  "message": "New ASAP intent created.",
  "intent": {
    "interestId": "new-intent-id",
    "interestType": "ASAP",
    "serviceKey": "simulator pensie",
    "createdAtUtc": "2026-08-10T10:15:00.000Z"
  },
  "lead": {
    "id": "existing-lead-id",
    "contactId": "canonical-contact-id",
    "fullName": "Customer Name",
    "email": "customer@example.com",
    "phoneNumber": "07700111222"
  }
}
```

The frontend also accepts `leadIntent` instead of `intent`.

## Error Responses

Unknown lead/contact:

```json
{
  "error": "Lead not found."
}
```

Unsupported service:

```json
{
  "error": "Unknown serviceKey."
}
```

Unsupported intent type:

```json
{
  "error": "Only ASAP intents can be created from this endpoint."
}
```

## Service Dropdown Dependency

The frontend gets service options from:

`GET /justproveit/admin/crm/lead-intents`

using `options.services`. Keep returning current service options in this response. The frontend filters out internal service options already hidden in the existing Lead Intents tab, such as `Book Call`, `Inbound SMS`, and `Missed Calls`.

## Acceptance Criteria

- Searching `All Leads CRM` and getting exactly one result displays a service dropdown and `New ASAP` button.
- The dropdown is preselected from the lead's latest intent service when one exists.
- Pressing `New ASAP` calls `POST /justproveit/admin/crm/lead-intents` with the selected `serviceKey` and `interestType = "ASAP"`.
- A new ASAP intent is created against the existing lead/contact, not a duplicate lead.
- The new ASAP intent appears in the `Lead Intents` tab for the selected service.
- The activity/audit history for that contact/email/phone shows the manual ASAP intent creation.
