import {useState} from 'react';
import {getWhatsAppDayDownload} from '@/lib/crmAdmin';
export default function WhatsAppDayDownload({token,kind='contact',id,messageId}:{token:string;kind?:'contact'|'booking';id:string;messageId:string}){
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 async function download(){if(busy)return;setBusy(true);setError('');setNotice('');try{
  const result=await getWhatsAppDayDownload(token,kind,id,messageId),url=URL.createObjectURL(result.blob),a=document.createElement('a');a.href=url;a.download=result.fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  setNotice(result.missing?`${result.missing} attachment(s) could not be downloaded. See DOWNLOAD-INFO.txt in the ZIP.`:'ZIP downloaded with the images and documents received from this number on that UK date.');
 }catch(e){setError(e instanceof Error?e.message:'Download failed. Please retry.');}finally{setBusy(false);}}
 return <div style={{marginTop:8}}><button type="button" disabled={busy} onClick={download} title="Download all images and documents received from this number on the same UK calendar day, from both WhatsApp channels">{busy?'Preparing ZIP...':'Download all from this day'}</button>{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}</div>;
}
