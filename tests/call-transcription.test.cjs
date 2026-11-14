const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const source=ts.transpileModule(fs.readFileSync('src/components/PhoneHistoryModal.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const loaded={exports:{}};new Function('require','module','exports',source)(name=>name==='./MediatelMessageAttachment'?{__esModule:true,default:()=>null}:name==='./GatewayMessageMedia'?{__esModule:true,default:()=>null}:name==='@/lib/crmAdmin'?{}:/(?:WhatsApp|Sms)ReplyComposer/.test(name)?{default:()=>null}:require(name),loaded,loaded.exports);
test('call summary is shown beside its call; full transcript expands on demand as safe text',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const root=createRoot(document.getElementById('root'));const event={kind:'call',id:'call:123',atUtc:'2026-11-06T12:00:00Z',endedAtUtc:null,agent:'Daniel',callType:'Outgoing',resolution:'VA_CUMPARA',callCode:7,durationSeconds:60,talkSeconds:50,transcriptions:[{recordingId:7,status:'completed',summary:'Clientul dorește serviciul.',transcript:'<script>untrusted()</script>\nConvorbire completă.'}]};
 try{
  await React.act(async()=>root.render(React.createElement(loaded.exports.PhoneHistoryTimeline,{events:[event]})));
  assert.match(document.querySelector('li.call').textContent,/Clientul dorește serviciul/);assert.doesNotMatch(document.body.textContent,/Convorbire completă/);
  let button=document.querySelector('button');assert.equal(button.textContent,'View full transcript');assert.equal(button.getAttribute('aria-expanded'),'false');
  await React.act(async()=>button.click());assert.equal(button.getAttribute('aria-expanded'),'true');assert.match(document.getElementById('transcript-7').textContent,/<script>/);assert.equal(document.querySelector('script'),null);
  await React.act(async()=>button.click());assert.equal(document.getElementById('transcript-7'),null);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('unavailable audio is clearly pending and has no invented summary or transcript button',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;const root=createRoot(document.getElementById('root'));
 try{await React.act(async()=>root.render(React.createElement(loaded.exports.CallTranscriptRow,{item:{recordingId:8,status:'awaiting_audio',summary:null,transcript:null}})));
  assert.match(document.body.textContent,/Waiting for a playable recording/);assert.equal(document.querySelector('button'),null);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
