const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=(path,source=fs.readFileSync(path,'utf8'))=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('gateway APIs use the authenticated base once, encode searches, and never expose a send operation',async()=>{
 const calls=[],exports={};vm.runInNewContext(compile('src/lib/whatsappGateway.ts'),{exports,require:()=>({fetchJson:async(...args)=>{calls.push(args);return{};}})});
 await exports.gatewayTargets('fixture','a+b@example.invalid');await exports.gatewayHistory('fixture','customer','id');await exports.gatewayLink('fixture','message',{requestId:'req',expectedVersion:1,targetKind:'customer',targetId:'id',reason:'Checked'});
 assert.equal(calls[0][0],'/justproveit/admin/crm/whatsapp-gateway/targets?q=a%2Bb%40example.invalid');assert.equal(calls[0][1].headers.Authorization,'Bearer fixture');assert.equal(calls[2][1].method,'POST');assert.equal(JSON.parse(calls[2][1].body).targetKind,'customer');assert.ok(Object.keys(exports).every(key=>!key.toLowerCase().includes('send')));
});
test('manual review requires a selected record and reason; rapid clicks and uncertain retry preserve one request ID',async()=>{
 const slots=[],calls=[],results=[],effects=[],exports={};let cursor=0,tree,saved=0,ids=0;
 const react={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(value){const i=cursor++;return slots[i]??={current:value};},useEffect(){}};
 const api={gatewayTargets:async()=>({rows:[{kind:'customer',id:'customer-id',name:'Fixture',email:'fixture@example.invalid',phone:'447700900001'}]}),gatewayLink:async(...args)=>{calls.push(args);const result=results.shift();if(result instanceof Error)throw result;return result;}};
 vm.runInNewContext(compile('src/components/WhatsAppGatewayInbox.tsx',fs.readFileSync('src/components/WhatsAppGatewayInbox.tsx','utf8').replace('function ReviewMessage','export function ReviewMessage')),{exports,crypto:{randomUUID:()=>`request-${++ids}`},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:api});
 const walk=node=>!node?[]:Array.isArray(node)?node.flatMap(walk):typeof node==='object'?[node,...walk(node.props?.children)]:[];
 const text=node=>!node?'':Array.isArray(node)?node.map(text).join(''):typeof node==='object'?text(node.props?.children):String(node);
 const nodes=type=>walk(tree).filter(n=>n.type===type),button=label=>nodes('button').find(n=>text(n)===label);
 const render=()=>{cursor=0;tree=exports.ReviewMessage({token:'token',row:{id:'message',version:1,state:'review',reason:'unresolved_provider_identity',atUtc:'2026-01-01',text:'<script>untrusted</script>'},onSaved:()=>saved++});};
 render();assert.equal(button('Confirm link to selected record').props.disabled,true);
 nodes('input')[0].props.onChange({target:{value:'Fixture'}});render();await button('Find records').props.onClick();render();nodes('input').find(n=>n.props.type==='radio').props.onChange();render();
 assert.equal(button('Confirm link to selected record').props.disabled,true);nodes('input').find(n=>n.props.maxLength===500).props.onChange({target:{value:'Verified existing record'}});render();
 results.push(new Error('Temporary unavailable'));const send=button('Confirm link to selected record').props.onClick;await Promise.all([send(),send()]);render();assert.equal(calls.length,1);assert.equal(saved,0);
 results.push({state:'matched'});await button('Confirm link to selected record').props.onClick();render();assert.equal(calls.length,2);assert.equal(calls[0][2].requestId,calls[1][2].requestId);assert.equal(calls[0][2].expectedVersion,1);assert.equal(saved,1);
 assert.ok(!nodes('textarea').length);assert.ok(!button('Send'));assert.ok(text(tree).includes('<script>untrusted</script>'));
});

test('gateway reply composer blocks disabled sends and reuses one request after an uncertain response',async()=>{
 const slots=[],calls=[],results=[],exports={};let cursor=0,tree,ids=0;
 const react={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(value){const i=cursor++;return slots[i]??={current:value};},useEffect(){}};
 vm.runInNewContext(compile('src/components/GatewayReplyComposer.tsx'),{exports,crypto:{randomUUID:()=>`reply-${++ids}`},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:{gatewayReply:async(...args)=>{calls.push(args);const r=results.shift();if(r instanceof Error)throw r;return r;}}});
 const walk=n=>!n?[]:Array.isArray(n)?n.flatMap(walk):typeof n==='object'?[n,...walk(n.props?.children)]:[];
 const text=n=>!n?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
 const nodes=t=>walk(tree).filter(n=>n.type===t),button=label=>nodes('button').find(n=>text(n)===label);
 const render=enabled=>{cursor=0;tree=exports.GatewayReplyComposer({token:'token',id:'source',phone:'+447700900001',enabled});};
 render(false);button('Reply through gateway').props.onClick();render(false);nodes('textarea')[0].props.onChange({target:{value:'Mock reply'}});render(false);assert.equal(button('Send WhatsApp reply').props.disabled,true);await button('Send WhatsApp reply').props.onClick();assert.equal(calls.length,0);
 render(true);results.push(Error('Uncertain response'));const send=button('Send WhatsApp reply').props.onClick;await Promise.all([send(),send()]);render(true);assert.equal(calls.length,1);assert.equal(nodes('textarea')[0].props.value,'Mock reply');
 results.push({id:'reply',text:'Mock reply',state:'queued'});await button('Send WhatsApp reply').props.onClick();render(true);assert.equal(calls.length,2);assert.equal(calls[0][2].requestId,calls[1][2].requestId);assert.deepEqual(Object.keys(calls[1][2]).sort(),['requestId','text']);assert.equal(nodes('textarea')[0].props.value,'');assert.ok(text(tree).includes('Queued — not yet sent'));
});
