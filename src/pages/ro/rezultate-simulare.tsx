import PensionResultTrackingChoice from '@/components/PensionResultTrackingChoice';
import {preparePensionResultVisit} from '@/lib/pensionResultTracking';
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
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Rezultatul nu poate fi încărcat momentan.');}
    }
    void load();return()=>controller.abort();
  },[choiceResolved,token]);
  return <><Head><title>Rezultatele simulării tale | Proveit</title><meta name="robots" content="noindex,nofollow,noarchive"/><meta name="referrer" content="no-referrer"/></Head>
    <main data-clarity-mask="True" className="mx-auto max-w-5xl space-y-5 px-4 py-10 text-slate-900">
      <PensionResultTrackingChoice onContinue={()=>setChoiceResolved(true)}/>
      {choiceResolved&&<>
      <h1 className="text-3xl font-bold">Rezultatele simulării tale de pensie</h1>
      <p>Acesta este rezultatul salvat la momentul simulării. Linkul este privat; nu îl distribui altor persoane.</p>
      {createdAt&&<p className="text-sm text-slate-600">Simulare efectuată la: {new Date(createdAt).toLocaleString('ro-RO',{timeZone:'Europe/London'})} (ora Marii Britanii)</p>}
      {error?<p role="alert" className="rounded border border-red-200 bg-red-50 p-4">{error}</p>:!response?<p role="status">Se încarcă rezultatul…</p>:<ResultPanel response={response} emailMessage="" sendingEmail={false} onSendEmail={()=>{}} readOnly/>}
      <p><Link className="font-semibold text-emerald-700 underline" href="/ro/calculator-varsta-pensionare/">Fă o simulare nouă</Link></p>
      <p><Link className="font-semibold text-emerald-700 underline" href="/saleconsultation/">Află mai multe despre serviciile Proveit</Link></p>
      </>}
    </main></>;
}
