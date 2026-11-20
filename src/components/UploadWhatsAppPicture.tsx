import {useEffect,useRef,useState} from 'react';
import {API_BASE_URL} from '@/lib/auth';
export type UploadedWhatsAppPicture={pictureId:string;mimeType:string;fileName:string;size:number;previewUrl:string};
export default function UploadWhatsAppPicture({token,contactId,intentId,phone,picture,disabled,onChange,onBusyChange}:{token:string;contactId?:string;intentId?:string;phone:string|null;picture:UploadedWhatsAppPicture|null;disabled?:boolean;onChange:(picture:UploadedWhatsAppPicture|null)=>void;onBusyChange:(busy:boolean)=>void}){
 const input=useRef<HTMLInputElement>(null),flight=useRef(false),mounted=useRef(true);const[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>()=>{if(picture?.previewUrl)URL.revokeObjectURL(picture.previewUrl);},[picture?.previewUrl]);
 async function upload(file:File){
  if(flight.current||disabled||!phone)return;
  if(!['image/jpeg','image/png','application/pdf'].includes(file.type)||!file.size||file.size>5*1024*1024){setError('Choose a JPEG or PNG picture, or a PDF, up to 5 MB.');return;}
  flight.current=true;setBusy(true);onBusyChange(true);setError('');
  try{
   const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result.slice(reader.result.indexOf(',')+1)):reject(Error('Unable to read this attachment.'));reader.onerror=()=>reject(Error('Unable to read this attachment.'));reader.readAsDataURL(file);});
   const requestId=crypto.randomUUID(),base=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||API_BASE_URL).replace(/\/+$/,'');
   const r=await fetch(base+'/justproveit/admin/crm/'+(contactId?'contacts':'scheduled-calls')+'/'+encodeURIComponent(contactId||intentId!)+'/whatsapp/pictures',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({requestId,expectedPhone:phone,fileName:file.name,mimeType:file.type,base64}),cache:'no-store'}),data=await r.json();
   if(!r.ok)throw Error(data.error?.message||'Attachment upload failed. No WhatsApp message was sent.');
   if(!data.success||String(contactId?data.contactId:data.intentId).toLowerCase()!==String(contactId||intentId).toLowerCase()||data.picture?.pictureId!==requestId||data.picture.mimeType!==file.type||data.picture.size!==file.size||typeof data.picture.fileName!=='string')throw Error('The attachment upload could not be verified.');
   if(mounted.current)onChange({...data.picture,previewUrl:file.type==='application/pdf'?'':URL.createObjectURL(file)});
  }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Attachment upload failed.');}
  finally{flight.current=false;if(mounted.current){setBusy(false);onBusyChange(false);}}
 }
 return <span className="picture-control"><input ref={input} type="file" accept="image/jpeg,image/png,application/pdf,.pdf" aria-label="Choose a WhatsApp picture or PDF" hidden disabled={disabled||busy||!phone} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/><button type="button" disabled={disabled||busy||!phone} onClick={()=>input.current?.click()}>{busy?'Uploading attachment...':'Upload a picture / PDF'}</button>{picture&&<span className="picture-preview">{picture.mimeType!=='application/pdf'&&<a href={picture.previewUrl} target="_blank" rel="noopener noreferrer"><img src={picture.previewUrl} alt={picture.fileName}/></a>}<span>{picture.fileName}<small>Ready to send. The message above is an optional caption.</small></span><button type="button" disabled={disabled||busy} onClick={()=>{onChange(null);setError('');}}>Remove attachment</button></span>}{error&&<span role="alert">{error}</span>}<style jsx>{`.picture-control{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}.picture-control input[hidden]{display:none}button{border:1px solid #cbd5e1;border-radius:6px;padding:9px 12px;background:#176c43;color:white;font-weight:700;cursor:pointer}button:disabled{opacity:.5;cursor:default}.picture-preview{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;max-width:100%;overflow-wrap:anywhere}.picture-preview img{max-width:140px;max-height:110px;display:block;border-radius:5px;border:1px solid #cbd5e1}small{display:block;color:#667085;margin-top:4px}[role=alert]{color:#b42318;font-size:13px}`}</style></span>;
}
