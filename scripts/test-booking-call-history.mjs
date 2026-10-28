import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source=await fs.readFile(new URL('../src/components/BookingCallHistory.tsx',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
const exports={};
new Function('exports','require',outputText)(exports,createRequire(import.meta.url));
const render=booking=>renderToStaticMarkup(React.createElement(exports.default,{booking}));

test('call summary displays total and every outcome including voicemail and missing codes',()=>{
  const html=render({callsSinceAppointmentDay:3,callCodesSinceAppointmentDay:[
    {callCode:5,description:'Voice Mail',count:2},{callCode:null,description:null,count:1}
  ]});
  assert.match(html,/Apelat: Da · 3 apeluri/);
  assert.match(html,/Callcode 5/); assert.match(html,/Voice Mail/); assert.match(html,/× 2/);
  assert.match(html,/Fara callcode/); assert.match(html,/× 1/);
  assert.match(html,/Din ziua programarii, inclusiv dupa/);
});
test('no calls and unavailable history remain distinct',()=>{
  assert.match(render({callsSinceAppointmentDay:0,callCodesSinceAppointmentDay:[]}),/Apelat: Nu · 0 apeluri/);
  const html=render({callsSinceAppointmentDay:null,callCodesSinceAppointmentDay:[]});
  assert.match(html,/indisponibil/); assert.doesNotMatch(html,/0 apeluri/);
});
