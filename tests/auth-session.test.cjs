const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {JSDOM}=require('jsdom');
const {createRoot}=require('react-dom/client');
global.IS_REACT_ACT_ENVIRONMENT=true;
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const support={id:'support-id',email:'admin@example.com',name:'Admin',supportAdmin:true};
const regular={id:'user-id',email:'user@example.com',name:'User',supportAdmin:false};
function fixture(responder){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://www.justproveit.co.uk/login/'});
 global.window=dom.window;global.document=dom.window.document;
 const calls=[],exports={};
 vm.runInNewContext(compile('src/lib/auth.ts'),{exports,window,process:{env:{}},Headers,AbortController,DOMException,Error,fetch:async(url,options)=>{calls.push({url,options});return responder(url,options);}});
 return {dom,api:exports,calls,store:window.localStorage};
}
const response=(body,status=200)=>({ok:status===200,status,statusText:'test',json:async()=>body});
test('support login accepts the actual token-only API response; regular logins still require refresh data',async()=>{
 const f=fixture(()=>response({user:support,token:'access',refreshToken:null}));
 const session=await f.api.loginRequest('admin@example.com','synthetic');
 assert.equal(session.token,'access');assert.equal(session.refreshToken,null);assert.equal(session.user.supportAdmin,true);
 const normal=fixture(()=>response({user:regular,token:'access',refreshToken:'refresh'}));
 assert.equal((await normal.api.loginRequest('user@example.com','synthetic')).refreshToken,'refresh');
 const incomplete=fixture(()=>response({user:regular,token:'access',refreshToken:null}));
 await assert.rejects(incomplete.api.loginRequest('user@example.com','synthetic'),/missing session data/);
});
test('saving token-only support access removes a previous refresh token instead of storing null as text',()=>{
 const f=fixture(()=>assert.fail());f.store.setItem('jpi-refresh-token','old-refresh');
 f.api.saveStoredSession({user:support,token:'access',refreshToken:null});
 assert.equal(f.store.getItem('jpi-refresh-token'),null);assert.equal(f.api.getStoredSession().refreshToken,null);
});
async function restore({user=support,refreshToken=null,me=support,expired=false}){
 const f=fixture(url=>url.endsWith('/auth/me')?response(expired?{error:'Invalid token'}:me,expired?401:200):assert.fail('Unexpected refresh request'));
 f.api.saveStoredSession({user,token:'stored-access',refreshToken});
 const exports={};vm.runInNewContext(compile('src/context/AuthContext.tsx'),{exports,require:name=>name==='@/lib/auth'?f.api:require(name)});
 let snapshot;function Probe(){snapshot=exports.useAuth();return React.createElement('span',null,snapshot.status);}
 const root=createRoot(document.getElementById('root'));
 await React.act(async()=>{root.render(React.createElement(exports.AuthProvider,null,React.createElement(Probe)));});
 const result={status:snapshot.status,isAdmin:snapshot.isAdmin,token:snapshot.token,storedToken:f.store.getItem('jpi-access-token'),calls:f.calls};
 await React.act(async()=>root.unmount());f.dom.window.close();return result;
}
test('a token-only support session survives reload only after server verification',async()=>{
 const result=await restore({});assert.equal(result.status,'authenticated');assert.equal(result.isAdmin,true);assert.equal(result.token,'stored-access');assert.equal(result.calls.length,1);
});
test('expired support access is cleared without attempting refresh with a null token',async()=>{
 const result=await restore({expired:true});assert.equal(result.status,'anonymous');assert.equal(result.storedToken,null);assert.equal(result.calls.length,1);
});
test('editing a local support flag cannot restore access when the API returns a regular user',async()=>{
 const result=await restore({me:regular});assert.equal(result.status,'anonymous');assert.equal(result.token,null);assert.equal(result.storedToken,null);
});
test('standard refresh-enabled sessions retain their normal reload behavior',async()=>{
 const result=await restore({user:regular,refreshToken:'regular-refresh',me:regular});assert.equal(result.status,'authenticated');assert.equal(result.isAdmin,false);
});
