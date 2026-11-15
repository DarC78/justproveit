import {useEffect,useState} from 'react';
import {resolveCrmTab,type CrmTabKey} from './crmTabs';

export function useCrmTab(isReady:boolean,query:Record<string,string|string[]|undefined>){
 // The server and first browser render must agree. Reading window.location
 // in the initializer leaves stale navigation attributes after hydration.
 const [tab,setTab]=useState<CrmTabKey>('leadPipeline');
 const requested=Array.isArray(query.tab)?query.tab[0]:query.tab;
 const hasContactQuery=['phone','phoneNumber','telefon','phoneDNIS'].some(key=>query[key]!==undefined);
 useEffect(()=>{
  let current=true;
  Promise.resolve().then(()=>{if(current&&isReady)setTab(resolveCrmTab(requested,{gatewayEnabled:process.env.NEXT_PUBLIC_WHATSAPP_GATEWAY_CRM==='true',hasContactQuery}));});
  return()=>{current=false;};
 },[isReady,requested,hasContactQuery]);
 return [tab,setTab] as const;
}
