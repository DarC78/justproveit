import {useEffect,useRef,useState} from 'react';
import {startPensionResultTracking,type PensionTrackingChoice} from '@/lib/pensionResultTracking';

export default function PensionResultTrackingChoice({onContinue}:{onContinue:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [settings,setSettings]=useState(false);
  const [done,setDone]=useState(false);
  const [advertising,setAdvertising]=useState(false);
  const [analytics,setAnalytics]=useState(false);
  useEffect(()=>{
    const element=dialog.current;
    if(!element||done)return;
    if(!element.open)element.showModal();
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{element.close();document.body.style.overflow=previous;};
  },[done]);
  function finish(choice:PensionTrackingChoice){
    startPensionResultTracking(choice);
    // A blocked SDK or unavailable consent storage must never block the results.
    dialog.current?.close();setDone(true);onContinue();
  }
  if(done)return null;
  return <dialog ref={dialog} aria-labelledby="result-consent-title" aria-describedby="result-consent-description" onCancel={event=>{event.preventDefault();setSettings(true);}} className="w-[calc(100%-2rem)] max-w-lg rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
    <div className="p-6 sm:p-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">Proveit · Preferințele tale</p>
      <h2 id="result-consent-title" className="text-2xl font-bold">{settings?'Alege ce permiți':'Înainte să vezi rezultatele'}</h2>
      <p id="result-consent-description" className="mt-4 text-sm leading-6 text-slate-600">Folosim Meta, TikTok și Google Ads pentru măsurarea publicității și reclame relevante, iar Microsoft Clarity pentru analiza interacțiunilor. Accept activează ambele categorii. Poți alege în Settings și poți vedea rezultatele fără tracking.</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">Datele simulării și linkul privat nu sunt trimise în evenimentele publicitare. Conținutul rezultatelor este mascat în Clarity.</p>
      {settings&&<div className="mt-5 space-y-3">
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4"><input type="checkbox" checked={analytics} onChange={e=>setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700"/><span><strong className="text-sm">Analiză · Microsoft Clarity</strong><span className="mt-1 block text-sm text-slate-600">Măsurarea interacțiunilor, cu rezultatele mascate.</span></span></label>
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4"><input type="checkbox" checked={advertising} onChange={e=>setAdvertising(e.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700"/><span><strong className="text-sm">Publicitate · Meta, TikTok și Google Ads</strong><span className="mt-1 block text-sm text-slate-600">Măsurarea campaniilor și retargeting.</span></span></label>
      </div>}
      <p className="mt-5 text-xs text-slate-500"><a href="https://www.proveitweb.co.uk/privacypolicy" target="_blank" rel="noreferrer" className="underline">Politica de confidențialitate</a> · Poți modifica ulterior preferințele.</p>
      {settings?<div className="mt-6 flex flex-col gap-3"><button type="button" className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800" onClick={()=>finish({advertising,analytics})}>Salvează și continuă</button><button type="button" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50" onClick={()=>finish({advertising:false,analytics:false})}>Continuă fără tracking</button></div>:<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800" onClick={()=>finish({advertising:true,analytics:true})}>Accept</button><button type="button" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50" onClick={()=>setSettings(true)}>Settings</button></div>}
    </div>
  </dialog>;
}
