import {useEffect,useRef,useState} from 'react';
import {savePipelineControl,type PipelineControlInput,type PipelineControlView,type ManualPipelineStage} from '@/lib/leadPipelineControls';
export default function PipelineLeadControls({token,row,onChanged}:{token:string;row:PipelineControlView;onChanged:(message:string)=>void}){
 const [stage,setStage]=useState<ManualPipelineStage|''>(row.manualStage?.stage||''),[saving,setSaving]=useState(false),[error,setError]=useState('');
 const pending=useRef<PipelineControlInput|null>(null),busy=useRef(false);
 useEffect(()=>{setStage(row.manualStage?.stage||'');pending.current=null;setError('');},[row.contactId,row.pipelineVersion,row.manualStage?.stage]);
 async function save(action:'stage'|'handle'){
  if(busy.current)return;busy.current=true;setSaving(true);setError('');
  const input=pending.current?.action===action?pending.current:{requestId:crypto.randomUUID(),expectedVersion:row.pipelineVersion||0,...(action==='stage'?{action,stage:stage||null}:{action,inboundThroughAtUtc:row.lastInboundAtUtc||null})} as PipelineControlInput;pending.current=input;
  try{await savePipelineControl(token,row.contactId,input);pending.current=null;onChanged(action==='handle'?'Current P0 alert marked handled. Bookings and stage are preserved.':stage?`Lead manually assigned to ${stage}.`:'Automatic pipeline classification restored.');}
  catch(e){setError(e instanceof Error?e.message:'Unable to save pipeline action.');}
  finally{busy.current=false;setSaving(false);}
 }
 return <div className="pipeline-lead-controls">
  {row.priority===0&&<button type="button" disabled={saving} onClick={()=>void save('handle')}>Mark as handled</button>}
  <div className="stage-controls"><label>Assign pipeline stage<select aria-label="Assign pipeline stage" disabled={saving} value={stage} onChange={e=>{setStage(e.target.value as ManualPipelineStage|'');pending.current=null;setError('');}}><option value="">Automatic</option><option value="AgreedToBuy">AgreedToBuy</option><option value="ToAdrian">ToAdrian</option></select></label>
   <button type="button" disabled={saving||(!stage&&!row.manualStage)} onClick={()=>void save('stage')}>{saving?'Saving…':'Assign stage'}</button></div>
  {row.manualStage&&<small>Manual assignment{row.manualStage.actor?` by ${row.manualStage.actor}`:''}. {row.priority===0?'P0 awaiting review.':'Current alert handled.'}</small>}
  {error&&<p role="alert">{error}</p>}
  <style jsx>{`.pipeline-lead-controls{margin:10px 0;padding-top:8px;border-top:1px solid #dce3ee}.stage-controls{display:flex;align-items:end;gap:7px;flex-wrap:wrap;margin-top:8px}label{display:grid;gap:5px;font-size:11px;font-weight:600;color:#344054}select,button{border:1px solid #cbd5e1;border-radius:4px;padding:7px 9px;background:#fff;color:#123c92;font-size:12px}button{font-weight:600;cursor:pointer}button:disabled,select:disabled{opacity:.5;cursor:default}small{display:block;font-size:11px;margin-top:6px}p[role=alert]{font-size:12px;color:#b42318;max-width:300px}`}</style>
 </div>;
}
