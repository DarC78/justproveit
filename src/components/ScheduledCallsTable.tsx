import Link from "next/link";
import {useState} from "react";
import PhoneHistoryModal from "./PhoneHistoryModal";
import BookingCallHistory from "./BookingCallHistory";
import BookingActions from "./BookingActions";
import {bookingActionNotice} from "@/lib/bookedCalls";
import {ScheduledCallRow} from "@/lib/crmAdmin";

const londonDateTime=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",dateStyle:"medium",timeStyle:"short"});
const londonTime=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
function dateTime(value: string|null) {const timestamp=Date.parse(value||"");return Number.isFinite(timestamp)?londonDateTime.format(timestamp):"Unavailable";}
function YesNo({value}:{value:boolean|null}) {
  return <span className={value===true?"yes":value===false?"no":"unknown"}>{value===true?"Yes":value===false?"No":"Unavailable"}
    <style jsx>{`span{display:inline-block;border-radius:20px;padding:3px 9px;font-weight:700;font-size:12px}.yes{background:#e5f4e9;color:#196a35}.no{background:#fff2d6;color:#855a0b}.unknown{color:#667085}`}</style></span>;
}

export default function ScheduledCallsTable({token,rows,attention=false,onChanged}:{
  token:string;rows:ScheduledCallRow[];attention?:boolean;onChanged:(notice:string)=>void;
}) {
  const [historyBooking,setHistoryBooking]=useState<ScheduledCallRow|null>(null);
  return <><div className="table-scroll" tabIndex={0} role="region" aria-label={attention?"Attention calls table":"Scheduled calls table"}>
    <table><thead><tr>
      <th scope="col">Call time (UK)</th><th scope="col">Name</th><th scope="col">Phone number</th>
      <th scope="col">Became a lead</th><th scope="col">Call booked on</th>
      <th scope="col">Booking email sent</th><th scope="col">Booking WhatsApp sent</th>
      <th scope="col">Reminder email sent</th><th scope="col">Reminder WhatsApp sent</th>
      <th scope="col">Manual calls that day</th><th scope="col">Agent conversations that day</th><th scope="col">On dialler now</th>
      <th scope="col">On WhatsApp Business</th>
      <th scope="col">Apeluri din ziua programarii si dupa / callcoduri</th>
      <th scope="col">WhatsApp client in ziua programarii</th><th scope="col">WhatsApp noi in ziua programarii</th>
      <th scope="col">Actiuni programare</th>
    </tr></thead><tbody>{rows.map(row=><tr key={row.intentId}>
      <td><time dateTime={row.appointmentAtUtc}>{attention?dateTime(row.appointmentAtUtc):londonTime.format(new Date(row.appointmentAtUtc))}</time></td>
      <th scope="row">{row.phone?<Link href={{pathname:"/admin/crm",query:{tab:"details",phone:row.phone}}}>{row.name||"Client"}</Link>:row.name||"Client"}
        <small>{row.intentType==="MANUAL_BOOK"?"Manual booking":"Calendly"}{row.serviceName?` · ${row.serviceName}`:""}</small>
        {attention&&row.attentionReasons?.map(reason=><small className="reason" key={reason}>{reason}</small>)}
        {attention&&row.lastMediatelWhatsAppFromClient&&<small>Last client message: {dateTime(row.lastMediatelWhatsAppAtUtc)}</small>}
      </th>
      <td className="phone">{row.phone?<button type="button" className="phone-history" aria-haspopup="dialog"
        aria-label={`Open WhatsApp and call history for ${row.phone}`} onClick={()=>setHistoryBooking(row)}>{row.phone}</button>:"Unavailable"}</td><td>{dateTime(row.leadCreatedAtUtc)}</td><td>{dateTime(row.bookedAtUtc)}</td>
      <td><YesNo value={row.bookingEmailSent}/></td><td><YesNo value={row.bookingWhatsAppSent}/></td>
      <td><YesNo value={row.reminderEmailSent}/></td><td><YesNo value={row.reminderWhatsAppSent}/></td>
      <td className="number">{row.manualCallsToday??"Unavailable"}</td><td className="number">{row.agentConversationsToday??"Unavailable"}</td>
      <td><YesNo value={row.onDialler}/></td>
      <td><YesNo value={row.onWhatsAppBusiness}/>{row.onWhatsAppBusiness&&<small>{dateTime(row.whatsAppBusinessAtUtc)}<br/>{row.whatsAppBusinessBy}</small>}</td>
      <td className="history"><BookingCallHistory booking={row}/></td>
      <td className="number">{row.whatsAppClientMessages??"Unavailable"}</td><td className="number">{row.whatsAppTeamMessages??"Unavailable"}</td>
      <td className="history"><BookingActions token={token} booking={row}
        onChanged={result=>onChanged(bookingActionNotice(result))}
        onBusinessMarked={()=>onChanged("Continuarea conversatiei pe WhatsApp Business a fost inregistrata.")}/></td>
    </tr>)}</tbody></table>
    <style jsx>{`
      .table-scroll{overflow-x:auto;border:1px solid #dce3ee;border-radius:7px}
      table{width:100%;min-width:1650px;border-collapse:collapse;font-size:12px;text-align:left}thead{background:#eef3fb;color:#17376e}
      th,td{padding:14px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top}thead th{min-width:100px;font-size:11px;line-height:1.5}
      tbody th{min-width:175px;font-weight:700}tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#f8fafc}
      small{display:block;font-size:11px;color:#667085;font-weight:400;margin-top:5px}.reason{color:#a3480b;font-weight:600}
      time{color:#143b92;font-size:15px;font-weight:800}.phone{white-space:nowrap}.history{min-width:240px}
      .number{text-align:center;font-variant-numeric:tabular-nums;font-weight:700}
      .phone-history{border:0;background:none;padding:0;color:#123c92;text-decoration:underline;font:inherit;cursor:pointer}.phone-history:focus-visible{outline:2px solid #123c92;outline-offset:4px}
    `}</style>
  </div>{historyBooking&&<PhoneHistoryModal token={token} booking={historyBooking} onClose={()=>setHistoryBooking(null)}/>}</>;
}
