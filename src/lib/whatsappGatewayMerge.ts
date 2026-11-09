import type {CustomerRow} from './allCustomers';
import type {PhoneHistoryEvent} from './crmAdmin';
export type GatewayInboundEvent=Extract<PhoneHistoryEvent,{kind:'whatsapp'}>;
export function mergeGatewaySummary(row:CustomerRow,event:GatewayInboundEvent|null|undefined):CustomerRow{
 if(!event||event.direction!=='inbound'||!event.atUtc)return row;
 const at=Date.parse(event.atUtc);if(!Number.isFinite(at))throw Error('Invalid gateway message date.');
 const newer=(value:string|undefined|null)=>!value||!Number.isFinite(Date.parse(value))||at>=Date.parse(value);
 return{...row,...(newer(row.lastInbound?.atUtc)?{lastInbound:{channel:'whatsapp' as const,atUtc:event.atUtc,source:event.source||'Self-hosted WhatsApp',text:event.text}}:{}),...(newer(row.lastWhatsApp?.atUtc)?{lastWhatsApp:{atUtc:event.atUtc,direction:'inbound' as const,source:event.source||'Self-hosted WhatsApp',text:event.text}}:{})};
}
export function mergeGatewayHistory<T extends {events:PhoneHistoryEvent[];whatsAppMessages:number}>(history:T,incoming:PhoneHistoryEvent[]):T{
 const events=new Map(history.events.map(event=>[event.id,event]));for(const event of incoming)if(event.kind==='whatsapp'&&event.direction==='inbound')events.set(event.id,event);
 const merged=[...events.values()].sort((a,b)=>(Date.parse(a.atUtc||'')||0)-(Date.parse(b.atUtc||'')||0)||a.id.localeCompare(b.id));
 return{...history,events:merged,whatsAppMessages:merged.filter(event=>event.kind==='whatsapp').length};
}
