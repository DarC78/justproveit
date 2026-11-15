import {useEffect,useState} from 'react';
import {loadPipelineControl} from '@/lib/leadPipelineControls';
import ContactActions from './ContactActions';
import PipelineLeadControls from './PipelineLeadControls';
import BookingActions from './BookingActions';
import {contactActionNotice} from '@/lib/allCustomers';
import {bookingActionNotice} from '@/lib/bookedCalls';
import type {PipelineControlView} from '@/lib/leadPipelineControls';
import type {LeadNoteSummary} from '@/lib/leadNotes';
import type {ScheduledCallRow} from '@/lib/crmAdmin';

export default function LeadPipelineRowActions({token,row,noteSummary,onNoteSaved,onChanged,allowHandleForAllLeads=true}:{token:string;row:PipelineControlView&{name:string;phone:string|null;booking?:ScheduledCallRow|null};noteSummary?:LeadNoteSummary;onNoteSaved?:()=>void;onChanged:(message:string)=>void;allowHandleForAllLeads?:boolean}){
 const [loaded,setLoaded]=useState<PipelineControlView|null>(null),[loadError,setLoadError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{if(row.pipelineVersion!==undefined)return;let active=true;Promise.resolve().then(()=>{if(!active)return null;setLoaded(null);return loadPipelineControl(token,row.contactId);}).then(value=>{if(active&&value){setLoaded(value);setLoadError('');}}).catch(e=>{if(active)setLoadError(e.message||'Unable to load lead actions.');});return()=>{active=false;};},[token,row.contactId,row.pipelineVersion,revision]);
 const changed=(message:string)=>{setRevision(n=>n+1);onChanged(message);};
 const controls=row.pipelineVersion!==undefined?row:loaded?.contactId.toLowerCase()===row.contactId.toLowerCase()?loaded:null;
 return <div style={{minWidth:300}}>
  <ContactActions token={token} contactId={row.contactId} name={row.name} phone={row.phone} noteSummary={noteSummary} onNoteSaved={onNoteSaved} onChanged={result=>changed(contactActionNotice(result))}/>
  {controls?<PipelineLeadControls token={token} row={controls} onChanged={changed} allowHandleForAllLeads={allowHandleForAllLeads}/>:<p role={loadError?'alert':'status'}>{loadError||'Loading lead controls?'}{loadError&&<button type="button" onClick={()=>setRevision(n=>n+1)}>Retry</button>}</p>}
  {row.booking&&<BookingActions key={row.booking.intentId+':'+row.booking.appointmentAtUtc} token={token} booking={row.booking} onChanged={result=>onChanged(bookingActionNotice(result))} onBusinessMarked={()=>onChanged('WhatsApp Business updated.')} onSolved={()=>onChanged('Booking marked solved on WhatsApp.')}/>}
 </div>;
}
