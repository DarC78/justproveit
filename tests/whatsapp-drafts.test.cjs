const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function fixture(send,status='Ready'){
 const states=[],refs=[];let stateIndex=0,refIndex=0,sent=0;const exports={};
 const source=ts.transpileModule(fs.readFileSync('src/components/WhatsAppDraftRow.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const react={useState(initial){const i=stateIndex++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef(initial){const i=refIndex++;return refs[i]||(refs[i]={current:initial});}};
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:{sendWhatsAppDraft:send}});
 const draft={id:'draft-1',contactId:'contact-1',phone:'447700900001',text:'AI suggestion',status};
 function render(){stateIndex=0;refIndex=0;return exports.default({token:'token',draft,onSent:()=>sent++});}
 function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const child of Array.isArray(node.props?.children)?node.props.children:[node.props?.children]){const found=find(child,type);if(found)return found;}return null;}
 return {render,find,sent:()=>sent};
}
test('draft appears below the lead with editable text and Send Now using reviewed text',async()=>{
 let args;const f=fixture(async(...input)=>{args=input;return {status:'accepted',providerMessageId:'wamid.1'};});
 assert.equal(f.render().type,'tr');assert.equal(f.find(f.render(),'button').props.children,'Send Now');
 f.find(f.render(),'textarea').props.onChange({target:{value:'Reviewed reply'}});
 await f.find(f.render(),'button').props.onClick();await new Promise(setImmediate);
 assert.equal(args[2],'Reviewed reply');assert.equal(f.sent(),1);
});
test('uncertain network outcome freezes reviewed text and checks the identical draft',async()=>{
 const calls=[];const f=fixture(async(...args)=>{calls.push(args);if(calls.length===1)throw Error('Network uncertain');return {status:'accepted',providerMessageId:'wamid.1'};});
 await f.find(f.render(),'button').props.onClick();await new Promise(setImmediate);
 let tree=f.render();assert.equal(f.find(tree,'textarea').props.disabled,true);assert.equal(f.find(tree,'button').props.children,'Check status');
 await f.find(tree,'button').props.onClick();await new Promise(setImmediate);assert.equal(calls[0][1].id,calls[1][1].id);assert.equal(calls[0][2],calls[1][2]);
});
test('provider rejection remains visible and cannot be blindly resent',async()=>{
 const f=fixture(async()=>({status:'failed',errorMessage:'Reply window closed'}));await f.find(f.render(),'button').props.onClick();await new Promise(setImmediate);
 const tree=f.render();assert.equal(f.find(tree,'button').props.disabled,true);assert.match(JSON.stringify(tree),/Reply window closed/);
});
