const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=path=>ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('handled snapshots disable repeat handling, and a later incoming event re-enables it',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const mod={exports:{}};let calls=0;new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl:async()=>{calls++;return{success:true};}}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));let row={contactId:'lead',pipelineVersion:0,pipelineStatus:'clients',lastInboundAtUtc:'2030-01-14T10:00Z'},eventHandled=false;
 const render=()=>root.render(React.createElement(mod.exports.default,{token:'agent',row,eventHandled,onChanged:()=>{}})),button=()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Mark event as handled');
 try{
  await React.act(async()=>render());await React.act(async()=>button().click());assert.equal(calls,1);assert.equal(button().disabled,true);await React.act(async()=>button().click());assert.equal(calls,1);
  row={...row,pipelineVersion:1,manualStage:{stage:'ToAdrian',assignmentId:'new-assignment'}};await React.act(async()=>render());assert.equal(button().disabled,false,'A new manual stage assignment needs its own acknowledgement');
  row={...row,pipelineVersion:2,lastInboundAtUtc:'2030-01-14T11:00Z'};await React.act(async()=>render());assert.equal(button().disabled,false);
  eventHandled=true;await React.act(async()=>render());assert.equal(button().disabled,true);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('mark handled retries the same request and snapshot; any stage can be assigned or returned to Automatic',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const calls=[],changes=[],mod={exports:{}};let failures=1;
 const savePipelineControl=async(_token,contactId,input)=>{calls.push({contactId,input});if(failures-->0)throw Error('Retry same request');return {success:true};};
 new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));let row={contactId:'lead',pipelineStatus:'newLead',pipelineVersion:0,priority:0,lastInboundAtUtc:'2026-11-11T10:00:00Z',manualStage:null};
 const render=()=>root.render(React.createElement(mod.exports.default,{token:'token',row,onChanged:message=>changes.push(message)}));const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
 try{
  await React.act(async()=>render());await React.act(async()=>button('Mark event as handled').click());assert.match(document.body.textContent,/Retry same request/);
  row={...row,lastInboundAtUtc:'2026-11-11T10:01:00Z'};await React.act(async()=>render());await React.act(async()=>button('Mark event as handled').click());
  assert.equal(calls[0].input.requestId,calls[1].input.requestId);assert.equal(calls[1].input.inboundThroughAtUtc,'2026-11-11T10:00:00Z');assert.equal(calls[1].input.action,'handle');assert.match(changes[0],/Bookings and stage are preserved/);
  row={...row,pipelineVersion:1,priority:undefined};await React.act(async()=>render());assert.ok(button('Mark event as handled'));
  await React.act(async()=>{const select=document.querySelector('select');select.value='clients';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>button('Assign stage').click());assert.equal(calls.at(-1).input.stage,'clients');assert.equal(calls.at(-1).input.expectedVersion,1);assert.match(changes.at(-1),/clients/);
  row={...row,pipelineVersion:2,manualStage:{stage:'ToAdrian',actor:'Agent'}};await React.act(async()=>render());assert.equal(button('Assign stage').disabled,false); // explicit reassign can re-pin P0
  await React.act(async()=>{const select=document.querySelector('select');select.value='';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>button('Assign stage').click());assert.equal(calls.at(-1).input.stage,null);assert.match(changes.at(-1),/Automatic/);
  await React.act(async()=>button('End Lead').click());assert.equal(document.querySelector('select[aria-label="Resolution for ending lead"]').required,true);assert.equal(button('Confirm End Lead').disabled,true);
  await React.act(async()=>button('Cancel').click());assert.equal(document.querySelector('select[aria-label="Resolution for ending lead"]'),null);
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
test('InboundContacts can handle ended and non-P0 leads without reopening or editing their stage',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;const calls=[],notices=[],mod={exports:{}};
 new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl:async(token,id,input)=>{calls.push({token,id,input});}}:require(name),mod,mod.exports);const root=createRoot(document.getElementById('root'));
 const ended={pipelineStatus:'SimulationDone',reason:'Closed by agent',actor:'Fixture',atUtc:'2026-11-10T10:00Z'};
 try{for(const row of [{contactId:'closed',pipelineStatus:'SimulationDone',ended,pipelineVersion:4,priority:undefined,lastInboundAtUtc:'2026-11-14T10:00:00Z'},{contactId:'outside',pipelineStatus:'Outside current pipeline',pipelineVersion:0,priority:2,lastInboundAtUtc:'2026-11-14T11:00:00Z'}]){
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token',row,allowHandleForAllLeads:true,onChanged:m=>notices.push(m)})));const handle=[...document.querySelectorAll('button')].find(b=>b.textContent==='Mark event as handled');assert.ok(handle);assert.equal(handle.disabled,false);await React.act(async()=>handle.click());assert.equal(calls.at(-1).input.action,'handle');assert.equal(calls.at(-1).input.inboundThroughAtUtc,row.lastInboundAtUtc);assert.equal(calls.at(-1).input.expectedVersion,row.pipelineVersion);
  if(row.ended){assert.match(document.body.textContent,/Closed by agent/);assert.ok([...document.querySelectorAll('button')].some(b=>b.textContent==='Reopen Lead'));assert.equal(document.querySelector('select'),null);}
 }assert.equal(calls.length,2);assert.ok(calls.every(c=>c.input.action==='handle'));assert.match(notices[0],/closed leads remain closed/);
 }finally{await React.act(async()=>root.unmount());dom.window.close();delete global.window;delete global.document;}
});

test('ToInvestigate modal saves only an explicit flag with text and can cancel without saving',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLElement.prototype.attachEvent=function(name,fn){this.addEventListener(name.replace(/^on/,''),fn);};dom.window.HTMLElement.prototype.detachEvent=function(name,fn){this.removeEventListener(name.replace(/^on/,''),fn);};
 const calls=[],mod={exports:{}};new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl:async(t,id,body)=>{calls.push(body);return{success:true};}}:require(name),mod,mod.exports);const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token',row:{contactId:'lead',pipelineVersion:7,pipelineStatus:'ToAdrian'},onChanged:()=>{}})));
 const open=()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='ToInvestigate').click();await React.act(async()=>open());assert.deepEqual([...document.querySelector('dialog').querySelectorAll('button')].map(b=>b.textContent),['ToInvestigate','Cancel']);await React.act(async()=>[...document.querySelector('dialog').querySelectorAll('button')].find(b=>b.textContent==='Cancel').click());assert.equal(calls.length,0);
 await React.act(async()=>open());await React.act(async()=>{const input=document.querySelector('dialog textarea');Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(input,'Check identity');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));const event=new dom.window.Event('propertychange',{bubbles:true});Object.defineProperty(event,'propertyName',{value:'value'});input.dispatchEvent(event);});
 const confirm=document.querySelector('dialog button[type=submit]');assert.equal(confirm.disabled,false);await React.act(async()=>document.querySelector('dialog form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls[0].action,'investigate');assert.equal(calls[0].expectedVersion,7);assert.equal(calls[0].text,'Check identity');
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('End Lead requires one of the five configured resolutions and retries the same selected value',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const calls=[],mod={exports:{}};let failOnce=true;
 new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl:async(token,id,input)=>{calls.push(input);if(failOnce){failOnce=false;throw Error('Try again');}}}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root')),button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token',row:{contactId:'lead',pipelineVersion:2,pipelineStatus:'ToAdrian'},onChanged:()=>{}})));
  const values=['2ANI_PLUS_PANA_LA_PENSIE','A_DEMARAT_SINGUR','NO_QUALIFY','NU_MAI_RASPUNDE','DO_NOT_CONTACT_AGAIN'];
  for(const value of values){
   await React.act(async()=>button('End Lead').click());const select=document.querySelector('select[aria-label="Resolution for ending lead"]');
   assert.deepEqual([...select.options].map(o=>o.value),['',...values]);assert.equal(select.value,'');assert.equal(button('Confirm End Lead').disabled,true);assert.equal(document.querySelector('textarea'),null);
   await React.act(async()=>{select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.equal(button('Confirm End Lead').disabled,false);
   await React.act(async()=>button('Confirm End Lead').click());
   if(document.querySelector('[role=alert]')){const first=calls.at(-1);await React.act(async()=>button('Confirm End Lead').click());assert.deepEqual(calls.at(-1),first);}
   assert.equal(calls.at(-1).action,'end');assert.equal(calls.at(-1).reason,value);assert.equal(calls.at(-1).pipelineStatus,'ToAdrian');assert.equal(calls.at(-1).expectedVersion,2);
   assert.equal(document.querySelector('select[aria-label="Resolution for ending lead"]'),null);
  }
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('End Lead explains all-number removal and reports queued versus confirmed dialler status',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;let status='queued',message='';const mod={exports:{}};
 new Function('require','module','exports',compile('src/components/PipelineLeadControls.tsx'))(name=>name==='@/lib/leadPipelineControls'?{savePipelineControl:async()=>({success:true,diallerRemoval:{status}})}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root')),button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token',row:{contactId:'lead',pipelineVersion:0,pipelineStatus:'newLead'},onChanged:m=>{message=m;}})));
 for(const next of ['queued','removed']){status=next;await React.act(async()=>button('End Lead').click());assert.match(document.body.textContent,/all its contact phone numbers from every dialler campaign/);const select=document.querySelector('select[aria-label="Resolution for ending lead"]');await React.act(async()=>{select.value='DO_NOT_CONTACT_AGAIN';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>button('Confirm End Lead').click());assert.match(message,next==='queued'?/removal.*queued/i:/were removed/i);}
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
