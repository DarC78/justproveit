import styles from './WhatsAppStatsPanel.module.css';
import {FormEvent, useEffect, useRef, useState} from 'react';

type Category = 'clients' | 'closed' | 'passive' | 'active' | 'called' | 'contacted';
type Client = {Phone:string;ClientName:string;InitialAtUtc:string;ThreadStatus:string;CallCount:number;ConnectedCallCount:number;TotalRows:number};
type Message = {Id:string;TicketID:number;Type:number;Message:string|null;SubType:string|null;Author:string;AtUtc:string;TotalMessages:number};
type Report = {summary:Record<Category,number>;clients:Client[];messages:Message[]};
const categories: [Category,string][] = [['clients','Clients'],['closed','ClosedThreads'],['passive','Passive'],['active','Active'],['called','Users called'],['contacted','Users contacted']];
const apiBase=(process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL||'https://launchingstack-func-dev.azurewebsites.net/api').replace(/\/$/,'');
const timestamp=(value:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
async function loadReport(token:string,query:URLSearchParams,signal:AbortSignal):Promise<Report>{
  const response=await fetch(`${apiBase}/justproveit/admin/crm/whatsapp-stats?${query}`,{headers:{Authorization:`Bearer ${token}`},signal});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||'Unable to load WhatsApp stats.');
  return data;
}
export default function WhatsAppStatsPanel({token}:{token:string}){
  const [endDate,setEndDate]=useState(today);
  const [startDate,setStartDate]=useState(()=>new Date(Date.parse(today())-6*86400000).toISOString().slice(0,10));
  const [range,setRange]=useState({startDate,endDate});
  const [category,setCategory]=useState<Category>('clients');
  const [report,setReport]=useState<Report|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  const [offset,setOffset]=useState(0);const [selected,setSelected]=useState<Client|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);const [threadLoading,setThreadLoading]=useState(false);
  const [threadError,setThreadError]=useState('');const [threadOffset,setThreadOffset]=useState(0);
  const generation=useRef(0);
  useEffect(()=>{
    const controller=new AbortController();const version=++generation.current;
    const query=new URLSearchParams({...range,category,offset:String(offset)});
    loadReport(token,query,controller.signal).then(data=>{if(version===generation.current)setReport(data);})
      .catch(e=>{if(!controller.signal.aborted)setError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[token,range,category,offset]);
  useEffect(()=>{
    if(!selected)return;
    const controller=new AbortController();
    const query=new URLSearchParams({...range,phone:selected.Phone,offset:String(threadOffset)});
    loadReport(token,query,controller.signal).then(data=>{
      if(!controller.signal.aborted)setMessages(previous=>threadOffset?[...previous,...data.messages]:data.messages);
    }).catch(e=>{if(!controller.signal.aborted)setThreadError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setThreadLoading(false);});
    return()=>controller.abort();
  },[token,range,selected,threadOffset]);
  function resetReport(){setLoading(true);setError('');setSelected(null);setMessages([]);setReport(null);}
  function applyRange(event:FormEvent){event.preventDefault();resetReport();setOffset(0);setRange({startDate,endDate});}
  const total=report?.clients[0]?.TotalRows||0;
  return <section className={styles.panel} aria-label="WhatsApp stats">
    <h2>WhatsApp stats</h2>
    <form onSubmit={applyRange} style={{display:'flex',gap:12,alignItems:'end',flexWrap:'wrap'}}>
      <label>From <input type="date" required value={startDate} max={endDate} onChange={e=>setStartDate(e.target.value)}/></label>
      <label>To <input type="date" required value={endDate} min={startDate} onChange={e=>setEndDate(e.target.value)}/></label>
      <button type="submit" className="orange small" disabled={loading}>Apply dates</button>
    </form>
    <p className={styles.help}>Dates and times are London time. Clients with WhatsApp activity in these dates are counted once. Thread status is current; call counts use the selected dates.</p>
    <p className={styles.help}>ClosedThreads counts clients whose latest conversation is closed or solved. Active and passive exclude closed conversations. Contacted means an agent call outcome other than voicemail or NU_SE_AUDE.</p>
    {error?<p role="alert">{error}</p>:null}
    <div className={styles.summary}><table><caption>Click a total to see its clients</caption><thead><tr>{categories.map(([key,label])=><th scope="col" key={key}>{label}</th>)}</tr></thead>
      <tbody><tr>{categories.map(([key,label])=><td key={key}><button type="button" className={category===key?'toolbar-btn active':'toolbar-btn'} aria-pressed={category===key} aria-label={`${label}: ${report?.summary[key]??'loading'}`} disabled={loading||!report} onClick={()=>{if(category===key&&offset===0)return;resetReport();setCategory(key);setOffset(0);}}>{loading?'…':report?.summary[key]??'—'}</button></td>)}</tr></tbody></table></div>
    <h3>{categories.find(([key])=>key===category)?.[1]}</h3>
    {loading?<p role="status">Loading clients…</p>:report?<>
      <p>{total} clients{total?` · Showing ${offset+1}–${offset+report.clients.length}`:''}</p>
      <div className={styles.tableWrap}><table style={{width:'100%'}}><thead><tr><th>Client</th><th>Initial date/time</th><th>Status</th><th>Calls</th><th>Connected calls</th><th>WhatsApp thread</th></tr></thead>
        <tbody>{report.clients.map(client=><tr key={client.Phone}><td>{client.ClientName}<br/>{client.Phone}</td><td>{timestamp(client.InitialAtUtc)}</td><td>{client.ThreadStatus}</td><td>{client.CallCount}</td><td>{client.ConnectedCallCount}</td><td><button type="button" className="toolbar-btn" onClick={()=>{setMessages([]);setThreadLoading(true);setThreadError('');setThreadOffset(0);setSelected({...client});}}>View messages</button></td></tr>)}</tbody></table></div>
      {!total?<p>No clients match this category and date range.</p>:null}
      <div style={{display:'flex',gap:12,marginBlock:12}}><button type="button" disabled={!offset} onClick={()=>{resetReport();setOffset(Math.max(0,offset-100));}}>Previous clients</button><button type="button" disabled={offset+100>=total} onClick={()=>{resetReport();setOffset(offset+100);}}>Next clients</button></div>
    </>:null}
    {selected?<section className={styles.thread} aria-label="WhatsApp conversation">
      <h3>WhatsApp thread · {selected.ClientName} · {selected.Phone}</h3>
      <p>Initial message: {timestamp(selected.InitialAtUtc)} · Calls: {selected.CallCount} · Connected calls: {selected.ConnectedCallCount}. Full conversation history is shown, including messages outside the selected dates.</p>
      <button type="button" onClick={()=>{setSelected(null);setMessages([]);}}>Close thread</button>
      {threadError?<p role="alert">{threadError}</p>:null}
      <ol style={{listStyle:'none',padding:0}}>{messages.map(message=><li key={message.Id} style={{background:message.Type===2?'#edf7f2':'#f3f4f6',padding:16,marginBlock:8,borderRadius:8}}>
        <strong>{message.Type===2?'ProveIt · ':''}{message.Author}</strong> <time dateTime={message.AtUtc}>{timestamp(message.AtUtc)}</time> <small>Thread #{message.TicketID}</small>
        <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{message.Message||`[${message.SubType||'Message without text'}]`}</p>
      </li>)}</ol>
      {threadLoading?<p role="status">Loading messages…</p>:null}
      {messages.length<(messages[0]?.TotalMessages||0)?<button type="button" disabled={threadLoading} onClick={()=>{setThreadLoading(true);setThreadError('');setThreadOffset(messages.length);}}>Load more messages</button>:null}
    </section>:null}
  </section>;
}
