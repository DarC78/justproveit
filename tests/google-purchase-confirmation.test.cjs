const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const capture=fs.readFileSync('public/email-attribution.js','utf8');
function landing(path){
 const w={location:{href:'https://www.justproveit.co.uk'+path},history:{state:{},replaceState:(_,__,url)=>{w.clean=url;w.location.href='https://www.justproveit.co.uk'+url;}}};
 vm.runInNewContext(capture,{window:w,document:{createElement:()=>({}),head:{appendChild:()=>{}}},URL});return w;
}
test('checkout bearer is stripped before SDKs and retained only in the private document',()=>{
 const id='cs_live_'+'a'.repeat(30),w=landing('/plata-confirmata/?source=justproveit&session_id='+id);
 assert.equal(w.clean,'/plata-confirmata/');assert.equal(w.proveitPaidCheckout.sessionId,id);assert.equal(w.proveitPaidCheckout.source,'justproveit');
 assert.equal(landing('/plata-confirmata/?source=evil&session_id='+id).proveitPaidCheckout,undefined);
 assert.equal(landing('/plata-confirmata/?session_id='+id+'&session_id='+id).proveitPaidCheckout,undefined);
 assert.equal(landing('/bani-uk-multumim/?session_id='+id).proveitPaidCheckout.source,'proveit');
});
test('same-origin proxy rejects foreign origins and user-supplied identities before any upstream call',async()=>{
 const {createHandler}=require('../api/shared/googlePurchaseConsentProxy');let calls=[];
 const handler=createHandler({env:{AzureFunctionsWebHost__hostid:'justproveit-inhouse'},fetchImpl:async(...args)=>(calls.push(args),{status:200,json:async()=>({paid:true})})});
 const c={};await handler(c,{headers:{origin:'https://untrusted.invalid'},body:{}});assert.equal(c.res.status,403);assert.equal(calls.length,0);
 await handler(c,{headers:{origin:'https://www.justproveit.co.uk'},body:{email:'forged@example.com'}});assert.equal(c.res.status,400);assert.equal(calls.length,0);
 await handler(c,{headers:{origin:'https://www.justproveit.co.uk'},body:{source:'proveit',sessionId:'cs_live_'+'a'.repeat(30),action:'verify'}});
 assert.equal(c.res.status,200);assert.equal(calls[0][0],'http://127.0.0.1:7076/api/justproveit/public/google-purchase-consent');assert.equal(calls[0][1].headers.Origin,'https://www.justproveit.co.uk');assert.equal(c.res.headers['Cache-Control'],'no-store');assert.equal(c.res.headers['Access-Control-Allow-Origin'],undefined);
});
function load(source,requires,globals={}){
 const exports={};const js=ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(js,{exports,require:name=>name in requires?requires[name]:require(name),...globals});return exports;
}
test('a persisted server refusal cannot become a local grant',async()=>{
 const values=new Map(),reference={source:'proveit',sessionId:'cs_live_'+'a'.repeat(30)};
 const lib=load('src/lib/googlePurchaseConsent.ts',{'@/lib/googleAdvertising':{GOOGLE_CONSENT_KEY:'google-choice'}},{AbortSignal,localStorage:{setItem:(k,v)=>values.set(k,v)},fetch:async()=>({ok:true,json:async()=>({saved:true,adUserData:'denied',adPersonalization:'denied'})})});
 await lib.savePaidCheckoutChoice(reference,true,true);assert.equal(JSON.parse(values.get('google-choice')).adUserData,'denied');
});
test('payment consent is optional, unchecked and separate from payment fulfillment',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const C=load('src/components/GooglePurchaseConsent.tsx',{'@/lib/googlePurchaseConsent':{savePaidCheckoutChoice:async()=>{throw Error('must not run on render');}},'@/lib/googlePurchaseCopy':load('src/lib/googlePurchaseCopy.ts',{})}).default;
 const html=renderToStaticMarkup(React.createElement(C,{reference:{source:'proveit',sessionId:'cs_live_'+'a'.repeat(30)}}));
 assert.equal((html.match(/type="checkbox"/g)||[]).length,2);assert.ok(!html.includes('checked=""'));assert.ok(!html.includes('required=""'));assert.ok(html.includes('Refuz ambele'));assert.ok(html.includes('nu afectează'));
});
test('private receipt is excluded from session recording and has no-cache hosting headers',()=>{
 const clarity=fs.readFileSync('src/lib/clarity.ts','utf8');assert.ok(clarity.includes('"/plata-confirmata"'));
 const rule=require('../public/staticwebapp.config.json').routes.find(r=>r.route==='/plata-confirmata*');assert.equal(rule.headers['Referrer-Policy'],'no-referrer');assert.equal(rule.headers['Cache-Control'],'no-store');
 assert.ok(fs.readFileSync('infrastructure/inhouse/prepare-routing.mjs','utf8').includes('routes.length!==13'));
});
