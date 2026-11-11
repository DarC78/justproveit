import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/context/AuthContext";
import { DispatchContact, loadCrmDispatchContact, loadCrmDispatchRouting } from "@/lib/crmAdmin";
import { calculatorDispatchUrl, dispatchPhoneFromQuery, inboundDispatchUrl, isPensionDispatchQueue } from "@/lib/crmDispatch";

// Hydration has a server snapshot of false and a client snapshot of true.
// No subscription is needed: this value changes only when React hydrates.
const subscribeToHydration=()=>()=>{};
const clientMounted=()=>true;
const serverMounted=()=>false;

type Result={key:string;contact:DispatchContact|null;url:string;checked:boolean};
export default function CrmDispatchPage() {
  const router=useRouter();
  const mounted=useSyncExternalStore(subscribeToHydration,clientMounted,serverMounted);
  const {status,token,isCrm}=useAuth();
  const phone=dispatchPhoneFromQuery(router.query);
  const queue=typeof router.query.queue==='string'?router.query.queue.trim():'';
  const agent=typeof router.query.agent==='string'?router.query.agent.trim():'';
  const [loaded,setLoaded]=useState<Result|null>(null);
  const [failure,setFailure]=useState<{key:string;message:string}|null>(null);
  const [attempt,setAttempt]=useState(0);
  const requestKey=JSON.stringify([phone,queue,agent,attempt,token]);
  const result=loaded?.key===requestKey?loaded:null;
  const error=mounted&&router.isReady&&!phone?"Adauga un numar valid folosind phone_leads, phone_dnis, phone_ani sau phone. Exemplu: /crmdispatch?phone_leads=447440526630":failure?.key===requestKey?failure.message:"";
  useEffect(()=>{
    if(!router.isReady || status==="loading") return;
    if(status!=="authenticated") {
      void router.replace({pathname:"/login",query:{next:router.asPath}});return;
    }
    if(!isCrm || !token || !phone) return;
    const inboundUrl=inboundDispatchUrl(phone,queue,agent);
    if(inboundUrl) {
      window.location.replace(inboundUrl);
      return;
    }
    let cancelled=false;
    async function load() {
      const {contact}=await loadCrmDispatchContact(token!,phone);
      if(cancelled)return;
      const url=calculatorDispatchUrl(contact?{fullName:contact.name,email:contact.email}:null,phone,{queue,agent});
      // Render contact details before starting the independent routing lookup.
      setLoaded({key:requestKey,contact,url,checked:false});
      if(isPensionDispatchQueue(queue)) {
        void router.replace(url);
        return;
      }
      const {automatic}=await loadCrmDispatchRouting(token!,phone);
      if(cancelled)return;
      if(automatic) void router.replace(url);
      else setLoaded({key:requestKey,contact,url,checked:true});
    }
    void load().catch(()=>{
      if(!cancelled)setFailure({key:requestKey,message:"Nu am putut verifica datele clientului. Reincearca."});
    });
    return ()=>{cancelled=true;};
  },[router.isReady,router.asPath,status,token,isCrm,phone,queue,agent,attempt,requestKey,router]);
  return <>
    <Head><title>Alege CRM | ProveIt</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></Head>
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Alege CRM</h1>
        {status==="authenticated"&&!isCrm?<p className="mt-4" role="alert">Contul tau nu are acces la CRM.</p>:<>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2" aria-live="polite">
            <dt>Nume</dt><dd>{result?(result.contact?.name||"Necunoscut"):"Se incarca..."}</dd>
            <dt>Email</dt><dd className="break-all">{result?(result.contact?.email||"Indisponibil"):"Se incarca..."}</dd>
            <dt>Telefon</dt><dd>{phone||"Indisponibil"}</dd>
          </dl>
          {error?<div className="mt-4" role="alert"><p>{error}</p><button type="button" onClick={()=>setAttempt(n=>n+1)} className="mt-4 rounded bg-emerald-700 px-4 py-2 font-semibold text-white">Reincearca</button></div>:
            result?.checked?<div className="mt-4">
              {!result.contact&&<p className="text-sm text-slate-600">Nu am gasit un client pentru acest numar. Poti continua cu numarul de telefon completat.</p>}
              <ul className="mt-6"><li><Link href={result.url} className="block rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800 hover:bg-emerald-100">Simulator Pensie Internationala →</Link></li></ul>
            </div>:<p className="mt-4 text-slate-600" role="status">{result?"Verificam destinatia CRM...":"Incarcam datele clientului..."}</p>}
        </>}
      </section>
    </main>
  </>;
}
