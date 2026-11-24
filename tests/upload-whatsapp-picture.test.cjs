const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('authenticated attachment downloads accept 50 MiB PDFs but reject oversized PDFs and images',async()=>{
 const source=fs.readFileSync('src/lib/crmAdmin.ts','utf8'),start=source.indexOf('export async function getReplyPictureImage('),end=source.indexOf('export function getCrmEmailHistory(',start);
 const code=ts.transpileModule(source.slice(start,end),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,mod={exports:{}};let blob=new Blob([new Uint8Array(50*1024*1024)],{type:'application/pdf'});
 const fetch=async(url,options)=>{assert.match(url,/reply-pictures\/message$/);assert.equal(options.headers.Authorization,'Bearer agent');assert.equal(options.cache,'no-store');return {ok:true,blob:async()=>blob};};
 new Function('exports','fetch','BASE_PATH','CANONICAL_READ_API_BASE_URL','resolveUrl','authHeaders',code)(mod.exports,fetch,'/crm','https://api.test',(base,path)=>base+path,token=>({Authorization:'Bearer '+token}));
 assert.equal((await mod.exports.getReplyPictureImage('agent','message')).size,50*1024*1024);
 blob=new Blob([blob,'x'],{type:'application/pdf'});await assert.rejects(mod.exports.getReplyPictureImage('agent','message'),/unavailable/);
 blob=new Blob([new Uint8Array(5*1024*1024+1)],{type:'image/png'});await assert.rejects(mod.exports.getReplyPictureImage('agent','message'),/unavailable/);
});
test('upload validates files, binds the private upload to this lead and previews without sending',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.FileReader=dom.window.FileReader;global.IS_REACT_ACT_ENVIRONMENT=true;
 const oldFetch=global.fetch,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,calls=[],changes=[],busy=[],revoked=[];let picture=null;
 URL.createObjectURL=()=> 'blob:picture-fixture';URL.revokeObjectURL=url=>revoked.push(url);
 global.fetch=async(url,options)=>{calls.push({url,options});const body=JSON.parse(options.body);return{ok:true,json:async()=>({success:true,contactId:'lead',picture:{pictureId:body.requestId,mimeType:body.mimeType,fileName:body.fileName,size:Buffer.from(body.base64,'base64').length}})};};
 const mod={exports:{}},code=ts.transpileModule(fs.readFileSync('src/components/UploadWhatsAppPicture.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(n=>n==='@/lib/auth'?{API_BASE_URL:'https://api.invalid'}:require(n),mod,mod.exports);const root=createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(mod.exports.default,{token:'agent',contactId:'lead',phone:'447700900001',picture,onChange:p=>{picture=p;changes.push(p);render();},onBusyChange:v=>busy.push(v)}));
 const choose=async file=>{const input=document.querySelector('input[type=file]'),key=Object.keys(input).find(k=>k.startsWith('__reactProps$'));await React.act(async()=>{input[key].onChange({target:{files:[file],value:'fixture'}});await new Promise(r=>setTimeout(r,30));for(let i=0;i<100&&busy.at(-1)===true;i++)await new Promise(r=>setTimeout(r,20));});};
 try{await React.act(async()=>render());assert.ok([...document.querySelectorAll('button')].some(b=>b.textContent==='Upload a picture / PDF'));
  await choose(new dom.window.File(['svg'],'bad.svg',{type:'image/svg+xml'}));assert.equal(calls.length,0);assert.match(document.querySelector('[role=alert]').textContent,/JPEG or PNG/);
  await choose(new dom.window.File(['png'],'photo.png',{type:'image/png'}));assert.equal(calls.length,1);assert.match(calls[0].url,/contacts\/lead\/whatsapp\/pictures$/);assert.equal(calls[0].options.headers.Authorization,'Bearer agent');const body=JSON.parse(calls[0].options.body);assert.equal(body.expectedPhone,'447700900001');assert.equal(body.base64,Buffer.from('png').toString('base64'));assert.deepEqual(busy,[true,false]);assert.equal(document.querySelector('img').getAttribute('src'),'blob:picture-fixture');assert.equal(changes.length,1);
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Remove attachment').click());assert.equal(picture,null);assert.deepEqual(revoked,['blob:picture-fixture']);assert.equal(calls.length,1);
  await choose(new dom.window.File([new Uint8Array(6*1024*1024)],'large.pdf',{type:'application/pdf'}));assert.equal(calls.length,2);assert.equal(picture.size,6*1024*1024);assert.equal(picture.mimeType,'application/pdf');assert.equal(document.querySelector('img'),null);
  await choose({type:'application/pdf',size:50*1024*1024+1});assert.equal(calls.length,2);assert.match(document.querySelector('[role=alert]').textContent,/PDF up to 50 MB/);
  await choose({type:'image/png',size:5*1024*1024+1});assert.equal(calls.length,2);
 }finally{await React.act(async()=>root.unmount());global.fetch=oldFetch;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.close();}
});
