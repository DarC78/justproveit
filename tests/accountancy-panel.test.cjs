const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const id='10000000-0000-4000-8000-000000000001';
const detail={id,phone:'447700900001',contactId:null,version:7,state:{taxYear:'2025-26',step:'ready_for_agent',paused:false,optedOut:false,consent:{atUtc:'2026-11-25T12:00Z'},answers:{},reviewRequired:[],authorisation:{status:'link_ready'}},documents:[]};
function fixture({confirm=false,fail=false}={}){
 const states=[],refs=[],effects=[],calls=[];let index=0,refIndex=0;const exports={};
 const react={useState(initial){const i=index++;if(!(i in states))states[i]=initial;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];},useRef(initial){const i=refIndex++;return refs[i]||(refs[i]={current:initial});},useEffect(effect){effects.push(effect);}};
 const jsx=(type,props)=>({type,props});const source=ts.transpileModule(fs.readFileSync('src/components/AccountancyPanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,setTimeout,crypto:{randomUUID:()=>id},window:{confirm:()=>confirm},fetch:async(url,options)=>{calls.push({url,options});if(options.method==='POST')return {ok:!fail,json:async()=>fail?{error:{message:'Conflict: reload'}}:detail};return {ok:true,json:async()=>url.endsWith('/'+id)?detail:{trialEnabled:true,cases:[{...detail,name:'Synthetic',taxYear:'2025-26',stage:'ready_for_agent'}]}};},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:{API_BASE_URL:'https://api.invalid'}});
 const render=()=>{index=0;refIndex=0;return exports.default({token:'synthetic-token'});};
 const all=(n,p)=>!n||typeof n!=='object'?[]:[...(p(n)?[n]:[]),...[n.props?.children].flat(Infinity).flatMap(c=>all(c,p))];
 const button=text=>all(render(),n=>n.type==='button'&&n.props.children===text)[0];
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 return {calls,button,render,all,flush,async load(){render();effects.shift()();await flush();button('Vezi dosarul').props.onClick();await flush();}};
}
test('case API reads use the CRM bearer session; sending a link requires explicit confirmation',async()=>{
 const f=fixture();await f.load();assert.equal(f.calls.length,2);for(const call of f.calls){assert.equal(call.options.headers.Authorization,'Bearer synthetic-token');assert.equal(call.options.cache,'no-store');}
 f.button('Trimite linkul pe WhatsApp').props.onClick();await f.flush();assert.equal(f.calls.filter(c=>c.options.method==='POST').length,0);
});
test('confirmed send carries version and request ID; conflicts surface without automatic resend',async()=>{
 const f=fixture({confirm:true,fail:true});await f.load();f.button('Trimite linkul pe WhatsApp').props.onClick();f.button('Trimite linkul pe WhatsApp').props.onClick();await f.flush();const posts=f.calls.filter(c=>c.options.method==='POST');assert.equal(posts.length,1);const body=JSON.parse(posts[0].options.body);assert.equal(body.version,7);assert.equal(body.confirmed,true);assert.equal(body.action,'send_authorisation');assert.equal(body.requestId,id);assert.match(JSON.stringify(f.render()),/Conflict: reload/);
});
