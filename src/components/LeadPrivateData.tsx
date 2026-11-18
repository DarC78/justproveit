import {useEffect,useRef,useState} from 'react';
import {getLeadPrivateDataAvailability,revealLeadPrivateData} from '@/lib/crmAdmin';
export default function LeadPrivateData({token,contactId}:{token:string;contactId:string}){
 const [available,setAvailable]=useState(false),[open,setOpen]=useState(false),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sections,setSections]=useState<{text:string}[]>([]);const generation=useRef(0);
 useEffect(()=>{let active=true;setAvailable(false);getLeadPrivateDataAvailability(token,contactId).then(r=>{if(active)setAvailable(r.hasPrivateData);}).catch(()=>{});return()=>{active=false;generation.current++;};},[token,contactId]);
 function lock(){generation.current++;setSections([]);setPassword('');setError('');setOpen(false);setBusy(false);}
 useEffect(()=>{const hide=()=>{if(document.visibilityState==='hidden')lock();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 useEffect(()=>{if(!sections.length)return;const timer=window.setTimeout(lock,300000);return()=>window.clearTimeout(timer);},[sections]);
 useEffect(()=>{lock();},[token,contactId]);
 async function reveal(e:React.FormEvent){e.preventDefault();const current=++generation.current;setBusy(true);setError('');const submitted=password;setPassword('');try{const r=await revealLeadPrivateData(token,contactId,submitted);if(current===generation.current)setSections(r.sections);}catch(cause){if(current===generation.current)setError(cause instanceof Error?cause.message:'Unable to show private data.');}finally{if(current===generation.current)setBusy(false);}}
 if(!available)return null;
 return <section aria-label="Private client data" style={{border:'1px solid #cbd5e1',padding:12,marginBottom:16,borderRadius:8}}>
  {!open?<button type="button" onClick={()=>setOpen(true)}>Show private data</button>:<><button type="button" onClick={lock}>Hide private data</button>{!sections.length?<form onSubmit={reveal}><label>Admin password (adrian@proveitweb.co.uk)<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)} required disabled={busy}/></label><button disabled={busy||!password} type="submit">{busy?'Checking...':'Unlock private data'}</button></form>:<><p>Private data hides after five minutes or when you leave this tab.</p>{sections.map((s,i)=><pre key={i} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',fontFamily:'inherit'}}>{s.text}</pre>)}</>}{error&&<p role="alert">{error}</p>}</>}
 </section>;
}
