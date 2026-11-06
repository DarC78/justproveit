const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function nodes(tree){if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return [];return [tree,...nodes(tree.props?.children)];}
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
function setup(search,token='auth',overrides={}) {
 const states=[],deps=[],jobs=[],calls=[];let cursor=0,effect=0;
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>states[i]=typeof value==='function'?value(states[i]):value];},useEffect:(fn,next)=>{const i=effect++;if(JSON.stringify(deps[i])!==JSON.stringify(next)){deps[i]=next;jobs.push(fn);}}};
 const dispatch={};vm.runInNewContext(compile('src/lib/crmDispatch.ts'),{exports:dispatch,URLSearchParams});
 const api={loadCrmDispatchContact:async(...args)=>{calls.push(['lookup',...args]);return {contact:{name:'Latest CRM Name',email:'latest@example.com',phone:'447440526630'}};},saveCrmPensionContactEmail:async(...args)=>{calls.push(['save',...args]);return {action:'added-secondary'};},linkCrmPensionContactEmail:async(...args)=>{calls.push(['link',...args]);return {action:'linked',contactId:'current'};},...overrides};
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

const fixtureConflict={email:'shared@example.com',reviewToken:'fixture-review',current:{id:'current',name:'Fixture caller',phones:['447440526630'],emails:[]},other:{id:'other',name:'Other number',phones:['407700900111'],emails:['shared@example.com']}};
test('conflict review displays both contacts and requires same-person confirmation before linking',async()=>{
 const h=setup('?phone=447440526630&nume=Page&email=shared@example.com','auth',{saveCrmPensionContactEmail:async()=>({action:'email-conflict',conflict:fixtureConflict})});
 h.render();await h.flush();
 await assert.rejects(h.render().find(n=>n.props?.onSaveEmail).props.onSaveEmail(),/Verificați contactele/);
 const workflow=()=>h.render().find(n=>n.props?.onSaveEmail);
 let panel=nodes(workflow().props.contactReview);
 assert.ok(panel.some(n=>n.props?.children==='Other number'));assert.ok(panel.some(n=>n.props?.children==='Fixture caller'));
 assert.equal(panel.find(n=>n.type==='button').props.disabled,true);assert.equal(h.calls.some(c=>c[0]==='link'),false);
 panel.find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
 panel=nodes(workflow().props.contactReview);assert.equal(panel.find(n=>n.type==='button').props.disabled,false);
 await panel.find(n=>n.type==='button').props.onClick();await Promise.resolve();await Promise.resolve();
 assert.equal(h.calls.filter(c=>c[0]==='link').length,1);assert.equal(workflow().props.contactReview,null);assert.match(h.states[2],/Ambele numere/);assert.equal(workflow().props.contactLinkVersion,1);
});
test('editing the email clears the old review and failed links retain the review without claiming success',async()=>{
 const h=setup('?phone=447440526630&nume=Page&email=shared@example.com','auth',{saveCrmPensionContactEmail:async()=>({action:'email-conflict',conflict:fixtureConflict}),linkCrmPensionContactEmail:async()=>{throw Error('Datele s-au schimbat');}});
 h.render();await h.flush();const workflow=()=>h.render().find(n=>n.props?.onSaveEmail);
 await assert.rejects(workflow().props.onSaveEmail());let panel=nodes(workflow().props.contactReview);
 panel.find(n=>n.type==='input').props.onChange({target:{checked:true}});panel=nodes(workflow().props.contactReview);await panel.find(n=>n.type==='button').props.onClick();await Promise.resolve();await Promise.resolve();
 assert.ok(nodes(workflow().props.contactReview).some(n=>n.props?.role==='alert'));assert.equal(workflow().props.contactLinkVersion,0);
 workflow().props.onContact('email','different@example.com');assert.equal(workflow().props.contactReview,null);
});
