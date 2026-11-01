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
