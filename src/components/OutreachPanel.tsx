import {useEffect,useRef,useState} from 'react';

const ORIGIN='https://agents.launchingstack.com';
export default function OutreachPanel({token}:{token:string|null}){
 const frame=useRef<HTMLIFrameElement>(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==ORIGIN||event.source!==frame.current?.contentWindow||event.data?.type!=='launchingstack.outreach.ready'||!token)return;
   frame.current.contentWindow?.postMessage({type:'launchingstack.outreach.auth',token,defaults:{name:'Adrian Defta',profileUrl:'https://www.linkedin.com/in/adriandefta',brand:'proveit',brands:['proveit','launchingstack','proveit-agency','club-ai','fundraise']}},ORIGIN);setReady(true);
  };
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[token]);
 return <section aria-label="LinkedIn Outreach"><h2>LinkedIn Outreach</h2>{!ready&&<p>Opening your outreach workspace…</p>}<iframe ref={frame} title="LaunchingStack Outreach" src={`${ORIGIN}/outreach.html?embed=1&tenantKey=justproveit`} referrerPolicy="strict-origin" style={{width:'100%',minHeight:'1100px',border:'1px solid #cbd5e1',borderRadius:12,background:'white'}}/></section>;
}
