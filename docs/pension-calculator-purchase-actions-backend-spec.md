# Pension Calculator Purchase Actions Backend Spec

## Context

The frontend page:

`https://www.justproveit.co.uk/ro/calculator-varsta-pensionare`

is fully public. It must not require CRM login.

The frontend sends:

- purchase email through `POST /api/justproveit/admin/crm/manual-email`
- purchase SMS through `POST /api/justproveit/admin/crm/manual-sms`

These public purchase requests do not include `Authorization: Bearer ...`.
For the public pension calculator, the frontend should call the CRM/LaunchingStack base URL (`NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL`, currently `https://launchingstack-func-dev.azurewebsites.net/api`) because that is where the public template bypass is implemented. The authenticated admin CRM manual-send functions can keep using the normal admin API base.

The existing simulation email flow remains public and unchanged.

## Required Backend Email Work

Add support for this manual email template:

`ro-pension-calculator-email-cumparare`

The frontend payload is:

```json
{
  "email": "recipient@example.com",
  "firstName": "Client Name",
  "emailtemplate": "ro-pension-calculator-email-cumparare",
  "templateKey": "ro-pension-calculator-email-cumparare",
  "campaign": "ro-pension-calculator-email-cumparare",
  "param1": "Client Name",
  "param2": "07123456789",
  "param3": "https://www.justproveit.co.uk/ro/calculator-varsta-pensionare",
  "param4": "",
  "pageUrl": "https://www.justproveit.co.uk/ro/calculator-varsta-pensionare",
  "agent": "Public pension calculator"
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
  "template": "ro-pension-calculator-sms-cumparare",
  "templateKey": "ro-pension-calculator-sms-cumparare",
  "pageUrl": "https://www.justproveit.co.uk/ro/calculator-varsta-pensionare",
  "agent": "Public pension calculator"
}
```

The backend should use the approved SMS text server-side for template:

`ro-pension-calculator-sms-cumparare`

Existing frontend callers that still send the old exact `message` body may continue to work for backward compatibility, but the public pension calculator now sends `template`.

Approved SMS body:

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

The pension calculator purchase actions are public. Backend must allow these two specific template-driven sends without a bearer token:

- `manual-email` with `emailtemplate: "ro-pension-calculator-email-cumparare"`
- `manual-sms` with `template: "ro-pension-calculator-sms-cumparare"`

Do not require CRM login for `/ro/calculator-varsta-pensionare`, `Email cumparare`, or `SMS Cumparare`.

Other admin/manual messaging templates can keep their existing CRM authorization rules.

## Logging

Do not log full email addresses, full phone numbers, full SMS bodies, Resend API keys, or Twilio credentials.

Safe logs may include:

- template key
- provider message id
- phone last 4 or last 6 digits
- agent label
- success/failure code

## Acceptance Criteria

- Anonymous users can open `/ro/calculator-varsta-pensionare`.
- The page does not redirect to login.
- `Email Simulare` keeps the current public flow unchanged.
- `Email cumparare` sends the exact email body above through Resend.
- `Email cumparare` does not send `Authorization: Bearer ...`.
- If the email is not sent through Resend, `manual-email` must return a non-2xx response or `success: false` with a useful `message`; it must not return a success-shaped response for missing/unknown templates or provider failures.
- On successful Resend delivery request, include the Resend message id in `result` or another stable field so the frontend/operator can correlate the send with Resend logs.
- `SMS Cumparare` sends the exact SMS body above through Twilio.
- `SMS Cumparare` sends `template: "ro-pension-calculator-sms-cumparare"` and does not send `Authorization: Bearer ...`.
- Both buttons show a visible success or failure message in the frontend.
- Existing pension calculator calculation and simulation email behavior remain unchanged.
