const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=path=>ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('mark handled retries the same request and snapshot; any stage can be assigned or returned to Automatic',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const calls=[],changes=[],mod={exports:{}};let failures=1;
 const savePipelineControl=async(_token,contactId,input)=>{calls.push({contactId,input});if(failures-->0)throw Error('Retry same request');return {success:true};};
 new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));let row={contactId:'lead',pipelineVersion:0,priority:0,lastInboundAtUtc:'2026-11-11T10:00:00Z',manualStage:null};
 const render=()=>root.render(React.createElement(mod.exports.default,{token:'token',row,onChanged:message=>changes.push(message)}));const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
 try{
  await React.act(async()=>render());await React.act(async()=>button('Mark event as handled').click());assert.match(document.body.textContent,/Retry same request/);
  row={...row,lastInboundAtUtc:'2026-11-11T10:01:00Z'};await React.act(async()=>render());await React.act(async()=>button('Mark event as handled').click());
  assert.equal(calls[0].input.requestId,calls[1].input.requestId);assert.equal(calls[1].input.inboundThroughAtUtc,'2026-11-11T10:00:00Z');assert.equal(calls[1].input.action,'handle');assert.match(changes[0],/Bookings and stage are preserved/);
  row={...row,pipelineVersion:1,priority:undefined};await React.act(async()=>render());assert.equal(button('Mark event as handled'),undefined);
  await React.act(async()=>{const select=document.querySelector('select');select.value='ToAdrian';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>button('Assign stage').click());assert.equal(calls.at(-1).input.stage,'ToAdrian');assert.equal(calls.at(-1).input.expectedVersion,1);assert.match(changes.at(-1),/ToAdrian/);
  row={...row,pipelineVersion:2,manualStage:{stage:'ToAdrian',actor:'Agent'}};await React.act(async()=>render());assert.equal(button('Assign stage').disabled,false); // explicit reassign can re-pin P0
  await React.act(async()=>{const select=document.querySelector('select');select.value='';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>button('Assign stage').click());assert.equal(calls.at(-1).input.stage,null);assert.match(changes.at(-1),/Automatic/);
  await React.act(async()=>button('End Lead').click());assert.equal(document.querySelector('textarea').required,true);assert.equal(button('Confirm End Lead').disabled,true);
  await React.act(async()=>button('Cancel').click());assert.equal(document.querySelector('textarea'),null);
  row={...row,pipelineVersion:3,pipelineStatus:'ToAdrian',ended:{pipelineStatus:'ToAdrian',reason:'Not interested',actor:'Agent',atUtc:'2026-11-11T10:00Z'}};await React.act(async()=>render());
  assert.match(document.body.textContent,/Not interested/);assert.equal(button('End Lead'),undefined);assert.equal(document.querySelector('select'),null);
  await React.act(async()=>button('Reopen Lead').click());assert.equal(calls.at(-1).input.action,'reopen');assert.equal(calls.at(-1).input.expectedVersion,3);assert.match(changes.at(-1),/reopened/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();delete global.window;delete global.document;}
});
test('pipeline writes use authenticated POST and validate returned identity, stage and acknowledgement',async()=>{
 const old=global.fetch,calls=[],mod={exports:{}};let reply;
 new Function('require','module','exports',compile('src/lib/leadPipelineControls.ts'))(name=>name==='./auth'?{API_BASE_URL:'https://api.test/api'}:require(name),mod,mod.exports);
 global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>reply};};
 try{const body={action:'stage',stage:'ToAdrian',requestId:'request',expectedVersion:0};reply={success:true,action:'stage',contactId:'lead',pipelineVersion:1,manualStage:{stage:'ToAdrian'}};await mod.exports.savePipelineControl('token','lead',body);
  assert.equal(calls[0].url,'https://api.test/api/justproveit/admin/crm/contacts/lead/pipeline-control');assert.equal(calls[0].options.method,'POST');assert.equal(calls[0].options.headers.Authorization,'Bearer token');assert.deepEqual(JSON.parse(calls[0].options.body),body);
  reply={...reply,manualStage:{stage:'AgreedToBuy'}};await assert.rejects(mod.exports.savePipelineControl('token','lead',body),/could not be verified/);
  reply={success:true,action:'handle',contactId:'lead',pipelineVersion:2};await assert.rejects(mod.exports.savePipelineControl('token','lead',{action:'handle',expectedVersion:1,requestId:'handle',inboundThroughAtUtc:null}),/could not be verified/);
  const end={action:'end',expectedVersion:2,requestId:'end',pipelineStatus:'SimulationDone',reason:'Not interested'};
  reply={success:true,action:'end',contactId:'lead',pipelineVersion:3,ended:{pipelineStatus:'SimulationDone',reason:'Not interested'}};await mod.exports.savePipelineControl('token','lead',end);
  reply.ended.pipelineStatus='newLead';await assert.rejects(mod.exports.savePipelineControl('token','lead',end),/could not be verified/);
 }finally{global.fetch=old;}
});
