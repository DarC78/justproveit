import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { findCrmLeadByPhone, listCrmLeadIntents } from "@/lib/crmAdmin";
import { dispatchPhone, resolveCrmDispatch } from "@/lib/crmDispatch";

type Resolution=Awaited<ReturnType<typeof resolveCrmDispatch>>;
export default function CrmDispatchPage() {
  const router=useRouter();
  const {status,token,isCrm}=useAuth();
  const phone=typeof router.query.phone==="string"?router.query.phone:"";
  const [loaded,setLoaded]=useState<{key:string;value:Resolution}|null>(null);
  const [failure,setFailure]=useState<{key:string;message:string}|null>(null);
  const [attempt,setAttempt]=useState(0);
  const requestKey=`${phone}:${attempt}:${token}`;
  const result=loaded?.key===requestKey?loaded.value:null;
  const error=router.isReady&&!dispatchPhone(phone)?"Adauga un numar de telefon valid in adresa: /crmdispatch?phone=447440526630":failure?.key===requestKey?failure.message:"";
  useEffect(()=>{
    if(!router.isReady || status==="loading") return;
    if(status!=="authenticated") {
      void router.replace({pathname:"/login",query:{next:router.asPath}});return;
    }
    if(!isCrm || !token) return;
    if(!dispatchPhone(phone)) return;
    let cancelled=false;
    resolveCrmDispatch(phone,{
      findLead:value=>findCrmLeadByPhone(token,value),listIntents:params=>listCrmLeadIntents(token,params),
    }).then(resolution=>{
      if(cancelled)return;
      if(resolution.automatic) void router.replace(resolution.url);
      else setLoaded({key:requestKey,value:resolution});
    }).catch(err=>{if(!cancelled)setFailure({key:requestKey,message:err instanceof Error?err.message:"Nu am putut verifica datele clientului."});});
    return ()=>{cancelled=true;};
  },[router.isReady,router.asPath,status,token,isCrm,phone,attempt,requestKey,router]);
  return <>
    <Head><title>Alege CRM | ProveIt</title><meta name="robots" content="noindex,nofollow"/><meta name="referrer" content="no-referrer"/></Head>
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Alege CRM</h1>
        {status==="authenticated"&&!isCrm?<p className="mt-4" role="alert">Contul tau nu are acces la CRM.</p>:
          error?<div className="mt-4" role="alert"><p>{error}</p><button type="button" onClick={()=>setAttempt(n=>n+1)} className="mt-4 rounded bg-emerald-700 px-4 py-2 font-semibold text-white">Reincearca</button></div>:
          result?<div className="mt-4">
            <p className="text-slate-600">{result.lead?.fullName||"Client"} · {result.phone}</p>
            {!result.lead&&<p className="mt-2 text-sm text-slate-600">Nu am gasit un client pentru acest numar. Poti continua cu numarul de telefon completat.</p>}
            <ul className="mt-6"><li><Link href={result.url} className="block rounded-lg border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-800 hover:bg-emerald-100">Simulator Pensie Internationala →</Link></li></ul>
          </div>:<p className="mt-4 text-slate-600" role="status">Verificam datele clientului...</p>}
      </section>
    </main>
  </>;
}
