// Component contract tests with a minimal hook runner; no backend or real credentials.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/PrivatePensionsPanel.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const record = (id = 'uuid-one') => ({ id, version: 3, fullName: 'Synthetic Person', status: 'new client', actionType: '', nextAction: '', dueDate: null, priority: 'normal' });
const response = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function harness(base = 'https://example.invalid/api') {
  const slots = [], effects = [], calls = [], replies = [], events = {}, timers = new Map();
  let cursor = 0, tree, timerId = 0, confirmed = true, refreshes = 0;
  const depsEqual = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useMemo(fn) { cursor++; return fn(); },
    useEffect(fn, deps) { const i = cursor++; if (!depsEqual(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const document = { hidden: false, addEventListener: (name, fn) => { events[name] = fn; }, removeEventListener: name => { delete events[name]; } };
  const window = { confirm: () => confirmed, addEventListener() {}, removeEventListener() {}, setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), setInterval: () => 0, clearInterval() {} };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => name === 'react' ? react : name === 'react/jsx-runtime' ? { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: 'fragment' } : name === '@/lib/auth' ? { API_BASE_URL: base } : { useAuth: () => ({ refreshSession: async () => { refreshes++; } }) }, document, window, AbortController, console, fetch: async (url, options) => { calls.push({ url, ...options }); const reply = replies.shift(); if (!reply) throw Error('Unexpected request'); return await reply; } });
  const walk = node => !node ? [] : Array.isArray(node) ? node.flatMap(walk) : typeof node === 'object' ? [node, ...walk(node.props?.children)] : [];
  const text = node => !node ? '' : Array.isArray(node) ? node.map(text).join('') : typeof node === 'object' ? text(node.props?.children) : String(node);
  function render(token = 'bearer-test') { cursor = 0; tree = exports.default({ token }); effects.splice(0).forEach(fn => fn()); return tree; }
  const nodes = type => walk(tree).filter(n => n.type === type);
  const button = label => nodes('button').find(n => text(n).includes(label));
  const field = label => { const n = nodes('label').find(n => text(n).startsWith(label)); return walk(n).find(n => ['input', 'textarea', 'select'].includes(n.type)); };
  async function init() { replies.push(response({ cases: [record(), record('uuid-two')], statuses: ['new client', 'Complet'], actionTypes: ['Call'] })); render(); await tick(); render(); }
  async function open() { replies.push(response(record())); button('Synthetic Person').props.onClick(); await tick(); render(); }
  async function unlock(data = { providers: [{ provider: '', username: '', password: '', url: '', notes: 'synthetic secret excerpt' }], sourceDocuments: [{ label: 'Original', text: 'synthetic history' }] }) {
    field('Parola specială').props.onChange({ target: { value: 'synthetic-password' } }); render();
    replies.push(response({ token: 'vault-test', expiresAt: new Date(Date.now() + 300000).toISOString() }), response(data));
    await nodes('form')[1].props.onSubmit({ preventDefault() {} }); render();
  }
  return { init, open, unlock, render, calls, replies, document, events, timers, nodes, button, field, text: () => text(tree), refreshes: () => refreshes, confirm: value => { confirmed = value; }, unmount: () => slots.forEach(s => s?.cleanup?.()) };
}

test('API base normalization, bearer/no-store, and UUID identity', async () => {
  for (const base of ['https://example.invalid', 'https://example.invalid/api/']) {
    const h = harness(base); await h.init(); await h.open();
    assert.equal(h.calls[0].url, 'https://example.invalid/api/justproveit/admin/crm/private-pensions');
    assert.ok(h.calls[1].url.endsWith('/uuid-one'));
    for (const call of h.calls) { assert.equal(call.headers.Authorization, 'Bearer bearer-test'); assert.equal(call.cache, 'no-store'); assert.equal(call.headers['x-pension-unlock'], undefined); }
  }
});

test('409 retains edits and note whitespace, blocks resubmission and requires confirmed reload', async () => {
  const h = harness(); await h.init(); await h.open();
  h.field('Nume').props.onChange({ target: { value: 'Edited name' } });
  h.field('Adaugă notă').props.onChange({ target: { value: '  note\n  detail  ' } }); h.render();
  h.replies.push(response({}, 409)); await h.nodes('form')[0].props.onSubmit({ preventDefault() {} }); h.render();
  assert.equal(h.field('Nume').props.value, 'Edited name'); assert.equal(h.field('Adaugă notă').props.value, '  note\n  detail  ');
  assert.equal(JSON.parse(h.calls.at(-1).body).note, '  note\n  detail  ');
  assert.match(h.text(), /Conflict/); assert.equal(h.button('Salvează dosarul').props.disabled, true);
  h.confirm(false); const before = h.calls.length; h.button('Reîncarcă dosarul curent').props.onClick(); assert.equal(h.calls.length, before);
});

test('new cases send only writable fields and do not send note/version', async () => {
  const h = harness(); await h.init(); h.button('Dosar nou').props.onClick(); h.render();
  h.field('Nume').props.onChange({ target: { value: 'New synthetic person' } }); h.render();
  h.replies.push(response(record('new-uuid'), 201)); await h.nodes('form')[0].props.onSubmit({ preventDefault() {} });
  const call = h.calls.at(-1), body = JSON.parse(call.body);
  assert.equal(call.method, 'POST'); assert.equal(body.status, 'new client'); assert.equal(body.dueDate, null);
  for (const key of ['id', 'version', 'note', 'activity', 'payment']) assert.equal(key in body, false);
});

test('vault displays unstructured excerpts, PUT increments version while preserving case draft, lock clears', async () => {
  const h = harness(); await h.init(); await h.open(); await h.unlock();
  assert.equal(h.nodes('textarea').some(n => n.props.value === 'synthetic secret excerpt'), true);
  assert.match(h.text(), /synthetic history/);
  h.field('Nume').props.onChange({ target: { value: 'Unsaved name' } }); h.render();
  h.replies.push(response({ success: true })); h.button('Salvează furnizorii').props.onClick(); await tick(); h.render();
  assert.equal(JSON.parse(h.calls.at(-1).body).version, 3); assert.equal(h.calls.at(-1).headers['x-pension-unlock'], 'vault-test');
  assert.equal(h.field('Nume').props.value, 'Unsaved name');
  h.replies.push(response({ ...record(), version: 5 })); await h.nodes('form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(JSON.parse(h.calls.at(-1).body).version, 4);
  h.render(); h.button('Blochează acum').props.onClick(); h.render();
  assert.equal(h.nodes('textarea').some(n => n.props.value === 'synthetic secret excerpt'), false);
  assert.doesNotMatch(h.text(), /synthetic history/);
});

test('hidden document during unlock prevents vault fetch even if transport resolves late', async () => {
  const h = harness(); await h.init(); await h.open(); const grant = deferred(); h.replies.push(grant.promise);
  const pending = h.nodes('form')[1].props.onSubmit({ preventDefault() {} });
  h.document.hidden = true; h.events.visibilitychange();
  grant.resolve(response({ token: 'late-token', expiresAt: new Date(Date.now() + 300000).toISOString() })); await pending; h.render();
  assert.equal(h.calls.length, 3); assert.equal(h.calls.at(-1).signal.aborted, true); assert.ok(h.field('Parola specială'));
});

test('late vault data cannot restore secrets after hidden, expiry, auth change or unmount', async () => {
  for (const reason of ['hidden', 'expiry', 'auth', 'unmount']) {
    const h = harness(); await h.init(); await h.open(); const data = deferred();
    h.replies.push(response({ token: 'vault-test', expiresAt: new Date(Date.now() + 300000).toISOString() }), data.promise);
    const pending = h.nodes('form')[1].props.onSubmit({ preventDefault() {} }); await tick(); h.render();
    if (reason === 'hidden') { h.document.hidden = true; h.events.visibilitychange(); }
    if (reason === 'expiry') [...h.timers.values()].forEach(fn => fn());
    if (reason === 'auth') { h.replies.push(response({ cases: [], statuses: [], actionTypes: [] })); h.render('new-bearer'); }
    if (reason === 'unmount') h.unmount();
    data.resolve(response({ providers: [], sourceDocuments: [{ label: 'secret', text: 'late synthetic secret' }] })); await pending;
    if (reason !== 'unmount') { h.render(reason === 'auth' ? 'new-bearer' : 'bearer-test'); assert.doesNotMatch(h.text(), /late synthetic secret/); }
    assert.equal(h.calls.find(c => c.url.endsWith('/vault')).signal.aborted, true);
  }
});

test('unlock 403/429 clear password and surface server error without retry', async () => {
  for (const status of [403, 429]) {
    const h = harness(); await h.init(); await h.open(); h.replies.push(response({ error: { message: 'Synthetic denial' } }, status));
    h.field('Parola specială').props.onChange({ target: { value: 'wrong' } }); h.render();
    await h.nodes('form')[1].props.onSubmit({ preventDefault() {} }); h.render();
    assert.equal(h.field('Parola specială').props.value, ''); assert.match(h.text(), /Synthetic denial/); assert.equal(h.calls.length, 3);
  }
});

test('vault 403 clears visible secrets and 401 invokes existing session refresh', async () => {
  const h = harness(); await h.init(); await h.open(); await h.unlock();
  h.replies.push(response({}, 403)); h.button('Salvează furnizorii').props.onClick(); await tick(); h.render(); assert.ok(h.field('Parola specială'));
  h.replies.push(response({}, 401)); await h.nodes('form')[0].props.onSubmit({ preventDefault() {} }); h.render(); assert.equal(h.refreshes(), 1);
});

test('filters exclude closed cases from overdue counts and preserve UUIDs with duplicate numbers', async () => {
  const h = harness();
  h.replies.push(response({ cases: [
    { ...record('active'), caseNumber: 7, dueDate: '2000-01-01', reviewReasons: ['Check source'] },
    { ...record('closed'), caseNumber: 7, status: 'Complet finalizat', dueDate: '1999-01-01' },
    { ...record('paused'), fullName: 'Paused synthetic', status: 'Pauză', dueDate: null },
  ], statuses: ['new client', 'Complet finalizat', 'Pauză'], actionTypes: [] }));
  h.render(); await tick(); h.render(); assert.match(h.text(), /3 dosare · 2 active · 1 restante/);
  h.field('Urmărire').props.onChange({ target: { value: 'overdue' } }); h.render(); assert.match(h.text(), /1 rezultate/);
  h.field('Urmărire').props.onChange({ target: { value: 'review' } }); h.render(); assert.match(h.text(), /1 rezultate/);
  h.field('Urmărire').props.onChange({ target: { value: '' } });
  h.field('Caută').props.onChange({ target: { value: '7' } }); h.render(); assert.match(h.text(), /2 rezultate/);
});

test('duplicate submissions are blocked synchronously and failed saves keep the draft', async () => {
  const h = harness(); await h.init(); await h.open(); h.field('Nume').props.onChange({ target: { value: 'Keep me' } }); h.render();
  const save = deferred(); h.replies.push(save.promise); const form = h.nodes('form')[0];
  const first = form.props.onSubmit({ preventDefault() {} }); await form.props.onSubmit({ preventDefault() {} });
  assert.equal(h.calls.length, 3); save.resolve(response({}, 500)); await first; h.render(); assert.equal(h.field('Nume').props.value, 'Keep me');
});

test('case switch warns about edits and clears vault on confirmed change', async () => {
  const h = harness(); await h.init(); await h.open(); await h.unlock();
  h.field('Nume').props.onChange({ target: { value: 'Unsaved' } }); h.render(); h.confirm(false);
  let cases = h.nodes('button').filter(n => n.props.className?.startsWith('case'));
  const before = h.calls.length; cases[1].props.onClick(); assert.equal(h.calls.length, before);
  h.confirm(true); h.replies.push(response(record('uuid-two'))); cases[1].props.onClick(); await tick(); h.render();
  assert.ok(h.field('Parola specială')); assert.doesNotMatch(h.text(), /synthetic history/);
});

test('CRM direct-link tab is visible only for authenticated Adrian with CRM access', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const crmSource = fs.readFileSync('src/pages/admin/crm.tsx', 'utf8');
  const code = ts.transpileModule(crmSource, { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const [email, isCrm, status, visible] of [
    [' Adrian@ProveItWeb.co.uk ', true, 'authenticated', true],
    ['other@example.invalid', true, 'authenticated', false],
    ['adrian@proveitweb.co.uk', false, 'authenticated', false],
    ['adrian@proveitweb.co.uk', true, 'loading', false],
  ]) {
    const exports = {};
    vm.runInNewContext(code, { exports, URLSearchParams, window: { location: { search: '?tab=privatePensions' } }, require: name => name === 'react' ? React : name === 'react/jsx-runtime' ? require(name) : name === '@/context/AuthContext' ? { useAuth: () => ({ user: { email }, token: 'test', isCrm, status }) } : name === 'next/router' ? { useRouter: () => ({ query: {}, isReady: true }) } : ['next/head', 'next/link', '@/components/PrivatePensionsPanel'].includes(name) ? { default: () => null } : {} });
    const html = renderToStaticMarkup(React.createElement(exports.default));
    assert.equal(html.includes('Livrare Pensii Private'), visible);
  }
});
