import {useState} from 'react';
import type {AgentActivityHistogram} from '@/lib/crmAdmin';
const series=[{key:'talkedMinutes',label:'Talking',color:'#dc2626',unit:'min'},{key:'clericalMinutes',label:'Clerical',color:'#eab308',unit:'min'},{key:'pauseMinutes',label:'Pause',color:'#111111',unit:'min'},{key:'count',label:'CRM activity',color:'#1746a2',unit:'events'}] as const;
type Bin=AgentActivityHistogram['bins'][number];
const value=(bin:Bin,key:typeof series[number]['key'])=>bin[key]||0;
const amount=(n:number)=>Number(n.toFixed(2)).toString();
const intervalEnd=(time:string)=>{const [h,m]=time.split(':').map(Number),minute=h*60+m+4;return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');};
const describe=(b:Bin)=>`${b.time}-${intervalEnd(b.time)}: ${series.map(s=>`${s.label} ${amount(value(b,s.key))} ${s.unit}`).join('; ')}`;
export default function AgentActivityChart({data,loading}:{data?:AgentActivityHistogram;loading:boolean}){
 const [active,setActive]=useState<number|null>(null);
 const max=Math.max(1,...(data?.bins.map(b=>series.reduce((sum,s)=>sum+value(b,s.key),0))||[])),step=Math.max(1,Math.ceil(max/4)),ceiling=step*4;
 const width=1200,height=300,left=62,top=24,bottom=252,plot=width-left-20;
 const selected=active===null?null:data?.bins[active];
 const durations=data?.bins.reduce((n,b)=>n+value(b,'talkedMinutes')+value(b,'clericalMinutes')+value(b,'pauseMinutes'),0)||0;
 return <section aria-label="CRM activity report" aria-busy={loading}>
  <h3>CRM activity and agent time - {data?.date||'Date end'}</h3>
  <p>Stacked five-minute intervals: 1 unit = 1 minute for talking, clerical and pause; 1 unit = 1 recorded CRM event for blue. Time can overlap CRM activity. Minutes add across selected agents. Timezone: Romania (Europe/Bucharest).</p>
  <ul className="legend" aria-label="Chart legend">{series.map(s=><li key={s.key}><span style={{background:s.color}}/>{s.label} ({s.unit})</li>)}</ul>
  {loading?<p role="status">Loading activity...</p>:!data?<p role="status">CRM activity is unavailable for this report.</p>:<>
   <p><strong>{data.total} CRM events between 06:00 and 23:59.</strong>{data.total===0&&durations===0?' No recorded activity in this period.':''} Presence heartbeats are excluded.</p>
   <p className="detail" aria-live="polite">{selected?describe(selected):'Hover over or focus a bar for minutes and CRM event counts.'}</p>
   <div className="chart-scroll">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Agent activity on ${data.date}, Romania time, ${data.total} CRM events. Each bar covers five minutes; durations are minutes.`}>
     <text x="8" y="14" fontSize="12">Units</text>
     {[0,1,2,3,4].map(i=>{const y=bottom-i*(bottom-top)/4;return <g key={i}><line x1={left} x2={width-20} y1={y} y2={y} stroke="#dce3ed"/><text x={left-10} y={y+4} textAnchor="end" fontSize="12">{i*step}</text></g>;})}
     {data.bins.map((b,i)=>{let base=0;return <g key={b.time} tabIndex={0} role="graphics-symbol" aria-label={describe(b)} onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(i)} onBlur={()=>setActive(null)}>
      <title>{describe(b)}</title>
      <rect x={left+i*plot/216} y={top} width={plot/216} height={bottom-top} fill="transparent"/>
      {series.map(s=>{const n=value(b,s.key),h=n/ceiling*(bottom-top);base+=n;return <rect key={s.key} data-series={s.key} x={left+i*plot/216+.4} y={bottom-base/ceiling*(bottom-top)} width={Math.max(1,plot/216-.8)} height={h} fill={s.color} stroke={active===i?'#64748b':'none'} strokeWidth="0.6"/>;})}
     </g>;})}
     {Array.from({length:18},(_,i)=><text key={i} x={left+i*plot/18} y={bottom+23} textAnchor="middle" fontSize="12">{String(i+6).padStart(2,'0')}:00</text>)}
     <text x={width-20} y={bottom+23} textAnchor="end" fontSize="12">23:59</text>
     <text x={width/2} y={height-4} textAnchor="middle" fontSize="12">Time in Romania - 5-minute intervals</text>
    </svg>
   </div>
  </>}
  <style jsx>{`section{margin-top:28px;border-top:1px solid #dce3ed;padding-top:18px}h3{color:#163e85;margin:0 0 10px}p{color:#475569;font-size:13px;line-height:1.5}.legend{display:flex;flex-wrap:wrap;gap:18px;list-style:none;padding:0;color:#334155;font-size:13px}.legend li{display:flex;gap:6px;align-items:center}.legend span{width:13px;height:13px;border:1px solid #64748b;border-radius:2px}.detail{min-height:20px;font-variant-numeric:tabular-nums}.chart-scroll{overflow-x:auto;background:#fff;border:1px solid #dce3ed;border-radius:8px;padding:12px}svg{display:block;width:100%;min-width:1080px;color:#334155}svg text{fill:currentColor}g:focus{outline:2px solid #64748b}`}</style>
 </section>;
}
