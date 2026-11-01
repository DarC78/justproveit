import type {AgeYM,PensionCalculatorResponse} from '@/lib/pensionCalculator';
import {estimateUkPension} from '@/lib/pensionUkEstimate';
const ADDITIONAL_BREAKDOWN_LABELS: Record<string,string>={armyNormal:'Armata - termen normal',armyReduced:'Armata - termen redus',paidUnemployment:'Șomaj plătit',maternityLeave:'Concediu de maternitate',university:'Facultate fără suprapunere'};
export default function ResultPanel({
  emailMessage,
  onSendEmail,
  response,
  sendingEmail,
  readOnly = false,
}: {
  emailMessage: string;
  onSendEmail: () => void;
  response: PensionCalculatorResponse | null;
  sendingEmail: boolean;
  readOnly?: boolean;
}) {
  if (!response) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold">Rezultatul apare aici</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Dupa calcul, vei vedea recomandarea principala si scenariile. Daca vrei, trimiti apoi
          rezultatul pe email.
        </p>
      </section>
    );
  }

  const { result } = response;
  const isLocalOnly = response.localOnly || response.resultId.startsWith("local-");
  const standardScenario = result.scenarios.find(
    (scenario) => scenario.type === "limita_varsta_standard",
  );
  const recommendedScenario = result.recommended;
  const sortedScenarios = sortPensionScenariosForDisplay(result.scenarios);
  const declaredForeignMonths=result.foreignPensionSections?.reduce((sum,section)=>sum+section.workedPeriod.years*12+section.workedPeriod.months,0);
  const totalWorkedMonths=declaredForeignMonths!==undefined&&result.foreignPensionSections?.length
    ? result.stagiu.roContributiv.years*12+result.stagiu.roContributiv.months+declaredForeignMonths
    : result.stagiu.totalContributiv.years*12+result.stagiu.totalContributiv.months;
  const totalWorked={years:Math.floor(totalWorkedMonths/12),months:totalWorkedMonths%12};

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
        {isLocalOnly ? "Rezultat calculat local" : "Rezultat salvat"}
      </p>
      {isLocalOnly ? (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
          API-ul LS pentru salvarea calculatorului nu este disponibil momentan. Rezultatul este afisat, dar
          trimiterea automata pe email va functiona dupa ce endpoint-ul backend este activ.
        </p>
      ) : null}
      <div className="mt-3 space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-lg font-extrabold">Romania</h2>
          {recommendedScenario?.eligibleNow ? (
            <>
              <h3 className="mt-2 text-xl font-extrabold">{recommendedScenario.label}</h3>
              <p className="mt-2 text-sm text-slate-700">
                Varsta: <strong>{formatAge(recommendedScenario.retirementAge)}</strong>
                {" "}| Data estimata: <strong>{recommendedScenario.retirementDate}</strong>
              </p>
            </>
          ) : recommendedScenario ? (
            <>
              <h3 className="mt-2 text-xl font-extrabold">
                Cel mai devreme va puteti pensiona la data de{" "}
                <strong>{recommendedScenario.retirementDate}</strong>.
              </h3>
              <p className="mt-2 text-sm text-slate-700">
                Varianta: <strong>{recommendedScenario.label}</strong>
                {" "}| Varsta: <strong>{formatAge(recommendedScenario.retirementAge)}</strong>
              </p>
            </>
          ) : (
            <h3 className="mt-2 text-xl font-extrabold">Nu exista o varianta eligibila cu datele introduse.</h3>
          )}

          <div className="mt-4 grid gap-2 text-sm">
            <Metric label="Varsta acum" value={formatAge(result.currentAge)} />
            <Metric
              label="Varsta standard"
              value={
                standardScenario
                  ? `${formatAge(result.anexa.standardAge)} (${standardScenario.retirementDate})`
                  : formatAge(result.anexa.standardAge)
              }
            />
            <Metric label="Stagiu complet" value={formatAge(result.anexa.fullStagiu)} />
            <Metric label="Stagiu minim" value={formatAge(result.anexa.minimumStagiu)} />
            <Metric label="Stagiu total contributiv" value={formatAge(result.stagiu.totalContributiv)} />
          </div>

          {result.stagiu.additionalBreakdown &&
          Object.keys(result.stagiu.additionalBreakdown).length > 0 ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-bold text-slate-800">Perioade suplimentare incluse</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {Object.entries(result.stagiu.additionalBreakdown).map(([key, period]) => (
                  <Metric
                    key={key}
                    label={`${formatAdditionalBreakdownLabel(key, period.label)} (${formatBreakdownClassification(period.classification)})`}
                    value={formatAge(period)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <h3 className="text-sm font-bold text-amber-900">Atentionari</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="px-3 py-2">Scenariu</th>
                  <th className="px-3 py-2">Varsta</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedScenarios.map((scenario) => (
                  <tr key={scenario.type} className="border-b border-slate-200 bg-white/70">
                    <td className="px-3 py-2 font-semibold">{scenario.label}</td>
                    <td className="px-3 py-2">{formatScenarioAge(scenario)}</td>
                    <td className="px-3 py-2">{formatScenarioDate(scenario)}</td>
                    <td className="px-3 py-2">
                      <p className="font-semibold">{formatScenarioStatus(scenario)}</p>
                      {scenario.notApplicableReason ? (
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {scenario.notApplicableReason}
                        </p>
                      ) : null}
                      {scenario.eligibilityReasons.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-emerald-700">Conditii indeplinite:</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-600">
                            {scenario.eligibilityReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {scenario.ineligibilityReasons.length > 0 ? (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-red-700">Conditii neindeplinite:</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-slate-600">
                            {scenario.ineligibilityReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(result.foreignPensionSections?.length
          ? result.foreignPensionSections
          : result.ukStatePension
            ? [
                {
                  countryName: "UK",
                  countryCode: "UK",
                  minimumServiceText: undefined,
                  serviceAssessment: undefined,
                  earlyRetirementText: undefined,
                  rulesCheckedAt: undefined,
                  sourceUrls: undefined,
                  workedPeriod: result.stagiu.foreign,
                  retirementAge: result.ukStatePension.retirementAge,
                  retirementDate: result.ukStatePension.retirementDate,
                  eligibleNow: result.ukStatePension.eligibleNow,
                  sourceUrl: result.ukStatePension.sourceUrl,
                  note: result.ukStatePension.note,
                },
              ]
            : []
        ).map((section) => (
          <div key={`${section.countryName}-${section.retirementDate || section.workedPeriod.years}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-extrabold">{section.countryName}</h2>
            {section.retirementDate ? (
              <p className="mt-2 text-xl font-extrabold">
                Data estimată pentru împlinirea vârstei de pensionare în {section.countryName}:{" "}
                <strong>{section.retirementDate}</strong>.
              </p>
            ) : (
              <p className="mt-2 text-xl font-extrabold">
                Stagiu declarat in {section.countryName}:{" "}
                <strong>{formatAge(section.workedPeriod)}</strong>.
              </p>
            )}
            <div className="mt-4 grid gap-2 text-sm">
              <Metric label="Stagiu declarat" value={formatAge(section.workedPeriod)} />
              {section.retirementAge ? (
                <Metric label="Varsta pensie de stat" value={formatAge(section.retirementAge)} />
              ) : null}
              {section.retirementDate ? (
                <Metric
                  label="Status"
                  value={section.eligibleNow?'Vârsta din model este îndeplinită; dreptul se verifică':'Vârsta din model se împlinește la data indicată'}
                />
              ) : null}
            </div>
            {section.minimumServiceText&&<div className="mt-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Vechimea minimă și verificarea stagiului</h3><p className="text-sm">{section.minimumServiceText}</p><p className="text-sm font-semibold">{section.serviceAssessment}</p></div>}
            {section.earlyRetirementText&&<div className="mt-3 rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-bold">Se poate ieși mai devreme? Condiții principale</h3><p className="mt-2 text-sm">{section.earlyRetirementText}</p><p className="mt-2 text-xs text-slate-600">Acestea sunt condițiile schemei, nu confirmarea eligibilității personale. Nu sunt presupuse automat perioade speciale, puncte, cuantumuri ori totalizarea cu toate statele.</p></div>}
            {section.rulesCheckedAt&&<p className="mt-3 text-xs text-slate-600">Reguli verificate la {section.rulesCheckedAt}. Data este o estimare lunară după vârstă; acordarea depinde și de stagiul confirmat și de cerere.</p>}
            {section.countryCode!=='UK'&&!section.rulesCheckedAt&&<p className="mt-3 text-sm text-amber-900">Acesta este un rezultat salvat anterior regulilor internaționale detaliate. Rulați o simulare nouă pentru vârstă, stagiu minim și condițiile de anticipare actualizate.</p>}
            {section.countryCode==='UK'&&section.retirementAge&&<UkPensionEstimate worked={section.workedPeriod} totalWorked={totalWorked} currentAge={result.currentAge} retirementAge={section.retirementAge}/>}
            {section.note ? (
              <p className="mt-3 text-xs leading-5 text-slate-600">{section.note}</p>
            ) : null}
            {section.sourceUrl ? (
              <a
                href={section.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline"
              >
                Verifica sursa oficiala
              </a>
            ) : null}
            {section.sourceUrls?.filter(url=>url!==section.sourceUrl).map((url,i)=><a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-emerald-700 underline">Sursă oficială suplimentară {i+1}</a>)}
          </div>
        ))}
      </div>

      {!readOnly && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-700">
          Email: {response.emailSent ? "trimis" : "netrimis"}
        </p>
        <button
          type="button"
          disabled={sendingEmail || response.emailSent || isLocalOnly}
          onClick={onSendEmail}
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {sendingEmail
            ? "Trimit..."
            : response.emailSent
              ? "Email trimis"
              : isLocalOnly
                ? "Email indisponibil momentan"
                : "Trimite rezultatul pe email"}
        </button>
        {emailMessage ? (
          <p className="mt-2 text-sm font-semibold text-slate-700">{emailMessage}</p>
        ) : null}
      </div>}
    </section>
  );
}

function UkPensionEstimate({worked,totalWorked,currentAge,retirementAge}:{worked:AgeYM;totalWorked:AgeYM;currentAge:AgeYM;retirementAge:AgeYM}) {
  const estimate=estimateUkPension(worked,currentAge,retirementAge);
  const money=(value:number)=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(value);
  return <section className="mt-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
    <h3 className="font-bold">Estimare pensie de stat UK</h3>
    <Metric label="Cu stagiul UK declarat acum" value={`${money(estimate.currentMonthly)} / lună`}/>
    <Metric label="Dacă lucrați în UK până la pensionare" value={`${money(estimate.projectedMonthly)} / lună`}/>
    <Metric label="Stagiu UK estimat atunci" value={formatAge(estimate.projectedPeriod)}/>
    <p className="text-sm">Calcul proporțional: £1.048 ÷ 35 × anii UK, plafonat la £1.048 pe lună. Bază fixă de estimare, nu tarif oficial garantat. Proiecția presupune contribuții continue în UK până la data indicată și nu include majorări viitoare sau inflație.</p>
    <p className="text-xs leading-5">Anii lucrați declarați sunt folosiți ca aproximare pentru anii eligibili National Insurance; lunile sunt prorate orientativ. Istoricul anterior lui 2016 și perioadele contracted-out pot schimba suma. Aceasta nu este o ofertă sau o confirmare de drept la pensie.</p>
    {estimate.belowMinimum&&<p className="text-sm font-semibold text-emerald-900">Aveți sub 10 ani în UK declarați. Dar, în total, vechimea dvs. declarată în toate țările în care ați muncit este de <strong>{formatAge(totalWorked)}</strong>. {totalWorked.years>=10?'Prin urmare, veți putea primi pensie și din UK chiar dacă nu munciți 10 ani în UK, dacă instituțiile competente confirmă cel puțin 10 ani eligibili cumulați conform acordurilor aplicabile.':'Nu trebuie ca toți cei 10 ani eligibili să fie lucrați în UK; pragul poate fi completat cu perioade recunoscute din celelalte țări. Din vechimea declarată acum, pragul total de 10 ani nu este încă atins.'} Suma pensiei UK se calculează pentru anii eligibili din UK.</p>}
    <a className="text-sm font-semibold text-emerald-800 underline" href="https://www.gov.uk/check-state-pension" target="_blank" rel="noreferrer">Verificați estimarea oficială și National Insurance record</a>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatAdditionalBreakdownLabel(key: string, backendLabel?: string) {
  return backendLabel || ADDITIONAL_BREAKDOWN_LABELS[key] || key;
}

function formatBreakdownClassification(classification?: string) {
  switch (classification) {
    case "contributiv":
      return "contributiv";
    case "asimilat":
      return "asimilat";
    case "excluded":
      return "exclus";
    default:
      return classification || "inclus";
  }
}

function sortPensionScenariosForDisplay(
  scenarios: PensionCalculatorResponse["result"]["scenarios"],
) {
  return scenarios
    .map((scenario, index) => ({ scenario, index }))
    .sort((left, right) => {
      const leftRank = getScenarioChronologyRank(left.scenario);
      const rightRank = getScenarioChronologyRank(right.scenario);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.index - right.index;
    })
    .map(({ scenario }) => scenario);
}

function getScenarioChronologyRank(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  if (scenario.notApplicable) {
    return Number.POSITIVE_INFINITY;
  }

  const dateRank = parseYearMonthRank(scenario.retirementDate);
  if (dateRank !== null) {
    return dateRank;
  }

  return Number.POSITIVE_INFINITY;
}

function parseYearMonthRank(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value.trim());
  if (!match) {
    return null;
  }

  return Number(match[1]) * 12 + Number(match[2]);
}

function formatAge(age: AgeYM) {
  if (age.months === 0) {
    return `${age.years} ani`;
  }
  return `${age.years} ani si ${age.months} luni`;
}

function formatScenarioStatus(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  if (scenario.notApplicable) {
    return "Nu se aplica";
  }
  if (scenario.eligibleNow) {
    return "Eligibil acum";
  }
  if (scenario.eligible || scenario.futureEligible || isOnlyAgePending(scenario)) {
    return "Eligibil la data indicata";
  }
  return "Nu acum";
}

function formatScenarioAge(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return scenario.notApplicable ? "N/A" : formatAge(scenario.retirementAge);
}

function formatScenarioDate(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return scenario.notApplicable || !scenario.retirementDate ? "N/A" : scenario.retirementDate;
}

function isOnlyAgePending(
  scenario: PensionCalculatorResponse["result"]["scenarios"][number],
) {
  return (
    !scenario.notApplicable &&
    scenario.ineligibilityReasons.length > 0 &&
    scenario.ineligibilityReasons.every((reason) =>
      reason.trim().toLowerCase().startsWith("varsta"),
    )
  );
}

