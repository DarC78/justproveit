import {API_BASE_URL} from './auth';
export type ManualPipelineStage='AgreedToBuy'|'ToAdrian';
export type PipelineControlView={contactId:string;pipelineVersion?:number;manualStage?:{stage:ManualPipelineStage;assignmentId:string;atUtc:string;actor:string|null}|null;lastInboundAtUtc?:string|null;priority?:number};
export type PipelineControlInput={requestId:string;expectedVersion:number}&({action:'stage';stage:ManualPipelineStage|null}|{action:'handle';inboundThroughAtUtc:string|null});
export async function savePipelineControl(token:string,contactId:string,input:PipelineControlInput){
 const response=await fetch(`${API_BASE_URL.replace(/\/+$/,'')}/justproveit/admin/crm/contacts/${encodeURIComponent(contactId)}/pipeline-control`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error?.message||'Unable to save pipeline action. Retry the same request.'),{status:response.status});
 if(!data.success||data.action!==input.action||String(data.contactId).toLowerCase()!==contactId.toLowerCase()||!Number.isSafeInteger(data.pipelineVersion)||data.pipelineVersion<1||(input.action==='stage'&&(data.manualStage?.stage||null)!==input.stage)||(input.action==='handle'&&!Number.isFinite(Date.parse(data.p0Handled?.atUtc))))throw Error('The pipeline action could not be verified. Refresh before trying again.');
 return data as {success:true;action:PipelineControlInput['action'];contactId:string;pipelineVersion:number;manualStage:PipelineControlView['manualStage']};
}
