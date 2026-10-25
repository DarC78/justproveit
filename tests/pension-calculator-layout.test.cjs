const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function nodes(tree){if(!tree||typeof tree!=='object')return [];const children=tree.props?.children;return [tree,...(Array.isArray(children)?children:[children]).flatMap(nodes)];}
test('calculator form presents work history first and the four actions after personal details',()=>{
  const source=ts.transpileModule(fs.readFileSync('src/pages/ro/calculator-varsta-pensionare.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const exports={};const react={useState:initial=>[initial,()=>{}],useEffect:()=>{},useMemo:fn=>fn()};
  vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:{},URLSearchParams});
  const tree=exports.default();
  const form=nodes(tree).find(n=>n.type==='form');
  const ordered=nodes(form);
  assert.deepEqual(ordered.filter(n=>n.type==='legend').map(n=>n.props.children),['Stagii de cotizare','Situatii speciale pentru vechime','Handicap, daca se aplica','Date de contact','Date personale']);
  const actions=ordered.filter(n=>n.type==='button');
  assert.deepEqual(actions.slice(0,4).map(n=>n.props.children),['Email Simulare','Email cumparare','SMS Cumparare','Trimite Detalii După Vânzare']);
  assert.ok(ordered.indexOf(actions[0])>ordered.findIndex(n=>n.type==='legend'&&n.props.children==='Date personale'));
});


test('after-sale action calculates the current form and requests the legacy after-sale email',async()=>{
  const source=ts.transpileModule(fs.readFileSync('src/pages/ro/calculator-varsta-pensionare.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const calls=[];let stateIndex=0;
  const react={useState:initial=>[stateIndex++===0?{...initial,fullName:'Client Test',email:'client@example.com',phone:'07123456789',birthYear:'1967',birthMonth:'04',normalRoYears:'28',foreignCountry1:'ES',foreignYears1:'6'}:initial,()=>{}],useEffect:()=>{},useMemo:fn=>fn()};
  const api={submitPensionCalculator:async payload=>{calls.push(payload);return {resultId:'saved-result',emailSent:false};},sendPensionCalculatorEmail:async(...args)=>{calls.push(args);return {emailSent:true};}};
  const exports={};
  vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:name==='@/lib/pensionCalculator'?api:{},URLSearchParams});
  const action=nodes(exports.default()).find(n=>n.type==='button'&&String(n.props.children).startsWith('Trimite Detalii'));
  await action.props.onClick();
  assert.equal(calls.length,2);
  assert.equal(calls[0].birthYearMonth,'1967-04');
  assert.equal(calls[0].periods.normalRoYears,28);
  assert.equal(calls[0].foreignPeriods[0].country,'ES');
  assert.equal(calls[0].foreignPeriods[0].years,6);
  assert.equal(calls[1][0],'saved-result');
  assert.equal(calls[1][1].email,'client@example.com');
  assert.equal(calls[1][2],'after_sale');
});
