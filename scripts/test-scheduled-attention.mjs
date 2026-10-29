import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function component(file,mocks={}) {
  const source=fs.readFileSync(new URL('../src/components/'+file,import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  const exports={};new Function('exports','require',outputText)(exports,name=>{
    if(!(name in mocks))return require(name);
    return typeof mocks[name]==='function'?{default:mocks[name]}:mocks[name];
  });return exports.default;
}
const Actions=component('BookingActions.tsx',{'@/lib/crmAdmin':{}});
const Table=component('ScheduledCallsTable.tsx',{
  './PhoneHistoryModal':()=>null,
  'next/link':({children})=>React.createElement('a',null,children),
  './BookingCallHistory':()=>React.createElement('span',null,'Call history'),
  './BookingActions':Actions,'@/lib/bookedCalls':{bookingActionNotice:()=>''},'@/lib/crmAdmin':{}
});
const Panel=component('ScheduledCallsPanel.tsx',{'./ScheduledCallsTable':Table,'@/lib/crmAdmin':{},'@/lib/bookedCalls':{visibleScheduledCalls:rows=>rows}});
const booking={intentId:'10000000-0000-4000-8000-000000000001',name:'Client',phone:'447700900001',intentType:'MANUAL_BOOK',
  appointmentAtUtc:'2026-10-28T12:00:00Z',bookedAtUtc:'2026-10-27T12:00:00Z',leadCreatedAtUtc:null,onWhatsAppBusiness:false,
  bookingEmailSent:false,bookingWhatsAppSent:false,reminderEmailSent:false,reminderWhatsAppSent:false,manualCallsToday:0,agentConversationsToday:0,onDialler:false};

test('both tables expose the Business column/action and Attention displays the full appointment date and reasons',()=>{
  const render=(attention,row=booking)=>renderToStaticMarkup(React.createElement(Table,{token:'fixture',rows:[row],attention,onChanged:()=>{}}));
  assert.match(render(false),/On WhatsApp Business/);assert.match(render(false),/Actiuni programare/);
  assert.match(render(false),/aria-haspopup="dialog"/);assert.match(render(false),/Open WhatsApp and call history for 447700900001/);
  const marked=render(true,{...booking,onWhatsAppBusiness:true,whatsAppBusinessAtUtc:'2026-10-28T12:30:00Z',whatsAppBusinessBy:'agent@example.test',
    attentionReasons:['Latest Mediatel WhatsApp message is from the client']});
  assert.match(marked,/28 Oct 2026/);assert.match(marked,/agent@example.test/);assert.match(marked,/Latest Mediatel WhatsApp/);
  assert.match(marked,/<button[^>]*disabled=""[^>]*>On WhatsApp Business<\/button>/);
});

test('Attention precedes the daily schedule, defaults to seven days and loads without a misleading zero count',()=>{
  const html=renderToStaticMarkup(React.createElement(Panel,{token:'fixture'}));
  assert.ok(html.indexOf('id="attention-heading"')<html.indexOf('Scheduled calls by date'));
  assert.match(html,/<option value="7" selected="">7 days<\/option>/);
  assert.match(html,/Loading Attention calls/);assert.doesNotMatch(html,/0 calls need attention/);
  assert.match(html,/regardless of duration/);assert.doesNotMatch(html,/60 seconds/);
  assert.match(html,/no valid agent call after their first message/);
  assert.match(html,/<input type="checkbox" checked=""\/>Show finished leads/);
  assert.ok(html.indexOf('Show finished leads')>html.indexOf('Scheduled calls by date'));
});

test('unmarked bookings offer the action without opening a WhatsApp URL or sending a message',()=>{
  const html=renderToStaticMarkup(React.createElement(Actions,{token:'fixture',booking,onChanged:()=>{}}));
  assert.match(html,/>On WhatsApp Business<\/button>/);assert.doesNotMatch(html,/href=|wa\.me/);
});
