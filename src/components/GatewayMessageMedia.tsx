import {useEffect,useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
export type GatewayMedia={messageId:string;type:string;sha256?:string;size?:number;mimeType?:string;fileName?:string;error?:string};
export type GatewayReaction={targetId:string;removed:boolean;emoji:string};
export default function GatewayMessageMedia({token,media,reaction}:{token:string;media?:GatewayMedia;reaction?:GatewayReaction}){
 if(reaction)return <p>Reaction {reaction.removed?'removed':reaction.emoji} <small>to message {reaction.targetId}</small></p>;
 if(!media)return null;
 if(media.error)return <p>{media.error==='too_large'?'Attachment exceeds the 32 MB limit.':media.error==='view_once'?'View-once attachment is not stored.':'Attachment could not be downloaded from WhatsApp.'}</p>;
 return <GatewayAttachment key={token+':'+media.messageId} token={token} media={media}/>;
}
function GatewayAttachment({token,media}:{token:string;media:GatewayMedia}){
 const holder=useRef<HTMLDivElement>(null);
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[requested,setRequested]=useState(false),[attempt,setAttempt]=useState(0);
 const mime=media.mimeType?.split(';')[0],image=['image/jpeg','image/png','image/gif','image/webp'].includes(mime||'');
 useEffect(()=>{
  if(!image)return;
  if(typeof IntersectionObserver==='undefined'){setRequested(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setRequested(true);observer.disconnect();}},{rootMargin:'200px'});
  if(holder.current)observer.observe(holder.current);
  return()=>observer.disconnect();
 },[image]);
 useEffect(()=>{
  if(!requested)return;
  const controller=new AbortController();let objectUrl='';setBusy(true);setError('');setUrl('');
  void (async()=>{
   try{
    const response=await fetch(`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/whatsapp-gateway/media/${encodeURIComponent(media.messageId)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('Attachment unavailable. Please try again.');
    const blob=await response.blob();if(controller.signal.aborted)return;
    objectUrl=URL.createObjectURL(blob);setUrl(objectUrl);
   }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Attachment unavailable.');}
   finally{if(!controller.signal.aborted)setBusy(false);}
  })();
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[requested,attempt,token,media.messageId]);
 const load=()=>{setRequested(true);setAttempt(n=>n+1);};
 return <div ref={holder} style={{marginTop:8,minHeight:image?70:undefined}}>
  {!url&&<button type="button" disabled={busy} onClick={load}>{busy?'Loading attachment...':error?'Reîncearcă':`Open ${media.type}${media.fileName?`: ${media.fileName}`:''}`}</button>}
  {error&&<p role="alert">{error}</p>}
  {url&&<>{image?<a href={url} target="_blank" rel="noopener noreferrer" aria-label="Mărește fotografia WhatsApp"><img src={url} alt={media.fileName||'WhatsApp attachment'} style={{maxWidth:'100%',maxHeight:480,display:'block'}}/>Mărește fotografia</a>:media.type==='video'?<video src={url} controls preload="metadata" style={{maxWidth:'100%',maxHeight:420}}/>:media.type==='audio'?<audio src={url} controls preload="metadata"/>:null}<p><a href={url} download={media.fileName||'attachment'}>Download {media.fileName||media.type}</a></p></>}
 </div>;
}
