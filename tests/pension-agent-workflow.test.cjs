const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function all(tree){if(Array.isArray(tree))return tree.flatMap(all);if(!tree||typeof tree!=='object')return [];if(typeof tree.type==='function')return all(tree.type(tree.props));const children=tree.props?.children;return [tree,...(Array.isArray(children)?children:[children]).flatMap(all)];}
function setup(overrides={}) {
 const states=[];let cursor=0;const calls=[];
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useEffect:()=>{}};
 const data={exports:{}};vm.runInNewContext(compile('src/lib/pensionInterview.ts'),{exports:data.exports,Set});
 const response={resultId:'saved-id',emailSent:false,result:{scenarios:[],recommended:{retirementDate:'2030-01'}}};
 const api={submitPensionCalculator:async payload=>{calls.push({kind:'calculate',payload});return response;},sendPensionCalculatorEmail:async()=>{calls.push({kind:'email'});return {emailSent:false,emailError:'Provider unavailable'};},...overrides};
 const exports={};vm.runInNewContext(compile('src/components/PensionAgentWorkflow.tsx'),{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:name==='@/lib/pensionCalculator'?api:data.exports,URLSearchParams,Date,Set,window:{location:{href:'https://example.com/calculator?agent=Test'}}});
 const props={contact:{fullName:'Test User',email:'test@example.com',phone:'447700900001'},onContact:()=>{},onResult:()=>{}};
 return {states,calls,render:()=>{cursor=0;return all(exports.default(props));}};
}
test('interview has five country selectors, digits-only fields, and UK questions upon selection',()=>{
 const h=setup();let nodes=h.render();
 assert.equal(nodes.filter(n=>n.type==='select').length,10); // countries, birth, sex, workbook and residence
 h.states[5][0]={country:'UK',years:''};
 nodes=h.render();assert.ok(nodes.some(n=>n.type==='option'&&n.props.value==='contract'));
 const ro=nodes.find(n=>n.type==='input'&&n.props.pattern==='[0-9]*');
 ro.props.onChange({target:{value:'invalid'}});assert.equal(h.states[1],'');
 ro.props.onChange({target:{value:'20'}});assert.equal(h.states[1],'20');
 const options=nodes.filter(n=>n.type==='option').map(n=>n.props.value);
 for(const country of ['US','CA','IL','UK','CH','NO','MD','UA','VA'])assert.ok(options.includes(country));
 for(let year=1950;year<=1980;year++)assert.ok(options.includes(year));
 assert.ok(options.includes('1980+'));
 const cards=nodes.filter(n=>n.type==='div'&&n.props.className==='space-y-2 rounded-lg border bg-white p-3');
 assert.ok(all(cards[0]).some(n=>n.type==='option'&&n.props.value==='contract'));
 assert.equal(all(cards[1]).some(n=>n.type==='option'&&n.props.value==='contract'),false);
});

test('DA/NU defaults and private-pension follow-up clear stale answers; UK is the first country',()=>{
 const h=setup();let nodes=h.render();
 assert.equal(h.states[2],true);
 const countries=nodes.find(n=>n.type==='select'&&n.props.children.flat?.().some?.(c=>c?.props?.value==='UK'));
 assert.ok(countries);
 h.states[5][0]={country:'UK',years:'7'};
 nodes=h.render();
 const label=text=>nodes.find(n=>n.type==='label'&&n.props.children[0]===text);
 const select=text=>all(label(text)).find(n=>n.type==='select');
 assert.equal(select('Știți unde vă sunt pensiile private?').props.value,'NU');
 assert.equal(Boolean(label('Ați încasat toate pensiile private?')),false);
 select('Știți unde vă sunt pensiile private?').props.onChange({target:{value:'DA'}});
 nodes=h.render();assert.ok(label('Ați încasat toate pensiile private?'));
 select('Ați încasat toate pensiile private?').props.onChange({target:{value:'DA'}});
 select('Știți unde vă sunt pensiile private?').props.onChange({target:{value:'NU'}});
 nodes=h.render();assert.equal(h.states[9],false);
 const countryOptions=all(nodes.find(n=>n.type==='select'&&n.props.value==='UK')).filter(n=>n.type==='option');
 assert.equal(countryOptions[1].props.value,'UK');
});
test('simulation counts Romania groups once and does not send an email automatically',async()=>{
 const h=setup();h.render();h.states[1]='20';h.states[3]='5';h.states[4]='3';h.states[5][0]={country:'UK',years:'15'};h.states[10]='1968-01';
 await h.render().find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(h.calls.length,1);assert.equal(h.calls[0].kind,'calculate');
 assert.equal(h.calls[0].payload.periods.normalRoYears,12);
 assert.equal(h.calls[0].payload.projectFutureContributions,true);
 assert.equal(h.calls[0].payload.interview.ukEmployment,'contract');
});
test('provider failure does not claim email sent or reveal receipt confirmation',async()=>{
 const h=setup();h.render();h.states[19]={resultId:'saved-id',result:{scenarios:[],recommended:null}};
 const button=h.render().find(n=>n.type==='button'&&n.props.onClick);
 await button.props.onClick();
 assert.equal(h.states[17],false);assert.equal(h.states[16],'Provider unavailable');
 assert.equal(JSON.stringify(h.render()).includes('Clientul confirmă că a primit emailul'),false);
 assert.equal(h.states[18],false);
});
test('confirmed email acceptance reveals the receipt step and prevents resending',async()=>{
 let sends=0;
 const h=setup({sendPensionCalculatorEmail:async()=>{sends++;return {emailSent:true};}});
 h.render();h.states[19]={resultId:'saved-id',result:{scenarios:[],recommended:null}};
 await h.render().find(n=>n.type==='button'&&n.props.onClick).props.onClick();
 assert.equal(h.states[17],true);
 assert.ok(JSON.stringify(h.render()).includes('Clientul confirmă că a primit emailul'));
 const button=h.render().find(n=>n.type==='button'&&n.props.onClick);
 assert.equal(button.props.disabled,true);
 await button.props.onClick();
 assert.equal(sends,1);
});
