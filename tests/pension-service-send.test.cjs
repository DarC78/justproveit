const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function nodes(tree){if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return [];return [tree,...nodes(tree.props?.children)];}
function fixture(send,token='token'){
 const states=[],refs=[];let cursor=0,refCursor=0;const storage=new Map(),calls=[];
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useRef:value=>{const i=refCursor++;return refs[i]||(refs[i]={current:value});}};
 const exports={};const code=ts.transpileModule(fs.readFileSync('src/components/PensionServiceSendButtons.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:{sendPensionServiceLink:async(...args)=>{calls.push(args);return send(...args);}},crypto:{randomUUID:()=> 'f973a146-94b6-4db3-a486-9f6cdf03527e'},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},Date,Error});
 const props={service:'international',serviceName:'Pensia Internațională',contact:{email:'lead@example.com',phone:'447700900001'},token};
 const render=()=>{cursor=refCursor=0;return nodes(exports.default(props));};
 return {props,calls,render,buttons:()=>render().filter(n=>n.type==='button'),flush:async()=>{for(let i=0;i<8;i++)await Promise.resolve();}};
}
test('three channels use current lead details and distinguish queued from accepted',async()=>{
 const f=fixture(async()=>({status:'queued'}));assert.equal(f.buttons().length,3);
 f.buttons()[1].props.onClick();await f.flush();assert.equal(f.calls[0][1].phone,'447700900001');assert.equal(f.calls[0][1].channel,'whatsapp');
 assert.match(JSON.stringify(f.render()),/WhatsApp pus în coadă/);assert.equal(f.buttons()[1].props.disabled,true);
 assert.doesNotMatch(JSON.stringify(f.render()),/Trimitere acceptată/);
});
test('double clicks are blocked and a network retry reuses its send reference',async()=>{
 let finish;const f=fixture(()=>new Promise((resolve,reject)=>finish={resolve,reject}));
 const button=f.buttons()[0];button.props.onClick();button.props.onClick();assert.equal(f.calls.length,1);
 finish.reject(Error('Network uncertain'));await f.flush();
 f.buttons()[0].props.onClick();assert.equal(f.calls.length,2);assert.equal(f.calls[0][1].requestId,f.calls[1][1].requestId);
 finish.resolve({status:'accepted'});await f.flush();assert.equal(f.buttons()[0].props.disabled,true);
});
test('signed out agents and missing recipients cannot send; changed lead can send independently',async()=>{
 const signedOut=fixture(async()=>assert.fail(),null);assert.ok(signedOut.buttons().every(b=>b.props.disabled));
 const f=fixture(async()=>({status:'accepted'}));f.props.contact.email='';assert.equal(f.buttons()[0].props.disabled,true);
 f.props.contact.email='first@example.com';f.buttons()[0].props.onClick();await f.flush();assert.equal(f.buttons()[0].props.disabled,true);
 f.props.contact.email='second@example.com';assert.equal(f.buttons()[0].props.disabled,false);
});
