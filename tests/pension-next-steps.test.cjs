const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const load=(file,require)=>{const exports={};vm.runInNewContext(compile(file),{exports,require,Date,Set});return exports;};
const lib=load('src/lib/pensionNextSteps.ts',()=>({}));
const data=load('src/lib/pensionInterview.ts',()=>({}));
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
function walk(tree){if(Array.isArray(tree))return tree.flatMap(walk);if(!tree||typeof tree!=='object')return [];if(typeof tree.type==='function')return walk(tree.type(tree.props));return [tree,...walk(tree.props?.children)];}
function text(tree){if(Array.isArray(tree))return tree.map(text).join('');if(!tree||typeof tree!=='object')return String(tree??'');if(typeof tree.type==='function')return text(tree.type(tree.props));return text(tree.props?.children);}
test('preparation window handles passed, near, exactly two years, far, and invalid dates',()=>{
 const now=new Date('2026-11-15T00:00:00Z');
 assert.match(lib.preparationTiming('2025-06',now),/a trecut deja/);
 assert.match(lib.preparationTiming('2026-11',now),/a sosit/);
 assert.match(lib.preparationTiming('2027-03',now),/cel mult 2 ani/);
 assert.match(lib.preparationTiming('2028-11',now),/cel mult 2 ani/);
 assert.equal(lib.preparationTiming('2030-01',now),'între 2028-01 și 2029-01.');
 assert.match(lib.preparationTiming(null,now),/verificarea datei/);
});
test('saved result shows seven steps, sorted milestones, correct office and both service links',()=>{
 const states=[];let cursor=0;
 const react={useState:initial=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],value=>{states[i]=value;}];}};
 const {default:Component}=load('src/components/PensionNextSteps.tsx',name=>name==='react'?react:name==='react/jsx-runtime'?jsx:name==='@/lib/pensionInterview'?data:lib);
 const result={recommended:{label:'Pensie anticipată cu penalizare',retirementAge:{years:60,months:0},retirementDate:'2030-03'},foreignPensionSections:[{countryName:'Italia',retirementDate:'2034-03'},{countryName:'UK',retirementDate:'2033-03'},{countryName:'Turcia'}]};
 const render=()=>{cursor=0;return Component({result,residenceCountry:'UK'});};
 let tree=render(),nodes=walk(tree),body=text(tree);
 assert.ok(body.indexOf('2033-03')<body.indexOf('2034-03'));
 assert.match(body,/pensiona în România/);
 assert.match(body,/județul Covasna/);
 assert.match(body,/International Pension Centre/);
 assert.match(body,/45 de zile de la comunicare/);
 assert.equal(nodes.filter(n=>n.type==='h3'&&text(n).startsWith('Pasul ')).length,7);
 assert.equal(nodes.filter(n=>n.type==='a'&&n.props.href==='https://www.proveitweb.co.uk/salepensieinternationala').length,2);
 assert.equal(nodes.some(n=>n.type==='select'),false);
 const whatsapp=nodes.find(n=>n.type==='a'&&n.props.href==='https://wa.me/447447707829?text=WEB_REZULTATE_SIMULARE');
 assert.equal(text(whatsapp),'Cere detalii pe WhatsApp');
 assert.ok(body.indexOf('Județul Covasna este centru de competență')<body.indexOf('Orientativ, comunicarea'));
 assert.match(body,/indiferent de județul în care aveați domiciliul în România/);
 assert.ok(nodes.some(n=>n.type==='a'&&n.props.href==='https://www.cnpp.ro/intrebari_frecvente/cum-si-in-ce-termen-se-contesta-decizia-de-pensie/'));
 body=text(Component({result,residenceCountry:'IT'}));assert.match(body,/județul de referință/);assert.match(body,/INPS/);
 body=text(Component({result}));assert.doesNotMatch(body,/Selectați țara|Alegeți țara/);
});
