export type FutureLeadMeeting={id:string;atUtc:string;kind:'call'|'adrian'|'contact'};
const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'});
export default function LeadNextMeetings({meetings=[],nextActionDate}:{meetings?:FutureLeadMeeting[];nextActionDate?:string|null}){
 const future=meetings.filter(m=>Number.isFinite(Date.parse(m.atUtc)));
 return <div style={{minWidth:190,display:'grid',gap:8}}>{future.map(m=><div key={m.kind+':'+m.id}><strong>{m.kind==='adrian'?'Call with Adrian':m.kind==='contact'?'Next contact':'Booked call'}</strong><br/><time dateTime={m.atUtc}>{clock.format(new Date(m.atUtc))} UK</time></div>)}{nextActionDate&&<div><strong>Next Action Date</strong><br/><time dateTime={nextActionDate}>{nextActionDate.split('-').reverse().join('/')}</time></div>}{!future.length&&!nextActionDate&&<span>—</span>}</div>;
}
