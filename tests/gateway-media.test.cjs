const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
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
