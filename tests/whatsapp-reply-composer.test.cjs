const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function fixture(send,templates){
 const effects=[];
 const states=[],refs=[];let stateIndex=0,refIndex=0,updated=0;
 const exports={};const source=ts.transpileModule(fs.readFileSync('src/components/WhatsAppReplyComposer.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const react={useState(initial){const i=stateIndex++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef(initial){const i=refIndex++;return refs[i]||(refs[i]={current:initial});},useEffect(effect){if(templates)effects.push(effect);}};
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(source,{exports,crypto:{randomUUID:()=> 'fixed-request-id'},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{sendScheduledWhatsAppReply:send,getComposerTemplates:async()=>({templates})}});
 function render(){stateIndex=0;refIndex=0;return exports.default({token:'token',intentId:'booking',phone:'447700900001',onSent:()=>updated++});}
 function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;const children=node.props?.children;for(const child of Array.isArray(children)?children:[children]){const result=find(child,type);if(result)return result;}return null;}
 return {render,find,updated:()=>updated,async load(){render();for(const effect of effects.splice(0))effect();await Promise.resolve();await Promise.resolve();}};
}
const submit=tree=>tree.props.onSubmit({preventDefault(){}});
test('composer sends exact booking text and clears only after provider acceptance',async()=>{
 let calls=[];const f=fixture(async(...args)=>{calls.push(args);return {id:'1',status:'accepted'};});
 f.find(f.render(),'textarea').props.onChange({target:{value:' Hello '}});
 await submit(f.render());assert.equal(calls.length,1);assert.equal(calls[0][1],'booking');assert.equal(calls[0][2].text,'Hello');assert.equal(calls[0][2].expectedPhone,'447700900001');
 assert.equal(f.find(f.render(),'textarea').props.value,'');assert.equal(f.updated(),1);
});
test('provider failure retains editable text and displays its rejection',async()=>{
 const f=fixture(async()=>({id:'1',status:'failed',errorMessage:'The 24-hour window has closed.'}));
 f.find(f.render(),'textarea').props.onChange({target:{value:'Keep this draft'}});await submit(f.render());
 const tree=f.render();assert.equal(f.find(tree,'textarea').props.value,'Keep this draft');assert.equal(f.find(tree,'textarea').props.disabled,false);
 assert.match(JSON.stringify(tree),/24-hour window/);
});
test('network uncertainty locks draft and reuses the same request rather than duplicating',async()=>{
 let calls=[];const f=fixture(async(...args)=>{calls.push(args);if(calls.length===1)throw Error('Network uncertain');return {id:'1',status:'accepted'};});
 f.find(f.render(),'textarea').props.onChange({target:{value:'Only once'}});await submit(f.render());
 let tree=f.render();assert.equal(f.find(tree,'textarea').props.disabled,true);assert.equal(f.find(tree,'button').props.children,'Check send status');
 await submit(tree);assert.equal(calls[0][2].requestId,calls[1][2].requestId);assert.equal(calls[0][2].text,calls[1][2].text);
 assert.equal(f.find(f.render(),'textarea').props.value,'');
});
test('double submit while request pending is ignored',async()=>{
 let resolve,calls=0;const f=fixture(()=>{calls++;return new Promise(r=>resolve=r);});
 f.find(f.render(),'textarea').props.onChange({target:{value:'One reply'}});const tree=f.render();const pending=submit(tree);await submit(tree);assert.equal(calls,1);resolve({id:'1',status:'accepted'});await pending;
});

test('approved template selector sends exact language and values and leaves free text available',async()=>{
 let calls=[];
 const f=fixture(async(...args)=>{calls.push(args);return {id:'1',status:'accepted'};},[{name:'pensii_private_voicemail',language:'ro',components:[{type:'BODY',text:'Buna {{1}}'}]}]);
 await f.load();
 f.find(f.render(),'select').props.onChange({target:{value:'pensii_private_voicemail:ro'}});
 let tree=f.render();assert.equal(f.find(tree,'button').props.disabled,true);
 // Template variables are rendered as an array of labeled inputs.
 function input(node){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const child of node){const found=input(child);if(found)return found;}return null;}if(node.type==='input')return node;return input(node.props?.children);}
 input(tree).props.onChange({target:{value:'Ana'}});
 tree=f.render();assert.equal(f.find(tree,'textarea').props.value,'Buna Ana');assert.equal(f.find(tree,'button').props.disabled,false);
 await submit(tree);assert.equal(calls[0][2].templateName,'pensii_private_voicemail');assert.equal(calls[0][2].templateLanguage,'ro');assert.equal(calls[0][2].parameters['body:1'],'Ana');
 f.find(f.render(),'select').props.onChange({target:{value:''}});assert.equal(f.find(f.render(),'textarea').props.disabled,false);
});
