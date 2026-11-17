const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function load(api){
 const stub={__esModule:true,default:()=>null},timeline={exports:{}};
 new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(name=>name==='@/lib/crmAdmin'?api:name==='./MediatelMessageAttachment'||name==='./GatewayMessageMedia'||name.includes('ReplyComposer')?stub:require(name),timeline,timeline.exports);
 const component={exports:{}};
 new Function('require','module','exports',compile('src/components/LeadPhoneHistory.tsx'))(name=>name==='@/lib/crmAdmin'?api:name==='./PhoneHistoryModal'?timeline.exports:name.includes('ReplyComposer')?stub:require(name),component,component.exports);
 return component.exports.default;
}
test('expanded conversation shows CRM replies and WhatsApp-app sends together with incoming messages, pages and refreshes',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const calls=[];let resolveFirst;
 Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
 const props={token:'agent',contactId:'lead',phone:'447700900001',name:'Fixture',conversation:true,refreshKey:0,fallback:React.createElement('p',null,'Known incoming snapshot')};
 const events=[{kind:'whatsapp',id:'in',direction:'inbound',atUtc:'2030-01-10T10:00Z',text:'Client message'},
  {kind:'whatsapp',id:'gateway-outbound:crm',channel:'agents',direction:'outbound',atUtc:'2030-01-10T10:01Z',text:'Sent from CRM',status:'delivered'},
  {kind:'whatsapp',id:'gateway:app',channel:'agents',direction:'outbound',atUtc:'2030-01-10T10:02Z',text:'Sent from WhatsApp app',status:'sent'}];
 const response=(page=0)=>({contactId:'lead',phone:props.phone,events:page?[{...events[0],id:'older',text:'Older message'}]:events,whatsAppMessages:3,calls:0,page,pageSize:25,hasMore:page===0});
 const Component=load({getContactPhoneHistory:async(token,id,signal,fresh,page)=>{calls.push({token,id,fresh,page});if(calls.length===1)return new Promise(r=>resolveFirst=r);return response(page);}}),root=createRoot(document.getElementById('root'));
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{
  await React.act(async()=>root.render(React.createElement(Component,props)));assert.match(document.body.textContent,/Known incoming snapshot/);
  await React.act(async()=>resolveFirst(response()));
  assert.doesNotMatch(document.body.textContent,/Known incoming snapshot/);
  assert.deepEqual([...document.querySelectorAll('ol .body')].map(n=>n.textContent),['Sent from WhatsApp app','Sent from CRM','Client message']);
  assert.equal(document.querySelectorAll('li.outbound').length,2);assert.equal(document.querySelectorAll('li.inbound').length,1);assert.match(document.body.textContent,/delivered/);
  assert.deepEqual(calls[0],{token:'agent',id:'lead',fresh:true,page:0});
  await React.act(async()=>button('Next').click());assert.equal(calls.at(-1).page,1);assert.match(document.body.textContent,/Older message/);
  await React.act(async()=>root.render(React.createElement(Component,{...props,refreshKey:1})));assert.equal(calls.at(-1).fresh,true);
  const before=calls.length;await React.act(async()=>root.render(React.createElement(Component,{...props,refreshKey:2})));assert.equal(calls.length,before+1);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('failed conversation history retains the incoming snapshot and offers a retry',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const Component=load({getContactPhoneHistory:async()=>{throw Error('Source unavailable');}}),root=createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(Component,{token:'agent',contactId:'lead',phone:'447700900001',name:'Fixture',conversation:true,fallback:React.createElement('p',null,'Known incoming snapshot')})));
  assert.match(document.body.textContent,/Known incoming snapshot/);assert.match(document.querySelector('[role="alert"]').textContent,/Source unavailable/);
  assert.ok([...document.querySelectorAll('button')].some(b=>b.textContent==='Refresh history'&&!b.disabled));
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
