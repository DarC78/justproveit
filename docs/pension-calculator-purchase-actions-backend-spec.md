# Pension Calculator Purchase Actions Backend Spec

## Context

The frontend page:

`https://www.justproveit.co.uk/ro/calculator-varsta-pensionare`

is now CRM-authenticated and uses existing authenticated backend CRM messaging patterns.

The frontend sends:

- purchase email through `POST /api/justproveit/admin/crm/manual-email`
- purchase SMS through `POST /api/justproveit/admin/crm/manual-sms`

Both requests include the logged-in user's bearer token.

## Required Backend Email Work

Add support for this manual email template:

`ro-pension-calculator-email-cumparare`

The frontend payload is:

```json
{
  "email": "recipient@example.com",
  "firstName": "Client Name",
  "emailtemplate": "ro-pension-calculator-email-cumparare",
  "campaign": "ro-pension-calculator-email-cumparare",
  "param1": "Client Name",
  "param2": "07123456789",
  "param3": "https://www.justproveit.co.uk/ro/calculator-varsta-pensionare",
  "param4": "referrer",
  "agent": "Agent Name"
}
```

The backend should send the email via the existing Resend integration using:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Recommended subject:

`Simulare pensionare internationala`

Email body:

```text
Buna ziua, 

Felicitari pentru ca doriti sa vedeti exact cand iesiti la pensie in Romania si in alte tari in care ati mai muncit. 

Aveti aici link-ul pentru serviciul nostru: https://www.proveitweb.co.uk/saleconsultation

Costul serviciului este de £50 astazi. Daca va puteti pensiona in urmatorii 2 ani, mai platiti £47 sub forma a doua rate, una luna urmatoare si una cealalta luna. Ratele sunt in valoare de £23.5 (prin urmare inca £47 in total). Dupa cum va spuneam, daca nu va puteti pensiona in urmatorii 2 ani nu mai aveti nimic de plata. 

Serviciul nostru costa in:
1 - Simulare pe cazul dvs. sa vedeti exact cand iesiti la pensie in Romania, si cand iesiti in fiecare din tarile in care ati mai muncit. 
2 - Va raspundem la orice intrebare in cadrul simularii.
3 - Va facem o programare cu dl. Adrian Defta pentru a va clarifica orice alte intrebari ati avea. 

Mai mult, in urmatoarele 30 de zile puteti intreba orice. 

O zi buna, 
Adrian Defta
```

Return the existing manual email response shape, for example:

```json
{
  "success": true,
  "message": "Email sent.",
  "result": "resend-message-id"
}
```

If `manual-email` currently only accepts legacy template names, add this key to the same template registry/router rather than creating a frontend-specific exception.

## Required Backend SMS Behavior

The frontend sends purchase SMS through:

`POST /api/justproveit/admin/crm/manual-sms`

Payload:

```json
{
  "phone": "07123456789",
  "message": "SMS body",
  "agent": "Agent Name"
}
```

The SMS body is:

```text
Felicitari pentru ca doriti sa vedeti exact cand iesiti la pensie in Romania si in alte tari in care ati mai muncit. 

Aveti aici link-ul pentru serviciul nostru: https://www.proveitweb.co.uk/saleconsultation

Costul serviciului este de £50 astazi. Daca va puteti pensiona in urmatorii 2 ani, mai platiti £47 sub forma a doua rate, una luna urmatoare si una cealalta luna. Ratele sunt in valoare de £23.5 (prin urmare inca £47 in total). Dupa cum va spuneam, daca nu va puteti pensiona in urmatorii 2 ani nu mai aveti nimic de plata. 

Serviciul nostru costa in:
1 - Simulare pe cazul dvs. sa vedeti exact cand iesiti la pensie in Romania, si cand iesiti in fiecare din tarile in care ati mai muncit. 
2 - Va raspundem la orice intrebare in cadrul simularii.
3 - Va facem o programare cu dl. Adrian Defta pentru a va clarifica orice alte intrebari ati avea. 

Mai mult, in urmatoarele 30 de zile puteti intreba orice.
```

The backend should reuse the existing Twilio helper/settings:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

If `manual-sms` already sends immediately through Twilio, no new SMS endpoint is required.

## Auth

Both endpoints should keep existing CRM/admin bearer-token authorization. This page is not public anymore.

## Logging

Do not log full email addresses, full phone numbers, full SMS bodies, Resend API keys, or Twilio credentials.

Safe logs may include:

- template key
- provider message id
- phone last 4 or last 6 digits
- authenticated agent name/id
- success/failure code

## Acceptance Criteria

- A CRM-authenticated user can open `/ro/calculator-varsta-pensionare`.
- Anonymous users are redirected to `/login?next=/ro/calculator-varsta-pensionare`.
- `Email cumparare` sends the exact email body above through Resend.
- If the email is not sent through Resend, `manual-email` must return a non-2xx response or `success: false` with a useful `message`; it must not return a success-shaped response for missing/unknown templates or provider failures.
- On successful Resend delivery request, include the Resend message id in `result` or another stable field so the frontend/operator can correlate the send with Resend logs.
- `SMS Cumparare` sends the exact SMS body above through Twilio.
- Both buttons show a visible success or failure message in the frontend.
- Existing pension calculator calculation and simulation email behavior remain unchanged.
