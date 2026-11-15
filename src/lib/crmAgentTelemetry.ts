// Presence is observational evidence, not a security/audit assertion. Never collect
// keys, input values, message bodies, search text or URLs with query parameters.
export function startCrmActivityTracking(token: string, endpoint: string, host: Window = window) {
  const doc=host.document, nativeFetch=host.fetch.bind(host), tabId=host.crypto.randomUUID();
  let lastInput: number|null=null, previous=Date.now(), stopped=false, sending=false;
  type Sample={id:string;kind:'sample'|'leave';atUtc:string;previousAtUtc:string;lastInteractionAtUtc:string|null;visible:boolean;focused:boolean};
  let queue:Sample[]=[];
  const target=new URL(endpoint,host.location.href);
  const focused=()=>doc.visibilityState==='visible'&&doc.hasFocus();
  const observe=(event:Event)=>{if(event.isTrusted&&focused())lastInput=Date.now();};
  const inputs=['pointerdown','keydown','input','scroll','wheel','touchstart'];
  for(const name of inputs)doc.addEventListener(name,observe,{capture:true,passive:true});
  async function flush(keepalive=false) {
    if(sending||!queue.length)return;
    const cutoff=Date.now()-110000;queue=queue.filter(e=>Date.parse(e.atUtc)>=cutoff);
    const batch=queue.slice(0,20);if(!batch.length)return;
    sending=true;
    try{
      const response=await nativeFetch(target.href,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({tabId,events:batch}),keepalive});
      if(response.ok){const ids=new Set(batch.map(e=>e.id));queue=queue.filter(e=>!ids.has(e.id));}
      else if(response.status===400||response.status===413)queue=[];
    }catch{/* Retry bounded samples; CRM work must continue during telemetry outages. */}
    finally{sending=false;}
  }
  function sample(kind:'sample'|'leave'='sample',keepalive=false){
    if(stopped)return;
    const now=Date.now();
    queue.push({id:host.crypto.randomUUID(),kind,atUtc:new Date(now).toISOString(),previousAtUtc:new Date(previous).toISOString(),lastInteractionAtUtc:lastInput===null?null:new Date(lastInput).toISOString(),visible:doc.visibilityState==='visible',focused:doc.hasFocus()});
    previous=now;queue=queue.slice(-20);void flush(keepalive);
  }
  const changed=()=>sample(),leaving=()=>sample('leave',true);
  doc.addEventListener('visibilitychange',changed);host.addEventListener('focus',changed);host.addEventListener('blur',changed);host.addEventListener('pagehide',leaving);
  // Correlation only: recent-input does not prove that a particular request was
  // manually triggered. Server stores it separately from confirmed operations.
  const originalFetch=host.fetch;
  const wrappedFetch:typeof fetch=(input,init)=>{
    try{
      const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,host.location.href);
      if(url.origin===target.origin&&url.pathname.startsWith(target.pathname.replace(/agent-telemetry$/,''))&&!url.pathname.endsWith('/agent-telemetry')){
        const headers=new Headers(init?.headers??(input instanceof Request?input.headers:undefined));
        headers.set('x-crm-tab-id',tabId);headers.set('x-crm-recent-input',focused()&&lastInput!==null&&Date.now()-lastInput<2000?'1':'0');
        return nativeFetch(input,{...init,headers});
      }
    }catch{/* Preserve native request validation. */}
    return nativeFetch(input,init);
  };
  host.fetch=wrappedFetch;
  sample();const timer=host.setInterval(()=>sample(),15000);
  return ()=>{
    sample('leave',true);stopped=true;host.clearInterval(timer);
    for(const name of inputs)doc.removeEventListener(name,observe,true);
    doc.removeEventListener('visibilitychange',changed);host.removeEventListener('focus',changed);host.removeEventListener('blur',changed);host.removeEventListener('pagehide',leaving);
    if(host.fetch===wrappedFetch)host.fetch=originalFetch;
  };
}
