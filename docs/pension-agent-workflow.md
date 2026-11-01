# Pension calculator agent workflow

The calculator opens with the requested title, a single-column agent interview and the agent name from `?agent=...`. The previous detailed calculator is retained in a collapsed section; the previous result sidebar is at the bottom.

The interview collects total Romanian years (including groups), work-book availability, group I/II years, five foreign-country periods, UK employment/private-pension questions, birth month/year, sex and children. Group years are subtracted from normal Romanian years to avoid double counting. Duplicate countries, missing countries and implausible totals are rejected. All European countries plus Israel, Canada and USA are listed. Countries outside the automatic coordination shortlist remain in the saved interview but are excluded from the projection pending specialist verification; selecting a country is not proof that every international combination can be totalised.

`Simulare` saves the interview and requests `projectFutureContributions: true` from the backend. Four scenarios are returned, assuming one contributory month per future month without overlap. Dates wait for both age and service thresholds. Article 56 requires full service plus five years; early retirement requires full service. An early scenario reached at/after the standard route is marked inapplicable. Existing children/group reductions and legal caps apply. No future group-work reduction is invented. The assumption is stored with the result and included in email and the private result page. Backend failure produces an error rather than substituting the older local calculator for this projection.

Sending is a separate explicit `Trimite rezultatul pe email` action through the existing Resend route and sender. The script says the email was sent only after provider acceptance; mock delivery is rejected. The agent then asks the client to check Inbox/Spam and open the private results link, and can tick the receipt-confirmation checkbox. No email is sent merely by running a simulation. Receipt confirmation is session UI state, not a provider delivery webhook.

The script preserves the requested introduction, process guidance, country-specific office mappings, expandable document list and £297 / three-instalment service offer. Absolute claims about totalisation across every country, mandatory legalisation, universal filing procedures, guaranteed dates and loss of all retroactive rights have been qualified. The unsupported claim about three million incorrect decisions is omitted. Office routing is shown only for countries with positive declared years, with the supplied official reference and a prompt to verify competence/exceptions. Do not treat these mappings as determined solely by country for Italy, Spain, Germany or Austria.

References checked on 1 November 2026:

- [CNPP: standard retirement and reductions](https://www.cnpp.ro/activitati-cnpp/pensii/pensia-pentru-limita-de-varsta/)
- [CNPP: early retirement](https://www.cnpp.ro/activitati-cnpp/pensii/pensia-anticipata/)
- [CNPP: international coordination and filing](https://www.cnpp.ro/activitati-cnpp/relatii-internationale/pensii-internationale/pensii-comunitare/)
- [Supplied county competence reference](https://www.cjpbn.ro/informare-privind-rolul-de-organism-de-legatura-in-materie-de-pensii-si-ajutoare-deces-a-directiei-relatii-internationale-din-cadrul-casei-nationale-de-pensii-publice/)

Validation: frontend production build; interview, layout and dispatcher tests; backend full test suite including projection/email consistency tests. Local HTTP rendering confirms the one-column page and removal of the old introduction. Interactive browser/screenshot inspection could not run because the browser access host was unavailable. The broader frontend suite has unrelated failures in existing Bani UK checkout tests and missing `@azure/data-tables` in local API test resolution; relevant pension tests pass. No live email is sent during verification.

## Follow-up changes

The detailed calculator and its old actions are removed. Birth month/year use separate selectors (1950–1980 plus 1980+); 1980+ requires an exact year. UK employment/private-pension questions appear inside the country card where UK is selected. Reduced, early and full-service-plus-five routes at/after the standard route are marked inapplicable without hiding their contribution explanations. Projected saved results and email share the revised explanations, including current service, target service, target date and individual reductions.

Page parameters prefill contact fields. An authenticated CRM session fills missing name/email from an exact phone lookup, selecting the latest updated contact/email. Manual values are not overwritten by a delayed lookup. Editing an email saves on blur and is checked again before the email send action. CRM updates require the existing CRM role/permission. Without a session the page reports that CRM authentication is needed; it never exposes or updates CRM anonymously. A missing CRM contact is reported rather than creating a new identity silently.

The protected contact-email endpoint uses a serializable transaction, normalized exact phone matching and tenant isolation. An absent email is added as primary; an existing syntactically invalid address is replaced; a different syntactically valid address is preserved and the new email is added. Plausible domain typos are not guessed. An address owned by another CRM contact is rejected rather than moved. Tests cover the email decision policy, transaction/ownership conflict, parameter precedence, authenticated filling/saving, anonymous access, UK placement and birth-year options. No live customer email or contact is changed during QA.

## UK amount estimate

The UK section in the live calculator and private saved-result page shows two illustrative monthly amounts: declared UK months now, and declared UK months plus the remaining months to the displayed UK pension age. Formula: GBP 1,048 * min(UK months, 420) / 420, rounded to pennies. The second estimate assumes continuous future UK contributions and no uprating/inflation. The simulation's saved current age is used, so reopening an older result does not move its projection forward automatically. GBP 1,048 is the user-requested fixed modelling base, not a claim about the official rate. Amounts are conditional on the National Insurance record, qualifying-year rules and transitional/contracted-out treatment. Under ten UK years triggers a minimum-qualification note with the overseas coordination caveat. The status describes reaching pension age rather than asserting entitlement. The existing email links open the result page with these estimates; the email body itself is unchanged.

References: https://www.gov.uk/new-state-pension and https://www.gov.uk/new-state-pension/living-and-working-overseas . Validation covers 7 years = GBP 209.60, month-level future contributions, 35-year cap, no future accrual after pension age, and rendering of the amount/eligibility notices.

## International retirement estimates

New results show official-age date estimates, minimum service, early-retirement conditions and official sources for selected foreign countries. Backend rules were reviewed on 2026-11-01. Age milestones do not establish entitlement; unsupported cohorts/regimes require individual verification. Existing saved results need a new simulation to obtain the new rules. UK amount estimates are unchanged.


## Lead details and saved-result next steps

The calculator displays current lead name, email and phone below its title. UK is first in country lists. Workbook defaults to DA; private-pension location defaults to NU and only DA reveals the all-pensions-paid question. Changing back to NU clears the hidden paid answer.

Residence is explicitly selected and saved as interview.residenceCountry. The private result endpoint returns only that extra field, without exposing the interview. Results reuse the saved residence without repeating the question. Older results without residence show generic filing guidance. The selected residence drives the filing guide and Romanian liaison office; uncertain allocations show de referinta.

PensionNextSteps renders Romania then chronological foreign age milestones and seven process steps, with two service links. preparationTiming uses the current month: passed/current, up to 24 months, or a two-to-one year window. This window covers preparation rather than an unsupported promise that institutions accept applications two years early. Legal copy distinguishes certified copies, statutory extensions, court appeals and revision requests. An unverified claim that 2.7 million decisions are wrong is not presented as established fact.

Tests: node --test tests/pension-agent-workflow.test.cjs tests/pension-next-steps.test.cjs


The first service offer includes a WhatsApp details link with WEB_REZULTATE_SIMULARE. Step 2 explains that liaison competence follows the foreign-country allocation rather than the former Romanian domicile; multi-office countries retain their regional allocation details. Step 7 uses the current CNPP FAQ URL supplied by the user.

Both service offers now include the WhatsApp details link. The UK under-ten-years explanation displays total declared work: Romanian contributory service plus all displayed foreign worked periods, falling back to the saved contributory total for older results. At ten total years it explains the aggregation route, subject to official recognition and applicable agreements; below ten total years it does not promise eligibility. The UK amount remains based on UK years only.


## Result delivery over WhatsApp

The agent interview email button also queues a plain-text WhatsApp summary to the same contact phone after Resend email success. It includes the email opening, ordered country dates and preparation warning. Backend scopes this to the agent-interview simulation source. UI reports queued/provider-accepted states without claiming delivery, and distinguishes queue failure from email failure. A queue-write failure exposes Reincearca WhatsApp; the saved successful email is not resent to the same email on retry. Queue references are stable per result and normalized recipient; existing failed messages are not duplicated or converted to templates. The existing WhatsApp sender and 24-hour service-window rules apply.

