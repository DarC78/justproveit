import ContactActions from './ContactActions';
import PipelineLeadControls from './PipelineLeadControls';
import BookingActions from './BookingActions';
import {contactActionNotice} from '@/lib/allCustomers';
import {bookingActionNotice} from '@/lib/bookedCalls';
import type {PipelineControlView} from '@/lib/leadPipelineControls';
import type {LeadNoteSummary} from '@/lib/leadNotes';
import type {ScheduledCallRow} from '@/lib/crmAdmin';

export default function LeadPipelineRowActions({token,row,noteSummary,onNoteSaved,onChanged}:{token:string;row:PipelineControlView&{name:string;phone:string|null;booking?:ScheduledCallRow|null};noteSummary?:LeadNoteSummary;onNoteSaved?:()=>void;onChanged:(message:string)=>void}){
 return <div style={{minWidth:300}}>
  <ContactActions token={token} contactId={row.contactId} name={row.name} phone={row.phone} noteSummary={noteSummary} onNoteSaved={onNoteSaved} onChanged={result=>onChanged(contactActionNotice(result))}/>
  <PipelineLeadControls token={token} row={row} onChanged={onChanged}/>
  {row.booking&&<BookingActions key={row.booking.intentId+':'+row.booking.appointmentAtUtc} token={token} booking={row.booking} onChanged={result=>onChanged(bookingActionNotice(result))} onBusinessMarked={()=>onChanged('WhatsApp Business updated.')} onSolved={()=>onChanged('Booking marked solved on WhatsApp.')}/>}
 </div>;
}
