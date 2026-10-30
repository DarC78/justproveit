const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/components/ContactActions.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const tick=()=>new Promise(r=>setImmediate(r));
function harness(){
 const slots=[],effects=[],calls=[],results=[],changes=[];let cursor=0,tree,opened=0,id=0;
 const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(v){const i=cursor++;return slots[i]??={current:v};},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,n)=>v!==slots[i][n])){slots[i]=deps;effects.push(fn);}}};
 const exports={};vm.runInNewContext(compiled,{exports,crypto:{randomUUID:()=>`request-${++id}`},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:{runContactAction:async(...args)=>{calls.push(args);const result=results.shift();if(result instanceof Error)throw result;return await result;}},console});
 const walk=n=>!n?[]:Array.isArray(n)?n.flatMap(walk):typeof n==='object'?[n,...walk(n.props?.children)]:[];
 const text=n=>!n?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
 const nodes=type=>walk(tree).filter(n=>n.type===type),button=label=>nodes('button').find(n=>text(n)===label);
 function render(){cursor=0;tree=exports.default({token:'fixture-token',contactId:'contact',name:'Fixture',phone:'447700900001',onChanged:r=>changes.push(r)});for(const n of nodes('dialog'))n.props.ref.current={showModal(){opened++;}};effects.splice(0).forEach(fn=>fn());}
 function draft(value){button('Reply on WhatsApp').props.onClick();render();nodes('textarea')[0].props.onChange({target:{value}});render();}
 return {render,button,nodes,draft,calls,results,changes,opened:()=>opened};
}
test('floating reply composer requires a message, opens modally, and cancellation sends nothing',()=>{
 const h=harness();h.render();h.draft('');assert.equal(h.opened(),1);assert.equal(h.button('Send & solve').props.disabled,true);h.button('Cancel').props.onClick();h.render();assert.equal(h.nodes('dialog').length,0);assert.equal(h.calls.length,0);
});
test('rapid double submission cannot send twice; failed reply keeps text and request ID for retry',async()=>{
 const h=harness();h.render();h.draft('  Fixture message  ');h.results.push(new Error('Temporary error'));
 const send=h.nodes('form')[0].props.onSubmit;send({preventDefault(){}});send({preventDefault(){}});assert.equal(h.calls.length,1);
 await tick();h.render();assert.equal(h.nodes('textarea')[0].props.value,'  Fixture message  ');const request=h.calls[0][3].requestId;
 h.results.push({success:true,action:'reply',solved:true,whatsAppQueued:true});h.nodes('form')[0].props.onSubmit({preventDefault(){}});await tick();h.render();
 assert.equal(h.calls.length,2);assert.equal(h.calls[1][3].requestId,request);assert.equal(h.calls[1][3].text,'Fixture message');assert.equal(h.nodes('dialog').length,0);assert.equal(h.changes.length,1);
});
test('Solve and New ASAP use their own actions without submitting a WhatsApp message',async()=>{
 for(const [label,action] of [['Solve','solve'],['New ASAP','asap']]){
 const h=harness();h.render();h.results.push({success:true,action,solved:action==='solve'});h.button(label).props.onClick();await tick();assert.equal(h.calls.length,1);assert.equal(h.calls[0][2],action);assert.equal(h.calls[0][3].text,undefined);
 }
});
