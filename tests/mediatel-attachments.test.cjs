const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('Mediatel PDF loads only through the authorized conversation and offers open/download',async()=>{
 const dom=new JSDOM('<div id="root"></div>');global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const mod={exports:{}},calls=[],revoked=[],create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 URL.createObjectURL=()=> 'blob:private-pdf';URL.revokeObjectURL=url=>revoked.push(url);
 const code=ts.transpileModule(fs.readFileSync('src/components/MediatelMessageAttachment.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name=>name==='@/lib/crmAdmin'?{getPhoneHistoryImage:async(...args)=>{calls.push(args);return new Blob(['%PDF'],{type:'application/pdf'});}}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));
 try{
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'private',targetId:'lead-id',media:{messageId:'mcic:12',mimeType:'application/pdf',name:'payslip.pdf',kind:'document'}})));
  assert.equal(calls.length,0);await React.act(async()=>document.querySelector('button').click());assert.deepEqual(calls[0],['private','contact','lead-id','mcic:12']);
  assert.equal(document.querySelector('a[target=_blank]').getAttribute('rel'),'noopener noreferrer');assert.equal(document.querySelector('a[download]').getAttribute('download'),'payslip.pdf');
 }finally{await React.act(async()=>root.unmount());URL.createObjectURL=create;URL.revokeObjectURL=revoke;dom.window.close();}
 assert.deepEqual(revoked,['blob:private-pdf']);
});
