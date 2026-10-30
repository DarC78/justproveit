const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function fixture(response){const exports={};const calls=[];const source=ts.transpileModule(fs.readFileSync('src/lib/allCustomers.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(source,{exports,URLSearchParams,process:{env:{}},require:()=>({API_BASE_URL:'https://api.example.test/api'}),fetch:async(url,options)=>{calls.push({url,options});return response;}});return {...exports,calls};}
const page=(overrides={})=>({scope:'all',rows:[],total:0,limit:50,offset:0,...overrides});
const response=data=>({ok:true,status:200,json:async()=>data});
test('customer pagination fixes 50 rows and combines URL-encoded filters without broadening scope',()=>{
 const f=fixture();const q=f.customerPageQuery('inbound',{name:' Dan & Ana ',phone:'+447440526630',email:'dan+test@example.com'},2);
 assert.equal(q.get('scope'),'inbound');assert.equal(q.get('name'),'Dan & Ana');assert.equal(q.get('phone'),'+447440526630');assert.equal(q.get('email'),'dan+test@example.com');assert.equal(q.get('limit'),'50');assert.equal(q.get('offset'),'100');assert.throws(()=>f.customerPageQuery('all',{},-1));
});
test('API uses CRM bearer auth, exact pagination and cancellable request',async()=>{
 const f=fixture(response(page()));const signal=new AbortController().signal;
 const data=await f.loadCustomerPage('fixture-token','all',{name:'',phone:'',email:''},0,signal);
 assert.equal(data.total,0);assert.equal(f.calls[0].options.headers.Authorization,'Bearer fixture-token');assert.equal(f.calls[0].options.signal,signal);assert.match(f.calls[0].url,/\/customers\?/);
});
test('unavailable backend and source errors are shown rather than returning empty customers',async()=>{
 for(const status of [404,501]){const f=fixture({ok:false,status});await assert.rejects(()=>f.loadCustomerPage('x','all',{name:'',phone:'',email:''},0,new AbortController().signal),/not available yet/);}
 const f=fixture({ok:false,status:503,json:async()=>({error:{message:'Email source unavailable'}})});await assert.rejects(()=>f.loadCustomerPage('x','all',{name:'',phone:'',email:''},0,new AbortController().signal),/Email source unavailable/);
});
test('wrong-scope, wrong-page, oversized or invalid-total reports are rejected',async()=>{
 for(const data of [page({scope:'inbound'}),page({offset:50}),page({limit:200}),page({rows:Array(51).fill({})}),page({total:-1})]){
 const f=fixture(response(data));await assert.rejects(()=>f.loadCustomerPage('x','all',{name:'',phone:'',email:''},0,new AbortController().signal),/could not be verified/);}
});

test('lead listing uses the same validated filters, auth and independent page contract',async()=>{
 const f=fixture(response(page({scope:'inbound',offset:50})));const signal=new AbortController().signal;
 await f.loadCustomerPage('token','inbound',{name:'Ana',phone:'447700900001',email:''},1,signal,'leads');
 assert.match(f.calls[0].url,/\/leads-view\?/);assert.equal(new URL(f.calls[0].url).searchParams.get('offset'),'50');
});
test('callcode rendering shows text descriptions and never numeric identifiers',()=>{
 const f=fixture();assert.equal(f.callcodeText('NU_SE_AUDE'),'NU_SE_AUDE');for(const value of [5,'5',null,undefined,''])assert.equal(f.callcodeText(value),'Unavailable');
});
test('contact action keeps idempotency key and message, and verifies solve and queue confirmation',async()=>{
 const f=fixture(response({success:true,action:'reply',contactId:'contact',solved:true,whatsAppQueued:true}));
 await f.runContactAction('token','contact','reply',{requestId:'request',text:'Message'});
 const call=f.calls[0];assert.equal(call.options.method,'POST');assert.equal(call.options.headers.Authorization,'Bearer token');
 assert.deepEqual(JSON.parse(call.options.body),{action:'reply',requestId:'request',text:'Message'});
 for(const value of [{success:true,action:'reply',contactId:'contact',solved:false,whatsAppQueued:true},{success:true,action:'reply',contactId:'other',solved:true,whatsAppQueued:true},{success:true,action:'reply',contactId:'contact',solved:true,whatsAppQueued:false}]){
  const bad=fixture(response(value));await assert.rejects(()=>bad.runContactAction('token','contact','reply',{requestId:'request',text:'Message'}),/could not be verified/);
 }
});
