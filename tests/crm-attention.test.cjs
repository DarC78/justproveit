const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<html><body></body></html>',{url:'http://localhost'});global.window=dom.window;global.document=dom.window.document;Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});global.IS_REACT_ACT_ENVIRONMENT=true;
const {act}=React,{createRoot}=require('react-dom/client');let calls=[],histories=0,solved=false,handoff=false;const warmed=[];
const contact={contactId:'returned',name:'Returning client',phone:'447700900001',primaryPhone:'447700900001',channel:'whatsapp',atUtc:'2026-11-02T11:30:00Z',text:'Please call back',bookingId:'past',appointmentAtUtc:'2026-11-01T09:00:00Z'};
const mocks={'@/lib/leadNotes':{nextActionRowStyle:()=>undefined,useLeadNoteSummaries:()=>({summaries:{},error:'',refresh(){}})},'./InternalLeadActions':{default:()=>null},'./LeadAgentAssignment':{default:()=>React.createElement('span',null,'Assignment control')},'@/lib/crmAdmin':{async prefetchAttentionPhoneHistories(token,report,signal){warmed.push({token,report,signal});},async listCrmAttention(token,days){calls.push({token,days});return {overdue:[{intentId:'overdue'}],returned:solved?[]:[contact],other:[{...contact,chatbotHandoff:handoff?{reason:'photo',requestedAtUtc:'2026-11-02T11:30:00Z',summary:'Client sent a photograph and needs an agent'}:undefined,contactId:'secondary',name:'Secondary contact',phone:'447700900002',bookingId:null}],lookbackDays:days,asOfUtc:'2026-11-02T12:00:00Z',warnings:[]};}},'@/lib/allCustomers':{contactActionNotice:()=> 'Saved'},'./ScheduledCallsTable':{default:()=>React.createElement('p',null,'Overdue booking table')},'./ContactActions':{default:({onChanged})=>React.createElement('button',{onClick:()=>{solved=true;onChanged({});}},'Solve contact')},'./LeadPhoneHistory':{default:({onReplied,onCollapse})=>{histories++;return React.createElement('div',null,React.createElement('p',null,'Actual contact history'),React.createElement('button',{onClick:onReplied},'Confirmed WhatsApp reply'),React.createElement('button',{onClick:onCollapse},'Collapse history'));}}};
const moduleCopy={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/components/AttentionPanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('require','module','exports',code)(name=>mocks[name]?{...mocks[name],__esModule:true}:require(name),moduleCopy,moduleCopy.exports);
const flush=async()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});

test('Other leads highlights only chatbot handoffs with a pale red background and a readable badge',async()=>{
 calls=[];solved=false;handoff=true;const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{await act(async()=>root.render(React.createElement(moduleCopy.exports.default,{token:'handoff-test'})));await flush();
  const pending=host.querySelector('tr[data-chatbot-handoff="pending"]');assert.ok(pending);assert.ok(pending.classList.contains('bg-red-50'));assert.match(pending.textContent,/De preluat de la chatbot/);assert.match(pending.textContent,/Client sent a photograph/);
  assert.ok(pending.closest('section').querySelector('h2').textContent.includes('Alte lead-uri care ne-au contactat'));
  const ordinary=[...host.querySelectorAll('tr')].find(row=>row.textContent.includes('Returning client'));assert.ok(ordinary);assert.equal(ordinary.classList.contains('bg-red-50'),false);
 }finally{handoff=false;calls=[];solved=false;histories=0;warmed.length=0;await act(async()=>root.unmount());host.remove();}
});
test('Attention displays its four groups, loads seven days, opens history on demand and refreshes after solve',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{await act(async()=>root.render(React.createElement(moduleCopy.exports.default,{token:'fixture-token'})));await flush();assert.deepEqual(calls,[{token:'fixture-token',days:7}]);assert.equal(host.querySelectorAll('h2').length,4);assert.match(host.querySelectorAll('h2')[0].textContent,/^1\. Leaduri revenite/);assert.match(host.querySelectorAll('h2')[1].textContent,/^2\. Program/);assert.match(host.textContent,/Programări restante/);assert.match(host.textContent,/Leaduri revenite/);assert.match(host.textContent,/Alte lead-uri/);assert.match(host.querySelectorAll('h2')[2].textContent,/^3\. Leaduri VA_CUMPARA/);assert.match(host.querySelectorAll('h2')[3].textContent,/^4\. Alte/);assert.equal(histories,0);assert.equal(warmed.length,1);assert.equal(warmed[0].token,'fixture-token');
 const phone=[...host.querySelectorAll('button')].find(b=>b.textContent===contact.phone);await act(async()=>phone.click());assert.equal(histories,1);
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Collapse history').click());assert.equal(host.textContent.includes('Actual contact history'),false);assert.equal(phone.getAttribute('aria-expanded'),'false');assert.equal(calls.length,1);assert.match(host.querySelector('h2').textContent,/\(1\)/);await act(async()=>phone.click());assert.equal(histories,2);
 const secondary=[...host.querySelectorAll('button')].find(b=>b.textContent==='447700900002');assert.equal(secondary.disabled,true);assert.equal(host.querySelectorAll('button').length>0,true);assert.equal([...host.querySelectorAll('button')].filter(b=>b.textContent==='Solve contact').length,1);
 await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Solve contact').click());await flush();assert.equal(calls.length,2);assert.match(host.textContent,/Nu există reveniri/);
 }finally{await act(async()=>root.unmount());host.remove();}
});

function loadAssignment(api){const mod={exports:{}};const source=ts.transpileModule(fs.readFileSync('src/components/LeadAgentAssignment.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',source)(name=>name==='@/lib/crmAdmin'?{assignCrmLead:api}:require(name),mod,mod.exports);return mod.exports.default;}
test('assignment offers Adrian last and becomes read-only after saving',async()=>{
 let saves=0,notice='';const Component=loadAssignment(async(token,id,agent)=>{saves++;assert.equal(id,'contact');return {success:true,assignment:{agent,assignedAtUtc:'2026-11-02T12:00:00Z'}};});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{await act(async()=>root.render(React.createElement(Component,{token:'token',contactId:'contact',onChanged:value=>{notice=value;}})));assert.equal(host.querySelector('button').disabled,true);assert.deepEqual([...host.querySelectorAll('option')].slice(1).map(o=>o.textContent),['Daniel','Andreea','Elena','Georgiana','Adrian']);
 await act(async()=>{const select=host.querySelector('select');select.value='Adrian';select.dispatchEvent(new window.Event('change',{bubbles:true}));});await act(async()=>{host.querySelector('button').click();});assert.equal(saves,1);assert.equal(host.querySelector('select'),null);assert.equal(host.querySelector('button'),null);assert.equal(host.textContent,'Adrian');assert.match(notice,/Adrian/);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test('agent column preserves the manual owner and every caller without duplicate names',async()=>{
 const Component=loadAssignment(()=>assert.fail('Reading call associations must not overwrite assignment'));
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 const assignment={agent:'Daniel',assignedAtUtc:'2026-11-01T10:00:00Z',assignedBy:'admin'};
 const calledAgents=[{agentId:10,agent:'Daniel Petrariu'},{agentId:26,agent:'Elena Mailat'},{agentId:21,agent:'Andreea'},{agentId:26,agent:'Elena Mailat'}];
 try{
  await act(async()=>root.render(React.createElement(Component,{token:'token',contactId:'contact',assignment,calledAgents,onChanged:()=>{}})));
  assert.deepEqual([...host.querySelectorAll('li')].map(n=>n.textContent),['Daniel Petrariu','Elena Mailat','Andreea']);assert.equal(host.querySelector('select'),null);
  await act(async()=>root.render(React.createElement(Component,{token:'token',contactId:'contact',assignment,calledAgents:[...calledAgents,{agentId:20,agent:'Georgiana D'}],onChanged:()=>{}})));
  assert.deepEqual([...host.querySelectorAll('li')].map(n=>n.textContent),['Daniel Petrariu','Elena Mailat','Andreea','Georgiana D']);
 }finally{await act(async()=>root.unmount());host.remove();}
});


test('accepted WhatsApp replies remove the returned lead and update its count without reloading Attention',async()=>{
 calls=[];solved=false;const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{await act(async()=>root.render(React.createElement(moduleCopy.exports.default,{token:'reply-test'})));await flush();
  const phone=[...host.querySelectorAll('button')].find(b=>b.textContent===contact.phone);await act(async()=>phone.click());
  await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Confirmed WhatsApp reply').click());
  assert.equal(calls.length,1);assert.match(host.querySelector('h2').textContent,/\(0\)/);assert.equal([...host.querySelectorAll('button')].some(b=>b.textContent===contact.phone),false);assert.match(host.textContent,/WhatsApp acceptat/);
 }finally{await act(async()=>root.unmount());host.remove();}
});
