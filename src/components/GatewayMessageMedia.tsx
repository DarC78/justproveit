import {useEffect,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
export type GatewayMedia={messageId:string;type:string;sha256?:string;size?:number;mimeType?:string;fileName?:string;error?:string};
export type GatewayReaction={targetId:string;removed:boolean;emoji:string};
export default function GatewayMessageMedia({token,media,reaction}:{token:string;media?:GatewayMedia;reaction?:GatewayReaction}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
 async function load(){setBusy(true);setError('');try{
  const response=await fetch(`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/whatsapp-gateway/media/${encodeURIComponent(media!.messageId)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  if(!response.ok)throw Error('Attachment unavailable. Please try again.');
  setUrl(URL.createObjectURL(await response.blob()));
 }catch(e){setError(e instanceof Error?e.message:'Attachment unavailable.');}finally{setBusy(false);}}
 if(reaction)return <p>Reaction {reaction.removed?'removed':reaction.emoji} <small>to message {reaction.targetId}</small></p>;
 if(!media)return null;
 if(media.error)return <p>{media.error==='too_large'?'Attachment exceeds the 32 MB limit.':media.error==='view_once'?'View-once attachment is not stored.':'Attachment could not be downloaded from WhatsApp.'}</p>;
 const mime=media.mimeType?.split(';')[0],image=['image/jpeg','image/png','image/gif','image/webp'].includes(mime||'');
 return <div style={{marginTop:8}}>
  {!url&&<button type="button" disabled={busy} onClick={load}>{busy?'Loading attachment...':`Open ${media.type}${media.fileName?`: ${media.fileName}`:''}`}</button>}
  {error&&<p role="alert">{error}</p>}
  {url&&<>{image?<img src={url} alt={media.fileName||'WhatsApp attachment'} style={{maxWidth:'100%',maxHeight:420}}/>:media.type==='video'?<video src={url} controls preload="metadata" style={{maxWidth:'100%',maxHeight:420}}/>:media.type==='audio'?<audio src={url} controls preload="metadata"/>:null}<p><a href={url} download={media.fileName||'attachment'}>Download {media.fileName||media.type}</a></p></>}
 </div>;
}
