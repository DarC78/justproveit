const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('pending replies use peach history styling and a scheduled UK time without claiming delivery',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),mod={exports:{}};
 new Function('require','module','exports',compile('src/components/PhoneHistoryModal.tsx'))(n=>n==='react'||n==='react/jsx-runtime'?require(n):n==='@/lib/crmAdmin'?{}:{__esModule:true,default:()=>null},mod,mod.exports);
 const html=renderToStaticMarkup(React.createElement(mod.exports.PhoneHistoryTimeline,{paged:true,events:[{kind:'whatsapp',id:'scheduled',direction:'outbound',atUtc:'2026-11-15T13:00Z',author:'Synthetic agent',text:'Pending reply',messageType:'text',status:'scheduled',source:'Scheduled WhatsApp reply',scheduledAtUtc:'2026-11-16T09:00Z'}]}));
 assert.match(html,/class="outbound scheduled-pending"/);assert.match(html,/#ffedd5/);assert.match(html,/Pending: scheduled for/);assert.match(html,/16 Nov 2026, 09:00:00/);assert.doesNotMatch(html,/Accepted by WhatsApp|WhatsApp Mediatel/);
});
test('scheduled reply uses the shared draft directly and preserves the same request after failure',async()=>{
 const slots=[],effects=[],calls=[],changes=[],exports={};let cursor=0,tree,fail=true;
 const react={useState(v){const i=cursor++;if(!(i in slots))slots[i]=v;return[slots[i],v=>slots[i]=v];},useRef(v){const i=cursor++;return slots[i]??={current:v};},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i][j])){slots[i]=deps;effects.push(fn);}}};
 vm.runInNewContext(compile('src/components/ScheduleWhatsAppReply.tsx'),{exports,Intl,Date,Error,process:{env:{}},crypto:{randomUUID:()=> 'stable-request'},CustomEvent:class{},window:{dispatchEvent(){}},fetch:async(_url,options)=>{calls.push(options);if(options.method==='POST'&&fail){fail=false;throw Error('SIMULATED uncertain response');}return{ok:true,json:async()=>({success:true,action:'schedule-reply',contactId:'contact',messageId:'queued',scheduledAtUtc:'2030-01-07T09:00:00Z'})};},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:{API_BASE_URL:'https://api.invalid'}});
 const walk=n=>!n?[]:Array.isArray(n)?n.flatMap(walk):typeof n==='object'?[n,...walk(n.props?.children)]:[],text=n=>!n?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n),nodes=t=>walk(tree).filter(n=>n.type===t),button=s=>nodes('button').find(n=>text(n)===s);
 const locks=[];
 const render=(draft=' Future reply ')=>{cursor=0;tree=exports.default({token:'token',contactId:'contact',text:draft,phone:'447700900123',onLockChange:v=>locks.push(v),onScheduled:()=>changes.push(true)});};
 render('');assert.equal(button('Schedule Reply').props.disabled,true);assert.equal(calls.length,0);
 render();assert.equal(nodes('dialog').length,0);assert.equal(nodes('textarea').length,0);
 button('Schedule Reply').props.onClick();button('Schedule Reply').props.onClick();await new Promise(setImmediate);render();
 assert.equal(calls.length,1);assert.equal(calls[0].method,'POST');assert.equal(JSON.parse(calls[0].body).text,'Future reply');assert.deepEqual(locks,[true]);assert.ok(button('Retry same message'));
 button('Retry same message').props.onClick();await new Promise(setImmediate);render('');
 assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(changes.length,1);assert.deepEqual(locks,[true,true,false]);assert.equal(nodes('dialog').length,0);assert.match(text(tree),/Scheduled for/);
});
