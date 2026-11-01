const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function nodes(tree){if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return [];return [tree,...nodes(tree.props?.children)];}
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function setup(search,token='auth') {
 const states=[],deps=[],jobs=[],calls=[];let cursor=0,effect=0;
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useEffect:(fn,next)=>{const i=effect++;if(JSON.stringify(deps[i])!==JSON.stringify(next)){deps[i]=next;jobs.push(fn);}}};
 const dispatch={};vm.runInNewContext(compile('src/lib/crmDispatch.ts'),{exports:dispatch,URLSearchParams});
 const api={loadCrmDispatchContact:async(...args)=>{calls.push(['lookup',...args]);return {contact:{name:'Latest CRM Name',email:'latest@example.com',phone:'447440526630'}};},saveCrmPensionContactEmail:async(...args)=>{calls.push(['save',...args]);return {action:'added-secondary'};}};
 const exports={};vm.runInNewContext(compile('src/pages/ro/calculator-varsta-pensionare.tsx'),{exports,URLSearchParams,Object,window:{location:{search}},require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:name==='@/context/AuthContext'?{useAuth:()=>({token})}:name==='@/lib/crmDispatch'?dispatch:name==='@/lib/crmAdmin'?api:()=>null});
 return {states,calls,render(){cursor=0;effect=0;return nodes(exports.default());},async flush(){while(jobs.length)jobs.shift()();await Promise.resolve();await Promise.resolve();}};
}
test('calculator removes detailed form and keeps one-column results after workflow',()=>{
 const h=setup('');const tree=h.render();
 assert.ok(tree.find(n=>n.type==='main').props.className.includes('flex-col'));
 assert.equal(tree.some(n=>n.type==='details'),false);
 assert.equal(tree.some(n=>n.type==='form'),false);
 assert.ok(tree.findIndex(n=>n.type==='aside')>tree.findIndex(n=>n.props?.onContact));
});
test('contact parameters take precedence and CRM fills missing fields using normalized phone',async()=>{
 const h=setup('?phone_leads=07440526630&nume=Page%20Name');h.render();await h.flush();h.render();await h.flush();
 assert.equal(h.states[0].fullName,'Page Name');
 assert.equal(h.states[0].phone,'447440526630');
 assert.equal(h.states[0].email,'latest@example.com');
 assert.equal(h.calls[0][0],'lookup');
});
test('saving edited email uses the authenticated CRM endpoint and current contact',async()=>{
 const h=setup('?phone=447440526630&nume=Page&email=old@example.com');h.render();await h.flush();
 h.states[0].email='new@example.com';
 await h.render().find(n=>n.props?.onSaveEmail).props.onSaveEmail();
 assert.deepEqual(h.calls[0],['save','auth','447440526630','new@example.com']);
 assert.ok(h.states[2].includes('păstrată'));
});
test('anonymous page never reads or writes CRM contacts',async()=>{
 const h=setup('?phone=447440526630',null);h.render();await h.flush();h.render();await h.flush();
 await h.render().find(n=>n.props?.onSaveEmail).props.onSaveEmail();
 assert.equal(h.calls.length,0);
});
