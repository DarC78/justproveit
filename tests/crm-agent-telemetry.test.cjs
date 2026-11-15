const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function fixture(){
 let time=Date.parse('2026-11-15T12:00:00Z'),serial=0,online=true,interval;
 const listeners=new Map(),calls=[];
 const doc={visibilityState:'visible',hasFocus:()=>true,addEventListener:(n,fn)=>listeners.set('doc:'+n,fn),removeEventListener:n=>listeners.delete('doc:'+n)};
 const host={document:doc,crypto:{randomUUID:()=>`00000000-0000-0000-0000-${String(++serial).padStart(12,'0')}`},location:{href:'https://crm.test/admin/crm/'},setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>{interval=null;},addEventListener:(n,fn)=>listeners.set('window:'+n,fn),removeEventListener:n=>listeners.delete('window:'+n),fetch:async(url,init)=>{calls.push({url,init});if(!online)throw Error('offline');return{ok:true};}};
 class Clock extends Date{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}}
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/crmAgentTelemetry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,Date:Clock,URL,Headers,Request,Set});
 return{host,calls,listeners,start:()=>exports.startCrmActivityTracking('fixture-token','https://api.test/api/justproveit/admin/crm/agent-telemetry',host),tick:async(ms=15000)=>{time+=ms;interval?.();await new Promise(setImmediate);},event:(n,e={isTrusted:true})=>listeners.get(n)?.(e),offline:()=>{online=false;},online:()=>{online=true;}};
}
const samples=f=>f.calls.filter(c=>String(c.url).endsWith('/agent-telemetry')).map(c=>JSON.parse(c.init.body));
test('open tab is idle until trusted interaction; samples retain timing but never key or input contents',async()=>{
 const f=fixture(),stop=f.start();await new Promise(setImmediate);
 assert.equal(samples(f)[0].events[0].lastInteractionAtUtc,null);
 f.event('doc:keydown',{isTrusted:false,key:'secret'});await f.tick();assert.equal(samples(f).at(-1).events[0].lastInteractionAtUtc,null);
 f.event('doc:input',{isTrusted:true,target:{value:'private message'}});await f.tick();assert.ok(samples(f).at(-1).events[0].lastInteractionAtUtc);
 assert.ok(!JSON.stringify(samples(f)).includes('private message'));await f.tick(61000);
 const last=samples(f).at(-1).events[0];assert.ok(Date.parse(last.atUtc)-Date.parse(last.lastInteractionAtUtc)>60000);
 stop();assert.equal(f.listeners.size,0);
});
test('request correlation is bounded, excludes other origins and restores fetch on logout',async()=>{
 const f=fixture(),original=f.host.fetch,stop=f.start();await new Promise(setImmediate);
 f.event('doc:pointerdown');await f.host.fetch('https://api.test/api/justproveit/admin/crm/leads?phone=private');
 assert.equal(f.calls.at(-1).init.headers.get('x-crm-recent-input'),'1');
 assert.ok(f.calls.at(-1).init.headers.get('x-crm-tab-id'));await f.tick();
 await f.host.fetch('https://api.test/api/justproveit/admin/crm/leads');assert.equal(f.calls.at(-1).init.headers.get('x-crm-recent-input'),'0');
 await f.host.fetch('https://foreign.test/api/justproveit/admin/crm/leads');assert.equal(f.calls.at(-1).init,undefined);
 stop();assert.equal(f.host.fetch,original);
});
test('hidden and unfocused samples are retained; retry reuses IDs and drops expired offline evidence',async()=>{
 const f=fixture();f.offline();const stop=f.start();await new Promise(setImmediate);
 const first=samples(f)[0].events[0].id;f.host.document.visibilityState='hidden';f.event('doc:visibilitychange');await new Promise(setImmediate);
 assert.equal(samples(f).at(-1).events.at(-1).visible,false);
 f.online();await f.tick();assert.equal(samples(f).at(-1).events[0].id,first);
 f.offline();await f.tick();const expired=samples(f).at(-1).events[0].id;
 f.online();await f.tick(121000);assert.ok(!samples(f).at(-1).events.some(e=>e.id===expired));stop();
});
