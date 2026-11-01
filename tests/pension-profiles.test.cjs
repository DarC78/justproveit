const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('segment export preserves fields, escapes CSV formulas and deduplicates contacts using latest profile',()=>{
 const exports={};vm.runInNewContext(compile('src/lib/pensionProfiles.ts'),{exports,Set});
 const base={contactId:'contact',name:'=HYPERLINK("bad")',phone:'447771866203',country:'GB',age:58,totalYears:33,categories:[{category:'international',priority:1,provisional:false},{category:'private',priority:1,provisional:true}],answers:{ukAgency:true},work:[{countryCode:'RO',years:20},{countryCode:'GB',years:13}],updatedAtUtc:'2026-11-01'};
 const csv=exports.pensionProfilesCsv([base,{...base,phone:'old-number'}]);
 assert.equal(csv.includes('old-number'),false);assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('RO:20;GB:13'));assert.equal(csv.split('\r\n').length,2);assert.ok(csv.includes('Declared years (overlaps included)'));
});
test('CRM panel applies intersecting priorities and passes the session token to the loader',async()=>{
 const states=[],calls=[];let cursor=0,effect;const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useEffect:fn=>{effect=fn;}};
 const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
 const api={getPensionProfiles:async(token,filters)=>{calls.push({token,filters});return {rows:[],total:0};}};
 const exports={};vm.runInNewContext(compile('src/components/PensionQualificationProfiles.tsx'),{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:name==='@/lib/crmAdmin'?api:{pensionProfilesCsv:()=>''},Date,JSON});
 const all=tree=>Array.isArray(tree)?tree.flatMap(all):tree&&typeof tree==='object'?[tree,...all(tree.props?.children)]:[];
 const render=()=>{cursor=0;return exports.default({token:'session-token'});};let tree=render();
 for(const name of ['Pensie internațională','Pensie privată UK']){const label=all(tree).find(n=>n.type==='label'&&n.props.children[0]===name);all(label).find(n=>n.type==='select').props.onChange({target:{value:'1'}});}
 tree=render();all(tree).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});render();effect();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls.length,1);assert.equal(calls[0].token,'session-token');assert.equal(calls[0].filters.internationalPriority,'1');assert.equal(calls[0].filters.privatePriority,'1');
});
