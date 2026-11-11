const ukDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'});
const calendarDay=(date:Date)=>Date.parse(ukDate.format(date)+'T00:00:00Z');

export function scheduledCallDisplay(appointment:string,now:Date,handled=false){
 const at=Date.parse(appointment);
 if(!Number.isFinite(at))return {label:'Unavailable',backgroundColor:undefined};
 const days=Math.round((calendarDay(new Date(at))-calendarDay(now))/86400000);
 const label=days===0?'Today':days===1?'Tomorrow':days===2?'Day after tomorrow':days>2?'In the future':'In the past';
 const backgroundColor=days>0?'#dbeafe':days===0&&!handled&&+now-at>30*60000?'#fecaca':undefined;
 return {label,backgroundColor};
}
