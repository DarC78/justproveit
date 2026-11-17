const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('gateway photos load automatically when visible, enlarge, and release private URLs on login changes',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const saved={fetch:global.fetch,observer:global.IntersectionObserver,create:URL.createObjectURL,revoke:URL.revokeObjectURL},requests=[],revoked=[];let visible,disconnected=0;
 global.IntersectionObserver=class{constructor(fn){visible=fn;}observe(){}disconnect(){disconnected++;}};
 global.fetch=async(url,options)=>{requests.push({url,options});return{ok:true,blob:async()=>new Blob(['fixture'],{type:'image/jpeg'})};};
 URL.createObjectURL=()=>`blob:photo-${requests.length}`;URL.revokeObjectURL=url=>revoked.push(url);
 const mod={exports:{}},code=ts.transpileModule(fs.readFileSync('src/components/GatewayMessageMedia.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name=>name==='@/lib/auth'?{API_BASE_URL:'https://api.example.test/api'}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root')),media={messageId:'photo-id',type:'image',mimeType:'image/jpeg',fileName:'photo.jpg'};
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'first',media})));
  assert.equal(requests.length,0);assert.equal(document.querySelector('img'),null);
  await React.act(async()=>visible([{isIntersecting:true}]));assert.equal(requests.length,1);assert.equal(requests[0].options.headers.Authorization,'Bearer first');
  assert.equal(document.querySelector('img').src,'blob:photo-1');assert.equal(document.querySelector('a[target="_blank"]').getAttribute('rel'),'noopener noreferrer');assert.equal(document.querySelector('a[download]').download,'photo.jpg');assert.ok(disconnected);
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'second',media})));
  assert.equal(document.querySelector('img'),null);assert.deepEqual(revoked,['blob:photo-1']);assert.equal(requests[0].options.signal.aborted,true);
  await React.act(async()=>visible([{isIntersecting:true}]));assert.equal(requests[1].options.headers.Authorization,'Bearer second');
 }finally{await React.act(async()=>root.unmount());global.fetch=saved.fetch;global.IntersectionObserver=saved.observer;URL.createObjectURL=saved.create;URL.revokeObjectURL=saved.revoke;dom.window.close();}
 assert.deepEqual(revoked,['blob:photo-1','blob:photo-2']);
});
test('gateway attachments use authenticated reads and reactions retain their target',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/components/GatewayMessageMedia.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name=>name==='@/lib/auth'?{API_BASE_URL:'https://api.example.test/api'}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root')),originalFetch=global.fetch;let requested;
 global.fetch=async(url,options)=>{requested={url,options};return {ok:false};};
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'private',media:{messageId:'opaque-id',type:'image',mimeType:'image/png'}})));
  await React.act(async()=>document.querySelector('button').click());
  assert.match(requested.url,/whatsapp-gateway\/media\/opaque-id$/);assert.equal(requested.options.headers.Authorization,'Bearer private');assert.equal(requested.options.cache,'no-store');assert.match(document.querySelector('[role=alert]').textContent,/unavailable/);
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'private',reaction:{targetId:'original-message',emoji:'👍',removed:false}})));
  assert.match(document.body.textContent,/original-message/);assert.match(document.body.textContent,/👍/);
 }finally{await React.act(async()=>root.unmount());global.fetch=originalFetch;dom.window.close();}
});
