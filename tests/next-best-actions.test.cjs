const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('NBA review UI separates approvals from delivery, disables blocked approval and saves edited drafts',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const sample={key:'a'.repeat(64),name:'SYNTHETIC LEAD',phone:'447700900111',contactId:'synthetic',serviceKey:'pension-prospect',rule:'L01',status:'recommended',version:1,dueAtUtc:'2030-01-14T12:00:00Z',title:'Offer simulation',reason:'New inbound',channel:'agents-whatsapp',blocks:[],message:'SYNTHETIC DRAFT',evidence:[],decision:{},deliveryEnabled:false},requests=[];
 const api={getNextBestActions:async()=>({rows:[sample,{...sample,key:'b'.repeat(64),name:'BLOCKED LEAD',blocks:['Uncertain identity']}],total:2,offset:0,asOfUtc:'2030-01-14T12:00:00Z',warnings:[],ruleVersion:'test',deliveryEnabled:false}),reviewNextBestAction:async(...args)=>{requests.push(args);return{...sample,saved:true};}};
 const mod={exports:{}};new Function('require','module','exports',compile('src/components/NextBestActionsPanel.tsx'))(name=>name==='@/lib/nextBestActions'?api:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root')),button=(scope,label)=>[...scope.querySelectorAll('button')].find(b=>b.textContent===label);
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'synthetic-token'})));
  assert.match(document.body.textContent,/sending is disabled/);const rows=document.querySelectorAll('article');assert.equal(rows.length,2);assert.equal(button(rows[1],'Approve recommendation').disabled,true);
  await React.act(async()=>button(rows[0],'Approve recommendation').click());assert.ok(document.querySelector('dialog').open);assert.match(document.querySelector('dialog').textContent,/does not|do not/);
  await React.act(async()=>document.querySelector('dialog form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
  assert.equal(requests.length,1);assert.equal(requests[0][2].action,'approve');assert.equal(requests[0][2].expectedVersion,1);assert.match(requests[0][2].requestId,/^[a-f0-9-]{36}$/);assert.match(document.body.textContent,/No message has been queued or sent/);
  await React.act(async()=>button(document.querySelector('article'),'Edit draft').click());assert.equal(document.querySelector('textarea').value,'SYNTHETIC DRAFT');assert.equal(document.querySelectorAll('button[data-send]').length,0);
 }finally{await React.act(async()=>root.unmount());dom.window.close();}
});
test('NBA HTTP client only exposes recommendation reads and review commands',async()=>{
 const calls=[],previous=global.fetch;global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({deliveryEnabled:false})};};
 try{const mod={exports:{}};new Function('require','module','exports',compile('src/lib/nextBestActions.ts'))(name=>name==='./auth'?{API_BASE_URL:'https://example.test/api'}:require(name),mod,mod.exports);
  await mod.exports.getNextBestActions('synthetic-token',{search:'test',status:'blocked',rule:'L01',offset:25});await mod.exports.reviewNextBestAction('synthetic-token','a'.repeat(64),{action:'dismiss',requestId:'synthetic',expectedVersion:1,text:'Reviewed'});
  assert.match(calls[0].url,/next-best-actions\?.*offset=25/);assert.equal(calls[0].options.cache,'no-store');assert.equal(calls[1].options.method,'POST');assert.equal(JSON.parse(calls[1].options.body).action,'dismiss');assert.ok(calls.every(c=>!c.url.includes('outbound')&&!c.url.includes('scheduled-replies')));
 }finally{global.fetch=previous;}
});
