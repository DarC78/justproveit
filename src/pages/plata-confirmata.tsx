import Head from 'next/head';
import { useEffect, useState, useSyncExternalStore } from 'react';
import GooglePurchaseConsent from '@/components/GooglePurchaseConsent';
import { capturedPaidCheckout, verifyPaidCheckout, type PaidCheckout } from '@/lib/googlePurchaseConsent';
import {purchaseCopy,type PurchaseLanguage} from '@/lib/googlePurchaseCopy';
const subscribe=()=>()=>{};
export default function PaymentConfirmed() {
  const reference=useSyncExternalStore(subscribe,capturedPaidCheckout,()=>null),hydrated=useSyncExternalStore(subscribe,()=>true,()=>false);
  const [purchase,setPurchase]=useState<PaidCheckout|null>(null),[status,setStatus]=useState('checking'),[attempt,setAttempt]=useState(0),[language,setLanguage]=useState<PurchaseLanguage|null>(null);
  useEffect(()=>{
    if(!reference)return;let active=true;
    verifyPaidCheckout(reference).then(p=>{if(active){setPurchase(p);setStatus(p?'paid':'unverified');}}).catch(()=>{if(active)setStatus('error');});
    return ()=>{active=false;};
  },[reference,attempt]);
  const displayStatus=!hydrated?'checking':reference?status:'unverified',lang=language||purchase?.language||'ro',t=purchaseCopy[lang];
  const amount=purchase?new Intl.NumberFormat('en-GB',{style:'currency',currency:purchase.currency}).format(purchase.amount/(10**(new Intl.NumberFormat('en',{style:'currency',currency:purchase.currency}).resolvedOptions().maximumFractionDigits ?? 2))):null;
  return <>
    <Head><title>{t.title}</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /></Head>
    <main lang={lang} style={{maxWidth:760,margin:'48px auto',padding:'0 24px',color:'#172554',lineHeight:1.6}}>
      <label>Language / Limbă: <select value={lang} onChange={e=>setLanguage(e.target.value as PurchaseLanguage)}><option value="ro">Română</option><option value="en">English</option><option value="es">Español</option><option value="pl">Polski</option></select></label>
      <h1>{displayStatus==='paid'?t.paidTitle:displayStatus==='checking'?t.checkingTitle:t.title}</h1>
      {displayStatus==='checking'?<p role="status">{t.verifying}</p>:null}
      {purchase?<><p>{t.paid} <strong>{amount}</strong>.</p><ul>{purchase.products.map((p,i)=><li key={i}>{p.name}{p.quantity>1?' × '+p.quantity:''}</li>)}</ul>
        {purchase.confirmationMessage?<p style={{whiteSpace:'pre-wrap'}}>{purchase.confirmationMessage}</p>:null}
        {reference?<GooglePurchaseConsent reference={reference} language={lang} />:null}
        {purchase.continueUrl?<p><a href={purchase.continueUrl} rel="noreferrer" style={{display:'inline-block',padding:'12px 20px',background:'#173b8f',color:'#fff',borderRadius:8}}>{t.continue}</a></p>:<p>{t.close}</p>}
        <p>{t.skip}</p>
      </>:null}
      {displayStatus==='error'||displayStatus==='unverified'?<><p>{t.verifyError}</p><button onClick={()=>{setStatus('checking');setAttempt(v=>v+1);}}>{t.retry}</button></>:null}
    </main>
  </>;
}
