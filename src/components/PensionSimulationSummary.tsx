import {type PensionProfile} from '@/lib/pensionProfiles';
type Report={messages?:string[];createdAtUtc?:string};
type Delivery={status?:string;email?:string;providerMessageId?:string};
export default function PensionSimulationSummary({profile}:{profile:PensionProfile}){
 const report=profile.answers.simulation as Report|undefined,delivery=profile.answers.emailDelivery as Delivery|undefined;
 const statuses:Record<string,string>={pending:'Solicitat',processing:'În curs de trimitere',sent:'Acceptat de Resend',failed:'Trimitere eșuată',unknown:'Trimitere neconfirmată — fără retrimitere automată'};
 return <div className="my-3 rounded border border-blue-100 bg-blue-50 p-3 text-sm">
 <p>Luna și anul nașterii: {String(profile.answers.birthYearMonth||'Necompletat')} · E-mail rezultat: {String(delivery?.email||profile.answers.email||'Necompletat')}</p>
 {delivery&&<p>Livrare e-mail: {statuses[delivery.status||'']||delivery.status}{delivery.providerMessageId?' · Referință Resend: '+delivery.providerMessageId:''}</p>}
 {report?.messages&&<details className="mt-2"><summary className="cursor-pointer font-semibold">Simularea comunicată pe WhatsApp</summary><p className="mt-2">Calcul orientativ. Vechimea pentru clasificarea comercială poate include suprapuneri; simularea presupune perioade fără suprapuneri și continuarea cotizării.</p>{report.messages.map((message,index)=><p key={index} className="my-2 whitespace-pre-wrap rounded border bg-white p-3">{message}</p>)}</details>}
 </div>;
}
