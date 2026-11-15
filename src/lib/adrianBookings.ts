import {API_BASE_URL} from './auth';
export type AdrianSlot={start:string;end:string;date:string;time:string;label:string};
export type AdrianBooking=AdrianSlot&{requestId:string;status:'pending'|'uncertain'|'confirmed'|'failed';calendarId:string;calendarLink?:string|null};
export type AdrianAvailability={contactId:string;calendarId:string;timeZone:string;slotMinutes:number;booking:AdrianBooking|null;slots:AdrianSlot[]};
async function request(token:string,id:string,input?:{requestId:string;start:string}){
 const r=await fetch(`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/contacts/${encodeURIComponent(id)}/adrian-bookings`,{method:input?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(input?{'Content-Type':'application/json'}:{})},...(input?{body:JSON.stringify(input)}:{}),cache:'no-store'}),data=await r.json();
 if(!r.ok)throw Object.assign(Error(data.error?.message||'Unable to confirm Adrian booking.'),{status:r.status});if(String(data.contactId).toLowerCase()!==id.toLowerCase())throw Error('Booking identity could not be verified.');return data;
}
export const loadAdrianAvailability=(token:string,id:string):Promise<AdrianAvailability>=>request(token,id);
export async function bookAdrian(token:string,id:string,input:{requestId:string;start:string}):Promise<AdrianBooking>{
 const data=await request(token,id,input),b=data.booking;if(!data.success||data.action!=='book-adrian'||b?.status!=='confirmed'||b.requestId!==input.requestId||Date.parse(b.start)!==Date.parse(input.start)||b.calendarId!=='adriandefta@proveitweb.co.uk')throw Error('The booking receipt could not be verified. Retry the same reservation.');return b;
}
