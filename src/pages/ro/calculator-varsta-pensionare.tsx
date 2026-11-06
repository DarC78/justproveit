import Head from 'next/head';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import PensionAgentWorkflow from '@/components/PensionAgentWorkflow';
import PensionServicesTable from '@/components/PensionServicesTable';
import ResultPanel from '@/components/PensionResultPanel';
import {useAuth} from '@/context/AuthContext';
import {loadCrmDispatchContact,saveCrmPensionContactEmail,linkCrmPensionContactEmail,type PensionEmailConflict} from '@/lib/crmAdmin';
import {dispatchPhone,dispatchPhoneFromQuery} from '@/lib/crmDispatch';
import type {PensionCalculatorResponse} from '@/lib/pensionCalculator';

type Contact={fullName:string;email:string;phone:string};
export default function RomanianPensionCalculatorPage() {
  const [contact,setContact]=useState<Contact>({fullName:'',email:'',phone:''});
  const [response,setResponse]=useState<PensionCalculatorResponse|null>(null);
  const [crmStatus,setCrmStatus]=useState('');
  const [emailConflict,setEmailConflict]=useState<(PensionEmailConflict&{requestedPhone:string})|null>(null);
  const [confirmLink,setConfirmLink]=useState(false);
  const [linking,setLinking]=useState(false);
  const [linkError,setLinkError]=useState('');
  const [linkVersion,setLinkVersion]=useState(0);
  const {token}=useAuth();
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const query=Object.fromEntries(params.entries());
    setContact({fullName:params.get('nume')||params.get('name')||params.get('fullName')||'',email:params.get('email')||'',phone:dispatchPhoneFromQuery(query)||dispatchPhone(params.get('telefon')||params.get('tel')||'')});
  },[]);
  useEffect(()=>{
    if(!token||!contact.phone||contact.fullName&&contact.email)return;
    let cancelled=false;
    const phone=contact.phone;
    setCrmStatus('Căutăm datele de contact în CRM…');
    loadCrmDispatchContact(token,phone).then(({contact:found})=>{
      if(cancelled)return;
      if(!found){setCrmStatus('Nu am găsit un contact pentru acest număr. Completați datele manual.');return;}
      setContact(current=>current.phone===phone?{...current,fullName:current.fullName||found.name||'',email:current.email||found.email||''}:current);
      setCrmStatus('Datele lipsă au fost completate din cel mai recent contact CRM.');
    }).catch(()=>{if(!cancelled)setCrmStatus('Datele CRM nu au putut fi încărcate. Completați manual sau reîncercați.');});
    return()=>{cancelled=true;};
    // Fetch on a phone/session change; preserve anything the agent types meanwhile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[token,contact.phone]);
  async function saveEmail() {
    if(!token){setCrmStatus('Autentificați-vă în CRM pentru a salva adresa în CRM.');return;}
    try {
      const saved=await saveCrmPensionContactEmail(token,contact.phone,contact.email);
      if(saved.action==='email-conflict'&&saved.conflict){setEmailConflict({...saved.conflict,requestedPhone:contact.phone});setConfirmLink(false);setLinkError('');setCrmStatus('');throw new Error('Verificați contactele afișate mai jos înainte de trimitere.');}
      setEmailConflict(null);
      setCrmStatus(saved.action==='contact-not-found'?'Numărul nu există în CRM; adresa nu a fost salvată în CRM.':saved.action==='replaced-invalid'?'Adresa evident invalidă a fost înlocuită în CRM.':saved.action==='added-secondary'?'Noua adresă a fost adăugată; adresa existentă a fost păstrată.':'Adresa de email este salvată în CRM.');
    }catch(error){setCrmStatus(error instanceof Error?error.message:'Emailul nu a putut fi salvat în CRM.');throw error;}
  }
  const activeConflict=emailConflict&&emailConflict.email===contact.email.trim().toLowerCase()&&emailConflict.requestedPhone===contact.phone?emailConflict:null;
  async function linkContacts(){
    if(!token||!activeConflict||!confirmLink||linking)return;
    setLinking(true);setLinkError('');
    try{
      await linkCrmPensionContactEmail(token,contact.phone,contact.email,activeConflict);
      setEmailConflict(null);setConfirmLink(false);setCrmStatus('Contactele au fost asociate. Ambele numere și istoricul au fost păstrate. Puteți trimite acum rezultatul.');setLinkVersion(v=>v+1);
    }catch(error){setLinkError(error instanceof Error?error.message:'Contactele nu au putut fi asociate.');}
    finally{setLinking(false);}
  }
  const contactReview=activeConflict?<section data-clarity-mask="True" className="rounded-lg border border-amber-300 bg-amber-50 p-4" aria-labelledby="email-conflict-title">
    <h4 id="email-conflict-title" className="font-bold text-amber-950">Această adresă de email este folosită de alt contact</h4>
    <p className="mt-2 text-sm">Verificați dacă este aceeași persoană cu două numere de telefon. Nu asociați contactele doar pentru că folosesc o adresă comună.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">{[[activeConflict.current,'Contactul curent'],[activeConflict.other,'Contactul care are emailul']] .map(([value,title])=>{const person=value as PensionEmailConflict['current'];return <div key={person.id} className="min-w-0 rounded border border-amber-200 bg-white p-3"><p className="text-xs font-semibold text-slate-600">{title as string}</p><p className="mt-1 break-words font-bold">{person.name}</p><p className="mt-2 break-all text-sm">Telefon: {person.phones.join(', ')||'Nespecificat'}</p><p className="mt-1 break-all text-sm">Email: {person.emails.join(', ')||'Nespecificat'}</p></div>;})}</div>
    <label className="mt-4 flex items-start gap-2 text-sm font-semibold"><input type="checkbox" className="mt-1" checked={confirmLink} disabled={linking} onChange={e=>setConfirmLink(e.target.checked)}/>Confirm că ambele contacte aparțin aceleiași persoane.</label>
    <p className="mt-2 text-xs text-slate-700">Asocierea păstrează numerele, emailurile și istoricul într-un singur contact. Acest pas nu trimite email sau WhatsApp.</p>
    <button type="button" className="mt-3 rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={!confirmLink||linking} onClick={()=>void linkContacts()}>{linking?'Se asociază…':'Asociază contactele cu acest email'}</button>
    {linkError&&<><p role="alert" className="mt-2 text-sm text-red-700">{linkError}</p><button type="button" disabled={linking} className="mt-2 text-sm font-semibold underline" onClick={()=>void saveEmail().catch(()=>{})}>Actualizează verificarea</button></>}
  </section>:null;
  return <><Head><title>Calculator varsta de pensionare in Romania | Proveit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></Head>
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 text-slate-900">
      <Link href="/ro" className="font-bold text-emerald-800">JustProveIt</Link>
      <section><h1 className="text-3xl font-extrabold">Calculator varsta de pensionare in Romania</h1>
        <dl data-clarity-mask="True" className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div><dt className="text-sm font-semibold text-slate-600">Nume</dt><dd className="break-words">{contact.fullName||'Nespecificat'}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-600">Email</dt><dd className="break-all">{contact.email||'Nespecificat'}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-600">Telefon</dt><dd className="break-words">{contact.phone||'Nespecificat'}</dd></div>
        </dl>
        <PensionServicesTable contact={contact} token={token}/>
        <PensionAgentWorkflow contact={contact} onContact={(key,value)=>{setContact(current=>({...current,[key]:value}));setEmailConflict(null);setConfirmLink(false);setLinkError('');}} onResult={setResponse} onSaveEmail={saveEmail} crmStatus={activeConflict?'':crmStatus} contactReview={contactReview} contactReviewBusy={linking} contactLinkVersion={linkVersion}/>
      </section>
      <aside><ResultPanel response={response} emailMessage="" sendingEmail={false} onSendEmail={()=>{}} readOnly/></aside>
    </main></>;
}
