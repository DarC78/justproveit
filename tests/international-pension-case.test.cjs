const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom');const dom=new JSDOM('<!doctype html><body></body>',{url:'http://localhost'});
global.window=dom.window;global.document=dom.window.document;global.HTMLElement=dom.window.HTMLElement;global.IS_REACT_ACT_ENVIRONMENT=true;
Object.defineProperty(global,'navigator',{value:dom.window.navigator,configurable:true});Object.defineProperty(global,'crypto',{value:require('node:crypto').webcrypto,configurable:true});
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
const {act}=React,{createRoot}=require('react-dom/client');let api;
function load(file,mocks={}){file=path.resolve(file);const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',code)(name=>mocks[name]?{...mocks[name],__esModule:true}:require(name),module,module.exports);return module.exports;}
const actual=load('src/lib/internationalPensionCases.ts',{'./auth':{API_BASE_URL:'https://example.invalid/api'}});
test('UK dates preserve winter and summer wall clock and reject the missing spring-transition hour',()=>{assert.equal(actual.ukInstant('2026-11-07T09:00'),'2026-11-07T09:00:00.000Z');assert.equal(actual.ukInstant('2026-07-07T09:00'),'2026-07-07T08:00:00.000Z');assert.throws(()=>actual.ukInstant('2026-03-29T01:30'));});
const Component=load('src/components/InternationalPensionCase.tsx',{'@/lib/internationalPensionCases':{...actual,loadPensionCase:(...args)=>api.read(...args),savePensionCase:(...args)=>api.save(...args)}}).default;
test('operator can save additional-country history without automatically completing stages; failures retain the draft',async()=>{
 let stored={customer:{id:'client',name:'Synthetic client',email:'test@example.invalid',phone:''},sales:[],case:{id:'case',version:1,currentStage:'S01',updatedAt:'2026-11-07T09:00:00Z',data:{sellingAgent:'Sale agent',payment:{plan:'instalments',firstPaidAt:'2026-11-06T09:00:00Z',confirmedBy:'Pay confirmer'},intake:{},countries:[{country:'UK',years:10,months:2,notes:''},{country:'România',years:15,months:4,notes:''}],documents:{},initialReviewed:false,adrianMeetingAt:null,clientFormApproved:false,postedAt:null,sentToIpcAt:null,appealRequired:false,nextAction:'',nextActionDueAt:null,waitingOn:'agent',notes:'',stages:{}}},stages:[{id:'S01',label:'Initial review',major:true}],intakeLabels:{},documentLabels:{},events:[]};
 const calls=[];let conflict=false;api={read:async()=>structuredClone(stored),save:async(token,id,command)=>{calls.push(command);if(conflict)throw Error('Dosarul a fost modificat de alt agent.');stored.case={...stored.case,version:2,data:{...stored.case.data,...command.details}};return {case:structuredClone(stored.case)};}};
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const flush=()=>act(async()=>{await new Promise(r=>setTimeout(r,0));});
 const button=t=>[...host.querySelectorAll('button')].find(b=>b.textContent===t);const click=async b=>{await act(async()=>b.click());await flush();};
 const set=async(input,value)=>act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
 try{
 await act(async()=>root.render(React.createElement(Component,{token:'test',customerId:'client',summary:null,onSaved:()=>{}})));await click(button('Deschide dosarul'));
 await click(button('Adaugă o țară'));const countryRows=host.querySelectorAll('.country');assert.equal(countryRows.length,3);await set(countryRows[2].querySelector('input'),'Franța');
 assert.equal(button('Marchează realizat').disabled,true);
 const form=host.querySelector('dialog form');await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await flush();
 assert.equal(calls.length,1);assert.equal(calls[0].action,'save');assert.equal(calls[0].details.countries[2].country,'Franța');assert.deepEqual(calls[0].details.stages,{});assert.match(host.textContent,/Sale agent/);
 conflict=true;const next=[...host.querySelectorAll('label')].find(x=>x.textContent.startsWith('Următoarea acțiune')).querySelector('input');await set(next,'Keep this unsaved task');
 await act(async()=>form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await flush();assert.match(host.textContent,/modificat de alt agent/);assert.equal(next.value,'Keep this unsaved task');assert.equal(button('Marchează realizat').disabled,true);
 }finally{await act(async()=>root.unmount());host.remove();}
});
