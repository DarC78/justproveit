# FreeMoneyCheck Intent Backend Spec

## Objective

Create a new JustProveIt CRM service/campaign called `FreeMoneyCheck`.

This must work for both:

- ASAP leads, for example Facebook/website/manual leads that should be called soon
- Calendly bookings from:
  `https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani`

Important naming rule:

- Keep `interestType` as `ASAP` or `CALENDLY`.
- Store `FreeMoneyCheck` as the service/serviceKey/campaign/product name.
- Do not replace `interestType` with `FreeMoneyCheck`, because the frontend uses `ASAP` and `CALENDLY` for queue behavior, reservation behavior, and Calendly filters.

## Frontend Change In This Repository

The CRM manual lead form at:

`/admin/crm/?tab=new`

now allows:

```json
{
  "service": "FreeMoneyCheck",
  "interestType": "ASAP"
}
```

The backend must accept this service value on:

`POST /justproveit/leads/asap`

## Backend Event Sources

### ASAP

When a new ASAP lead arrives with service/campaign/product `FreeMoneyCheck`:

- resolve or create the contact
- create or dedupe an active `ASAP` intent according to the existing active-intent idempotency rules
- store service/serviceKey/campaign as `FreeMoneyCheck`
- add to the dialler/manual-call queue according to the same rules as other ASAP leads, if applicable
- trigger the FreeMoneyCheck outbound automation below

Recommended normalized fields:

```json
{
  "interestType": "ASAP",
  "service": "FreeMoneyCheck",
  "serviceKey": "free_money_check",
  "campaign": "FreeMoneyCheck",
  "source": "facebook_lead_ad | website | manual_crm | other"
}
```

### Calendly

When a Calendly booking is received for:

`https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani`

the backend must:

- create a `CALENDLY` intent/event
- store service/serviceKey/campaign as `FreeMoneyCheck`
- preserve Calendly event URI, invitee URI, start time, timezone, cancellation/reschedule status, phone, email, and name
- trigger the FreeMoneyCheck outbound automation below

Calendly rows should still follow the existing Calendly rule:

- each Calendly booking creates its own Calendly intent/event
- do not dedupe Calendly bookings into one row

## Contact Fields Required

Minimum fields:

- full name
- email
- phone number
- source
- interest type: `ASAP` or `CALENDLY`
- service: `FreeMoneyCheck`
- created timestamp UTC

Normalize:

- phone to canonical E.164 where possible
- email lower-case/trimmed
- first name for message greeting, derived from full name when needed

If name is missing, use:

`Buna ziua,`

instead of:

`Buna ziua <name>,`

## Send Window

Use Europe/London local time for customer-facing scheduled messages.

Allowed sending window:

- 09:00 to 21:00 Europe/London

Rules:

- If an immediate message is triggered inside the window, send it immediately.
- If it is triggered outside the window, schedule it for the next 09:00 Europe/London.
- Educational follow-up emails should be spaced at least 24 hours apart.
- If a scheduled send time would fall outside 09:00-21:00, move it to the next valid time inside the window.

## Immediate SMS

Send an SMS to the phone number.

Template key suggestion:

`free-money-check-confirmation-sms`

Body:

```text
Buna ziua <name>,

Multumim ca v-ati facut o programare cu firma Proveit pentru o verificare sa nu pierdeti bani in UK. Unul din agentii nostri va va suna astazi sau maine si vom verifica 6 moduri in care puteti sa pierdeti bani. Veti primi si un raport complet pe email cu rezultatul si ce puteti face sa nu pierdeti bani.

Apelul, verificarea in 6 puncte, si raportul pe email este total gratuit.

Daca doriti sa va sunam la o anumita data si ora, faceti-va o programare in calendarul nostru: https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

## Immediate Email

Send an email with the same core message.

Template key suggestion:

`free-money-check-confirmation-email`

Subject:

`Verificarea gratuita Proveit: 6 moduri in care puteti pierde bani in UK`

Plain text body:

```text
Buna ziua <name>,

Multumim ca v-ati facut o programare cu firma Proveit pentru o verificare sa nu pierdeti bani in UK. Unul din agentii nostri va va suna astazi sau maine si vom verifica 6 moduri in care puteti sa pierdeti bani. Veti primi si un raport complet pe email cu rezultatul si ce puteti face sa nu pierdeti bani.

Va vom suna la numarul: <phone>.

Apelul, verificarea in 6 puncte, si raportul pe email este total gratuit.

Daca doriti sa va sunam la o anumita data si ora, faceti-va o programare in calendarul nostru:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

HTML body should preserve the same text and make the Calendly URL clickable.

## Educational Email Sequence

Create six educational emails, one for each of the 6 FreeMoneyCheck checks.

CTA URL for every email:

`https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani`

Scheduling:

- Email 1: send when the lead arrives, subject to the 09:00-21:00 send window.
- Emails 2-6: schedule at 24 hour intervals after the previous educational email, subject to the send window.
- Do not schedule duplicate sequence emails for the same ASAP active intent if the lead is deduped.
- For Calendly, each booking can receive the sequence unless LaunchingStack already suppresses duplicate marketing sequences for the same person/campaign.

Recommended metadata for all sequence emails:

```json
{
  "campaign": "FreeMoneyCheck",
  "sequenceKey": "free-money-check-6-checks",
  "sequenceStep": 1,
  "leadIntentId": "intent-id",
  "contactId": "contact-id",
  "source": "asap | calendly"
}
```

### Email 1 - Cod Fiscal

Template key:

`free-money-check-sequence-01-tax-code`

Subject:

`Verificarea 1: ati platit prea mult tax in UK?`

Body:

```text
Buna ziua <name>,

Prima verificare din Free Money Check este codul fiscal si taxele platite in UK.

Multi romani au avut mai multe joburi, au schimbat angajatorul, au lucrat prin agentie sau au avut perioade in care HMRC a folosit un tax code gresit. Cand se intampla asta, se poate ajunge la taxe platite in plus.

In apelul gratuit verificam rapid daca exista semne ca merita sa va uitati la tax code, la istoricul de munca si la posibilitatea de recuperare pentru anii anteriori.

Puteti programa o verificare gratuita aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

### Email 2 - Credit Score

Template key:

`free-money-check-sequence-02-credit-score`

Subject:

`Verificarea 2: raportul de credit va poate costa bani fara sa stiti`

Body:

```text
Buna ziua <name>,

A doua verificare este raportul de credit.

O eroare simpla, o adresa veche, lipsa de pe electoral roll sau o informatie gresita in raport poate afecta sansele de aprobare pentru credit, telefon, masina, chirie sau mortgage. Uneori costul nu apare ca o factura directa, ci ca dobanda mai mare sau optiuni mai putine.

In Free Money Check vedem daca exista pasi simpli pe care ii puteti face pentru a verifica gratuit raportul si pentru a corecta eventuale probleme.

Programati un apel gratuit aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

### Email 3 - Bank Switching

Template key:

`free-money-check-sequence-03-bank-switching`

Subject:

`Verificarea 3: bonusuri bancare de pana la £1000`

Body:

```text
Buna ziua <name>,

A treia verificare este bank switching.

Mai multe banci din UK ofera bonusuri cand mutati un cont curent la ele prin Current Account Switch Service. De obicei nu este nevoie sa fie contul principal; pentru multe persoane poate fi mai potrivit un cont secundar, daca indeplineste conditiile bancii.

Bonusurile pot fi in zona £150-£220 per banca. Daca sunt mai multe oferte active intr-un an, totalul poate ajunge la aproximativ £1000.

In apelul gratuit va explicam ce inseamna, ce conditii sunt de verificat si cum sa evitati sa faceti miscari nepotrivite pentru situatia dvs.

Programati un apel gratuit aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

### Email 4 - Asigurari

Template key:

`free-money-check-sequence-04-insurance`

Subject:

`Verificarea 4: platiti prea mult la asigurari?`

Body:

```text
Buna ziua <name>,

A patra verificare este zona de asigurari: masina, casa, van, travel, business sau alte polite.

Multi clienti platesc mai mult pentru ca reinnoiesc automat, raman cu acelasi furnizor sau nu compara piata la timp. Diferentele pot fi mici lunar, dar mari pe un an sau pe mai multi ani.

In Free Money Check vedem daca aveti zone unde merita comparat pretul, schimbat furnizorul sau negociat inainte de reinnoire.

Programati un apel gratuit aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

### Email 5 - Transfer Bani Romania

Template key:

`free-money-check-sequence-05-money-transfer`

Subject:

`Verificarea 5: pierdeti bani cand trimiteti bani in Romania?`

Body:

```text
Buna ziua <name>,

A cincea verificare este trimiterea banilor din UK in Romania.

Costul real nu este doar comisionul afisat. Uneori pierderea vine din cursul de schimb, din taxe ascunse sau din folosirea aceleiasi metode scumpe ani la rand.

Daca trimiteti bani regulat familiei sau pentru rate, economiile pot deveni importante in timp. In apelul gratuit verificam metoda folosita si daca merita comparata cu alternative mai ieftine.

Programati un apel gratuit aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

### Email 6 - Utilitati Si Abonamente

Template key:

`free-money-check-sequence-06-utilities`

Subject:

`Verificarea 6: facturi si abonamente care pot fi reduse`

Body:

```text
Buna ziua <name>,

A sasea verificare este despre facturi si abonamente: energie, broadband, telefon, TV, servicii online si alte plati recurente.

Multe gospodarii pierd bani pentru ca nu renegociaza, nu compara furnizorii sau pastreaza servicii pe care nu le mai folosesc. O verificare rapida poate arata unde exista economii simple, fara schimbari complicate.

In apelul gratuit facem o radiografie scurta si va spunem ce zone merita verificate mai departe.

Programati un apel gratuit aici:
https://calendly.com/proveitweb/verificare-sa-nu-pierdeti-bani

O zi buna,
Adrian Defta
```

## Email/SMS Queue Requirements

Use the backend's existing queued email/SMS infrastructure where possible.

Required fields for each queued outbound item:

- tenant/client key
- contact id
- lead intent id
- campaign: `FreeMoneyCheck`
- template key
- recipient email or phone
- scheduledAtUtc
- status: `to_send`
- source event id / idempotency key
- payload JSON with name, phone, email, Calendly URL, and source

Idempotency keys:

- confirmation SMS:
  `free-money-check:<intentId>:confirmation-sms`
- confirmation email:
  `free-money-check:<intentId>:confirmation-email`
- educational email:
  `free-money-check:<intentId>:sequence:<stepNumber>`

If the same key already exists in `to_send`, `sending`, or `sent`, do not create a duplicate.

## CRM Lead Intents API

`GET /justproveit/admin/crm/lead-intents` should return the new service/campaign fields so the frontend can filter/display the rows.

Recommended response fields:

```json
{
  "interestType": "ASAP",
  "service": "FreeMoneyCheck",
  "serviceKey": "free_money_check",
  "campaign": "FreeMoneyCheck"
}
```

For Calendly bookings:

```json
{
  "interestType": "CALENDLY",
  "service": "FreeMoneyCheck",
  "serviceKey": "free_money_check",
  "campaign": "FreeMoneyCheck",
  "calendlyEventUri": "https://api.calendly.com/...",
  "contactTimeUtc": "2026-08-09T12:00:00.000Z"
}
```

## Acceptance Criteria

- ASAP FreeMoneyCheck leads can be created from `POST /justproveit/leads/asap`.
- CRM manual lead form can submit `service = FreeMoneyCheck`.
- Calendly bookings from `verificare-sa-nu-pierdeti-bani` create `CALENDLY` FreeMoneyCheck intents.
- Lead Intents tab shows these rows without frontend errors.
- New ASAP FreeMoneyCheck lead triggers one confirmation SMS and one confirmation email.
- New Calendly FreeMoneyCheck booking triggers one confirmation SMS and one confirmation email.
- Six educational emails are queued with correct template keys, 24h spacing, and 09:00-21:00 Europe/London send-window handling.
- Duplicate/retried ASAP events do not create duplicate active intents or duplicate outbound sequence items.
- Calendly bookings remain separate events, but outbound messages use idempotency by `intentId` to avoid duplicate sends for the same booking.
- Every email contains the Calendly CTA URL.
- Full phone numbers, email addresses, and SMS/email bodies are not written to unsafe logs.
