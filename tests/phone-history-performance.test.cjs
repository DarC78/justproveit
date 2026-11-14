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
 let resolveRead,onSent,replied=0;const api={getContactPhoneHistory:()=>new Promise(r=>resolveRead=r)};
 const composer={default:props=>{onSent=props.onSent;return React.createElement('textarea',{'aria-label':'WhatsApp message'});}};
 const timeline={exports:{}};new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:/(?:WhatsApp|Sms)ReplyComposer/.test(name)?{__esModule:true,...composer}:name==='@/lib/crmAdmin'?api:require(name),timeline,timeline.exports);
 const component={exports:{}};new Function('require','module','exports',compile('src/components/LeadPhoneHistory.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:name==='@/lib/crmAdmin'?api:name==='./PhoneHistoryModal'?timeline.exports:name==='./WhatsAppReplyComposer'?{__esModule:true,...composer}:require(name),component,component.exports);
 const events=[{kind:'whatsapp',id:'old',atUtc:'2026-11-01T10:00:00Z',direction:'inbound',author:'Client',messageType:'text',text:'Older message'},{kind:'whatsapp',id:'gateway:new',channel:'agents',atUtc:'2026-11-06T10:00:00Z',direction:'inbound',author:'Client',messageType:'text',text:'Newest message'}];
 const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(component.exports.default,{token:'agent',contactId:'contact',phone:'447700900001',name:'Test',onReplied:()=>replied++})));assert.ok(document.querySelector('textarea'));assert.equal(document.querySelector('ol'),null);
  await React.act(async()=>resolveRead({contactId:'contact',phone:'447700900001',events,whatsAppMessages:2,calls:0}));
  assert.deepEqual([...document.querySelectorAll('ol .body')].map(n=>n.textContent),['Newest message','Older message']);
  assert.deepEqual([...document.querySelectorAll('.event-heading strong')].map(n=>n.textContent),['WhatsApp Agenti - Client','WhatsApp Mediatel - Client']);
  assert.ok(document.querySelector('textarea').compareDocumentPosition(document.querySelector('ol'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.deepEqual(events.map(e=>e.id),['old','gateway:new']);
  await React.act(async()=>onSent({status:'failed'}));assert.equal(replied,0);
  await React.act(async()=>onSent({status:'processing'}));assert.equal(replied,0);
  await React.act(async()=>onSent({status:'accepted'}));assert.equal(replied,1);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('history Next requests the next backend page and replaces events without fetching separate email or Stripe lists',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const pages=[];const api={getContactPhoneHistory:async(_token,_id,_signal,_fresh,page)=>{pages.push(page);return {contactId:'contact',phone:'447700900001',page,pageSize:25,hasMore:page===0,events:[{kind:'whatsapp',id:'p'+page,atUtc:'2026-11-11T10:00Z',direction:'inbound',author:'Client',messageType:'text',text:'Backend page '+page}],calls:0,whatsAppMessages:1};},getCrmEmailHistory:()=>assert.fail('paged timeline must not load emails separately'),getCrmStripeHistory:()=>assert.fail('paged timeline must not load Stripe separately')};
 const composer={__esModule:true,default:()=>React.createElement('textarea')};
 const timeline={exports:{}};new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:/(?:WhatsApp|Sms)ReplyComposer/.test(name)?composer:name==='@/lib/crmAdmin'?api:require(name),timeline,timeline.exports);
 const component={exports:{}};new Function('require','module','exports',compile('src/components/LeadPhoneHistory.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:name==='@/lib/crmAdmin'?api:name==='./PhoneHistoryModal'?timeline.exports:name==='./WhatsAppReplyComposer'?composer:require(name),component,component.exports);
 const root=createRoot(document.getElementById('root'));try{
  await React.act(async()=>root.render(React.createElement(component.exports.default,{token:'agent',contactId:'contact',phone:'447700900001',name:'Lead'})));
  assert.ok(document.body.textContent.includes('Backend page 0'));
  await React.act(async()=>[...document.querySelectorAll('nav button')].find(b=>b.textContent==='Next').click());
  assert.deepEqual(pages,[0,1]);assert.ok(document.body.textContent.includes('Backend page 1'));assert.ok(!document.body.textContent.includes('Backend page 0'));
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('WhatsApp photos load with authenticated context, enlarge, retry and release object URLs',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;const revoked=[];let calls=0;
 URL.createObjectURL=()=> 'blob:photo';URL.revokeObjectURL=url=>revoked.push(url);
 const api={getPhoneHistoryImage:async(token,kind,id,messageId)=>{assert.deepEqual([token,kind,id,messageId],['agent','contact','contact-id','mcic:12']);calls++;if(calls===1)throw Error('unavailable');return new Blob(['image'],{type:'image/png'});}};
 const component={exports:{}};new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:/(?:WhatsApp|Sms)ReplyComposer/.test(name)?{__esModule:true,default:()=>null}:name==='@/lib/crmAdmin'?api:require(name),component,component.exports);
 const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(component.exports.WhatsAppHistoryImage,{target:{token:'agent',kind:'contact',id:'contact-id'},messageId:'mcic:12',name:'photo.png'})));
  assert.match(document.body.textContent,/WhatsApp/);assert.equal(document.querySelector('img'),null);
  await React.act(async()=>document.querySelector('button').click());assert.equal(document.querySelector('img').getAttribute('src'),'blob:photo');
  await React.act(async()=>document.querySelector('button').click());assert.ok(document.querySelector('dialog[open]'));
  await React.act(async()=>document.querySelector('dialog button').click());assert.equal(document.querySelector('dialog'),null);
 }finally{await React.act(async()=>root.unmount());URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close();delete global.window;delete global.document;}
 assert.deepEqual(revoked,['blob:photo']);
});
test('WhatsApp call timeline distinguishes the source and leaves agent and duration explicitly unknown',()=>{
 const component={exports:{}};new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:/(?:WhatsApp|Sms)ReplyComposer/.test(name)?{__esModule:true,default:()=>null}:name==='@/lib/crmAdmin'?{}:require(name),component,component.exports);
 const html=require('react-dom/server').renderToStaticMarkup(React.createElement(component.exports.PhoneHistoryTimeline,{events:[{kind:'call',id:'gateway-call:fixture',atUtc:'2026-11-11T01:00:00Z',endedAtUtc:null,agentId:null,agent:'Unknown — shared WhatsApp account',callCode:null,resolution:'Ringing',callType:'WhatsApp voice',queueId:null,durationSeconds:null,talkSeconds:null,source:'WhatsApp Agenti',direction:'outbound',phone:'+447700900001',coverage:'Observed gateway events only.'}]}));
 assert.match(html,/WhatsApp Agenti call/);assert.match(html,/Unknown — shared WhatsApp account/);assert.match(html,/Observed connected duration/);assert.match(html,/Unavailable/);assert.match(html,/Observed gateway events only/);assert.ok(!html.includes('<audio'));
});
