import {useState} from "react";
import {useRouter} from "next/router";
import {CustomersSection} from "./AllCustomersView";
export default function AllLeadsView({token}:{token:string}) {
 const router=useRouter();
 const value=(key:string)=>{const raw=router.query[key];return String(Array.isArray(raw)?raw[0]:raw||"").trim();};
 const phone=value("phone")||value("phoneNumber")||value("telefon"),email=value("email"),name=value("name")||value("nume");
 const defaultFilters={phone,email:phone?"":email,name:phone||email?"":name};
 const [revision,setRevision]=useState(0);
 const changed=()=>setRevision(n=>n+1);
 return <section><h1 className="text-3xl font-bold mt-7">All Leads</h1><p className="mt-2 text-sm text-slate-600">CRM lead search ? All times are UK time</p>
  {router.isReady&&<CustomersSection key={JSON.stringify(defaultFilters)} defaultFilters={defaultFilters} token={token} kind="leads" scope="all" refreshKey={revision} onChanged={changed} title="All Leads" description="All CRM leads, including leads without bookings or inbound contact. Search by name, phone or email. Five leads per page, each followed by their WhatsApp and call history."/>}
 </section>;
}
