const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=path=>ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const tabsModule={exports:{}};new Function('require','module','exports',compile('src/lib/crmTabs.ts'))(require,tabsModule,tabsModule.exports);const tabs=tabsModule.exports;
test('primary navigation has the requested order and legacy/contact links resolve safely',()=>{
 assert.deepEqual(tabs.PRIMARY_CRM_TABS.map(t=>t.label),['Lead Pipeline','All Leads CRM','Lead Nou','All Messages','Agent Report']);
 assert.equal(tabs.resolveCrmTab(null),'leadPipeline');assert.equal(tabs.resolveCrmTab(null,{hasContactQuery:true}),'details');assert.equal(tabs.resolveCrmTab('AllWhatsAppMessages'),'allMessages');assert.equal(tabs.resolveCrmTab('inboundSms'),'inboundSms');assert.equal(tabs.resolveCrmTab('bogus'),'leadPipeline');assert.equal(tabs.resolveCrmTab('whatsappGateway'),'leadPipeline');assert.equal(tabs.resolveCrmTab('whatsappGateway',{gatewayEnabled:true}),'whatsappGateway');
 const all=[...tabs.PRIMARY_CRM_TABS,...tabs.otherCrmTabs(true,true)];assert.equal(new Set(all.map(t=>t.key)).size,all.length);for(const key of ['details','scheduledCalls','attention','allCustomersView','sales','intents','inboundSms','whatsappStats','manual','missed','highLevelFunnels'])assert.ok(tabs.otherCrmTabs().some(t=>t.key===key));assert.equal(tabs.otherCrmTabs(false,false).some(t=>t.key==='privatePensions'||t.key==='whatsappGateway'),false);
});
test('Other expands remaining tabs, remembers selection, collapses, and preserves hidden details button navigation',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const mod={exports:{}};new Function('require','module','exports',compile('src/components/CrmTabNavigation.tsx'))(name=>name==='@/lib/crmTabs'?tabs:require(name),mod,mod.exports);const ref=React.createRef(),changed=[];
 function Wrapper(){const [active,setActive]=React.useState('leadPipeline');return React.createElement(mod.exports.default,{activeTab:active,onChange:tab=>{changed.push(tab);setActive(tab);},canUsePrivatePensions:false,detailsButtonRef:ref});}
 const root=createRoot(document.getElementById('root')),other=()=>document.querySelector('[aria-controls="crm-other-tabs"]'),panel=()=>document.getElementById('crm-other-tabs');
 try{await React.act(async()=>root.render(React.createElement(Wrapper)));assert.deepEqual([...document.querySelectorAll('.primary-tabs button')].map(b=>b.textContent),['Lead Pipeline','All Leads CRM','Lead Nou','All Messages','Agent Report','Other']);assert.equal(panel().hidden,true);assert.ok(ref.current);assert.equal(document.body.textContent.includes('Livrare Pensii Private'),false);
 await React.act(async()=>other().click());assert.equal(panel().hidden,false);assert.equal(other().getAttribute('aria-expanded'),'true');
 await React.act(async()=>ref.current.click());assert.equal(changed.at(-1),'details');assert.equal(panel().hidden,false);assert.ok(other().classList.contains('active'));
 await React.act(async()=>other().click());assert.equal(panel().hidden,true);
 await React.act(async()=>ref.current.click());assert.equal(panel().hidden,false);
 await React.act(async()=>[...document.querySelectorAll('.primary-tabs button')].find(b=>b.textContent==='Lead Pipeline').click());assert.equal(panel().hidden,true);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
