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

test('call and monitoring APIs stay authenticated and use no outbound operation',async()=>{
 const calls=[],exports={};vm.runInNewContext(compile('src/lib/whatsappGateway.ts'),{exports,require:()=>({fetchJson:async(...args)=>{calls.push(args);return{};}})});await exports.gatewayOperations('fixture');await exports.gatewayCalls('fixture');assert.equal(calls[0][0],'/justproveit/admin/crm/whatsapp-gateway/operations');assert.equal(calls[1][0],'/justproveit/admin/crm/whatsapp-gateway/calls');assert.ok(calls.every(c=>c[1].headers.Authorization==='Bearer fixture'&&!c[1].method));
});

test('call linking selects a lead with a note; locks uncertain edits and retries one audited request',async()=>{
 const slots=[],calls=[],results=[],exports={};let cursor=0,tree,saved=0,ids=0;
 const react={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v];},useRef(value){const i=cursor++;return slots[i]??={current:value};}};
 const api={gatewayCallTargets:async(_token,query)=>{assert.equal(query,'Fixture');return{rows:[{kind:'contact',id:'contact-id',name:'Fixture lead',phone:'447700900001'}]};},gatewayCallLink:async(...args)=>{calls.push(args);const result=results.shift();if(result instanceof Error)throw result;return result;}};
 vm.runInNewContext(compile('src/components/WhatsAppGatewayCallLink.tsx'),{exports,crypto:{randomUUID:()=>`request-${++ids}`},require:name=>name==='react'?react:name==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:api});
 const walk=n=>!n?[]:Array.isArray(n)?n.flatMap(walk):typeof n==='object'?[n,...walk(n.props?.children)]:[],text=n=>!n?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
 const nodes=type=>walk(tree).filter(n=>n.type===type),button=label=>nodes('button').find(n=>text(n)===label);
 let call={id:'call',contactId:null,customerId:null,linkKey:'key',callToken:'opaque',linkSnapshot:'snapshot-1'};
 const render=()=>{cursor=0;tree=exports.default({token:'token',call,onSaved:()=>saved++,onRefresh:async()=>{saved++;return call;}});};
 render();button('Link to lead').props.onClick();render();assert.equal(button('Confirm link to selected lead').props.disabled,true);
 nodes('input')[0].props.onChange({target:{value:'Fixture'}});render();await button('Find leads').props.onClick();await new Promise(r=>setImmediate(r));render();
 nodes('input').find(n=>n.props.type==='radio').props.onChange();render();assert.equal(button('Confirm link to selected lead').props.disabled,true);
 nodes('input').find(n=>n.props.maxLength===500).props.onChange({target:{value:'Verified call participant'}});render();
 results.push(new Error('Timeout'));const click=button('Confirm link to selected lead').props.onClick;click();click();await new Promise(r=>setImmediate(r));render();
 assert.equal(calls.length,1);assert.equal(saved,0);assert.ok(nodes('input').every(n=>n.props.disabled));
 call={...call,linkSnapshot:'snapshot-2'};render();results.push({contactId:'contact-id',leadName:'Fixture lead'});button('Retry same action').props.onClick();await new Promise(r=>setImmediate(r));render();
 assert.equal(calls.length,2);assert.equal(calls[0][2].requestId,calls[1][2].requestId);assert.equal(calls[1][2].expectedSnapshot,'snapshot-1');assert.equal(calls[1][2].contactId,'contact-id');assert.equal(saved,1);
 assert.ok(text(tree).includes('Call linked to Fixture lead.'));
 // Conflict preserves the note and requires a refresh, and unlink is explicit.
 call={...call,contactId:'contact-id',leadName:'Fixture lead'};render();button('Change linked lead').props.onClick();render();
 nodes('input').find(n=>n.props.maxLength===500).props.onChange({target:{value:'Wrong participant verified'}});render();
 call={...call,linkSnapshot:'snapshot-3'};render();
 results.push(Object.assign(new Error('version_conflict'),{status:409}));button('Unlink call and return to review').props.onClick();await new Promise(r=>setImmediate(r));render();
 assert.equal(calls[2][2].contactId,null);assert.equal(calls[2][2].expectedSnapshot,'snapshot-2');assert.equal(nodes('input').find(n=>n.props.maxLength===500).props.value,'Wrong participant verified');assert.equal(button('Unlink call and return to review').props.disabled,true);
 await button('Refresh call').props.onClick();render();assert.equal(saved,2);assert.equal(button('Unlink call and return to review').props.disabled,false);
});

test('call lead search and audited link API use dedicated authenticated routes',async()=>{
 const calls=[],exports={};vm.runInNewContext(compile('src/lib/whatsappGateway.ts'),{exports,require:()=>({fetchJson:async(...args)=>{calls.push(args);return{};}})});
 await exports.gatewayCallTargets('token','A+B');await exports.gatewayCallLink('token','key',{requestId:'id',callToken:'opaque',expectedSnapshot:'hash',contactId:null,reason:'Reviewed'});
 assert.equal(calls[0][0],'/justproveit/admin/crm/whatsapp-gateway/calls/targets?q=A%2BB');assert.equal(calls[1][0],'/justproveit/admin/crm/whatsapp-gateway/calls/key/link');assert.equal(calls[1][1].headers.Authorization,'Bearer token');assert.equal(JSON.parse(calls[1][1].body).contactId,null);
});
