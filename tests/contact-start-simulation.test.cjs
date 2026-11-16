const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('Start Simulare confirms the displayed recipient, prevents double submit and reuses a failed request',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 const compiled=ts.transpileModule(fs.readFileSync('src/components/ContactStartSimulation.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',compiled)(n=>n==='@/lib/auth'?{API_BASE_URL:'https://example.test/api'}:require(n),mod,mod.exports);
 const previous=global.fetch,calls=[],changes=[];let release;
 global.fetch=async(url,options)=>{calls.push({url,...JSON.parse(options.body)});if(calls.length===1){await new Promise(r=>release=r);return{ok:false,json:async()=>({error:{message:'Temporary error'}})};}return{ok:true,json:async()=>({success:true,action:'start-simulation',contactId:'contact',status:'scheduled',sent:false})};};
 const root=createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'synthetic',contactId:'contact',name:'Test recipient',phone:'447700900001',onChanged:r=>changes.push(r)})));
  await React.act(async()=>document.querySelector('button').click());assert.match(document.querySelector('dialog').textContent,/Test recipient.*447700900001/);assert.equal(calls.length,0);
  const submit=()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  await React.act(async()=>{submit();submit();});assert.equal(calls.length,1);
  await React.act(async()=>release());assert.match(document.querySelector('[role=alert]').textContent,/Temporary error/);
  await React.act(async()=>submit());assert.equal(calls.length,2);assert.equal(calls[0].requestId,calls[1].requestId);assert.equal(calls[0].phone,'447700900001');assert.equal(calls[0].confirm,true);assert.match(calls[0].url,/contacts\/contact\/start-simulation$/);assert.equal(changes.length,1);assert.equal(changes[0].solved,false);assert.match(document.querySelector('[role=status]').textContent,/nu este inca confirmata/);
 }finally{global.fetch=previous;await React.act(async()=>root.unmount());dom.window.close();}
});
