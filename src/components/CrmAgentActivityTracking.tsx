import {useEffect} from 'react';
import {API_BASE_URL} from '@/lib/auth';
import {startCrmActivityTracking} from '@/lib/crmAgentTelemetry';
const base=process.env.NEXT_PUBLIC_JPI_CRM_READ_API_BASE_URL??process.env.VITE_JPI_CRM_READ_API_BASE_URL??API_BASE_URL;
export default function CrmAgentActivityTracking({token}:{token:string}) {
  useEffect(()=>startCrmActivityTracking(token,`${base.replace(/\/+$/,'')}/justproveit/admin/crm/agent-telemetry`),[token]);
  return null;
}
