const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
const canonical='11111111-1111-4111-8111-111111111111';
function setup(api){const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const code=ts.transpileModule(fs.readFileSync('src/components/LeadDetailsPhoneHistory.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,mod={exports:{}};let viewed;
 new Function('require','module','exports',code)(name=>name==='@/lib/crmAdmin'?api:name==='./LeadPhoneHistory'?{__esModule:true,default:props=>{viewed=props;return React.createElement('button',{onClick:props.onCollapse},'Collapse history');}}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));return{Component:mod.exports.default,root,dom,viewed:()=>viewed,close:async()=>{await React.act(async()=>root.unmount());dom.window.close();delete global.window;delete global.document;}};
}
test('details phone links include normalized-only and additional numbers; history opens for the canonical contact and collapses',async()=>{
 let reads=0;const h=setup({getContactPhoneHistory:async(token,id)=>{reads++;assert.equal(token,'agent');assert.equal(id,canonical);return{contactId:canonical,phone:'447700900001'};}});
 try{await React.act(async()=>h.root.render(React.createElement(h.Component,{token:'agent',lead:{canonicalContactId:canonical,normalizedPhone:'447700900001',phones:[{phone:'+44 7700 900001'},{phone:'+40 755 663815'}]}})));const buttons=[...document.querySelectorAll('button')];assert.equal(buttons.length,2);assert.match(buttons[0].textContent,/447700900001/);assert.equal(reads,0);
 await React.act(async()=>buttons[1].click());assert.equal(reads,1);assert.ok(document.querySelector('dialog[open]'));assert.equal(h.viewed().contactId,canonical);assert.equal(h.viewed().phone,'447700900001');await React.act(async()=>document.querySelector('dialog button').click());assert.equal(document.querySelector('dialog'),null);assert.equal(document.activeElement,buttons[0]);
 }finally{await h.close();}
});
test('legacy record ID is never treated as a canonical contact; an exact phone lookup resolves the history',async()=>{
 const h=setup({findCrmLeadByPhone:async(token,phone)=>{assert.equal(phone,'07700 900001');return{lead:{contactId:canonical,normalizedPhone:'447700900001'}};},getContactPhoneHistory:async(_token,id)=>{assert.equal(id,canonical);return{contactId:id,phone:'447700900001'};}});
 try{await React.act(async()=>h.root.render(React.createElement(h.Component,{token:'agent',lead:{id:'22222222-2222-4222-8222-222222222222',phoneNumber:'07700 900001'}})));await React.act(async()=>document.querySelector('button').click());assert.ok(document.querySelector('dialog[open]'));assert.equal(h.viewed().contactId,canonical);}finally{await h.close();}
});
test('a fuzzy phone match cannot open another contact history and retains a retryable phone link',async()=>{
 let reads=0;const h=setup({findCrmLeadByPhone:async()=>({lead:{contactId:canonical,phoneNumber:'407700900001'}}),getContactPhoneHistory:async()=>{reads++;}});
 try{await React.act(async()=>h.root.render(React.createElement(h.Component,{token:'agent',lead:{phoneNumber:'447700900001'}})));await React.act(async()=>document.querySelector('button').click());assert.equal(reads,0);assert.equal(document.querySelector('dialog'),null);assert.match(document.querySelector('[role=alert]').textContent,/exact CRM contact/);assert.equal(document.querySelector('button').disabled,false);}finally{await h.close();}
});
