const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('list groups marked calls, loads audio only on demand and removes labels independently',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 let downloads=0,removed,revoked=0;const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;URL.createObjectURL=()=> 'blob:fixture';URL.revokeObjectURL=()=>revoked++;
 const report={totalLeads:1,totalCalls:1,rows:[{contactId:'lead',name:'Fixture Lead',phone:'447700900001',calls:[{callId:'123',mark:{atUtc:'2026-11-23T12:00Z',actor:'Agent'},atUtc:'2026-11-20T12:00Z',available:true,recordings:[{recordingId:7,transcription:{status:'completed',transcript:'Saved text'}}]}]}]};
 const mocks={'@/lib/crmAdmin':{getCallsToListen:async()=>report,getCallListeningAudio:async(...args)=>{assert.deepEqual(args.slice(0,4),['token','lead','123',7]);downloads++;return new Blob(['audio']);},setCallListeningLabel:async(...args)=>{removed=args;}},'./PhoneHistoryModal':{CallTranscriptRow:({item})=>React.createElement('p',null,item.transcript)},'./LeadPhoneHistory':{__esModule:true,default:()=>null}};
 const mod={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('src/components/CallsToListenPanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText)(n=>mocks[n]||require(n),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));const click=async text=>React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent===text).click());
 try{await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'token'})));assert.match(document.body.textContent,/Fixture Lead/);assert.match(document.body.textContent,/Saved text/);assert.equal(downloads,0);
 await click('Listen to recording');assert.equal(downloads,1);assert.equal(document.querySelector('audio').src,'blob:fixture');
 await click('Remove from listening list');assert.deepEqual(removed.slice(0,4),['token','contact','lead','123']);assert.equal(removed[4].marked,false);assert.ok(removed[4].requestId);
 }finally{await React.act(async()=>root.unmount());assert.equal(revoked,1);URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close();}
});
