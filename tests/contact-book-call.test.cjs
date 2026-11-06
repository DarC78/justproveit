const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/components/ContactBookCall.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const tick=()=>new Promise(r=>setImmediate(r));
function harness(bookings=[]){
 const slots=[],effects=[],calls=[],results=[],changes=[];let cursor=0,tree,id=0;
 const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(v){const i=cursor++;return slots[i]??={current:v};},useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,n)=>v!==slots[i][n])){slots[i]=deps;effects.push(fn);}}};
 const exports={};vm.runInNewContext(compiled,{exports,Intl,Date,crypto:{randomUUID:()=>`request-${++id}`},require:n=>n==='react'?react:n==='react/jsx-runtime'?{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})}:{loadContactBooking:async()=>({contactId:'contact',phone:'447700900001',bookings}),bookContactCall:async(...args)=>{calls.push(args);const r=results.shift();if(r instanceof Error)throw r;return r;}}});
 const walk=n=>!n?[]:Array.isArray(n)?n.flatMap(walk):typeof n==='object'?[n,...walk(n.props?.children)]:[];
 const text=n=>!n?'':Array.isArray(n)?n.map(text).join(''):typeof n==='object'?text(n.props?.children):String(n);
 const nodes=type=>walk(tree).filter(n=>n.type===type),button=label=>nodes('button').find(n=>text(n)===label);
 function render(){cursor=0;tree=exports.default({token:'fixture',contactId:'contact',name:'Fixture',onBooked:r=>changes.push(r)});for(const n of nodes('dialog'))n.props.ref.current={showModal(){}};effects.splice(0).forEach(fn=>fn());}
 return {render,nodes,button,calls,results,changes,async open(){render();button('Book a Call').props.onClick();await tick();render();},submit(){return nodes('form')[0].props.onSubmit({preventDefault(){}});}};
}
test('new booking uses verified contact snapshot, UK time limit and cancellation sends nothing',async()=>{
 const h=harness();await h.open();assert.equal(h.nodes('input').find(n=>n.props.type==='time').props.min,'10:00');h.button('Renunta').props.onClick();h.render();assert.equal(h.calls.length,0);assert.equal(h.nodes('dialog').length,0);
 await h.open();h.results.push({success:true});await h.submit();assert.equal(h.calls[0][2].expectedBookingId,null);assert.equal(h.calls[0][2].expectedPhone,'447700900001');assert.equal(h.changes.length,1);
});
test('reschedule targets selected active booking and retry retains request ID; double clicks submit once',async()=>{
 const h=harness([{id:'booking',appointmentAtUtc:'2030-06-01T09:00:00.000Z',serviceName:'Fixture'}]);await h.open();h.results.push(new Error('Temporary failure'));const pending=h.submit();h.submit();await pending;h.render();assert.equal(h.calls.length,1);assert.equal(h.calls[0][2].expectedBookingId,'booking');assert.equal(h.calls[0][2].expectedAppointmentAtUtc,'2030-06-01T09:00:00.000Z');
 h.results.push({success:true});await h.submit();assert.equal(h.calls[1][2].requestId,h.calls[0][2].requestId);assert.equal(h.changes.length,1);
});

test('Book a Call has button styling before the modal is opened',()=>{const h=harness();h.render();assert.ok(h.button('Book a Call'));assert.ok(h.nodes('style').some(n=>String(n.props.children).includes('border:1px solid #cbd5e1')));});
