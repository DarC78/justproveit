import {useState,type Ref} from 'react';
import {PRIMARY_CRM_TABS,otherCrmTabs,type CrmTabKey} from '@/lib/crmTabs';
export default function CrmTabNavigation({activeTab,onChange,canUsePrivatePensions,detailsButtonRef}:{activeTab:CrmTabKey;onChange:(tab:CrmTabKey)=>void;canUsePrivatePensions:boolean;detailsButtonRef:Ref<HTMLButtonElement>}){
 const other=otherCrmTabs(process.env.NEXT_PUBLIC_WHATSAPP_GATEWAY_CRM==='true',canUsePrivatePensions);
 const isOther=other.some(t=>t.key===activeTab);
 const [menu,setMenu]=useState<{tab:CrmTabKey;open:boolean}|null>(null);
 const open=menu?.tab===activeTab?menu.open:isOther;
 const select=(tab:CrmTabKey)=>{setMenu({tab,open:other.some(t=>t.key===tab)});onChange(tab);};
 return <nav className="crm-tab-navigation" aria-label="CRM sections">
  <div className="primary-tabs">{PRIMARY_CRM_TABS.map(tab=><button key={tab.key} type="button" className={activeTab===tab.key?'nav-button active':'nav-button'} aria-current={activeTab===tab.key?'page':undefined} onClick={()=>select(tab.key)}>{tab.label}</button>)}
   <button type="button" className={isOther?'nav-button other-button active':'nav-button other-button'} aria-expanded={open} aria-controls="crm-other-tabs" onClick={()=>setMenu({tab:activeTab,open:!open})}>Other<svg viewBox="0 0 20 20" aria-hidden="true" style={{transform:open?'rotate(180deg)':undefined}}><path d="m6 8 4 4 4-4"/></svg></button>
  </div>
  <div id="crm-other-tabs" className="other-tabs" role="group" aria-label="Other CRM sections" hidden={!open}>{other.map(tab=><button key={tab.key} ref={tab.key==='details'?detailsButtonRef:undefined} type="button" className={activeTab===tab.key?'nav-button active':'nav-button'} aria-current={activeTab===tab.key?'page':undefined} onClick={()=>select(tab.key)}>{tab.label}</button>)}</div>
  <style jsx>{`
   .crm-tab-navigation{box-sizing:border-box;width:min(1600px,calc(100vw - 48px));margin:20px auto 0;padding:22px 26px;border-radius:14px 14px 0 0;background:#0c389d;box-shadow:0 6px 16px #0003}
   .primary-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.nav-button{min-height:40px;box-sizing:border-box;padding:8px 12px;border:1px solid transparent;border-radius:6px;background:#ff4b26;color:white;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:background-color .15s,box-shadow .15s}.nav-button:hover{background:#e53d1c}.nav-button.active{background:#fff;color:#d53715;border-color:#ff4b26}.nav-button:focus-visible{outline:3px solid #bfdbfe;outline-offset:3px}
   .other-button{display:flex;align-items:center;justify-content:center;gap:7px}.other-button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .15s}.other-tabs{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px;padding-top:18px;border-top:1px solid #ffffff40}.other-tabs[hidden]{display:none}.other-tabs .nav-button{background:#ffffff17;border-color:#ffffff50}.other-tabs .nav-button:hover{background:#ffffff30}.other-tabs .nav-button.active{background:#fff;color:#d53715;border-color:#ff4b26}
   @media(max-width:1000px){.primary-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:600px){.crm-tab-navigation{width:calc(100vw - 20px);padding:16px 12px}.primary-tabs{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.other-tabs .nav-button{flex:1 1 140px}}
  `}</style>
 </nav>;
}
