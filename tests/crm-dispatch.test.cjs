const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const exportsObject={};
const source=ts.transpileModule(fs.readFileSync('src/lib/crmDispatch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(source,{exports:exportsObject,URLSearchParams});
const {resolveCrmDispatch,dispatchPhone,dispatchPhoneFromQuery,qualifyingDispatchIntent}=exportsObject;
const now=Date.parse('2026-10-29T12:00:00Z');
const lead={contactId:'contact-1',fullName:'Dan & Urse',email:'dan+test@example.com',phoneNumber:'+44 7440 526630'};
const row=(overrides={})=>({contactId:'contact-1',lead,createdAtUtc:'2026-10-28T12:00:00Z',interestType:'ASAP',serviceKey:'SimulatorPensie',...overrides});
const result=rows=>({rows,total:rows.length,limit:300,offset:0});
function deps(rows,found=lead){return {now,findLead:async()=>({lead:found}),listIntents:async p=>result(p.closed?[]:rows)};}

test('phone accepts international, 00 and UK local formats and rejects malformed inputs',()=>{
  for(const p of ['+44 7440 526630','00447440526630','07440526630'])assert.equal(dispatchPhone(p),'447440526630');
  for(const p of ['', 'abc447440526630','123','//example.com'])assert.equal(dispatchPhone(p),'');
});
test('phone query selects first valid value in leads, dnis, ani, legacy order',()=>{
  const query={phone_leads:'07440526630',phone_dnis:'447700900002',phone_ani:'447700900003',phone:'447700900004'};
  assert.equal(dispatchPhoneFromQuery(query),'447440526630');
  assert.equal(dispatchPhoneFromQuery({...query,phone_leads:''}),'447700900002');
  assert.equal(dispatchPhoneFromQuery({...query,phone_leads:'not a number',phone_dnis:' '}),'447700900003');
  assert.equal(dispatchPhoneFromQuery({phone:'00447700900004'}),'447700900004');
  assert.equal(dispatchPhoneFromQuery({phone_leads:['447700900001','447700900002'],phone_ani:'447700900003'}),'447700900003');
  assert.equal(dispatchPhoneFromQuery({}), '');
  assert.equal(dispatchPhoneFromQuery({phone_leads:'123',phone_dnis:'abc',phone_ani:''}), '');
});
test('manual booking for any service OR pension service qualifies within exact 30 day boundary',()=>{
  assert.equal(qualifyingDispatchIntent(row({interestType:'MANUAL_BOOK',serviceKey:'Other'}),now),true);
  assert.equal(qualifyingDispatchIntent(row(),now),true);
  assert.equal(qualifyingDispatchIntent(row({createdAtUtc:new Date(now-30*86400000).toISOString()}),now),true);
  for(const date of [new Date(now-30*86400000-1).toISOString(),new Date(now+1).toISOString(),'bad'])
    assert.equal(qualifyingDispatchIntent(row({createdAtUtc:date}),now),false);
  assert.equal(qualifyingDispatchIntent(row({serviceKey:'Other'}),now),false);
});
test('automatic route encodes all three contact parameters and ignores wrong-person rows',async()=>{
  const resolved=await resolveCrmDispatch('+447440526630',deps([row()]));
  assert.equal(resolved.automatic,true);
  const url=new URL(resolved.url,'https://www.justproveit.co.uk');
  assert.equal(url.searchParams.get('name'),lead.fullName);assert.equal(url.searchParams.get('email'),lead.email);
  assert.equal(url.searchParams.get('phone'),'447440526630');
  const wrong={...lead,contactId:'other',phoneNumber:'447700900001'};
  assert.equal((await resolveCrmDispatch(lead.phoneNumber,deps([row({contactId:'other',lead:wrong})]))).automatic,false);
});
test('reads closed records and later pages; reserved contacts are included',async()=>{
  const calls=[];
  const resolved=await resolveCrmDispatch(lead.phoneNumber,{now,findLead:async()=>({lead}),listIntents:async p=>{
    calls.push(p);assert.equal(p.includeReserved,true);assert.equal(p.phone,'447440526630');
    if(!p.closed)return result([]);
    return {rows:p.offset?[row()]:[row({serviceKey:'Other'})],total:2,offset:p.offset,limit:1};
  }});
  assert.equal(resolved.automatic,true);assert.ok(calls.some(p=>p.closed&&p.offset===1));
});
test('unknown contacts and old intents show choice, never another contact details',async()=>{
  const wrong={...lead,phoneNumber:'447700900001'};
  const unknown=await resolveCrmDispatch(lead.phoneNumber,deps([],wrong));
  assert.equal(unknown.lead,null);assert.equal(unknown.automatic,false);
  assert.equal(new URL(unknown.url,'https://x.test').searchParams.get('name'),'');
  assert.equal((await resolveCrmDispatch(lead.phoneNumber,deps([row({createdAtUtc:'2026-09-01T00:00:00Z'})]))).automatic,false);
});
test('failed or incomplete database lookup must not silently select a CRM',async()=>{
  await assert.rejects(()=>resolveCrmDispatch(lead.phoneNumber,{...deps([]),listIntents:async()=>{throw Error('offline');}}),/offline/);
  await assert.rejects(()=>resolveCrmDispatch(lead.phoneNumber,{...deps([]),listIntents:async()=>({rows:[],total:1})}),/incompleta/);
});
