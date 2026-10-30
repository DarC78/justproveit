import {useState} from "react";
import {CustomersSection} from "./AllCustomersView";
export default function AllLeadsView({token}:{token:string}) {
 const [revision,setRevision]=useState(0);
 const changed=()=>setRevision(n=>n+1);
 return <section><h1 className="text-3xl font-bold mt-7">All Leads</h1><p className="mt-2 text-sm text-slate-600">Lead records and inbound contact · All times are UK time</p>
  <CustomersSection token={token} kind="leads" scope="inbound" refreshKey={revision} onChanged={changed} title="Leads who contacted us" description="Leads with at least one received email, WhatsApp message or inbound call."/>
  <CustomersSection token={token} kind="leads" scope="all" refreshKey={revision} onChanged={changed} title="All Leads" description="All CRM leads, including leads without bookings or inbound contact. 50 leads per page."/>
 </section>;
}
