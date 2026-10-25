const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function nodes(tree){if(!tree||typeof tree!=='object')return [];const children=tree.props?.children;return [tree,...(Array.isArray(children)?children:[children]).flatMap(nodes)];}
test('calculator form presents work history first and the three actions after personal details',()=>{
  const source=ts.transpileModule(fs.readFileSync('src/pages/ro/calculator-varsta-pensionare.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const exports={};const react={useState:initial=>[initial,()=>{}],useEffect:()=>{},useMemo:fn=>fn()};
  vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?jsx:{},URLSearchParams});
  const tree=exports.default();
  const form=nodes(tree).find(n=>n.type==='form');
  const ordered=nodes(form);
  assert.deepEqual(ordered.filter(n=>n.type==='legend').map(n=>n.props.children),['Stagii de cotizare','Situatii speciale pentru vechime','Handicap, daca se aplica','Date de contact','Date personale']);
  const actions=ordered.filter(n=>n.type==='button');
  assert.deepEqual(actions.slice(0,3).map(n=>n.props.children),['Email Simulare','Email cumparare','SMS Cumparare']);
  assert.ok(ordered.indexOf(actions[0])>ordered.findIndex(n=>n.type==='legend'&&n.props.children==='Date personale'));
});
