import PensionResultTrackingChoice from '@/components/PensionResultTrackingChoice';
import {preparePensionResultVisit,stopPensionResultTracking} from '@/lib/pensionResultTracking';
import Link from 'next/link';
import Head from 'next/head';
import {useEffect,useState} from 'react';
import ResultPanel from '@/components/PensionResultPanel';
import {API_BASE_URL} from '@/lib/auth';
import type {PensionCalculatorResponse} from '@/lib/pensionCalculator';

export default function SavedPensionResultPage(){
  const [response,setResponse]=useState<PensionCalculatorResponse|null>(null);
  const [error,setError]=useState('');
  const [createdAt,setCreatedAt]=useState('');
  const [token,setToken]=useState<string|null>(null);
  const [choiceResolved,setChoiceResolved]=useState(false);
  const [contact,setContact]=useState({fullName:'',email:'',phone:''});
  useEffect(()=>{setToken(preparePensionResultVisit());},[]);
  useEffect(()=>{
    if(!choiceResolved)return;
    const controller=new AbortController();
    if(!token){setError('Linkul este incomplet. Deschide linkul primit în email.');return;}
    async function load(){
      try{
        const r=await fetch(API_BASE_URL+'/justproveit/pension-calculator/results/read',{
          method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token}),
          cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:controller.signal
        });
        const data=await r.json();
        if(!r.ok||!data.success||!data.result)throw new Error(data.error?.message||'Rezultatul nu poate fi încărcat momentan.');
        setResponse({...data,leadId:null,emailSent:true,emailError:null});
        setCreatedAt(data.createdAtUtc||'');
        setContact({fullName:typeof data.contact?.fullName==='string'?data.contact.fullName:'',email:typeof data.contact?.email==='string'?data.contact.email:'',phone:typeof data.contact?.phone==='string'?data.contact.phone:''});
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Rezultatul nu poate fi încărcat momentan.');}
    }
    void load();return()=>controller.abort();
  },[choiceResolved,token]);
  return <><Head><title>Rezultatele simulării tale | Proveit</title><meta name="robots" content="noindex,nofollow,noarchive"/><meta name="referrer" content="no-referrer"/></Head>
    <main data-clarity-mask="True" className="mx-auto max-w-5xl space-y-5 px-4 py-10 text-slate-900">
      <PensionResultTrackingChoice onContinue={()=>setChoiceResolved(true)}/>
      {choiceResolved&&<>
      <h1 className="text-3xl font-bold">Rezultatele simulării tale de pensie</h1>
      {response&&<section aria-label="Date personale" data-clarity-mask="True" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="font-semibold text-slate-600">Nume:</dt><dd className="mt-1 break-words font-medium">{contact.fullName||'Nespecificat'}</dd></div>
          <div><dt className="font-semibold text-slate-600">Email:</dt><dd className="mt-1 break-all font-medium">{contact.email||'Nespecificat'}</dd></div>
          <div><dt className="font-semibold text-slate-600">Telefon:</dt><dd className="mt-1 break-words font-medium">{contact.phone||'Nespecificat'}</dd></div>
        </dl>
      </section>}
      <p>Acesta este rezultatul salvat la momentul simulării. Linkul este privat; nu îl distribui altor persoane.</p>
      {createdAt&&<p className="text-sm text-slate-600">Simulare efectuată la: {new Date(createdAt).toLocaleString('ro-RO',{timeZone:'Europe/London'})} (ora Marii Britanii)</p>}
      {error?<p role="alert" className="rounded border border-red-200 bg-red-50 p-4">{error}</p>:!response?<p role="status">Se încarcă rezultatul…</p>:<ResultPanel response={response} emailMessage="" sendingEmail={false} onSendEmail={()=>{}} readOnly/>}

      {response&&<section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="mb-4 text-base leading-7 text-slate-700">Proveit vă poate ajuta să ieșiți la pensia internațională. Apăsați butonul de mai jos.</p>
        <Link className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white shadow-sm hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/saleconsultation/">Detalii Serviciu Pensionare</Link>
      </section>}
      <footer className="border-t border-slate-200 pt-5 text-center"><button type="button" className="text-xs text-slate-500 underline" onClick={stopPensionResultTracking}>Preferințe cookie-uri</button></footer>
      </>}
    </main></>;
}
