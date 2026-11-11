const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('pipeline filters and paginates server-side and opens the correct contact history',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const previous=global.fetch,calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({sources:['FB','TikTok'],counts:{newLead:31,SimulationInProgress:0,SimulationDone:0,ScheduledCall:0,AgreedToBuy:0},cohortTotal:31,total:31,asOfUtc:'2026-11-10T12:00Z',rows:[{contactId:'correct-contact',name:'Fixture',phone:'447700900123',pipelineStatus:'newLead',source:'FB',service:'Simulator',createdAtUtc:'2026-11-01'}]})};};
 const code=ts.transpileModule(fs.readFileSync('src/components/LeadPipelinePanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,mod={exports:{}};let history,actions;
 const mocks={
  '@/lib/auth':{API_BASE_URL:'https://api.example.test'},
  '@/lib/allCustomers':{contactActionNotice:()=> 'Action saved'},
  '@/lib/bookedCalls':{bookingActionNotice:()=> 'Booking saved'},
  '@/lib/leadNotes':{useLeadNoteSummaries:()=>({summaries:{},refresh(){},error:''}),nextActionRowStyle:()=>undefined},
  './ContactActions':{__esModule:true,default:props=>{actions=props;return React.createElement('button',{onClick:()=>props.onChanged({action:'solve',success:true})},'Fixture Solve');}},
  './BookingActions':{__esModule:true,default:()=>null},
  './ScheduledCallsTable':{__esModule:true,default:props=>React.createElement('div',{'data-testid':'scheduled-table'},props.pipeline?'Scheduled pipeline table':'Other table')},
  './LeadPhoneHistory':{__esModule:true,default:props=>{history=props;return React.createElement('button',{onClick:props.onCollapse},'Collapse history');}}
 };
 new Function('require','module','exports',code)(name=>mocks[name]||require(name),mod,mod.exports);
 let root=createRoot(document.getElementById('root'));const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try {
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'agent-token'})));
  assert.equal(calls[0].options.headers.Authorization,'Bearer agent-token');assert.match(document.body.textContent,/31 leads matching/);
  assert.equal(document.querySelector('input[type="checkbox"]').checked,false);assert.equal(new URL(calls[0].url).searchParams.get('showFutureScheduled'),'false');
  assert.ok(button('447700900123').classList.contains('pipeline-phone-link'));assert.equal(document.querySelector('[aria-label="Show leads with a call booked"]'),null);
  await React.act(async()=>button('447700900123').click());assert.equal(history.contactId,'correct-contact');
  await React.act(async()=>button('Collapse history').click());assert.equal(button('Collapse history'),undefined);
  await React.act(async()=>button('Next').click());assert.equal(new URL(calls.at(-1).url).searchParams.get('offset'),'30');
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='AgreedToBuy: 0').click());
  const query=new URL(calls.at(-1).url).searchParams;assert.equal(query.get('offset'),'0');assert.equal(query.get('status'),'AgreedToBuy');
  await React.act(async()=>{const select=document.querySelector('[aria-label="Lead source"]');select.value='TikTok';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.equal(new URL(calls.at(-1).url).searchParams.get('source'),'TikTok');assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'AgreedToBuy');
  const key='proveit.crm.leadPipeline.filters.v1:default';assert.equal(JSON.parse(window.localStorage.getItem(key)).status,'AgreedToBuy');
  // A full unmount/remount models a reload. Saved inbound days are also restored before the first request.
  window.localStorage.setItem(key,JSON.stringify({status:'AgreedToBuy',source:'TikTok',inboundDays:7}));
  await React.act(async()=>root.unmount());root=createRoot(document.getElementById('root'));const before=calls.length;
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'agent-token'})));
  assert.equal(calls.length,before+1);const restored=new URL(calls.at(-1).url).searchParams;assert.equal(restored.get('status'),'AgreedToBuy');assert.equal(restored.get('source'),'TikTok');assert.equal(restored.get('inboundDays'),'7');
  assert.equal(document.querySelector('[aria-label="Pipeline status"]').value,'AgreedToBuy');assert.equal(document.querySelector('[aria-label="Inbound contact in the last X days"]').value,'7');
  await React.act(async()=>button('Refresh').click());assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'AgreedToBuy');
  assert.equal(actions.contactId,'correct-contact');assert.equal(actions.phone,'447700900123');assert.equal(actions.token,'agent-token');assert.equal(actions.internalLead,undefined);
  const beforeAction=calls.length;await React.act(async()=>button('Fixture Solve').click());assert.equal(calls.length,beforeAction+1);assert.match(document.body.textContent,/Action saved/);assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'AgreedToBuy');assert.equal(new URL(calls.at(-1).url).searchParams.get('source'),'TikTok');
  const beforeNote=calls.length;await React.act(async()=>actions.onNoteSaved());assert.equal(calls.length,beforeNote+1);assert.equal(new URL(calls.at(-1).url).searchParams.get('showFutureScheduled'),'false');
  await React.act(async()=>document.querySelector('input[type="checkbox"]').click());assert.equal(new URL(calls.at(-1).url).searchParams.get('showFutureScheduled'),'true');assert.equal(new URL(calls.at(-1).url).searchParams.get('offset'),'0');assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'AgreedToBuy');assert.equal(JSON.parse(window.localStorage.getItem(key)).showFutureScheduled,true);
  await React.act(async()=>root.unmount());root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'agent-token'})));assert.equal(document.querySelector('input[type="checkbox"]').checked,true);assert.equal(new URL(calls.at(-1).url).searchParams.get('showFutureScheduled'),'true');
  await React.act(async()=>root.unmount());root=createRoot(document.getElementById('root'));
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'another-token',userId:'another-user'})));
  assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'');assert.equal(new URL(calls.at(-1).url).searchParams.get('inboundDays'),'0');
  assert.equal(document.querySelector('input[type="checkbox"]').checked,false);
  await React.act(async()=>{const select=document.querySelector('[aria-label="Pipeline status"]');select.value='ScheduledCall';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'ScheduledCall');assert.equal(new URL(calls.at(-1).url).searchParams.get('offset'),'0');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  assert.equal(document.querySelector('[aria-label="ScheduledDate"]').value,today);assert.equal(new URL(calls.at(-1).url).searchParams.get('scheduledDate'),today);assert.ok(document.querySelector('[data-testid="scheduled-table"]'));
  assert.ok(document.body.textContent.includes('Has a recorded past or future call booking'));
  assert.equal(document.querySelector('[aria-label="Show leads with a call booked"]'),null);
  await React.act(async()=>root.unmount());root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'another-token',userId:'another-user'})));
  assert.equal(document.querySelector('[aria-label="Pipeline status"]').value,'ScheduledCall');assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'ScheduledCall');
  await React.act(async()=>button('Clear').click());assert.equal(new URL(calls.at(-1).url).searchParams.get('status'),'');
 }finally{await React.act(async()=>root.unmount());global.fetch=previous;dom.window.close();delete global.window;delete global.document;}
});
