import type {AgentCrmProductivity} from '@/lib/crmAdmin';
function duration(seconds:number){const n=Math.floor(Math.max(0,seconds));return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');}
export default function AgentCrmMetrics({data,agentId}:{data:AgentCrmProductivity|null;agentId:string}){
 const linked=agentId==='all'?Boolean(data?.mappedAgentIds?.length):data?.mappedAgentIds?.includes(Number(agentId));
 const missing=data?.unavailable||!data?'Unavailable':!linked?'Not linked':null;
 const active=data?.totals?.activeCrmSeconds;
 const metrics=[['Active in CRM total',active==null?'Not recorded':duration(active)],['Simulations done',data?.totals?.simulationsDone??'Not recorded'],['Cases opened',data?.totals?.casesOpened??'Not recorded'],['Cases updated',data?.totals?.casesUpdated??'Not recorded']];
 return <>{metrics.map(([label,value])=><div className="agent-crm-metric" key={label}><span>{label}</span><strong>{missing??value??'Unavailable'}</strong></div>)}<style jsx>{`.agent-crm-metric{display:grid;gap:4px;min-height:70px;align-content:center;border:1px solid #d6e8da;border-radius:8px;background:#f4fbf6;padding:10px 12px}.agent-crm-metric span{color:#34513c;font-size:12px;font-weight:800}.agent-crm-metric strong{color:#008a1e;font-size:18px;font-weight:900}`}</style></>;
}
