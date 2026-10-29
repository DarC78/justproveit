import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createRequire} from 'node:module';import ts from 'typescript';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const source=fs.readFileSync(new URL('../src/components/PhoneHistoryModal.tsx',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
const require=createRequire(import.meta.url),exports={};new Function('exports','require',outputText)(exports,name=>name==='@/lib/crmAdmin'?{}:require(name));

test('chronological history displays full text safely, call resolution, agent, duration and UK timestamp',()=>{
  const html=renderToStaticMarkup(React.createElement(exports.PhoneHistoryTimeline,{events:[
    {kind:'whatsapp',id:'m1',atUtc:'2026-10-23T09:00:00Z',direction:'inbound',author:'Client',text:'<script>alert(1)</script>\nSecond line',messageType:'text'},
    {kind:'call',id:'call:1',atUtc:'2026-10-23T12:10:32Z',endedAtUtc:'2026-10-23T12:11:31Z',agent:'Daniel',resolution:'CLIENT_EXISTENT',callCode:8,callType:'Manual Outgoing',durationSeconds:59,talkSeconds:44.313}
  ]}));
  assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/Second line/);
  assert.match(html,/CLIENT_EXISTENT/);assert.match(html,/Daniel/);assert.match(html,/0m 59s/);assert.match(html,/0m 44s/);
  assert.match(html,/23 Oct 2026, 13:10:32/);assert.ok(html.indexOf('Second line')<html.indexOf('CLIENT_EXISTENT'));
});

test('floating window has 80% viewport dimensions, labelled native dialog and explicit close/loading state',()=>{
  const html=renderToStaticMarkup(React.createElement(exports.default,{token:'fixture',booking:{intentId:'fixture',phone:'447700900001',name:'Client'},onClose:()=>{}}));
  assert.match(html,/<dialog/);assert.match(html,/aria-labelledby="phone-history-title"/);assert.match(html,/width:80vw/);assert.match(html,/height:80vh/);
  assert.match(html,/Close phone history/);assert.match(html,/Loading the full WhatsApp conversation and call history/);
});
