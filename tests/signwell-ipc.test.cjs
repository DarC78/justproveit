const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const field=(name,type='text',required=true)=>({name,label:name,type,required,maxLength:1000});
const templates=[{key:'ipc',label:'IPC',templateName:'Letter of Authority – International Pension Centre (3)',fields:[field('name'),field('email','email'),field('phone','tel'),field('address','textarea'),field('dob','date'),field('nino')]},{key:'private-pension',label:'Private Pension',templateName:'Letter of Authority (4)',fields:[field('name'),field('email','email'),field('address','textarea',false),field('dob','date',false),field('nino','text',false),...Array.from({length:5},(_,i)=>field('prevAddress'+(i+1),'textarea',false)),...Array.from({length:5},(_,i)=>[field('employer'+(i+1),'text',false),field('employmentDates'+(i+1),'text',false)]).flat()]}];
async function harness(mode,run){
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 const old=global.fetch,oldInterval=global.setInterval,calls=[],defaults={name:'Fixture',email:'fixture@example.invalid',phone:'+447700900123',address:'Fixture address',dob:'1960-01-01',nino:'AB123456C'};let records=[],poll;
 global.setInterval=fn=>{poll=fn;return 0;};
 global.fetch=async(url,options)=>{
  calls.push({url,options});
  if(options.method==='POST'){
   const body=JSON.parse(options.body),record={requestId:body.requestId,templateKey:body.templateKey,status:body.action==='validate'?'Verified':'Sent',name:'Fixture',email:defaults.email,createdAtUtc:new Date().toISOString(),documentId:body.action==='validate'?null:'fixture-document'};
   if(body.action==='send'&&mode==='rejected'){record.status='Rejected';record.errorMessage='SignWell (HTTP 422): recipients.duplicated_emails';records=[record];return{ok:false,json:async()=>({error:{message:record.errorMessage}})};}
   if(body.action==='send'&&mode==='pending')record.status='Sending';
   records=[record];
   if(body.action==='send'&&mode==='lost-response')throw Error('Synthetic response lost');
   return{ok:true,json:async()=>({success:true,contactId:'contact',record})};
  }
  return{ok:true,json:async()=>({contactId:'contact',templates,setup:{ready:true,reasons:[]},defaults,records,testMode:false,proveitSigner:{name:'Adrian Defta',email:'adriandefta@proveitweb.co.uk'}})};
 };
 const code=ts.transpileModule(fs.readFileSync('src/components/SignwellIpc.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,mod={exports:{}};new Function('require','module','exports',code)(n=>n==='@/lib/auth'?{API_BASE_URL:'https://api.test'}:require(n),mod,mod.exports);const root=createRoot(document.getElementById('root'));
 const submit=()=>React.act(async()=>document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 const confirm=()=>React.act(async()=>document.querySelector('input[type=checkbox]').click());
 const choose=key=>React.act(async()=>{const select=document.querySelector('select');select.value=key;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'fixture-token',contactId:'contact',name:'Fixture'})));assert.equal(calls.length,0);
  await React.act(async()=>document.querySelector('button').click());assert.equal(calls[0].options.headers.Authorization,'Bearer fixture-token');
  assert.equal(document.querySelector('select').value,'');assert.equal(document.querySelector('button[type=submit]').disabled,true);assert.equal(document.querySelector('fieldset'),null);await submit();assert.equal(calls.length,1);
  await choose(mode==='private'?'private-pension':'ipc');
  await run({calls,submit,confirm,choose,records:()=>records,complete:()=>{records=records.map(r=>({...r,status:'Sent'}));},poll:async()=>{assert.ok(poll,'Expected automatic status polling');await React.act(async()=>{poll();await Promise.resolve();await Promise.resolve();});}});
 }finally{await React.act(async()=>root.unmount());global.fetch=old;global.setInterval=oldInterval;dom.window.close();}
}
test('IPC has content verification then explicit confirmation, no remote draft entry and no status refresh button',async()=>harness('sent',async({calls,submit,confirm})=>{
 assert.equal(document.querySelectorAll('input[type=date]').length,1);
 await submit();assert.equal(calls.length,2);assert.equal(JSON.parse(calls[1].options.body).action,'validate');assert.equal(document.querySelector('button[type=submit]').disabled,true);
 assert.match(document.body.textContent,/SignWell nu a fost contactat/);assert.ok(!document.body.textContent.includes('Documente IPC'));assert.match(document.body.textContent,/LOADate este data semnării clientului/);
 await confirm();await submit();assert.equal(calls.length,3);const body=JSON.parse(calls[2].options.body);assert.equal(body.confirmed,true);assert.equal(body.action,'send');assert.equal(body.LOADate,undefined);assert.match(document.body.textContent,/SignWell a confirmat trimiterea/);
 assert.ok(!document.body.textContent.includes('Actualizează starea'));
}));
test('SignWell validation errors are shown directly and let the agent correct content without refreshing status',async()=>harness('rejected',async({calls,submit,confirm})=>{
 await submit();await confirm();await submit();assert.match(document.querySelector('[role=alert]').textContent,/SignWell \(HTTP 422\).*duplicated_emails/);
 assert.equal(document.querySelector('fieldset').disabled,false);assert.equal(document.querySelector('button[type=submit]').textContent,'Verifică datele');assert.ok(!document.body.textContent.includes('Actualizează starea'));assert.equal(calls.filter(c=>c.options.method==='POST'&&JSON.parse(c.options.body).action==='send').length,1);
}));
test('pending send confirmation updates automatically without creating another document',async()=>harness('pending',async({calls,submit,confirm,complete,poll})=>{
 await submit();await confirm();await submit();assert.match(document.body.textContent,/Confirmarea SignWell se va afișa automat/);complete();await poll();assert.match(document.body.textContent,/SignWell a confirmat trimiterea documentului/);
 assert.equal(calls.filter(c=>c.options.method==='POST').length,2);assert.ok(!document.body.textContent.includes('Actualizează starea'));
}));
test('a lost send response does not leave a false error when the local record already confirms sending',async()=>harness('lost-response',async({calls,submit,confirm})=>{
 await submit();await confirm();await submit();assert.equal(document.querySelector('[role=alert]'),null);assert.match(document.body.textContent,/SignWell a confirmat trimiterea documentului/);assert.equal(calls.filter(c=>c.options.method==='POST'&&JSON.parse(c.options.body).action==='send').length,1);
}));
test('Private Pension has its own optional address/employment fields and switching type resets verification',async()=>harness('private',async({calls,submit,choose})=>{
 assert.equal(document.querySelector('input[name=phone]'),null);assert.ok(document.querySelector('textarea[name=prevAddress5]'));assert.ok(document.querySelector('input[name=employer5]'));assert.ok(document.querySelector('input[name=employmentDates5]'));
 assert.equal(document.querySelector('textarea[name=prevAddress5]').required,false);assert.equal(document.querySelector('input[name=dob]').required,false);assert.equal(document.querySelector('input[name=email]').required,true);
 await submit();assert.equal(JSON.parse(calls[1].options.body).templateKey,'private-pension');assert.match(document.body.textContent,/Verificare înainte de trimitere — Private Pension/);assert.equal(document.querySelector('select').disabled,true);
 await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Modifică datele').click());await choose('ipc');
 assert.ok(document.querySelector('input[name=phone]'));assert.equal(document.querySelector('input[name=employer1]'),null);assert.equal(document.querySelector('textarea[name=prevAddress1]'),null);assert.equal(document.querySelector('.review'),null);
 assert.equal(document.querySelector('button[type=submit]').textContent,'Verifică datele');await submit();assert.equal(JSON.parse(calls[2].options.body).templateKey,'ipc');assert.notEqual(JSON.parse(calls[1].options.body).requestId,JSON.parse(calls[2].options.body).requestId);assert.equal(calls.filter(c=>c.options.method==='POST'&&JSON.parse(c.options.body).action==='send').length,0);
}));
