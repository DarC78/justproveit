import {FormEvent, useEffect, useState} from 'react';
import {PensionCalculatorResponse, submitPensionCalculator, sendPensionCalculatorEmail} from '@/lib/pensionCalculator';
import {COUNTRY_GUIDES, INTERVIEW_COUNTRIES, INTERVIEW_DOCUMENTS, PROJECTABLE_COUNTRIES} from '@/lib/pensionInterview';

type Contact={fullName:string;email:string;phone:string};
type Period={country:string;years:string;months?:string};
const source='https://www.cjpbn.ro/informare-privind-rolul-de-organism-de-legatura-in-materie-de-pensii-si-ajutoare-deces-a-directiei-relatii-internationale-din-cadrul-casei-nationale-de-pensii-publice/';
const number=(value:string)=>Number(value||0);
const periodMonths=(period:Period)=>number(period.years)*12+number(period.months||'');
const month=(value:string)=>value?`${value.slice(5,7)}/${value.slice(0,4)}`:'—';
const inputClass='mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2';
export default function PensionAgentWorkflow({contact,onContact,onResult,onSaveEmail,crmStatus=''}:{contact:Contact;onContact:(key:keyof Contact,value:string)=>void;onResult:(value:PensionCalculatorResponse|null)=>void;onSaveEmail?:()=>Promise<void>;crmStatus?:string}) {
  const [agent,setAgent]=useState('');
  const [ro,setRo]=useState('');
  const [book,setBook]=useState(true);
  const [group1,setGroup1]=useState('');
  const [group2,setGroup2]=useState('');
  const [periods,setPeriods]=useState<Period[]>(Array.from({length:5},()=>({country:'',years:'',months:'0'})));
  const [employment,setEmployment]=useState('contract');
  const [jobs,setJobs]=useState('');
  const [privateKnown,setPrivateKnown]=useState(false);
  const [privatePaid,setPrivatePaid]=useState(false);
  const [birth,setBirth]=useState('');
  const [gender,setGender]=useState('F');
  const [children,setChildren]=useState('');
  const [busy,setBusy]=useState(false);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const [emailState,setEmailState]=useState('');
  const [sent,setSent]=useState(false);
  const [confirmed,setConfirmed]=useState(false);
  const [result,setResult]=useState<PensionCalculatorResponse|null>(null);
  const [birthOver,setBirthOver]=useState(false);
  const [residenceCountry,setResidenceCountry]=useState('');
  const [whatsappFailed,setWhatsappFailed]=useState(false);
  const [roMonths,setRoMonths]=useState('0');
  useEffect(()=>{setAgent(new URLSearchParams(window.location.search).get('agent')||'');},[]);
  const countries=[...new Set(periods.filter(p=>p.country&&periodMonths(p)>0).map(p=>p.country))];
  function reset() {setResult(null);onResult(null);setSent(false);setConfirmed(false);setEmailState('');setError('');setWhatsappFailed(false);}
  function edit(action:()=>void){reset();action();}
  async function simulate(event:FormEvent) {
    event.preventDefault();reset();
    if(!/^\d{4}-\d{2}$/.test(birth)){setError('Selectați luna și anul exact al nașterii.');return;}
    const romaniaMonths=number(ro)*12+number(roMonths),totalMonths=romaniaMonths+periods.reduce((sum,p)=>sum+periodMonths(p),0);
    if([roMonths,...periods.map(p=>p.months||'')].some(value=>!Number.isInteger(number(value))||number(value)<0||number(value)>11)){setError('Lunile trebuie să fie între 0 și 11.');return;}
    const normalRoMonths=romaniaMonths-(number(group1)+number(group2))*12;
    if(normalRoMonths<0){setError('Anii de grupa I și II sunt incluși în totalul din România; nu pot depăși acest total.');return;}
    if(periods.some(p=>periodMonths(p)>0&&!p.country)){setError('Alegeți țara pentru fiecare perioadă lucrată.');return;}
    const selected=periods.filter(p=>p.country&&periodMonths(p)>0);
    if(new Set(selected.map(p=>p.country)).size!==selected.length){setError('Selectați fiecare țară o singură dată.');return;}
    const ageMonths=(new Date().getUTCFullYear()-number(birth.slice(0,4)))*12+new Date().getUTCMonth()+1-number(birth.slice(5,7));
    if(ageMonths<16*12||totalMonths>ageMonths-14*12){setError('Verificați data nașterii și anii lucrați. Perioadele nu trebuie să se suprapună.');return;}
    setBusy(true);
    try {
      const response=await submitPensionCalculator({...contact,email:/^\S+@\S+\.\S+$/.test(contact.email)?contact.email:'',birthYearMonth:birth,gender:gender as 'M'|'F',
        periods:{normalRoYears:Math.floor(normalRoMonths/12),normalRoMonths:normalRoMonths%12,grupaIYears:number(group1),grupaIIYears:number(group2)},
        foreignPeriods:selected.filter(p=>PROJECTABLE_COUNTRIES.has(p.country)).map(p=>({country:p.country,years:number(p.years),months:number(p.months||'')})),
        childrenRaised:number(children),projectFutureContributions:true,
        interview:{agent,residenceCountry,hasWorkBook:book,declaredForeignPeriods:selected,ukEmployment:employment,ukJobs:number(jobs),privatePensionsKnown:privateKnown,privatePensionsPaid:privateKnown&&privatePaid},
        source:'ro-pension-agent-interview',pageUrl:window.location.href.split('?')[0]});
      setResult(response);onResult(response);
    }catch(e){setError(e instanceof Error?e.message:'Simularea nu a reușit.');}
    finally{setBusy(false);}
  }
  async function sendEmail(retryWhatsApp=false) {
    if(!result||(sent&&!retryWhatsApp))return;
    if(!contact.fullName.trim()||!contact.phone.trim()||!/^\S+@\S+\.\S+$/.test(contact.email)){setEmailState('Completați numele, telefonul și un email valid înainte de trimitere.');return;}
    setSending(true);setEmailState('');
    try {
      await onSaveEmail?.();
      const response=await sendPensionCalculatorEmail(result.resultId,contact);
      if(!response.emailSent)throw new Error(response.emailError||'Emailul nu a putut fi trimis.');
      setSent(true);setWhatsappFailed(response.whatsappStatus==='queue_failed');
      const whatsappMessage=response.whatsappQueued===false?` ${response.whatsappError||'Mesajul WhatsApp nu a putut fi pus în coadă.'}`:response.whatsappQueued?(['accepted','sent','delivered','read'].includes(response.whatsappStatus||'')?' Mesajul WhatsApp a fost preluat de furnizor.':' Mesajul text WhatsApp a fost pus în coadă pentru trimitere.') : '';
      setEmailState('V-am trimis acum rezultatul pe email. Puteți verifica?'+whatsappMessage);
      const updated={...result,emailSent:true};setResult(updated);onResult(updated);
    }catch(e){setEmailState(e instanceof Error?e.message:'Trimiterea nu a reușit.');}
    finally{setSending(false);}
  }
  const displayAgent=agent.trim()||'[numele agentului]';
  const earliest=result?.result.recommended?.retirementDate;
  return <div className="mt-6 space-y-6">
    <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 leading-7">
      <h2 className="text-xl font-bold">Introducere — script agent</h2>
      <label className="block text-sm font-semibold">Numele agentului<input className={inputClass} value={agent} onChange={e=>setAgent(e.target.value)}/></label>
      <p>Bună ziua, mă numesc <strong>{displayAgent}</strong> și sun din partea Proveit. V-ați lăsat numărul de telefon pentru o simulare gratuită a vârstei de pensionare internațională. Aveți acum câteva minute?</p>
      <p>OK, înainte de a începe trebuie să vă spun că eu sunt <strong>{displayAgent}</strong> și reprezint firma Proveit. Firma este înregistrată în UK cu numărul 14007642 și apelurile sunt înregistrate.</p>
      <p>În urma simulării veți avea o estimare a momentului în care puteți ieși la pensie în România, a opțiunilor disponibile și a pașilor pentru pensia din celelalte țări. Vă explicăm cum se pot cumula anii și procesul de pensionare. Vă trimitem rezultatul pe email, clar, structurat. Încă o dată, aceasta este o simulare gratuită; nu avem nevoie de CNP sau copii de acte pentru simulare.</p>
      <p className="font-semibold">Bun. Haideți să vedem.</p>
    </section>
    <form onSubmit={simulate} className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5" onChange={()=>{if(result)reset();}}>
      <fieldset className="space-y-4" disabled={busy||sending}>
        <legend className="mb-4 text-xl font-bold">Întrebări și stagii de cotizare</legend>
        <Digits label="Câți ani ați muncit în România? (total, inclusiv grupe)" value={ro} onChange={v=>edit(()=>setRo(v))} required/>
        <Months label="Luni lucrate în România (în plus față de ani)" value={roMonths} onChange={v=>edit(()=>setRoMonths(v))}/>
        <YesNo label="Mai aveți cartea de muncă?" value={book} onChange={setBook}/>
        <label className="block text-sm font-semibold">Țara de reședință<select required className={inputClass} value={residenceCountry} onChange={e=>edit(()=>setResidenceCountry(e.target.value))}><option value="">Alege țara de reședință</option><option value="RO">România</option>{INTERVIEW_COUNTRIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
        <Digits label="Ați muncit la grupa I? Număr de ani" value={group1} onChange={v=>edit(()=>setGroup1(v))}/>
        <Digits label="Ați muncit la grupa II? Număr de ani" value={group2} onChange={v=>edit(()=>setGroup2(v))}/>
        <h3 className="font-bold">În ce alte țări ați mai muncit? Câți ani și câte luni în fiecare?</h3>
        <p className="text-sm text-slate-600">Introduceți perioade fără suprapunere. O țară selectată nu garantează că anii se totalizează automat cu toate celelalte țări.</p>
        {periods.map((period,i)=><div key={i} className="space-y-2 rounded-lg border bg-white p-3">
          <label className="block text-sm font-semibold">Țara {i+1}<select className={inputClass} value={period.country} onChange={e=>edit(()=>setPeriods(rows=>rows.map((row,n)=>n===i?{...row,country:e.target.value}:row)))}><option value="">Alege țara</option>{INTERVIEW_COUNTRIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
          <Digits label={`Ani lucrați — țara ${i+1}`} value={period.years} onChange={v=>edit(()=>setPeriods(rows=>rows.map((row,n)=>n===i?{...row,years:v}:row)))}/>
          <Months label={`Luni lucrate — țara ${i+1}`} value={period.months||'0'} onChange={v=>edit(()=>setPeriods(rows=>rows.map((row,n)=>n===i?{...row,months:v}:row)))}/>
          {period.country&&!PROJECTABLE_COUNTRIES.has(period.country)&&<p className="text-sm text-amber-900">Perioada este înregistrată în interviu, dar nu este inclusă automat în proiecție. Specialistul trebuie să confirme acordul aplicabil.</p>}
        {period.country==='UK'&&<section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4"><h3 className="font-bold">Munca și pensiile private în Regatul Unit</h3>
          <label className="block">Ați muncit cu contract de muncă sau ca self-employed?<select className={inputClass} value={employment} onChange={e=>setEmployment(e.target.value)}><option value="contract">Contract de muncă</option><option value="self-employed">Self-employed</option><option value="both">Ambele</option></select></label>
          <Digits label="Câte locuri de muncă ați avut?" value={jobs} onChange={setJobs}/>
          <YesNo label="Știți unde vă sunt pensiile private?" value={privateKnown} onChange={value=>{setPrivateKnown(value);if(!value)setPrivatePaid(false);}}/>
          {privateKnown&&<div className="space-y-2"><YesNo label="Ați încasat toate pensiile private?" value={privatePaid} onChange={setPrivatePaid}/><p className="text-sm">Fiecare angajator avea obligația să vă înscrie într-un fond de pensie privată dacă îndeplineați condițiile legale de eligibilitate. De multe ori, noul angajator vă înscria la un alt fond.</p></div>}
        </section>}
        </div>)}
        <fieldset className="space-y-3"><legend className="font-semibold">Luna și anul nașterii</legend>
          <label className="block">Luna nașterii<select required className={inputClass} value={birth.split('-')[1]||''} onChange={e=>edit(()=>setBirth(`${birth.split('-')[0]||''}-${e.target.value}`))}><option value="">Alege luna</option>{['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'].map((label,i)=><option key={i} value={String(i+1).padStart(2,'0')}>{label}</option>)}</select></label>
          <label className="block">Anul nașterii<select required className={inputClass} value={birthOver?'1980+':birth.split('-')[0]||''} onChange={e=>edit(()=>{setBirthOver(e.target.value==='1980+');setBirth(`${e.target.value==='1980+'?'':e.target.value}-${birth.split('-')[1]||''}`);})}><option value="">Alege anul</option>{Array.from({length:31},(_,i)=><option key={i} value={1950+i}>{1950+i}</option>)}<option value="1980+">1980+</option></select></label>
          {birthOver&&<label className="block">Anul exact (după 1980)<input className={inputClass} type="number" min="1981" max={new Date().getUTCFullYear()-16} required value={birth.split('-')[0]||''} onChange={e=>edit(()=>setBirth(`${e.target.value}-${birth.split('-')[1]||''}`))}/></label>}
        </fieldset>
        <label className="block font-semibold">Sex<select className={inputClass} value={gender} onChange={e=>edit(()=>setGender(e.target.value))}><option value="F">Femeie</option><option value="M">Bărbat</option></select></label>
        {gender==='F'&&<Digits label="Număr de copii crescuți până la 16 ani (pentru reducere, dacă sunt îndeplinite condițiile legale)" value={children} onChange={v=>edit(()=>setChildren(v))}/>}
        <p className="text-sm text-slate-600">Ipoteză: persoana continuă să lucreze fără întrerupere, acumulând un an contributiv pe an. Grupele declarate sunt vechime deja realizată, nu se dublează și nu sunt proiectate în viitor.</p>
        <button disabled={busy||sending} className="rounded-lg bg-emerald-700 px-6 py-3 font-bold text-white disabled:opacity-50">{busy?'Se calculează…':'Simulare'}</button>
      </fieldset>
      {error&&<p role="alert" className="text-red-700">{error}</p>}
    </form>
    {result&&<section className="space-y-4 rounded-xl border border-emerald-200 bg-white p-5" aria-live="polite">
      <h2 className="text-xl font-bold">Cele patru variante — proiecție orientativă</h2>
      {result.result.scenarios.map(s=><article key={s.type} className="rounded-lg border p-4"><h3 className="font-bold">{s.label}</h3>{s.notApplicable?<p>{s.notApplicableReason}</p>:<p>Vârsta: <strong>{s.retirementAge.years} ani și {s.retirementAge.months} luni</strong> · Data: <strong>{month(s.retirementDate)}</strong></p>}{s.eligibilityReasons.map(reason=><p key={reason} className="mt-2 text-sm">{reason}</p>)}</article>)}
      <p className="text-lg font-bold">{earliest?`OK, din toate aceste variante, cel mai devreme vă puteți pensiona estimativ în ${month(earliest)}.`:'Este necesară verificarea situației de către un specialist.'}</p>
      <p className="text-sm">Estimarea nu reprezintă o decizie de pensie. Numai instituțiile competente confirmă stagiile și drepturile; combinațiile de state pot necesita calcule distincte.</p>
      <h3 className="font-bold">Trimiterea rezultatului</h3>
      {(['fullName','email','phone'] as const).map(key=><label key={key} className="block text-sm font-semibold">{key==='fullName'?'Nume':key==='email'?'Email':'Telefon'}<input className={inputClass} type={key==='email'?'email':key==='phone'?'tel':'text'} value={contact[key]} disabled={sending||sent} onChange={e=>onContact(key,e.target.value)} onBlur={()=>{if(key==='email'&&contact.email)void onSaveEmail?.().catch(()=>{});}}/></label>)}
      {crmStatus&&<p role="status" className="text-sm text-slate-700">{crmStatus}</p>}
      <button type="button" disabled={sending||sent} onClick={()=>sendEmail()} className="rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">{sending?'Se trimite…':sent?'Email trimis':'Trimite rezultatul pe email'}</button>
      {whatsappFailed&&<button type="button" disabled={sending} onClick={()=>sendEmail(true)} className="ml-2 rounded-lg border border-emerald-700 px-5 py-3 font-bold text-emerald-800 disabled:opacity-50">Reîncearcă WhatsApp</button>}
      <p className="text-sm text-slate-600">La trimitere, rezumatul este trimis și ca mesaj text WhatsApp la telefonul de mai sus. Livrarea depinde de regulile WhatsApp și de fereastra de conversație de 24 de ore.</p>
      {emailState&&<p role="status" className={sent?'font-bold text-emerald-800':'text-red-700'}>{emailState}</p>}
      {sent&&<><p className="font-bold text-red-700">Se așteaptă verificarea emailului. Uneori durează mai mult sau ajunge în Spam. Rugați clientul să îl găsească, să îl scoată din Spam și să deschidă linkul pentru a vedea rezultatele pe site.</p><Check label="Clientul confirmă că a primit emailul și a deschis rezultatul" checked={confirmed} onChange={setConfirmed}/></>}
    </section>}
    <section className="space-y-4 rounded-xl border bg-white p-5 leading-7">
      <h2 className="text-xl font-bold">Continuare — procesul de pensionare</h2>
      <p>Bun. Aș vrea să mă asigur că înțelegeți câteva lucruri. Există persoane care amână procesul și ajung la vârste înaintate fără pensie, deși au muncit mulți ani.</p>
      <p>În primul rând, pentru a ieși la pensie avem nevoie de două lucruri: vârsta și vechimea. Vârsta diferă de la țară la țară. Perioadele de asigurare se pot totaliza conform regulilor europene sau acordului bilateral aplicabil, inclusiv pentru UK, Canada, USA ori Israel. Nu toate țările și combinațiile de perioade se cumulează automat. Fiecare stat calculează și plătește partea sa.</p>
      <p>Prin urmare, putem ieși la pensie treptat. În România, estimarea dumneavoastră este {earliest?<strong>{month(earliest)}</strong>:'cea care va fi afișată după simulare'}. În anumite condiții puteți primi pensie din România și continua activitatea în țara de reședință; pensia anticipată are reguli distincte de cumul. Apoi, când îndepliniți condițiile din celălalt stat, solicitați și pensia de acolo.</p>
      <p>Un alt aspect important este depunerea cererii. De regulă, în sistemul de coordonare, vă adresați instituției din țara de reședință; dacă nu ați fost asigurat acolo, poate fi competent ultimul stat în care ați lucrat. Pentru acorduri bilaterale se verifică procedura specifică. Nu este necesar să presupuneți că trebuie să călătoriți în România.</p>
      <p>Instituția competentă confirmă perioadele și transmite informațiile către instituția din România. Pentru țările în care ați lucrat:</p>
      {countries.length===0&&<p className="text-sm text-slate-500">Selectați țările și introduceți anii lucrați pentru a afișa ghidurile corespunzătoare.</p>}
      {countries.map(code=>{const guide=COUNTRY_GUIDES[code];return <article key={code} className="rounded-lg border bg-slate-50 p-4"><h3 className="font-bold">{INTERVIEW_COUNTRIES.find(c=>c.value===code)?.label}</h3><p className="font-semibold">{guide?.office||'Instituția și casa competentă se confirmă potrivit acordului aplicabil.'}</p><p>{guide?.filing||'Verificați cu instituția de pensii din statul de reședință procedura și acordul de securitate socială aplicabil.'}</p>{guide?.details&&<p className="mt-2 text-sm">{guide.details}</p>}<a className="text-sm text-emerald-800 underline" href={source} target="_blank" rel="noreferrer">Verifică repartizarea oficială și excepțiile de competență</a></article>;})}
      <p>În momentul în care casa competentă primește informațiile, se poate continua instrumentarea dosarului. Vă recomandăm să păstrați numărul de înregistrare și să solicitați stadiul după aproximativ două luni. Demersurile pot fi făcute și online, în funcție de instituție.</p>
      <p>Veți avea nevoie de actele cerute pentru situația dumneavoastră. Verificați lista și forma copiilor cu instituția competentă; nu toate copiile trebuie legalizate.</p>
      <details className="rounded-lg border p-4"><summary className="cursor-pointer font-bold">Lista de acte — doar dacă întreabă clientul</summary><ul className="mt-3 list-disc space-y-2 pl-5">{INTERVIEW_DOCUMENTS.map(item=><li key={item}>{item}</li>)}</ul></details>
      <p>Încă ceva: istoricul de muncă din celelalte țări trebuie confirmat. Comunicarea între instituții poate dura mai multe luni, iar dosarele complexe pot dura mai mult de un an. De aceea recomandăm pregătirea documentelor cu 1–2 ani înainte și verificarea momentului în care instituția acceptă cererea.</p>
      <p>Nu amânați până la vârsta de pensionare pentru a verifica istoricul. Data acordării drepturilor și eventualele plăți retroactive depind de tipul pensiei, data cererii, termene și legislația aplicabilă. Întârzierea poate afecta plățile; confirmați situația înainte de depunere.</p>
      <p>Bun. Sper că v-a fost de folos acest apel. Ați văzut când v-ați putea pensiona și pașii necesari pentru a evita întârzierile. Spuneți-mi dacă aveți întrebări.</p>
      <p>OK, acestea sunt detalii mai tehnice și nu aș vrea să vă răspund eronat. Pentru întrebările specifice putem solicita verificarea unui specialist.</p>
      <h3 className="text-lg font-bold">Serviciul de asistență</h3>
      <p>Avem un serviciu prin care dl. Adrian și echipa noastră vă asistă în tot procesul pentru pensia internațională. Vă ajutăm cu dosarul în țara de reședință și în România, verificăm documentele, ținem legătura cu autoritățile și analizăm decizia și opțiunile de contestare, dacă este cazul.</p>
      <p>Acest serviciu costă <strong>£297</strong> (aproximativ 350 de euro pentru clienții din alte țări, în funcție de curs) și se poate plăti în <strong>3 rate lunare fără dobândă</strong>. Pentru a demara avem nevoie de copia cărții de muncă, dacă o mai aveți, și de copia actului de identitate, transmise prin canalul indicat de echipă.</p>
      <p className="font-semibold">Vă rog să îmi spuneți dacă aveți întrebări.</p>
      <p className="text-xs text-slate-500">Referințe: <a href="https://www.cnpp.ro/activitati-cnpp/pensii/pensia-pentru-limita-de-varsta/" className="underline">CNPP — limită de vârstă</a> · <a href="https://www.cnpp.ro/activitati-cnpp/pensii/pensia-anticipata/" className="underline">Pensie anticipată</a> · <a href="https://www.cnpp.ro/activitati-cnpp/relatii-internationale/pensii-internationale/pensii-comunitare/" className="underline">Pensii internaționale</a></p>
    </section>
  </div>;
}

function Digits({label,value,onChange,required=false}:{label:string;value:string;onChange:(value:string)=>void;required?:boolean}) {return <label className="block text-sm font-semibold">{label}<input className={inputClass} inputMode="numeric" pattern="[0-9]*" maxLength={2} required={required} value={value} onChange={e=>{if(/^\d*$/.test(e.target.value))onChange(e.target.value);}}/></label>;}
function Months({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}) {return <label className="block text-sm font-semibold">{label}<select className={inputClass} value={value} onChange={e=>onChange(e.target.value)}>{Array.from({length:12},(_,n)=><option key={n} value={String(n)}>{n} {n===1?'lună':'luni'}</option>)}</select></label>;}
function Check({label,checked,onChange}:{label:string;checked:boolean;onChange:(value:boolean)=>void}) {return <label className="flex items-center gap-3"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>{label}</label>;}
function YesNo({label,value,onChange}:{label:string;value:boolean;onChange:(value:boolean)=>void}) {return <label className="block text-sm font-semibold">{label}<select className={inputClass} value={value?'DA':'NU'} onChange={e=>onChange(e.target.value==='DA')}><option value="DA">DA</option><option value="NU">NU</option></select></label>;}
