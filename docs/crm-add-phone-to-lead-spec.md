# CRM Add Phone To Lead Backend Spec

## Objective

Allow agents to add an extra phone number to the selected CRM lead from:

`https://www.justproveit.co.uk/admin/crm?tab=details`

The frontend adds the phone through the canonical CRM read/write API used by this page:

`NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL`

Default target in this repo:

`https://launchingstack-func-dev.azurewebsites.net/api`

## Frontend Contract

The details tab posts to:

`POST /justproveit/admin/crm/leads/{id}/phones`

Request body:

```json
{
  "phone": "07400123456",
  "agent": "agent name"
}
```

`{id}` is the selected lead/contact identifier. The frontend prefers canonical contact identifiers when present:

- `contactId`
- `canonicalContactId`
- `canonical.contactId`
- fallback legacy lead ids: `id`, `wixId`, `_id`

## Required Backend Behavior

- Apply the same JustProveIt admin authentication/authorization used by the other CRM admin endpoints.
- Resolve `{id}` to the canonical CRM contact/lead.
- Normalize the submitted phone with the existing CRM phone normalization rules.
- Store the normalized/canonical phone form.
- Attach the new phone to the canonical contact, likely in `crm.ContactPhones`.
- Do not replace the existing primary phone unless the contact currently has no primary phone.
- If the same normalized phone already exists on the same contact, return success without creating a duplicate.
- If the normalized phone belongs to another contact, return a clear validation error.
- Return the added phone and refreshed lead/contact phone data when available.

## Response Shape

Success:

```json
{
  "success": true,
  "normalizedPhone": "447400123456",
  "phone": {
    "phone": "447400123456",
    "normalizedPhone": "447400123456",
    "isPrimary": false
  },
  "contact": {
    "phones": [
      {
        "phone": "447400123456",
        "normalizedPhone": "447400123456",
        "isPrimary": false
      }
    ]
  },
  "lead": {}
}
```

Validation error:

```json
{
  "success": false,
  "error": {
    "code": "phone_belongs_to_another_contact",
    "message": "Telefonul exista deja pe alt contact."
  }
}
```

## Normalization Rules

- Strip spaces, brackets, hyphens, and `+`.
- UK local numbers like `07400...` normalize to `447400...`.
- Romanian local/international numbers normalize consistently with existing CRM rules.
- Reject values that do not look like real phone numbers.

## Frontend Display Rules

The frontend now shows:

- existing `Telefon:` value
- input placeholder `Telefon nou`
- button `Adauga telefon`
- success message `Telefonul a fost adaugat.`
- a small list of phones under `Telefon:` when the API returns multiple phones

After success, the frontend clears the input and updates the selected lead from the response.

## Acceptance Criteria

- Agent can add a new phone from the CRM details page.
- The new phone persists after page refresh.
- Searching by the new phone finds the same lead.
- Existing primary phone remains unchanged unless there was no primary phone.
- Invalid phone returns a friendly error.
- Duplicate phone on the same lead is idempotent and does not create duplicates.
- Phone attached to another lead/contact is blocked.
