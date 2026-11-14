import {useEffect,useState} from 'react';
import {getPhoneHistoryAttachment} from '@/lib/crmAdmin';
export type MediatelMedia={messageId:string;mimeType:string;name:string;kind:string};
export default function MediatelMessageAttachment({token,targetKind='contact',targetId,media}:{token:string;targetKind?:'contact'|'booking';targetId:string;media:MediatelMedia}){
 const [url,setUrl]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url);},[url]);
 async function load(){setBusy(true);setError('');try{const blob=await getPhoneHistoryAttachment(token,targetKind,targetId,media.messageId);setUrl(URL.createObjectURL(blob));}catch{setError('Fișierul nu poate fi încărcat. Este posibil să nu mai fie disponibil în WhatsApp.');}finally{setBusy(false);}}
 return <div style={{marginTop:10}}><strong>{media.name}</strong><br/>
  {!url&&<button type="button" disabled={busy} onClick={load}>{busy?'Se încarcă...':'Deschide fișierul'}</button>}
  {error&&<p role="status">{error} <button type="button" onClick={load}>Reîncearcă</button></p>}
  {url&&<>{media.kind==='image'?<a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={media.name} style={{maxWidth:'100%',maxHeight:480,display:'block'}}/>Mărește fotografia</a>:media.kind==='video'?<video controls src={url} style={{maxWidth:'100%',maxHeight:480}}/>:media.kind==='audio'?<audio controls src={url}/>:null}
   <p>{media.mimeType==='application/pdf'&&<><a href={url} target="_blank" rel="noopener noreferrer">Deschide PDF</a> · </>}<a href={url} download={media.name}>Descarcă fișierul</a></p>
  </>}
 </div>;
}
