import {useState} from "react";
import {CustomersSection} from "./AllCustomersView";
import PensionQualificationProfiles from './PensionQualificationProfiles';
export default function AllLeadsView({token}:{token:string}) {
 const [revision,setRevision]=useState(0);
 const changed=()=>setRevision(n=>n+1);
 return <section><h1 className="text-3xl font-bold mt-7">All Leads</h1><p className="mt-2 text-sm text-slate-600">CRM lead search ? All times are UK time</p>
  <PensionQualificationProfiles token={token}/>
  <CustomersSection token={token} kind="leads" scope="all" refreshKey={revision} onChanged={changed} title="All Leads" description="All CRM leads, including leads without bookings or inbound contact. Search by name, phone or email. Five leads per page, each followed by their WhatsApp and call history."/>
 </section>;
}
