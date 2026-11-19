import {useState} from 'react';
import type {AgentActivityHistogram} from '@/lib/crmAdmin';

export default function AgentActivityChart({data,loading}:{data?:AgentActivityHistogram;loading:boolean}){
 const [active,setActive]=useState<number|null>(null);
 const max=Math.max(1,...(data?.bins.map(b=>b.count)||[])),step=Math.max(1,Math.ceil(max/4)),ceiling=step*4;
 const width=1200,height=300,left=54,top=24,bottom=252,plot=width-left-20;
 const end=(time:string)=>{const [h,m]=time.split(':').map(Number),minute=h*60+m+4;return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');};
 const selected=active===null?null:data?.bins[active];
 return <section aria-label="CRM activity report" aria-busy={loading}>
  <h3>CRM activity — {data?.date||'Date end'}</h3>
  <p>Recorded CRM actions and completed simulations, grouped every 5 minutes. Presence heartbeats are excluded. Timezone: Romania (Europe/Bucharest). Uses the report’s selected agents.</p>
  {loading?<p role="status">Loading activity…</p>:!data?<p role="status">CRM activity is unavailable for this report.</p>:<>
   <p><strong>{data.total} events between 06:00 and 23:59.</strong>{data.total===0?' No recorded activity in this period.':''}</p>
   <p className="detail" aria-live="polite">{selected?`${selected.time}–${end(selected.time)}: ${selected.count} events`:'Hover over or focus a bar to see its event count.'}</p>
   <div className="chart-scroll">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`CRM events on ${data.date}, Romania time, ${data.total} events. Each bar covers five minutes.`}>
     <text x="8" y="14" fontSize="12">Events</text>
     {[0,1,2,3,4].map(i=>{const y=bottom-i*(bottom-top)/4;return <g key={i}><line x1={left} x2={width-20} y1={y} y2={y} stroke="#dce3ed"/><text x={left-10} y={y+4} textAnchor="end" fontSize="12">{i*step}</text></g>;})}
     {data.bins.map((b,i)=>{const h=b.count/ceiling*(bottom-top);return <g key={b.time} tabIndex={0} role="graphics-symbol" aria-label={`${b.time}–${end(b.time)}: ${b.count} events`} onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)}>
      <title>{`${b.time}\u2013${end(b.time)}: ${b.count} events`}</title>
      <rect x={left+i*plot/216} y={top} width={plot/216} height={bottom-top} fill="transparent"/>
      <rect x={left+i*plot/216+.4} y={bottom-h} width={Math.max(1,plot/216-.8)} height={h} fill={active===i?'#ff7b3d':'#1746a2'}/>
     </g>;})}
     {Array.from({length:18},(_,i)=><text key={i} x={left+i*plot/18} y={bottom+23} textAnchor="middle" fontSize="12">{String(i+6).padStart(2,'0')}:00</text>)}
     <text x={width-20} y={bottom+23} textAnchor="end" fontSize="12">23:59</text>
     <text x={width/2} y={height-4} textAnchor="middle" fontSize="12">Time in Romania — 5-minute intervals</text>
    </svg>
   </div>
  </>}
  <style jsx>{`section{margin-top:28px;border-top:1px solid #dce3ed;padding-top:18px}h3{color:#163e85;margin:0 0 10px}p{color:#475569;font-size:13px;line-height:1.5}.detail{min-height:20px;font-variant-numeric:tabular-nums}.chart-scroll{overflow-x:auto;background:#fff;border:1px solid #dce3ed;border-radius:8px;padding:12px}svg{display:block;width:100%;min-width:1080px;color:#334155}svg text{fill:currentColor}g:focus{outline:2px solid #ff7b3d}`}</style>
 </section>;
}
