const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=path=>ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const base={id:'event1',contactId:'lead',messageKey:'a'.repeat(64),name:'Fixture Lead',phone:'447700900001',email:'a@example.invalid',atUtc:'2026-11-12T10:00Z',message:'<script>unsafe</script>',messageType:'text',source:'WhatsApp Mediatel',pipelineStatus:'SimulationDone',pipelineVersion:2,manualStage:null,done:null};
function load(overrides){const mod={exports:{}};new Function('require','module','exports',compile('src/components/AllWhatsAppMessagesPanel.tsx'))(name=>name==='@/lib/allWhatsAppMessages'?overrides:name==='@/lib/leadNotes'?{useLeadNoteSummaries:()=>({summaries:{},refresh(){},error:''})}:name==='./LeadPipelineRowActions'?{default:props=>React.createElement('button',{'data-contact':props.row.contactId,'data-allow-handle':String(props.allowHandleForAllLeads),onClick:()=>props.onChanged('Action saved')},'Shared Lead Pipeline actions')}:name==='./MediatelMessageAttachment'?{default:()=>null}:name==='./GatewayMessageMedia'?{default:()=>null}:name==='./SmsReplyComposer'?{default:props=>React.createElement('button',{'data-phone':props.phone},'Reply via SMS')}:name==='./LeadPhoneHistory'?{default:props=>props.conversation?React.createElement('section',{'data-conversation-contact':props.contactId,'data-refresh':props.refreshKey},props.fallback):React.createElement('p',null,'History')}:require(name),mod,mod.exports);return mod.exports;}
async function setup(){const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;return {dom,root:createRoot(document.getElementById('root'))};}
test('default inbox excludes handled rows after an action while show-all retrieves them',async()=>{
 const {dom,root}=await setup(),calls=[];let handled=false;
 const Panel=load({getAllWhatsAppMessages:async(_token,filters)=>{calls.push(filters);const rows=handled&&!filters.showAll&&filters.completion==='pending'?[]:[{...base,done:handled?{atUtc:'2030-01-14T12:00Z'}:null}];return{rows,total:rows.length,offset:0,limit:50,asOfUtc:'2030-01-14T12:00Z',warnings:[]};}}).default;
 try{
  await React.act(async()=>root.render(React.createElement(Panel,{token:'agent'})));assert.equal(calls[0].completion,'pending');assert.equal(document.querySelector('[aria-label="Event completion"]').value,'pending');
  await React.act(async()=>document.querySelector('.row-toggle').click());handled=true;
  await React.act(async()=>document.querySelector('button[data-contact]').click());assert.equal(document.querySelector('.row-toggle'),null);
  await React.act(async()=>document.querySelector('[aria-label="show all conversations"]').click());assert.ok(document.querySelector('.row-toggle'));
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Clear').click());assert.equal(calls.at(-1).completion,'pending');assert.equal(document.querySelector('.row-toggle'),null);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('show all conversations applies immediately, marks replied-last rows dark green and preserves paging/filter reset',async()=>{
 const {dom,root}=await setup(),calls=[],replied={...base,id:'replied',name:'Replied lead',done:{atUtc:'2026-11-12T11:00Z'},category:'green',lastReplyAtUtc:'2026-11-12T11:00Z',lastActivityAtUtc:'2026-11-12T11:00Z',latestIsConfirmedReply:true};
 const Panel=load({getAllWhatsAppMessages:async(_token,filters)=>{calls.push(filters);return {rows:filters.showAll?[replied,base]:[base],total:51,offset:filters.offset,limit:50,asOfUtc:'2026-11-12T11:00Z',warnings:[]};}}).default;
 const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try{
  await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));
  assert.equal(document.querySelector('[aria-label="show all conversations"]').checked,false);assert.equal(document.querySelector('[data-replied="true"]'),null);
  await React.act(async()=>document.querySelector('[aria-label="show all conversations"]').click());
  assert.equal(calls.at(-1).showAll,true);assert.equal(calls.at(-1).offset,0);assert.equal(document.querySelector('[aria-label="Show Category"]').disabled,true);assert.equal(document.querySelector('[aria-label="Event completion"]').disabled,true);
  const row=document.querySelector('[data-replied="true"]');assert.equal(row.style.background,'rgb(22, 101, 52)');assert.equal(row.style.color,'rgb(255, 255, 255)');assert.match(row.textContent,/Our latest confirmed reply/);assert.match(row.querySelector('time').textContent,/11:00/);
  await React.act(async()=>button('Next').click());assert.equal(calls.at(-1).showAll,true);assert.equal(calls.at(-1).offset,50);
  await React.act(async()=>button('Clear').click());assert.equal(calls.at(-1).showAll,false);assert.equal(document.querySelector('[aria-label="show all conversations"]').checked,false);assert.equal(document.querySelector('[aria-label="Event completion"]').disabled,false);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('incoming messages tab renders required columns, text safely, filters and paginates 50 events',async()=>{
 const {dom,root}=await setup(),calls=[],api={getAllWhatsAppMessages:async(_token,filters)=>{calls.push(filters);return {rows:[base],total:51,offset:filters.offset,limit:50,asOfUtc:'2026-11-12T11:00Z',warnings:[]};}},Panel=load(api).default;
 try{await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));for(const heading of ['Date','CRM Lead','Phone','Email','Message','LeadStatus','Agent','Actions'])assert.ok([...document.querySelectorAll('th')].some(th=>th.textContent===heading));assert.equal(document.querySelector('script'),null);assert.ok(document.body.textContent.includes('<script>unsafe</script>'));assert.equal(calls[0].completion,'pending');
 await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Next').click());assert.equal(calls.at(-1).offset,50);
 await React.act(async()=>{const select=document.querySelector('[aria-label="Event completion"]');select.value='pending';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});await React.act(async()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(calls.at(-1).completion,'pending');assert.equal(calls.at(-1).offset,0);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('InboundContacts is routed to the combined message panel',()=>{const source=fs.readFileSync('src/pages/admin/crm.tsx','utf8');assert.match(source,/activeTab === "InboundContacts".*AllWhatsAppMessagesPanel/);assert.match(fs.readFileSync('src/lib/allWhatsAppMessages.ts','utf8'),/crm\/all-messages/);});
test('InboundContacts enables handling for a closed, non-P0 row',async()=>{
 const {dom,root}=await setup(),Panel=load({getAllWhatsAppMessages:async()=>({rows:[{...base,priority:2,ended:{reason:'Closed',pipelineStatus:'SimulationDone',actor:'Fixture',atUtc:'2026-11-12T09:00Z'}}],total:1,offset:0,limit:50,asOfUtc:'2026-11-12T11:00Z',warnings:[]})}).default;
 try{await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));await React.act(async()=>document.querySelector('.row-toggle').click());assert.equal(document.querySelector('button[data-contact="lead"]').dataset.allowHandle,'true');}finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('conversations default to one-line summaries, expand independently, retain expansion on refresh and reset on page changes',async()=>{
 const {dom,root}=await setup();let calls=0;
 const second={...base,id:'event2',contactId:'lead2',name:'Second Lead'},Panel=load({getAllWhatsAppMessages:async(_token,filters)=>{calls++;return {rows:[base,second],total:51,offset:filters.offset,limit:50,asOfUtc:'2026-11-12T11:00Z',warnings:[]};}}).default;
 const button=label=>[...document.querySelectorAll('button')].find(b=>b.textContent===label);
 try{
  await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));
  assert.equal(document.querySelectorAll('.collapsed-row').length,2);assert.equal(document.querySelectorAll('article').length,0);assert.equal(document.querySelectorAll('button[data-contact]').length,0);
  assert.equal(document.querySelector('.row-toggle').getAttribute('aria-expanded'),'false');assert.match(document.querySelector('.message-preview').textContent,/unsafe/);
  await React.act(async()=>document.querySelectorAll('.row-toggle')[0].click());
  assert.equal(document.querySelectorAll('.expanded-row').length,1);assert.equal(document.querySelectorAll('article').length,1);assert.equal(document.querySelector('button[data-contact]').dataset.contact,'lead');assert.equal(document.querySelector('[data-conversation-contact]').dataset.conversationContact,'lead');
  assert.equal(document.querySelector('.row-toggle').getAttribute('aria-expanded'),'true');
  await React.act(async()=>button('Fixture Lead').click());assert.match(document.body.textContent,/History/);
  await React.act(async()=>document.querySelectorAll('.row-toggle')[1].click());assert.equal(document.querySelectorAll('.expanded-row').length,2);
  await React.act(async()=>button('Refresh').click());assert.equal(calls,2);assert.equal(document.querySelectorAll('.expanded-row').length,2);assert.match(document.body.textContent,/History/);
  await React.act(async()=>document.querySelectorAll('.row-toggle')[0].click());assert.equal(document.querySelectorAll('.expanded-row').length,1);assert.equal(document.querySelector('button[data-contact]').dataset.contact,'lead2');assert.doesNotMatch(document.body.textContent,/History/);
  await React.act(async()=>button('Next').click());assert.equal(document.querySelectorAll('.collapsed-row').length,2);assert.equal(document.querySelectorAll('article').length,0);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('pagination recovers when replied conversations disappear from the last page',async()=>{
 const {dom,root}=await setup(),calls=[];const Panel=load({getAllWhatsAppMessages:async(_token,filters)=>{calls.push(filters.offset);return {rows:filters.offset?[]:[base],total:calls.length===1?51:1,offset:filters.offset,limit:50,asOfUtc:'2026-11-12T11:00Z',warnings:[]};}}).default;
 try{await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Next').click());assert.deepEqual(calls,[0,50,0]);assert.match(document.body.textContent,/Page 1 of 1/);}finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('a grouped row shows every timestamp and channel, safe text, and one SMS composer for each actual sender',async()=>{
 const {dom,root}=await setup(),Batch=load({}).IncomingMessageBatch,items=[{...base,channel:'mediatel'},{...base,messageKey:'b',message:'SMS one',channel:'sms',source:'SMS',atUtc:'2026-11-12T10:01Z'},{...base,messageKey:'c',message:'SMS two',channel:'sms',source:'SMS',atUtc:'2026-11-12T10:02Z'}];
 try{await React.act(async()=>root.render(React.createElement(Batch,{token:'token',row:{...base,messages:items,lastReplyAtUtc:'2026-11-12T09:00Z'},onChanged:()=>{}})));assert.equal(document.querySelectorAll('article').length,3);assert.equal(document.querySelectorAll('article time').length,3);assert.equal(document.querySelectorAll('[data-channel="sms"]').length,2);assert.equal(document.querySelectorAll('button[data-phone]').length,1);assert.equal(document.querySelector('button[data-phone]').dataset.phone,base.phone);assert.equal(document.querySelector('script'),null);assert.match(document.body.textContent,/10:01/);assert.match(document.body.textContent,/10:02/);assert.match(document.body.textContent,/since our reply/);}finally{await React.act(async()=>root.unmount());dom.window.close();}
});

test('the shared action group forwards the same lead, version, incoming snapshot, notes and booking to existing controls',async()=>{
 const {dom,root}=await setup(),mod={exports:{}},seen={},changed=[];
 new Function('require','module','exports',compile('src/components/LeadPipelineRowActions.tsx'))(name=>name==='@/lib/leadPipelineControls'?{loadPipelineControl:async()=>{throw Error('Unexpected load');}}:['./ManualPayment','./SignwellIpc','./ContactStartSimulation','./ContactBookCall','./ContactIdentityEditor','./ContactBookAdrian'].includes(name)?{default:p=>React.createElement('button',null,({'./ManualPayment':'Confirm bank payment','./SignwellIpc':'Imputernicire','./ContactStartSimulation':'Start Simulare','./ContactBookCall':'Book a Call','./ContactIdentityEditor':'Add email / phone','./ContactBookAdrian':'Book a call with Adrian'})[name])}:name==='./LeadPrivateWorkspace'?{default:p=>{seen.privateWorkspace=p;return React.createElement('button',null,'Private files & notes');}}:name==='./InternalLeadActions'?{default:p=>{seen.contact=p;return React.createElement('button',{onClick:()=>p.onChanged({success:true,action:'solve'})},'Contact controls');}}:name==='./PipelineLeadControls'?{default:p=>{seen.pipeline=p;return React.createElement('button',{onClick:()=>p.onChanged('Handled')},'Pipeline controls');}}:name==='./BookingActions'?{default:p=>{seen.booking=p;return React.createElement('button',null,'Booking controls');}}:name==='@/lib/allCustomers'?{contactActionNotice:()=> 'Solved'}:name==='@/lib/bookedCalls'?{bookingActionNotice:()=> 'Booked'}:require(name),mod,mod.exports);
 const row={...base,pipelineVersion:0,priority:0,lastInboundAtUtc:'2026-11-12T10:02Z',booking:{intentId:'booking',appointmentAtUtc:'2026-11-13T10:00Z'}},summary={noteCount:2,nextActionDate:'2026-11-13'};
 try{await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token',row,allowHandleForAllLeads:true,noteSummary:summary,onChanged:m=>changed.push(m)})));assert.equal(seen.privateWorkspace.contactId,base.contactId);assert.equal(seen.privateWorkspace.token,'token');assert.equal(seen.contact.contactId,base.contactId);assert.equal(seen.contact.summary,summary);assert.equal(seen.pipeline.row,row);assert.equal(seen.pipeline.allowHandleForAllLeads,true);assert.equal(seen.pipeline.row.lastInboundAtUtc,'2026-11-12T10:02Z');assert.equal(seen.booking.booking,row.booking);assert.equal(seen.contact.showSpecialActions,false);assert.equal(seen.contact.allowEnd,false);assert.equal(seen.booking.leadActionsOnly,true);assert.equal(seen.pipeline.leadActionsOnly,true);assert.deepEqual([...document.querySelectorAll('section')].map(s=>s.getAttribute('aria-label')),['Usual actions','Special actions']);assert.match(document.querySelectorAll('section')[1].textContent,/Confirm bank payment/);for(const label of ['Start Simulare','Book a Call','Add email / phone','Book a call with Adrian'])assert.ok([...document.querySelector('[aria-label="Usual actions"]').querySelectorAll('button')].some(b=>b.textContent===label));await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Contact controls').click());assert.deepEqual(changed,['Solved']);}finally{await React.act(async()=>root.unmount());dom.window.close();}
});

 test('category dropdown applies immediately, defaults to all, and retains the requested option order',async()=>{
 const {dom,root}=await setup(),calls=[],Panel=load({getAllWhatsAppMessages:async(_token,filters)=>{calls.push(filters);return {rows:[{...base,category:'red'}],total:1,offset:filters.offset,limit:50,asOfUtc:'2026-11-15T12:00Z',warnings:[]};}}).default;
 try{await React.act(async()=>root.render(React.createElement(Panel,{token:'token'})));
 const select=document.querySelector('[aria-label="Show Category"]');assert.equal(select.value,'');assert.equal(calls[0].category,'');assert.deepEqual([...select.options].map(o=>o.value),['','red','yellow','green','none']);
 assert.equal(document.querySelector('tr[data-category="red"]').style.background,'rgb(254, 242, 242)');
 await React.act(async()=>{select.value='none';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.equal(calls.at(-1).category,'none');assert.equal(calls.at(-1).offset,0);
 await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Clear').click());assert.equal(calls.at(-1).category,'');
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
 });
