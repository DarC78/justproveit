const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript'),React=require('react'),{JSDOM}=require('jsdom'),{createRoot}=require('react-dom/client');
test('pipeline filters and paginates server-side and opens the correct contact history',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'https://example.test'});global.window=dom.window;global.document=dom.window.document;global.IS_REACT_ACT_ENVIRONMENT=true;
 const previous=global.fetch,calls=[];global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({counts:{newLead:31,SimulationInProgress:0,SimulationDone:0,AgreedToBuy:0},cohortTotal:31,total:31,asOfUtc:'2026-11-10T12:00Z',rows:[{contactId:'correct-contact',name:'Fixture',phone:'447700900123',pipelineStatus:'newLead',source:'FB',service:'Simulator',createdAtUtc:'2026-11-01'}]})};};
 const code=ts.transpileModule(fs.readFileSync('src/components/LeadPipelinePanel.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,mod={exports:{}};let history;
 new Function('require','module','exports',code)(name=>name==='@/lib/auth'?{API_BASE_URL:'https://api.example.test'}:name==='./LeadPhoneHistory'?{__esModule:true,default:props=>{history=props;return React.createElement('button',{onClick:props.onCollapse},'Collapse history');}}:require(name),mod,mod.exports);
 const root=createRoot(document.getElementById('root'));const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);
 try {
  await React.act(async()=>root.render(React.createElement(mod.exports.default,{token:'agent-token'})));
  assert.equal(calls[0].options.headers.Authorization,'Bearer agent-token');assert.match(document.body.textContent,/31 leads matching/);
  await React.act(async()=>button('447700900123').click());assert.equal(history.contactId,'correct-contact');
  await React.act(async()=>button('Collapse history').click());assert.equal(button('Collapse history'),undefined);
  await React.act(async()=>button('Next').click());assert.equal(new URL(calls.at(-1).url).searchParams.get('offset'),'30');
  await React.act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='AgreedToBuy: 0').click());
  const query=new URL(calls.at(-1).url).searchParams;assert.equal(query.get('offset'),'0');assert.equal(query.get('status'),'AgreedToBuy');
 }finally{await React.act(async()=>root.unmount());global.fetch=previous;dom.window.close();delete global.window;delete global.document;}
});
