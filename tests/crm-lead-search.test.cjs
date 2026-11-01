const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {JSDOM}=require('jsdom');
const {act}=React;

// Exercise the actual components with an isolated CRM service, never a live sender.
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
global.window=dom.window;global.document=dom.window.document;
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});
Object.defineProperty(global,'crypto',{value:require('node:crypto').webcrypto,configurable:true});
global.HTMLElement=dom.window.HTMLElement;global.HTMLInputElement=dom.window.HTMLInputElement;
global.IS_REACT_ACT_ENVIRONMENT=true;
const {createRoot}=require('react-dom/client');
const calls={pages:[],histories:[],sends:[]};
const filters={name:'',phone:'',email:''};
const rows=Array.from({length:7},(_,n)=>({contactId:`contact-${n}`,name:`Matching lead ${n+1}`,phone:`44770090000${n}`,email:`lead${n}@example.invalid`,booking:null,createdAtUtc:null,callCount:0,lastInbound:null,lastWhatsApp:null,firstCallAtUtc:null,lastCallAtUtc:null,firstCallCode:null,lastCallCode:null}));
const crm={
 async getContactPhoneHistory(token,id){calls.histories.push(id);return {contactId:id,phone:rows.find(row=>row.contactId===id).phone,whatsAppMessages:1,calls:0,events:[{kind:'whatsapp',id:`event-${id}`,atUtc:'2026-11-01T10:00:00Z',direction:'inbound',author:'Client',text:`History for ${id}`,messageType:'text',status:'recorded'}]};},
 async getComposerTemplates(){return {templates:[{name:'approved-template',language:'ro',components:[{type:'BODY',text:'Approved greeting'}]}]};},
 async sendContactWhatsAppReply(token,id,body){calls.sends.push({id,body});return {id:'send-1',status:'accepted'};},
 async sendScheduledWhatsAppReply(){assert.fail('A booking must not be required for lead replies');}
};
const mocks={
 '@/lib/crmAdmin':crm,
 '@/lib/allCustomers':{CUSTOMER_PAGE_SIZE:50,callcodeText:()=>'',contactActionNotice:()=>'',async loadCustomerPage(token,scope,applied,page,signal,kind,size){calls.pages.push({applied,page,kind,size});return {scope,total:rows.length,limit:size,offset:page*size,rows:rows.slice(page*size,(page+1)*size)};}},
 '@/lib/whatsappDrafts':{async listWhatsAppDrafts(){return {drafts:[]};}},
 '@/lib/bookedCalls':{bookingActionNotice:()=>''},
 'next/link':{default:({children})=>React.createElement('span',null,children)},
 './PensionQualificationProfiles':{default:()=>null},'./ContactActions':{default:()=>null},'./BookingActions':{default:()=>null},'./WhatsAppDraftRow':{default:()=>null}
};
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
 const localRequire=name=>{
  if(mocks[name])return {...mocks[name],__esModule:true};
  if(name.startsWith('.')||name.startsWith('@/')){
   const base=name.startsWith('@/')?path.resolve('src',name.slice(2)):path.resolve(path.dirname(file),name);
   for(const suffix of ['.tsx','.ts',''])if(fs.existsSync(base+suffix)&&fs.statSync(base+suffix).isFile())return load(base+suffix);
  }
  return require(name);
 };
 new Function('require','module','exports',output)(localRequire,module,module.exports);return module.exports;
}
const AllLeadsView=load('src/components/AllLeadsView.tsx').default;
async function flush(){await act(async()=>{await new Promise(resolve=>setTimeout(resolve,0));});}
async function click(element){assert.ok(element,'Expected control');await act(async()=>element.click());await flush();}
const button=text=>[...document.querySelectorAll('button')].find(el=>el.textContent===text);
async function setInput(input,value){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});}

test('All Leads waits for search, pages five contacts with inline history, supports both WhatsApp modes and clears results',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  await act(async()=>root.render(React.createElement(AllLeadsView,{token:'fixture-token'})));await flush();
  assert.equal(calls.pages.length,0);assert.equal(calls.histories.length,0);
  assert.ok(!host.textContent.includes('Leads who contacted us'));
  assert.match(host.textContent,/Search by name, phone or email/);
  await setInput(host.querySelector('input[type=search]'),'Matching');
  await act(async()=>host.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
  assert.equal(calls.pages.at(-1).applied.name,'Matching');assert.equal(calls.pages.at(-1).size,5);
  assert.equal(host.querySelectorAll('.lead-history-row').length,5);assert.equal(calls.histories.length,5);
  assert.equal(host.querySelectorAll('form[aria-label="Reply on WhatsApp"]').length,5);
  const first=host.querySelector('.lead-history-row');assert.match(first.textContent,/History for contact-0/);
  assert.match(first.previousElementSibling.textContent,/Matching lead 1/);
  assert.equal(first.querySelector('select').options.length,2);
  const ids=[...host.querySelectorAll('textarea')].map(el=>el.id);assert.equal(new Set(ids).size,5);
  // Template send is mocked and must target the contact, not a booking.
  await act(async()=>{first.querySelector('select').value='approved-template:ro';first.querySelector('select').dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  await act(async()=>first.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  assert.equal(calls.sends.length,1);assert.equal(calls.sends[0].id,'contact-0');assert.equal(calls.sends[0].body.templateName,'approved-template');
  await act(async()=>{first.querySelector('select').value='';first.querySelector('select').dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  await act(async()=>{const textarea=first.querySelector('textarea');Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'A text reply');textarea.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await act(async()=>first.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  assert.equal(calls.sends.length,2);assert.equal(calls.sends[1].id,'contact-0');assert.equal(calls.sends[1].body.text,'A text reply');
  await click(button('Next'));await flush();
  assert.equal(calls.pages.at(-1).page,1);assert.equal(host.querySelectorAll('.lead-history-row').length,2);
  assert.match(host.textContent,/Matching lead 6/);assert.ok(!host.textContent.includes('Matching lead 1'));assert.match(host.textContent,/Page 2 of 2/);
  await click(button('Previous'));await flush();assert.equal(host.querySelectorAll('.lead-history-row').length,5);
  const pageCalls=calls.pages.length;
  await click(button('Clear'));assert.equal(host.querySelectorAll('.lead-history-row').length,0);assert.equal(calls.pages.length,pageCalls);
 }finally{await act(async()=>root.unmount());host.remove();}
});

test('customer query helper sends five-lead offsets without changing the default customer page size',()=>{
 const actual=load('src/lib/allCustomers.ts');
 assert.equal(actual.customerPageQuery('all',filters,2,5).get('offset'),'10');
 assert.equal(actual.customerPageQuery('all',filters,2).get('limit'),'50');
});
