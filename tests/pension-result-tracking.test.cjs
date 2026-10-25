const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('src/lib/pensionResultTracking.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019}}).outputText;
function harness(){
  const scripts=[],store=new Map(),session=new Map();
  let masked=true,reloads=0;
  const location={pathname:'/ro/rezultate-simulare/',search:'?tracking=untrusted',hash:'#token=private-result-token',reload(){reloads++;}};
  const window={location,history:{state:{as:'/ro/rezultate-simulare/#token=private-result-token'},replaceState(state,_title,url){this.state=state;location.pathname=url;location.search='';location.hash='';}}};
  const localStorage={setItem(k,v){store.set(k,v);},getItem:k=>store.get(k)};
  const sessionStorage={setItem(k,v){session.set(k,v);},getItem:k=>session.get(k)};
  const document={cookie:'',querySelector:()=>masked?{}:null,createElement:()=>({}),head:{appendChild(s){scripts.push(s);}}};
  const exports={};
  vm.runInNewContext(code,{exports,window,document,localStorage,sessionStorage,URLSearchParams,Date,require:()=>({CLARITY_PROJECT_ID:'xp8gw8yl07'})});
  return {lib:exports,window,scripts,document,localStorage,sessionStorage,mask:v=>{masked=v;},reloads:()=>reloads};
}
test('private token is removed before tracking and refresh can still reopen the result',()=>{
  const h=harness();
  assert.equal(h.lib.preparePensionResultVisit(),'private-result-token');
  assert.equal(h.window.location.hash,'');assert.equal(h.window.location.search,'');
  assert.ok(!JSON.stringify(h.window.history.state).includes('private-result-token'));
  assert.equal(h.scripts.length,0);
  assert.equal(h.lib.preparePensionResultVisit(),'private-result-token');
});
test('only an explicit opt-in on a clean masked page starts pixels and Clarity',()=>{
  const h=harness();assert.equal(h.lib.startPensionResultTracking(),false);assert.equal(h.scripts.length,0);
  h.lib.preparePensionResultVisit();h.mask(false);assert.equal(h.lib.startPensionResultTracking(),false);
  h.mask(true);assert.equal(h.lib.startPensionResultTracking(),true);assert.equal(h.scripts.length,2);
  assert.ok(h.scripts.some(s=>s.src==='https://www.clarity.ms/tag/xp8gw8yl07'));
  assert.ok(!JSON.stringify(h.scripts).includes('private-result-token'));
  assert.equal(h.window.clarity.q[0][0],'consentv2');
  assert.equal(h.window.clarity.q[0][1].analytics_Storage,'granted');
  h.lib.startPensionResultTracking();assert.equal(h.scripts.length,2);
});
test('unavailable consent storage blocks tracking and withdrawal reloads the private document',()=>{
  const h=harness();h.lib.preparePensionResultVisit();h.localStorage.setItem=()=>{throw Error('blocked');};
  assert.equal(h.lib.startPensionResultTracking(),false);assert.equal(h.scripts.length,0);
  const active=harness();active.lib.preparePensionResultVisit();active.lib.startPensionResultTracking();active.lib.stopPensionResultTracking();
  assert.equal(active.window.proveitPensionResultTracking,false);assert.equal(active.reloads(),1);
  assert.equal(active.window.clarity.q.at(-1)[1].analytics_Storage,'denied');
});
test('pixel bootstrap refuses private pages without current opt-in and a sanitized URL',()=>{
  const code=fs.readFileSync('public/advertising-pixels.js','utf8');
  const h=harness();
  h.window.localStorage=h.localStorage;
  h.localStorage.setItem('proveit-advertising-consent-v1',JSON.stringify({value:'granted',expires:Date.now()+10000}));
  h.document.getElementById=()=>null;
  const run=()=>vm.runInNewContext(code,{window:h.window,document:h.document,Date,URL});
  run();assert.equal(h.scripts.length,0);
  h.lib.preparePensionResultVisit();run();assert.equal(h.scripts.length,0);
  h.window.proveitPensionResultTracking=true;h.window.location.hash='#private';run();assert.equal(h.scripts.length,0);
  h.window.location.hash='';run();assert.equal(h.scripts.length,3);
});

test('analytics and advertising choices are independent and refusing both loads no SDK',()=>{
  for(const choice of [{advertising:false,analytics:false},{advertising:true,analytics:false},{advertising:false,analytics:true}]){
    const h=harness();h.lib.preparePensionResultVisit();assert.equal(h.lib.startPensionResultTracking(choice),true);
    assert.equal(h.scripts.some(s=>s.id==='proveit-advertising-loader'),choice.advertising);
    assert.equal(h.scripts.some(s=>s.id==='microsoft-clarity'),choice.analytics);
    if(choice.analytics)assert.equal(h.window.clarity.q[0][1].ad_Storage,'denied');
  }
});
