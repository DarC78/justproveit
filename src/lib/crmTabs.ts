export type CrmTabKey='privatePensions'|'details'|'new'|'scheduledCalls'|'attention'|'allCustomersView'|'leadPipeline'|'InboundContacts'|'allMessages'|'AllWhatsAppMessages'|'sales'|'all'|'intents'|'inboundSms'|'whatsappGateway'|'whatsappStats'|'agentreport'|'manual'|'highLevelFunnels'|'missed';
export type CrmTab={key:CrmTabKey;label:string};
export const PRIMARY_CRM_TABS:CrmTab[]=[
 {key:'leadPipeline',label:'Lead Pipeline'},
 {key:'all',label:'All Leads CRM'},
 {key:'new',label:'Lead Nou'},
 {key:'InboundContacts',label:'InboundContacts'},
 {key:'agentreport',label:'Agent Report'},
];
export function otherCrmTabs(gatewayEnabled=false,privatePensions=true):CrmTab[]{return [
 ...(privatePensions?[{key:'privatePensions' as const,label:'Livrare Pensii Private'}]:[]),
 {key:'details',label:'Detalii Lead'},
 {key:'scheduledCalls',label:'Scheduled calls'},
 {key:'attention',label:'Attention'},
 {key:'allCustomersView',label:'AllCustomersView'},
 {key:'sales',label:'Arata Vanzarile'},
 {key:'intents',label:'Lead Intents'},
 {key:'inboundSms',label:'InboundSMS'},
 ...(gatewayEnabled?[{key:'whatsappGateway' as const,label:'WhatsApp inbox'}]:[]),
 {key:'whatsappStats',label:'WhatsApp stats'},
 {key:'manual',label:'Send Manual Email/SMS'},
 {key:'missed',label:'Missed calls'},
 {key:'highLevelFunnels',label:'High Level Funnels'},
];}
export function resolveCrmTab(value:string|null|undefined,{gatewayEnabled=false,hasContactQuery=false}={}):CrmTabKey{
 if(value==='AllWhatsAppMessages'||value==='allMessages')return 'InboundContacts';
 return [...PRIMARY_CRM_TABS,...otherCrmTabs(gatewayEnabled)].some(t=>t.key===value)?value as CrmTabKey:hasContactQuery?'details':'leadPipeline';
}
