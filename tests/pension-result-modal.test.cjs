const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
function nodes(tree){if(!tree||typeof tree!=='object')return [];const children=tree.props?.children;return [tree,...(Array.isArray(children)?children:[children]).flatMap(nodes)];}
function hooks(){const state=[],effects=[];let index=0;return {state,effects,reset(){index=0;effects.length=0;},react:{useState(initial){const n=index++;if(!(n in state))state[n]=initial;return [state[n],value=>{state[n]=value;}];},useRef:()=>({current:{close(){}}}),useEffect:effect=>effects.push(effect)}};}
function load(file,deps,globals={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{exports,require:name=>deps[name],...globals});return exports.default;}
test('initial modal has Accept and Settings; settings permit refusal and result access',()=>{
 const h=hooks(),choices=[];let continued=0;
 const Component=load('src/components/PensionResultTrackingChoice.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/lib/pensionResultTracking':{startPensionResultTracking:c=>{choices.push(c);return true;},stopPensionResultTracking(){}}});
 const render=()=>{h.reset();return Component({onContinue:()=>continued++});};
 let tree=render();assert.equal(tree.type,'dialog');assert.ok(tree.props['aria-labelledby']);
 assert.deepEqual(nodes(tree).filter(n=>n.type==='button').map(n=>n.props.children),['Accept','Settings']);
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='Settings').props.onClick();tree=render();
 assert.deepEqual(nodes(tree).filter(n=>n.type==='input').map(n=>n.props.checked),[false,false]);
 assert.equal(choices.length,0);assert.equal(continued,0);
 nodes(tree).find(n=>n.type==='button'&&n.props.children==='Continuă fără tracking').props.onClick();
 assert.equal(choices[0].analytics,false);assert.equal(choices[0].advertising,false);assert.equal(continued,1);
 assert.equal(render().type,'button');
});
test('Accept enables both categories and allows viewing even if scripts are blocked',()=>{
 const h=hooks();let choice,continued=0;
 const Component=load('src/components/PensionResultTrackingChoice.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/lib/pensionResultTracking':{startPensionResultTracking:c=>{choice=c;return false;},stopPensionResultTracking(){}}});
 h.reset();const tree=Component({onContinue:()=>continued++});nodes(tree).find(n=>n.type==='button'&&n.props.children==='Accept').props.onClick();
 assert.equal(choice.analytics,true);assert.equal(choice.advertising,true);assert.equal(continued,1);
});
test('saved results are not requested or rendered until the modal choice is resolved',async()=>{
 const h=hooks();let requests=0;
 function Choice(){}function Panel(){}
 const Component=load('src/pages/ro/rezultate-simulare.tsx',{'react':h.react,'react/jsx-runtime':jsx,'@/components/PensionResultTrackingChoice':Choice,'@/components/PensionResultPanel':Panel,'@/lib/pensionResultTracking':{preparePensionResultVisit:()=> 'private-token'},'@/lib/auth':{API_BASE_URL:'https://example.test'},'next/link':'a','next/head':'head'},{AbortController,fetch:async()=>{requests++;return {ok:true,json:async()=>({success:true,result:{scenarios:[]}})};}});
 const render=()=>{h.reset();const tree=Component();for(const effect of h.effects)effect();return tree;};
 let tree=render();tree=render();assert.equal(requests,0);assert.equal(nodes(tree).some(n=>n.type===Panel),false);
 nodes(tree).find(n=>n.type===Choice).props.onContinue();render();assert.equal(requests,1);
 await new Promise(resolve=>setImmediate(resolve));tree=render();assert.equal(nodes(tree).some(n=>n.type===Panel),true);
});
