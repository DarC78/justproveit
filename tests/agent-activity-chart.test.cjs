const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const mod={exports:{}};const code=ts.transpileModule(fs.readFileSync('src/components/AgentActivityChart.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('require','module','exports',code)(require,mod,mod.exports);
test('activity chart renders every interval and accessible counts, including the last minute',()=>{
 const bins=Array.from({length:216},(_,i)=>({time:String(6+Math.floor(i/12)).padStart(2,'0')+':'+String(i%12*5).padStart(2,'0'),count:i===215?7:0}));
 const html=renderToStaticMarkup(React.createElement(mod.exports.default,{loading:false,data:{date:'2026-11-19',bins,total:7,timeZone:'Europe/Bucharest',intervalMinutes:5}}));
 assert.equal((html.match(/role="graphics-symbol"/g)||[]).length,216);assert.match(html,/23:55-23:59: Talking 0 min; Clerical 0 min; Pause 0 min; CRM activity 7 events/);assert.match(html,/06:00-06:04: Talking 0 min; Clerical 0 min; Pause 0 min; CRM activity 0 events/);assert.match(html,/2026-11-19/);assert.match(html,/Europe\/Bucharest/);
});
test('activity chart distinguishes missing data from a loaded zero-activity day',()=>{
 const render=data=>renderToStaticMarkup(React.createElement(mod.exports.default,{loading:false,data}));assert.match(render(undefined),/unavailable/);assert.match(render({date:'2026-11-19',bins:[],total:0}),/No recorded activity/);
});

test('overlapping durations and CRM events retain four distinct colours and units in the same bar',()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.default,{loading:false,data:{date:'2026-11-19',total:4,bins:[{time:'06:00',count:4,talkedMinutes:2.5,clericalMinutes:1,pauseMinutes:2}]}}));
 assert.match(html,/Talking 2.5 min; Clerical 1 min; Pause 2 min; CRM activity 4 events/);for(const color of ['#dc2626','#eab308','#111111','#1746a2'])assert.ok(html.includes('fill="'+color+'"'));for(const key of ['talkedMinutes','clericalMinutes','pauseMinutes','count'])assert.ok(html.includes('data-series="'+key+'"'));assert.ok(!html.includes('No recorded activity'));
});
