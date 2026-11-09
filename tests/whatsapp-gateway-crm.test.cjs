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

test('linked gateway messages fill empty lead summaries and preserve newer existing activity',()=>{
 const exports={};vm.runInNewContext(compile('src/lib/whatsappGatewayMerge.ts'),{exports});const row={contactId:'CONTACT',lastInbound:null,lastWhatsApp:null,booking:null,callCount:3};const event={kind:'whatsapp',id:'gateway:one',atUtc:'2026-11-09T21:05:35Z',direction:'inbound',text:'Fixture inbound',source:'Self-hosted WhatsApp'};
 const merged=exports.mergeGatewaySummary(row,event);assert.equal(merged.lastInbound.channel,'whatsapp');assert.equal(merged.lastWhatsApp.text,event.text);assert.equal(merged.callCount,3);assert.equal(row.lastInbound,null);
 const newer={...row,lastInbound:{atUtc:'2026-11-09T22:00:00Z',channel:'email'},lastWhatsApp:{atUtc:'2026-11-09T22:00:00Z',direction:'outbound',text:'Existing'}};assert.equal(exports.mergeGatewaySummary(newer,event).lastWhatsApp.text,'Existing');assert.equal(exports.mergeGatewaySummary(row,null),row);
 const history=exports.mergeGatewayHistory({events:[event],whatsAppMessages:1},[event,{...event,id:'gateway:two'}]);assert.equal(history.events.length,2);assert.equal(history.whatsAppMessages,2);
});
test('feature lead reads request explicit contact summaries before showing a row',async()=>{
 const exports={},calls=[];const row={contactId:'ABC',lastInbound:null,lastWhatsApp:null};const merged={...row,lastInbound:{channel:'whatsapp'}};
 vm.runInNewContext(compile('src/lib/allCustomers.ts'),{exports,URLSearchParams,process:{env:{NEXT_PUBLIC_WHATSAPP_GATEWAY_CRM:'true'}},fetch:async()=>({ok:true,status:200,json:async()=>({scope:'all',limit:5,offset:0,total:1,rows:[row]})}),require:name=>name==='./auth'?{API_BASE_URL:'/api'}:name==='./whatsappGateway'?{gatewaySummaries:async(...args)=>{calls.push(args);return{summaries:{'contact:abc':{kind:'whatsapp'}}};}}:{mergeGatewaySummary:(actual,event)=>{assert.equal(actual,row);assert.equal(event.kind,'whatsapp');return merged;}}});
 const result=await exports.loadCustomerPage('token','all',{name:'Fixture',phone:'',email:''},0,new AbortController().signal,'leads',5);assert.equal(result.rows[0],merged);assert.equal(calls[0][1][0].kind,'contact');assert.equal(calls[0][1][0].id,'ABC');
});
