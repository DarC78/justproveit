import type {PensionCalculatorResult} from '@/lib/pensionCalculator';
import {COUNTRY_GUIDES,INTERVIEW_COUNTRIES} from '@/lib/pensionInterview';
import {internationalMilestones,preparationTiming,validPensionMonth} from '@/lib/pensionNextSteps';

const sale='https://www.proveitweb.co.uk/salepensieinternationala';
const documents=[
  'Actele de identitate: buletin / carte de identitate, certificat de naștere și certificat de căsătorie, după caz.',
  'Carnetul de muncă.',
  'Carnetul de muncă pentru membrii CAP, dacă este aplicabil.',
  'Carnetul de asigurări sociale pentru agricultori, dacă este aplicabil.',
  'Alte acte prevăzute de lege privind vechimea în muncă sau stagiul de cotizare realizat în alte sectoare.',
  'Livretul militar, dacă este aplicabil.',
  'Diploma universitară și adeverința cu durata normală a studiilor, perioada frecventată și forma de învățământ la zi; pentru studii în străinătate, dovada echivalării în România.',
  'Adeverințe privind sporurile și adaosurile reglementate prin lege sau contractul de muncă, valorificabile la pensie.',
  'Adeverințe privind condițiile de muncă deosebite, speciale sau alte condiții.'
];
function ServiceOffer({final=false}:{final?:boolean}) {return <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
  <p>Puteți face aceste demersuri pe cont propriu sau ne puteți lăsa pe noi să ne ocupăm de tot procesul. Avem o singură taxă: <strong>£297 (aproximativ 350 euro)</strong>, care se poate plăti în <strong>3 rate lunare</strong>.</p>
  <p>{final?'Pentru a începe, avem nevoie de o copie după cartea de muncă, dacă o mai aveți, și o copie după buletin. Transmiteți actele prin canalul indicat de echipă.':'Puteți achiziționa serviciul online sau puteți solicita o programare cu unul dintre agenți prin pagina serviciului.'}</p>
  <a href={sale} className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">{final?'Vreau să vă ocupați de pensionarea mea':'Detalii și achiziție serviciu pensionare'}</a>
  <div><a href="https://wa.me/447447707829?text=WEB_REZULTATE_SIMULARE" className="inline-flex rounded-lg border border-emerald-700 bg-white px-5 py-3 font-semibold text-emerald-800 hover:bg-emerald-100">Cere detalii pe WhatsApp</a></div>
</div>;}
export default function PensionNextSteps({result,residenceCountry=''}:{result:PensionCalculatorResult;residenceCountry?:string}) {
  const code=residenceCountry;
  const country=code==='RO'?'România':INTERVIEW_COUNTRIES.find(c=>c.value===code)?.label;
  const guide=COUNTRY_GUIDES[code];
  const office=guide?.office?.startsWith('CJP ')?guide.office.replace(/^CJP /,''):'de referință';
  const recommended=result.recommended;
  const date=validPensionMonth(recommended?.retirementDate)?recommended.retirementDate:null;
  return <div className="space-y-5">
    <section aria-label="Calendarul pensionării" className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 leading-7">
      {recommended&&date?<p>Cel mai devreme vă puteți pensiona în România la data de <strong>{date}</strong>. Varianta: <strong>{recommended.label}</strong>, {recommended.retirementAge.years} ani{recommended.retirementAge.months?` și ${recommended.retirementAge.months} luni`:''}.</p>:<p>Data pensionării în România necesită verificarea condițiilor de către un specialist.</p>}
      {internationalMilestones(result).map((row,i)=><p key={`${row.countryName}-${i}`}>{validPensionMonth(row.retirementDate)?<>{date&&row.retirementDate>=date?'Apoi, în':'În'} <strong>{row.retirementDate}</strong>, este estimată pensionarea din <strong>{row.countryName}</strong>. De la acea dată, și {row.countryName} va putea începe să vă plătească pensie pentru anii de muncă în {row.countryName}, dacă sunt îndeplinite condițiile de stagiu și celelalte cerințe legale și cererea este aprobată.</>:<>Pentru {row.countryName}, data pensionării necesită verificare individuală.</>}</p>)}
    </section>
    <h2 className="text-2xl font-bold">Următorii pași</h2>
    <Step title={`Pasul 1 — Demararea în ${country||'țara de reședință'}`}>
      <p>{code==='RO'?'Dosarul se depune la casa teritorială de pensii competentă din România.':guide?`Se depune dosarul prin: ${guide.filing}`:'Instituția competentă și procedura de depunere trebuie confirmate potrivit țării de reședință și acordului aplicabil.'}</p>
      <p>În cazul dvs., vă îndrumăm să pregătiți documentele și să contactați instituția {preparationTiming(date)}</p>
      <p className="text-sm text-slate-600">Intervalul de 1–2 ani privește pregătirea și verificarea istoricului. Depunerea cererii se face în termenul acceptat de instituția competentă. Dacă nu ați fost asigurat în țara de reședință, poate fi competent ultimul stat în care ați lucrat.</p>
      <ServiceOffer/>
    </Step>
    <Step title={`Pasul 2 — Datele ajung în România la județul ${office}`}>
      {country&&code!=='RO'&&<p>{office!=='de referință'?`Județul ${office} este centru de competență pentru românii din ${country}, indiferent de județul în care aveați domiciliul în România.`:`Județul de referință este centrul de competență pentru dosarul dvs. din ${country}, indiferent de județul în care aveați domiciliul în România. Acesta se stabilește după regiunea sau instituția străină competentă, conform repartizării de mai jos.`}</p>}
      <p>Orientativ, comunicarea poate dura 2–6 luni de la demararea de la pasul 1, dar sunt multe cazuri în care durează mai mult. Solicitați numărul de înregistrare și urmăriți stadiul dosarului.</p>
      {guide?.details&&<p>{guide.details}</p>}
      <p className="text-sm">Repartizarea exactă depinde de instituția străină, regiune și eventualele excepții. <a className="underline text-emerald-800" href="https://www.cjpbn.ro/informare-privind-rolul-de-organism-de-legatura-in-materie-de-pensii-si-ajutoare-deces-a-directiei-relatii-internationale-din-cadrul-casei-nationale-de-pensii-publice/">Verificați casa de pensii competentă</a>.</p>
    </Step>
    <Step title="Pasul 3 — Verificarea datelor și eventuale corecturi"><p>Verificați dacă perioadele și celelalte date transmise sunt complete și corecte. Unele dosare necesită reverificări sau corecturi; acestea pot prelungi procesul.</p></Step>
    <Step title="Pasul 4 — Demararea procesului de pensionare în România">
      <p>După ce datele au ajuns și sunt corecte, iar dvs. îndepliniți condițiile de pensionare, estimate pentru <strong>{date||'data care trebuie confirmată'}</strong>, se poate finaliza dosarul pentru pensia din România, prin instituțiile competente. Cererea internațională de la pasul 1 poate acoperi și solicitarea pensiei românești; confirmați dacă sunt necesare acte sau cereri suplimentare.</p>
      <p>Pregătiți următoarele acte, după caz, în original și în forma de copie cerută de instituție. Pentru dosarele internaționale pot fi transmise copii certificate de instituția competentă; nu toate copiile trebuie legalizate.</p>
      <ul className="list-disc space-y-2 pl-5">{documents.map(item=><li key={item}>{item}</li>)}</ul>
      <a className="text-sm text-emerald-800 underline" href="https://www.cnpp.ro/activitati-cnpp/relatii-internationale/pensii-internationale/pensii-comunitare/">CNPP — acte și procedura pentru pensii internaționale</a>
    </Step>
    <Step title="Pasul 5 — Decizia"><p>Termenul general de emitere a deciziei este de 45 de zile de la înregistrarea cererii. Legea permite prelungirea cu 30 de zile în anumite situații. Lipsa documentelor și schimburile internaționale pot afecta durata soluționării.</p></Step>
    <Step title="Pasul 6 — Verificarea deciziei"><p>Verificați atent decizia: perioadele recunoscute, veniturile, punctajele și data acordării drepturilor. Pot exista erori, iar verificarea este un pas esențial înainte de expirarea termenului de contestație.</p></Step>
    <Step title="Pasul 7 — Contestarea deciziei la tribunal"><p>Dacă decizia este incorectă, poate fi contestată la instanța judecătorească competentă, în termen de <strong>45 de zile de la comunicare</strong>. Păstrați dovada comunicării. O solicitare de clarificare sau revizuire către casa de pensii nu înlocuiește contestația și nu trebuie presupus că suspendă termenul pentru instanță.</p><a className="text-sm text-emerald-800 underline" href="https://www.cnpp.ro/intrebari_frecvente/cum-si-in-ce-termen-se-contesta-decizia-de-pensie/">CNPP — termenul și procedura de contestare</a></Step>
    <section className="space-y-3"><h2 className="text-xl font-bold">Opțiunile dvs.</h2><p>Puteți gestiona procesul pe cont propriu, urmărind documentele, termenele și contestarea unei decizii incorecte, sau puteți apela la serviciul nostru.</p><ServiceOffer final/></section>
  </div>;
}
function Step({title,children}:{title:string;children:React.ReactNode}) {return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 leading-7"><h3 className="text-xl font-bold">{title}</h3>{children}</section>;}
