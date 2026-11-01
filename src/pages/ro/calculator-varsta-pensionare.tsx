import Head from 'next/head';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import PensionAgentWorkflow from '@/components/PensionAgentWorkflow';
import ResultPanel from '@/components/PensionResultPanel';
import {useAuth} from '@/context/AuthContext';
import {loadCrmDispatchContact,saveCrmPensionContactEmail} from '@/lib/crmAdmin';
import {dispatchPhone,dispatchPhoneFromQuery} from '@/lib/crmDispatch';
import type {PensionCalculatorResponse} from '@/lib/pensionCalculator';

type Contact={fullName:string;email:string;phone:string};
export default function RomanianPensionCalculatorPage() {
  const [contact,setContact]=useState<Contact>({fullName:'',email:'',phone:''});
  const [response,setResponse]=useState<PensionCalculatorResponse|null>(null);
  const [crmStatus,setCrmStatus]=useState('');
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
      setCrmStatus(saved.action==='contact-not-found'?'Numărul nu există în CRM; adresa nu a fost salvată în CRM.':saved.action==='replaced-invalid'?'Adresa evident invalidă a fost înlocuită în CRM.':saved.action==='added-secondary'?'Noua adresă a fost adăugată; adresa existentă a fost păstrată.':'Adresa de email este salvată în CRM.');
    }catch(error){setCrmStatus(error instanceof Error?error.message:'Emailul nu a putut fi salvat în CRM.');throw error;}
  }
  return <><Head><title>Calculator varsta de pensionare in Romania | Proveit</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></Head>
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 text-slate-900">
      <Link href="/ro" className="font-bold text-emerald-800">JustProveIt</Link>
      <section><h1 className="text-3xl font-extrabold">Calculator varsta de pensionare in Romania</h1>
        <dl data-clarity-mask="True" className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <div><dt className="text-sm font-semibold text-slate-600">Nume</dt><dd className="break-words">{contact.fullName||'Nespecificat'}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-600">Email</dt><dd className="break-all">{contact.email||'Nespecificat'}</dd></div>
          <div><dt className="text-sm font-semibold text-slate-600">Telefon</dt><dd className="break-words">{contact.phone||'Nespecificat'}</dd></div>
        </dl>
        <PensionAgentWorkflow contact={contact} onContact={(key,value)=>setContact(current=>({...current,[key]:value}))} onResult={setResponse} onSaveEmail={saveEmail} crmStatus={crmStatus}/>
      </section>
      <aside><ResultPanel response={response} emailMessage="" sendingEmail={false} onSendEmail={()=>{}} readOnly/></aside>
    </main></>;
}
