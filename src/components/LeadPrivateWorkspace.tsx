import {useEffect,useRef,useState} from 'react';
import {fetchPrivateFile,loadPrivateWorkspace,privateFileBase64,savePrivateEntry,type PrivateEntry,type PrivateWorkspace} from '@/lib/leadPrivateWorkspace';
const stamp=(entry:PrivateEntry)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'}).format(new Date(entry.createdAtUtc))+' UK · '+entry.addedBy.name;
export default function LeadPrivateWorkspace({token,contactId,name}:{token:string;contactId:string;name:string}){
 const [open,setOpen]=useState(false),[data,setData]=useState<PrivateWorkspace|null>(null),[text,setText]=useState(''),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),fileInput=useRef<HTMLInputElement>(null),generation=useRef(0),inFlight=useRef(false),noteId=useRef(''),fileId=useRef('');
 function close(){generation.current++;setOpen(false);setData(null);setText('');setFile(null);setBusy(false);setError('');setNotice('');noteId.current='';fileId.current='';}
 useEffect(()=>{const guard=generation;close();return()=>{guard.current++;};},[token,contactId]);
 useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
 useEffect(()=>{const hide=()=>{if(document.visibilityState==='hidden')close();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 useEffect(()=>{if(!open)return;const timer=window.setTimeout(close,300000);return()=>window.clearTimeout(timer);},[open]);
 async function show(){const current=++generation.current;setOpen(true);setData(null);setError('');try{const value=await loadPrivateWorkspace(token,contactId);if(current===generation.current)setData(value);}catch(e){if(current===generation.current)setError((e as Error).message);}}
 async function save(kind:'notes'|'files'){
  if(inFlight.current||!data||(kind==='notes'?!text.trim():!file))return;
  const current=generation.current;inFlight.current=true;setBusy(true);setError('');setNotice('');
  const ref=kind==='notes'?noteId:fileId;ref.current||=crypto.randomUUID();
  try{
   if(file&&kind==='files'&&file.size>data.maxFileBytes)throw Error('Choose a file up to 10 MB.');
   const payload=kind==='notes'?{text,requestId:ref.current}:{requestId:ref.current,fileName:file!.name,mimeType:file!.type,base64:await privateFileBase64(file!)};
   if(current!==generation.current)return;
   const result=await savePrivateEntry(token,contactId,kind,payload);
   if(current!==generation.current)return;
   ref.current='';if(kind==='notes')setText('');else{setFile(null);if(fileInput.current)fileInput.current.value='';}
   setNotice((kind==='notes'?'Private note saved. ':'Private file uploaded. ')+stamp(result.entry));
   try{const value=await loadPrivateWorkspace(token,contactId);if(current===generation.current)setData(value);}catch{if(current===generation.current){setData(null);setError('Saved. Close and reopen to refresh the private workspace.');}}
  }catch(e){if(current===generation.current)setError((e as Error).message);}finally{inFlight.current=false;if(current===generation.current)setBusy(false);}
 }
 async function more(kind:'notes'|'files',before:string){if(inFlight.current)return;inFlight.current=true;const current=generation.current;setBusy(true);try{const value=await loadPrivateWorkspace(token,contactId,kind,before);if(current===generation.current)setData(previous=>previous?{...previous,[kind]:[...(previous[kind]||[]),...(value[kind]||[])],[kind+'Next']:value[kind==='notes'?'notesNext':'filesNext']}:null);}catch(e){if(current===generation.current){setData(null);setError((e as Error).message);}}finally{inFlight.current=false;if(current===generation.current)setBusy(false);}}
 async function download(entry:PrivateEntry){if(inFlight.current)return;inFlight.current=true;const current=generation.current;setBusy(true);setError('');try{const blob=await fetchPrivateFile(token,contactId,entry.id);if(current!==generation.current)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=entry.fileName||'document';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){if(current===generation.current){setData(null);setError((e as Error).message);}}finally{inFlight.current=false;if(current===generation.current)setBusy(false);}}
 return <><button type="button" onClick={()=>void show()}>Private files &amp; notes</button>{open&&<dialog ref={dialog} aria-label="Private files and notes" onCancel={close}>
  <header><h3>Private files &amp; notes</h3><button type="button" onClick={close}>Close</button></header><p>{name||'Lead'}</p>
  <p>Only adrian@proveitweb.co.uk can consult these files and notes. Authorized CRM users can upload files and add notes. These are separate from the lead history.</p>
  <p>Closes after five minutes or when you leave this browser tab.</p>
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{!data&&!error&&<p role="status">Loading...</p>}
  {data&&<><section><h4>Add private note</h4><label>Note<textarea rows={5} maxLength={10000} value={text} disabled={busy} onChange={e=>{setText(e.target.value);noteId.current='';}}/></label><button type="button" disabled={busy||!text.trim()} onClick={()=>void save('notes')}>Add private note</button></section>
   <section><h4>Upload private file</h4><p>Up to 10 MB. JPG, PNG, WebP, PDF, DOCX, XLSX, TXT or CSV.</p><input ref={fileInput} aria-label="Private file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.txt,.csv" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);fileId.current='';}}/><button type="button" disabled={busy||!file} onClick={()=>void save('files')}>Upload private file</button></section>
   {data.canReadPrivateContent&&<><section><h4>Private files</h4>{!data.files?.length&&<p>No private files.</p>}{data.files?.map(entry=><article key={entry.id}><strong>{entry.fileName}</strong><p>{stamp(entry)} · {Math.ceil((entry.size||0)/1024)} KB</p><button disabled={busy} type="button" onClick={()=>void download(entry)}>Download</button></article>)}{data.filesNext&&<button disabled={busy} type="button" onClick={()=>void more('files',data.filesNext!)}>Older files</button>}</section>
   <section><h4>Private notes</h4>{!data.notes?.length&&<p>No private notes.</p>}{data.notes?.map(entry=><article key={entry.id}><p>{stamp(entry)}</p><div className="note">{entry.text}</div></article>)}{data.notesNext&&<button disabled={busy} type="button" onClick={()=>void more('notes',data.notesNext!)}>Older notes</button>}</section></>}
  </>}
 </dialog>}<style jsx>{`dialog{box-sizing:border-box;width:min(760px,calc(100vw - 32px));max-height:90vh;overflow:auto;border:1px solid #cbd5e1;border-radius:12px;padding:24px;color:#344054}dialog::backdrop{background:#10213d80}header{display:flex;justify-content:space-between;gap:16px}h3{margin:0;color:#17376e}section{border-top:1px solid #dce3ee;margin-top:20px;padding-top:12px}label{display:grid;gap:8px}textarea{width:100%;box-sizing:border-box;padding:10px;font:inherit}button{padding:8px;margin:4px;border:1px solid #94a3b8;border-radius:4px;background:white;color:#123c92;cursor:pointer}button:disabled{opacity:.5}article{padding:12px;background:#f1f5f9;margin:10px 0;overflow-wrap:anywhere}.note{white-space:pre-wrap}p{font-size:13px;line-height:1.6}p[role=alert]{color:#b42318}`}</style></>;
}
