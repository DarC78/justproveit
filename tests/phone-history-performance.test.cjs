const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');const {createRoot}=require('react-dom/client');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function cache(){const exports={};let now=0;vm.runInNewContext(compile('src/lib/phoneHistoryCache.ts'),{exports,Date:{now:()=>now},Map,Promise});return {...exports,advance:()=>now+=16000};}
test('preloaded reads coalesce, expire and remain isolated by login and CRM target',async()=>{
 const c=cache();let calls=0,finish;const load=()=>{calls++;return new Promise(r=>finish=r);};
 const a=c.readPhoneHistoryCached('agent','contact:a',load),b=c.readPhoneHistoryCached('agent','contact:a',load);assert.equal(calls,1);finish({events:['one']});await Promise.all([a,b]);
 assert.equal((await c.readPhoneHistoryCached('agent','contact:a',()=>assert.fail())).events[0],'one');
 await c.readPhoneHistoryCached('other-agent','contact:a',async()=>{calls++;return {};});assert.equal(calls,2);
 await c.readPhoneHistoryCached('agent','booking:a',async()=>{calls++;return {};});assert.equal(calls,3);
 c.advance();await c.readPhoneHistoryCached('agent','contact:a',async()=>{calls++;return {};});assert.equal(calls,4);
});
test('a forced post-send refresh replaces old work and failures are never cached',async()=>{
 const c=cache();let finishOld;
 const old=c.readPhoneHistoryCached('agent','contact:a',()=>new Promise(r=>finishOld=r));
 await c.readPhoneHistoryCached('agent','contact:a',async()=>({fresh:true}),true);finishOld({fresh:false});await old;
 assert.equal((await c.readPhoneHistoryCached('agent','contact:a',()=>assert.fail())).fresh,true);
 await assert.rejects(c.readPhoneHistoryCached('agent','contact:b',async()=>{throw Error('read failed');}));
 assert.equal(await c.readPhoneHistoryCached('agent','contact:b',async()=> 'retry succeeds'),'retry succeeds');
});
test('background warmup is limited to two readers and stops new work on navigation',async()=>{
 const c=cache(),controller=new AbortController();let started=0,active=0,max=0;const finish=[];
 const task=async()=>{started++;max=Math.max(max,++active);await new Promise(r=>finish.push(r));active--;};
 const work=c.warmPhoneHistories([task,task,task,task],controller.signal);assert.equal(started,2);controller.abort();finish.forEach(r=>r());await work;assert.equal(started,2);assert.equal(max,2);
});
test('composer is visible before the history loads and the timeline is newest first',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let resolveRead;const api={getContactPhoneHistory:()=>new Promise(r=>resolveRead=r)};
 const composer={default:()=>React.createElement('textarea',{'aria-label':'WhatsApp message'})};
 const timeline={exports:{}};new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name.includes('WhatsAppReplyComposer')?{__esModule:true,...composer}:name==='@/lib/crmAdmin'?api:require(name),timeline,timeline.exports);
 const component={exports:{}};new Function('require','module','exports',compile('src/components/LeadPhoneHistory.tsx'))(name=>name==='@/lib/crmAdmin'?api:name==='./PhoneHistoryModal'?timeline.exports:name==='./WhatsAppReplyComposer'?{__esModule:true,...composer}:require(name),component,component.exports);
 const events=[{kind:'whatsapp',id:'old',atUtc:'2026-11-01T10:00:00Z',direction:'inbound',author:'Client',messageType:'text',text:'Older message'},{kind:'whatsapp',id:'new',atUtc:'2026-11-06T10:00:00Z',direction:'inbound',author:'Client',messageType:'text',text:'Newest message'}];
 const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(component.exports.default,{token:'agent',contactId:'contact',phone:'447700900001',name:'Test'})));assert.ok(document.querySelector('textarea'));assert.equal(document.querySelector('ol'),null);
  await React.act(async()=>resolveRead({contactId:'contact',phone:'447700900001',events,whatsAppMessages:2,calls:0}));
  assert.deepEqual([...document.querySelectorAll('ol .body')].map(n=>n.textContent),['Newest message','Older message']);
  assert.ok(document.querySelector('textarea').compareDocumentPosition(document.querySelector('ol'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.deepEqual(events.map(e=>e.id),['old','new']);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
