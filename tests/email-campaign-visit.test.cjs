const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const content = require('../api/shared/email-attribution-content.json');
const token = 'a'.repeat(43);
const attribution = () => ({ token, visitId: '82357f01-1148-4f4f-8061-2cde5b6e5b61', eventId: '12257f01-1148-4f4f-8061-2cde5b6e5b61' });
function harness({ enabled = true, pathname = '/bani-uk-ai/', stored = null, sdk = true, pilot, now = Date.now() } = {}) {
  const calls = [], meta = [], tiktok = [], timers = [], listeners = new Map();
  const data = { stored, status: 202, now };
  class Clock extends Date { static now() { return data.now; } }
  const window = { location: { pathname, protocol: 'https:', hostname: 'www.justproveit.co.uk' }, proveitEmailToken: token, proveitEmailAttribution: attribution(),
    addEventListener: (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
    removeEventListener: (name, fn) => listeners.get(name)?.delete(fn),
    fbq: (...args) => meta.push(args), ttq: { track: (...args) => tiktok.push(args) }, ...(sdk ? { proveitAdvertising: {} } : {}),
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/emailCampaignVisit.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, require: name => ({ default: name.includes('email-attribution-content') ? content : { enabled, endpoint: 'https://fixture.invalid/visits', pilot } }), window, document: { cookie: '_fbp=fb.1.234; _fbc=fb.2.123; _ttp=fixture' },
    localStorage: { getItem: () => data.stored }, Date: Clock, TextEncoder, AbortSignal,
    crypto: { subtle: { digest: async (_, bytes) => new Uint8Array(crypto.createHash('sha256').update(bytes).digest()).buffer } },
    setTimeout: fn => { timers.push(fn); return fn; }, clearTimeout: fn => { const index = timers.indexOf(fn); if (index >= 0) timers.splice(index, 1); },
    fetch: async (url, options) => { calls.push({ url, options, body: JSON.parse(options.body) }); return { status: data.status }; },
  });
  return { exports, calls, meta, tiktok, timers, data, window, event: (name, detail) => [...(listeners.get(name) || [])].forEach(fn => fn({ detail })) };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('attributed visit posts once across remounts; browser ViewContent IDs match backend without PII', () => {
  const h = harness();
  h.exports.installEmailCampaignVisit()(); h.exports.installEmailCampaignVisit();
  h.event('proveit-advertising-ready');
  assert.equal(h.calls.length, 1); assert.equal(h.meta.length, 1); assert.equal(h.tiktok.length, 1);
  const { body, options } = h.calls[0];
  assert.equal(body.eventId, h.meta[0][3].eventID); assert.equal(body.eventId, h.tiktok[0][2].event_id);
  assert.equal(h.meta[0][1], 'ViewContent'); assert.equal(h.tiktok[0][0], 'ViewContent');
  assert.deepEqual(h.tiktok[0][1], content);
  assert.equal(h.tiktok[0][1].contents[0].content_id, 'bani-uk-ai-fondator');
  assert.equal(h.tiktok[0][1].value, undefined, 'a content view must not invent purchase value');
  assert.equal(body.content, undefined, 'public API body contract must remain unchanged');
  assert.deepEqual(body.consent, { choice: 'unknown', version: 'proveit-advertising-consent-v1', purposes: [] });
  assert.equal(body.dedupVersion, 'email-view-v1'); assert.equal(body.pagePath, '/bani-uk-ai/');
  assert.equal(options.keepalive, true); assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert.equal(options.referrerPolicy, 'no-referrer');
  for (const field of ['email', 'phone', 'name', 'contactId', 'pixelId', 'ip', 'userAgent']) assert.equal(body[field], undefined);
});
test('refusal before reload notifies same visit without identifiers and never emits another browser event', () => {
  const h = harness(); h.exports.installEmailCampaignVisit();
  const at = new Date().toISOString();
  h.data.stored = JSON.stringify({ value: 'denied', at, expires: Date.now() + 180 * 86400000 });
  h.event('proveit-advertising-choice', { value: 'denied', at });
  h.event('proveit-advertising-ready');
  assert.equal(h.calls.length, 2); const [first, denied] = h.calls.map(c => c.body);
  assert.equal(first.visitId, denied.visitId); assert.equal(first.eventId, denied.eventId);
  assert.equal(denied.consent.choice, 'denied'); assert.equal(denied.consent.at, at);
  for (const key of ['fbp', 'fbc', 'ttp', 'ttclid']) assert.equal(denied[key], undefined);
  assert.equal(h.meta.length, 1); assert.equal(h.tiktok.length, 1);
});
test('disabled and excluded routes never post; absent SDK does not prevent API attribution', () => {
  for (const options of [{ enabled: false }, { pathname: '/admin' }, { pathname: '/bani-uk-multumim/' }]) {
    const h = harness(options); h.exports.installEmailCampaignVisit(); assert.equal(h.calls.length, 0); assert.equal(h.meta.length, 0);
  }
  const h = harness({ sdk: false }); h.exports.installEmailCampaignVisit(); assert.equal(h.calls.length, 1); assert.equal(h.meta.length, 0);
  h.window.proveitAdvertising = {}; h.event('proveit-advertising-ready'); assert.equal(h.meta.length, 1); assert.equal(h.calls.length, 1);
});
test('legacy v1 timestamp is derived; malformed/expired preference stays unknown and purposes are never invented', () => {
  const h = harness({ stored: JSON.stringify({ value: 'granted', expires: Date.now() + 179 * 86400000 }) });
  const consent = h.exports.emailVisitChoice(); assert.equal(consent.choice, 'granted'); assert.ok(Number.isFinite(Date.parse(consent.at))); assert.equal(consent.purposes.length, 0);
  for (const stored of ['{invalid', JSON.stringify({ value: 'denied', expires: h.data.now - 1 })]) {
    h.data.stored = stored; assert.equal(h.exports.emailVisitChoice().choice, 'unknown');
  }
});
test('503 retries reuse exact body and IDs; leaving clears context and cancels retries', async () => {
  const h = harness(); h.data.status = 503; h.exports.installEmailCampaignVisit();
  await settle(); assert.equal(h.timers.length, 1);
  h.timers.shift()(); await settle(); assert.equal(h.calls.length, 2);
  assert.equal(h.calls[0].options.body, h.calls[1].options.body);
  h.exports.clearEmailCampaignVisit(); assert.equal(h.timers.length, 0); assert.equal(h.window.proveitEmailToken, undefined); assert.equal(h.window.proveitEmailAttribution, undefined);
});
test('automatic retries stop after three attempts, and a later refusal supersedes old retries', async () => {
  const h = harness(); h.data.status = 503; h.exports.installEmailCampaignVisit();
  await settle(); h.timers.shift()(); await settle(); h.timers.shift()(); await settle();
  assert.equal(h.calls.length, 3); assert.equal(h.timers.length, 0);
  assert.ok(h.calls.every(call => call.options.body === h.calls[0].options.body));
  const other = harness(); other.data.status = 503; other.exports.installEmailCampaignVisit(); await settle();
  assert.equal(other.timers.length, 1);
  other.data.status = 202;
  const at = new Date().toISOString();
  other.event('proveit-advertising-choice', { value: 'denied', at }); await settle();
  assert.equal(other.timers.length, 0); assert.equal(other.calls[1].body.consent.choice, 'denied');
});
const pilot = now => ({ enabled: true, tokenSha256: crypto.createHash('sha256').update(token).digest('hex'), preparedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 60000).toISOString() });
test('pilot allows only the pinned fixture, while general rollout stays disabled', async () => {
  const now = Date.now();
  const h = harness({ enabled: false, pilot: pilot(now), now });
  h.exports.installEmailCampaignVisit(); await settle();
  assert.equal(h.calls.length, 1); assert.equal(h.tiktok.length, 1);
  assert.equal(h.calls[0].body.eventId, h.tiktok[0][2].event_id);
  const wrong = harness({ enabled: false, pilot: { ...pilot(now), tokenSha256: '0'.repeat(64) }, now });
  wrong.exports.installEmailCampaignVisit(); await settle();
  assert.equal(wrong.calls.length, 0); assert.equal(wrong.meta.length, 0);
});
test('expired, disabled, overlong and conflicting pilot modes fail closed', async () => {
  const now = Date.now();
  for (const p of [{ ...pilot(now), enabled: false }, { ...pilot(now), expiresAt: new Date(now - 1).toISOString() }, { ...pilot(now), expiresAt: new Date(now + 7200000).toISOString() }, { ...pilot(now), tokenSha256: null }]) {
    const h = harness({ enabled: false, pilot: p, now }); h.exports.installEmailCampaignVisit(); await settle();
    assert.equal(h.calls.length, 0); assert.equal(h.meta.length, 0);
  }
  const conflict = harness({ enabled: true, pilot: pilot(now), now }); conflict.exports.installEmailCampaignVisit(); await settle(); assert.equal(conflict.calls.length, 0);
});
test('pilot automatically clears context at expiry and StrictMode remount sends only once', async () => {
  const now = Date.now(), h = harness({ enabled: false, pilot: pilot(now), now });
  h.exports.installEmailCampaignVisit()(); h.exports.installEmailCampaignVisit(); await settle();
  assert.equal(h.calls.length, 1); assert.equal(h.timers.length, 1);
  h.data.now = now + 61000; h.event('proveit-advertising-ready'); assert.equal(h.tiktok.length, 1);
  h.timers.shift()(); assert.equal(h.window.proveitEmailToken, undefined); assert.equal(h.window.proveitEmailAttribution, undefined);
});
