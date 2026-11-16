const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
test('CRM metric cards render duration/counts and distinguish unlinked agents from missing data',()=>{
 const mod={exports:{}};new Function('require','module','exports',compile('src/components/AgentCrmMetrics.tsx'))(require,mod,mod.exports);
 const data={totals:{activeCrmSeconds:3661,simulationsDone:7,casesOpened:9,casesUpdated:4},mappedAgentIds:[5],warnings:[]};
 const render=(agentId,override=data)=>renderToStaticMarkup(React.createElement(mod.exports.default,{data:override,agentId}));
 const html=render('5');for(const value of ['Active in CRM total','01:01:01','Simulations done','Cases opened','Cases updated'])assert.ok(html.includes(value));
 assert.equal((render('9').match(/Not linked/g)||[]).length,4);assert.equal((render('5',null).match(/Unavailable/g)||[]).length,4);
 const source=fs.readFileSync('src/pages/admin/crm.tsx','utf8'),summary=source.slice(source.indexOf('<div className="agent-report-summary">'),source.indexOf('      <DataTable',source.indexOf('<div className="agent-report-summary">')));
 assert.match(summary,/Logged To Mediatel/);assert.ok(!summary.includes('Logged interval RO'));assert.ok(!summary.includes('Logged outside interval'));assert.match(summary,/AgentCrmMetrics/);
});
test('logged-in agent calculations use authenticated attribution while public calculations keep their endpoint',async()=>{
 for(const [source,logged,expected] of [['ro-pension-agent-interview',true,'/admin/crm/pension-simulations'],['ro-pension-agent-interview',false,'/pension-calculator/calculate'],['ro-pension-calculator',true,'/pension-calculator/calculate']]){
  const exported={},calls=[];vm.runInNewContext(compile('src/lib/pensionCalculator.ts'),{exports:exported,require:name=>name==='@/lib/auth'?{API_BASE_URL:'https://api.invalid',TENANT_KEY:'justproveit',getStoredSession:()=>logged?{token:'token',user:{roles:['crm-admin']}}:{},isCrmUser:()=>true}:{default:require(path.resolve('src/lib',name))},fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({success:true,resultId:'saved',result:{}})};},console,Date,Map,Set});
  await exported.submitPensionCalculator({source});assert.ok(calls[0].url.endsWith(expected));assert.equal(calls[0].options.headers.Authorization,expected.includes('/admin/crm/')?'Bearer token':undefined);
 }
});
