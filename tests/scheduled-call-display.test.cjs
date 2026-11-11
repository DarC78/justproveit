const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),ts=require('typescript');
const mod={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync('src/lib/scheduledCallDisplay.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(mod,mod.exports);
const {scheduledCallDisplay:display}=mod.exports;
test('today overdue threshold is strict; tomorrow onward blue; past dates neutral',()=>{
 const now=new Date('2026-11-11T12:00:00Z');
 assert.deepEqual(display('2026-11-11T11:29:59Z',now),{label:'Today',backgroundColor:'#fecaca'});
 for(const at of ['2026-11-11T11:30:00Z','2026-11-11T15:00:00Z'])assert.deepEqual(display(at,now),{label:'Today',backgroundColor:undefined});
 for(const [date,label] of [['12','Tomorrow'],['13','Day after tomorrow'],['20','In the future']])assert.deepEqual(display(`2026-11-${date}T10:00Z`,now),{label,backgroundColor:'#dbeafe'});
 assert.deepEqual(display('2026-11-10T10:00Z',now),{label:'In the past',backgroundColor:undefined});
});
test('relative dates follow UK midnight and DST rather than elapsed 24-hour periods',()=>{
 assert.equal(display('2026-07-02T00:15Z',new Date('2026-07-01T23:05Z')).label,'Today');
 assert.equal(display('2026-03-30T09:00Z',new Date('2026-03-28T23:30Z')).label,'Day after tomorrow');
 assert.equal(display('2026-10-26T09:00Z',new Date('2026-10-24T23:30Z')).label,'Tomorrow');
});
test('a handled appointment does not remain overdue red, while future bookings stay blue',()=>{
 const now=new Date('2026-11-11T10:48:00Z');
 assert.equal(display('2026-11-11T10:15:00Z',now,false).backgroundColor,'#fecaca');
 assert.deepEqual(display('2026-11-11T10:15:00Z',now,true),{label:'Today',backgroundColor:undefined});
 assert.equal(display('2026-11-12T10:15:00Z',now,true).backgroundColor,'#dbeafe');
});
