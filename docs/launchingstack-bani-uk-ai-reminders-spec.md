# Handoff: course reminder worker (prepared, not deployed here)

The current repository deploys a static frontend and managed HTTP Functions;
Azure Static Web Apps managed Functions do not provide a timer-trigger worker.
Add scheduled reminders to LaunchingStack's existing backend/job infrastructure.
This file is the boundary handoff; no external repository has been modified.

## Source and audiences

Read paid entries from Azure Table `BaniUkAiFounders`, partition
`FondatoriBaniUkAi`, written by the signed Proveit course webhook. Preserve
transactional course communication and any opt-outs applicable to reminders.
Do not add buyers to unrelated marketing campaigns.

Course content/calendar is in this repository's `api/shared/bani-uk-ai-course.json`.
Set a confirmed recurring Zoom URL before enabling reminders. Never dispatch a
placeholder or a link that has not been supplied by the owner.

## Schedule

Use Europe/London scheduling (not a year-round fixed offset):

| Date | Local time | Subject |
| --- | --- | --- |
| 2026-11-02 | 18:00 | Mâine începem: Bani în UK cu AI |
| 2026-11-03 | 19:00 | Începem într-o oră: Verificări cu AI |
| 2026-11-09 | 18:00 | Mâine: Bonusuri de la bănci |
| 2026-11-10 | 19:00 | Începem într-o oră: Bonusuri de la bănci |
| 2026-11-16 | 18:00 | Mâine: Încă 6 modalități |
| 2026-11-17 | 19:00 | Începem într-o oră: Încă 6 modalități |
| 2026-11-23 | 18:00 | Mâine: Sistemul tău pentru tot anul |
| 2026-11-24 | 19:00 | Începem într-o oră: Sistemul tău pentru tot anul |

Draft body: personalized greeting or `Salut,`; session title/date, 20:00–21:30
UK, Zoom button, group WhatsApp button and a short relevant preparation list.
Use the Proveit orange/blue transactional shell and fixed Adrian Defta signature.
One-hour reminders should lead with the Zoom link, with the session time directly
above it. Never claim a session has started early or a recording exists yet.

After each session, let an authorized operator supply/approve the recording URL.
Then email the recording, the materials and the next session date. This cannot
be scheduled with a fabricated recording link before the recording exists.

## Reliability and acceptance

- Persist one delivery key per paid session, reminder type and live-session date.
- Use stable Resend idempotency keys plus a durable outbox and retry/reconciliation.
- Avoid sending old reminders after a delayed worker restart.
- Log delivery status/IDs, not secrets or full payment objects.
- Preview/test to the owner before enabling a job; no automatic broadcasts from
  this frontend. Verify London timezone at DST boundaries.
- Verify Zoom is configured, duplicates do not resend, non-buyers are excluded,
  failure/retry is safe, and recording messages require an approved URL.
