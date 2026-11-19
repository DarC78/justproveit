import {useEffect,useState} from 'react';
import {loadPipelineControl} from '@/lib/leadPipelineControls';
import InternalLeadActions from './InternalLeadActions';
import ManualPayment from './ManualPayment';
import SignwellIpc from './SignwellIpc';
import ContactStartSimulation from './ContactStartSimulation';
import ContactBookCall from './ContactBookCall';
import ContactIdentityEditor from './ContactIdentityEditor';
import ContactBookAdrian from './ContactBookAdrian';
import PipelineLeadControls from './PipelineLeadControls';
import BookingActions from './BookingActions';
import {contactActionNotice} from '@/lib/allCustomers';
import {bookingActionNotice} from '@/lib/bookedCalls';
import type {PipelineControlView} from '@/lib/leadPipelineControls';
import type {LeadNoteSummary} from '@/lib/leadNotes';
import type {ScheduledCallRow} from '@/lib/crmAdmin';

export default function LeadPipelineRowActions({token,row,noteSummary,onNoteSaved,onChanged,allowHandleForAllLeads=true}:{token:string;row:PipelineControlView&{name:string;phone:string|null;booking?:ScheduledCallRow|null;done?:{atUtc:string}|null};noteSummary?:LeadNoteSummary;onNoteSaved?:()=>void;onChanged:(message:string)=>void;allowHandleForAllLeads?:boolean}){
 const [loaded,setLoaded]=useState<PipelineControlView|null>(null),[loadError,setLoadError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{if(row.pipelineVersion!==undefined)return;let active=true;Promise.resolve().then(()=>{if(!active)return null;setLoaded(null);return loadPipelineControl(token,row.contactId);}).then(value=>{if(active&&value){setLoaded(value);setLoadError('');}}).catch(e=>{if(active)setLoadError(e.message||'Unable to load lead actions.');});return()=>{active=false;};},[token,row.contactId,row.pipelineVersion,revision]);
 const changed=(message:string)=>{setRevision(n=>n+1);onChanged(message);};
 const controls=row.pipelineVersion!==undefined?row:loaded?.contactId.toLowerCase()===row.contactId.toLowerCase()?loaded:null;
 return <div className="lead-row-actions" style={{minWidth:300}}>
  <section aria-label="Usual actions">
   <h4>Usual actions</h4>
   <div className="usual-buttons">
    <ContactStartSimulation token={token} contactId={row.contactId} name={row.name} phone={row.phone} onChanged={result=>changed(contactActionNotice(result))}/>
    <ContactBookCall token={token} contactId={row.contactId} name={row.name||row.phone||'Lead'} disabled={!row.phone} onBooked={result=>changed(contactActionNotice(result))}/>
    <ContactIdentityEditor token={token} contactId={row.contactId} onChanged={()=>changed('Contact details updated.')}/>
    <ContactBookAdrian token={token} contactId={row.contactId} name={row.name||row.phone||'Lead'} onBooked={()=>changed('Adrian booking updated.')}/>
   </div>
   {row.booking&&<BookingActions leadActionsOnly key={row.booking.intentId+':'+row.booking.appointmentAtUtc} token={token} booking={row.booking} onChanged={result=>changed(bookingActionNotice(result))}/>}
   <div className="comment-actions"><InternalLeadActions showSpecialActions={false} allowEnd={false} token={token} contactId={row.contactId} name={row.name} summary={noteSummary} onNoteSaved={onNoteSaved} onChanged={result=>changed(contactActionNotice(result))}/></div>
   {controls?<PipelineLeadControls leadActionsOnly token={token} row={controls} eventHandled={Boolean(row.done)} onChanged={changed} allowHandleForAllLeads={allowHandleForAllLeads}/>:<p role={loadError?'alert':'status'}>{loadError||'Loading lead controls...'}{loadError&&<button type="button" onClick={()=>setRevision(n=>n+1)}>Retry</button>}</p>}
  </section>
  <section aria-label="Special actions" className="special-actions">
   <h4>Special actions</h4>
   <div className="special-buttons"><ManualPayment token={token} contactId={row.contactId} name={row.name} onSaved={onNoteSaved}/><SignwellIpc token={token} contactId={row.contactId} name={row.name}/></div>
  </section>
  <style jsx>{`h4{margin:0 0 8px;font-size:12px;font-weight:700;color:#475569}.comment-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.special-actions{border-top:1px solid #dce3ee;margin-top:12px;padding-top:12px}.usual-buttons,.special-buttons{display:flex;flex-wrap:wrap;gap:7px}`}</style>
 </div>;
}
