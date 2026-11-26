const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function fixture(send,extra={}){
 const states=[],refs=[],locks=[],calls=[];let si=0,ri=0,sent=0;
 const exports={},jsx=(type,props)=>({type,props});
 const react={useState(initial){const i=si++;if(!(i in states))states[i]=initial;return[states[i],v=>states[i]=v];},useRef(initial){const i=ri++;return refs[i]||(refs[i]={current:initial});}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/SendComposerSms.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,crypto:{randomUUID:()=> 'request-id'},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{sendCrmComposerSms:async(...args)=>{calls.push(args);return send(...args);}}});
 const render=()=>{si=ri=0;return exports.default({token:'token',contactId:'lead',phone:'447700900123',text:' Salut! ',onLockChange:v=>locks.push(v),onSent:()=>sent++,...extra});};
 const walk=n=>!n||typeof n!=='object'?[]:[n,...[n.props?.children].flat(Infinity).flatMap(walk)];
 const button=()=>walk(render()).find(n=>n.type==='button');
 return{render,button,calls,locks,sent:()=>sent};
}
test('yellow SMS action sends shared trimmed text and reports acceptance separately from delivery',async()=>{
 const f=fixture(async()=>({success:true,status:'accepted',providerMessageId:'SMreceipt'}));
 assert.equal(f.button().props.children,'Send SMS');await f.button().props.onClick();await new Promise(setImmediate);
 assert.equal(f.calls[0][1],'contact');assert.equal(f.calls[0][2],'lead');assert.equal(f.calls[0][3].text,'Salut!');assert.equal(f.calls[0][3].expectedPhone,'447700900123');assert.equal(f.sent(),1);assert.deepEqual(f.locks,[true,false]);assert.match(JSON.stringify(f.render()),/Delivery is not yet confirmed/);
});
test('uncertain SMS reuses its original request and keeps other composer actions locked',async()=>{
 let count=0;const f=fixture(async()=>{if(++count===1)throw Error('timeout');return{status:'accepted',providerMessageId:'SMreceipt'};});
 f.button().props.onClick();await new Promise(setImmediate);assert.equal(f.button().props.children,'Check SMS status');assert.deepEqual(f.locks,[true]);
 f.button().props.onClick();await new Promise(setImmediate);assert.equal(f.calls[0][3],f.calls[1][3]);assert.equal(f.sent(),1);
});
test('SMS disables empty or oversize drafts and prevents parallel clicks',async()=>{
 for(const text of ['', ' '.repeat(10),'x'.repeat(1601)])assert.equal(fixture(()=>assert.fail(),{text}).button().props.disabled,true);
 let resolve;const f=fixture(()=>new Promise(r=>resolve=r));const b=f.button();b.props.onClick();b.props.onClick();assert.equal(f.calls.length,1);resolve({status:'failed',errorMessage:'Rejected'});await new Promise(setImmediate);assert.equal(f.sent(),0);assert.equal(f.button().props.children,'Send SMS');assert.deepEqual(f.locks,[true,false]);
});
