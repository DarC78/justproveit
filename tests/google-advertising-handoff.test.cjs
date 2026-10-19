const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const capture = fs.readFileSync('public/email-attribution.js', 'utf8');
test('deployed backend destination is pinned while coordinated activation remains off', () => {
  const config = require('../src/config/google-advertising.json');
  assert.equal(config.customerId, '1424642598');
  assert.equal(config.purchaseSendTo, 'AW-17883073327/k4UsCLO2tqIdEK-WqM9C');
  assert.equal(config.customerDataConsentEnabled, false);
  assert.equal(config.purchaseEnabled, false);
  assert.equal(config.purchaseDestinationVerified, false, 'browser/vendor verification is still outstanding');
});
function landing(path) {
  const metas = [];
  const w = { crypto: crypto.webcrypto, location: { href: 'https://www.justproveit.co.uk' + path }, history: { state: {}, replaceState: (_, __, url) => { w.clean = url; } } };
  vm.runInNewContext(capture, { window: w, document: { createElement: () => ({}), head: { appendChild: meta => metas.push(meta) } }, URL });
  return { w, metas };
}
test('ec is cleaned before analytics; only a single valid landing token is retained in memory', () => {
  const token = 'a'.repeat(43);
  const valid = landing('/bani-uk-ai/?ec=' + token + '&utm_source=email#offer');
  assert.equal(valid.w.proveitEmailToken, token);
  assert.match(valid.w.proveitEmailAttribution.eventId, /^[0-9a-f-]{36}$/);
  assert.notEqual(valid.w.proveitEmailAttribution.eventId, valid.w.proveitEmailAttribution.visitId);
  assert.equal(valid.w.clean, '/bani-uk-ai/?utm_source=email#offer');
  assert.equal(valid.metas[0].content, 'no-referrer');
  for (const path of ['/admin?ec=' + token, '/bani-uk-multumim/?ec=' + token, '/bani-uk-ai/?ec=invalid', '/bani-uk-ai/?ec=' + token + '&ec=' + token]) {
    const { w } = landing(path); assert.equal(w.proveitEmailToken, undefined); assert.ok(!w.clean.includes('ec='));
  }
});
function googleModule(config, storage, calls = [], overrides = {}) {
  const exports = {};
  const purchase = { paid: true, sessionId: 'cs_live_fixture1234567890', value: 39, currency: 'GBP', emailSent: true };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/googleAdvertising.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports, require: name => name.includes('config') ? { default: config } : { validPurchase: p => p === purchase },
    crypto: crypto.webcrypto, TextEncoder, Date, AbortSignal, Event, window: { gtag: overrides.gtag || ((...args) => calls.push(args)), dispatchEvent: overrides.dispatchEvent || (() => {}) },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    document: { getElementById: () => true }, fetch: overrides.fetch || (async () => ({ status: 202 })),
  });
  return { exports, purchase };
}
const enabled = { customerDataConsentEnabled: true, purchaseEnabled: true, purchaseDestinationVerified: true, purchaseSendTo: 'AW-123456/fixture', consentEndpoint: 'https://fixture.invalid' };
const consent = (user = 'granted', personalization = 'granted') => ({ adUserData: user, adPersonalization: personalization, version: 'google-customer-data-v1', at: new Date().toISOString() });
test('storage write failure cannot block Google refusal POST or let a stale grant override it', async () => {
  const sent = [], events = [], calls = [];
  const storage = { get: () => JSON.stringify(consent()), set: () => { throw new Error('quota'); } };
  const g = googleModule(enabled, storage, calls, {
    fetch: async (_, options) => { sent.push(options); return { status: 202 }; },
    dispatchEvent: event => events.push(event),
  });
  const denied = consent('denied', 'denied');
  await g.exports.saveGoogleChoice(denied, 'a'.repeat(43));
  assert.deepEqual(JSON.parse(sent[0].body), { token: 'a'.repeat(43), ...denied });
  assert.equal(sent[0].keepalive, true);
  assert.equal(g.exports.readGoogleChoice().adUserData, 'denied');
  assert.equal(events.length, 1);
  await g.exports.trackGooglePurchase(g.purchase);
  assert.equal(calls.filter(c => c[0] === 'event').length, 0);
  await assert.rejects(() => g.exports.saveGoogleChoice(consent(), 'a'.repeat(43)), /re-consent/);
  assert.equal(sent.length, 1);
});
test('storage and network failure retain the refusal in memory without a server-success event', async () => {
  for (const result of ['network', '503']) {
    const events = [], sent = [];
    const storage = { get: () => { throw new Error('storage blocked'); }, set: () => { throw new Error('storage blocked'); } };
    const g = googleModule(enabled, storage, [], {
      fetch: async (_, options) => { sent.push(options); if (result === 'network') throw new Error('offline'); return { status: 503 }; },
      dispatchEvent: event => events.push(event),
    });
    await assert.rejects(() => g.exports.saveGoogleChoice(consent('denied', 'denied'), 'a'.repeat(43)));
    assert.equal(sent.length, 1);
    assert.equal(g.exports.readGoogleChoice().adPersonalization, 'denied');
    assert.equal(events.length, 0, 'UI must not receive server acceptance when POST fails');
    await assert.rejects(() => g.exports.saveGoogleChoice(consent(), 'a'.repeat(43)), /re-consent/);
  }
});
test('a broken vendor SDK does not prevent server-side refusal notification', async () => {
  let sent = 0;
  const g = googleModule(enabled, new Map(), [], {
    gtag: () => { throw new Error('SDK failure'); },
    fetch: async () => { sent++; return { status: 202 }; },
  });
  await g.exports.saveGoogleChoice(consent('denied', 'denied'), 'a'.repeat(43));
  assert.equal(sent, 1);
});
test('Google transaction ID matches the server SHA256 contract and requires both real choices', async () => {
  for (const choice of [null, consent('denied'), consent('granted', 'denied'), consent()]) {
    const storage = new Map(), calls = [];
    if (choice) storage.set('proveit-google-customer-data-consent-v1', JSON.stringify(choice));
    const { exports: g, purchase } = googleModule(enabled, storage, calls);
    const expected = crypto.createHash('sha256').update('google-purchase:' + purchase.sessionId).digest('hex');
    assert.equal(await g.googleTransactionId(purchase.sessionId), expected);
    await g.trackGooglePurchase(purchase); await g.trackGooglePurchase(purchase);
    const conversions = calls.filter(c => c[0] === 'event');
    assert.equal(conversions.length, choice?.adUserData === 'granted' && choice.adPersonalization === 'granted' ? 1 : 0);
    if (conversions.length) assert.equal(conversions[0][2].transaction_id, expected);
  }
});
test('disabled/unverified destination sends nothing and a public grant cannot overwrite refusal', async () => {
  const storage = new Map([['proveit-google-customer-data-consent-v1', JSON.stringify(consent())]]), calls = [];
  for (const config of [{ ...enabled, purchaseEnabled: false }, { ...enabled, purchaseDestinationVerified: false }, { ...enabled, purchaseSendTo: null }]) {
    const g = googleModule(config, storage, calls); await g.exports.trackGooglePurchase(g.purchase);
  }
  assert.equal(calls.length, 0);
  storage.set('proveit-google-customer-data-consent-v1', JSON.stringify(consent('denied', 'denied')));
  await assert.rejects(() => googleModule(enabled, storage).exports.saveGoogleChoice(consent(), 'a'.repeat(43)), /re-consent/);
});
test('separate signed purchase callback remains disabled and never invokes fulfillment', async () => {
  const callback = require('../api/bani-uk-ai-google-purchases');
  const context = {}; await callback(context, { rawBody: '{}', headers: {} }); assert.equal(context.res.status, 400);
  const old = process.env.BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET;
  process.env.BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET = 'fixture';
  try {
    const raw = JSON.stringify({ id: 'evt_fixture', type: 'checkout.session.completed', data: { object: { payment_link: require('../api/shared/bani-uk-ai-course.json').paymentLinkId } } });
    const t = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', 'fixture').update(t + '.' + raw).digest('hex');
    await callback(context, { rawBody: raw, headers: { 'stripe-signature': `t=${t},v1=${signature}` } });
    assert.equal(context.res.status, 503);
  } finally { if (old === undefined) delete process.env.BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET; else process.env.BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET = old; }
});
test('purchase callback forwards only a signed event ID, and upstream errors request independent retries', async () => {
  const callback = require('../api/bani-uk-ai-google-purchases');
  const names = ['BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET', 'BANI_UK_AI_GOOGLE_CALLBACK_ENABLED', 'BANI_UK_AI_GOOGLE_CALLBACK_KEY'];
  const old = names.map(name => process.env[name]);
  const oldFetch = global.fetch;
  try {
    process.env[names[0]] = 'fixture'; process.env[names[1]] = 'true'; process.env[names[2]] = 'fixture-key';
    const raw = JSON.stringify({ id: 'evt_fixture', type: 'checkout.session.completed', data: { object: { payment_link: require('../api/shared/bani-uk-ai-course.json').paymentLinkId, customer_details: { email: 'fixture@example.test' } } } });
    const t = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', 'fixture').update(t + '.' + raw).digest('hex');
    const req = { rawBody: raw, headers: { 'stripe-signature': `t=${t},v1=${signature}` } };
    for (const ok of [true, false]) {
      global.fetch = async (url, options) => {
        assert.ok(url.endsWith('/internal/google-course-purchases'));
        assert.deepEqual(JSON.parse(options.body), { stripeEventId: 'evt_fixture' });
        assert.equal(options.headers['x-functions-key'], 'fixture-key');
        return { ok };
      };
      const context = {}; await callback(context, req); assert.equal(context.res.status, ok ? 200 : 503);
    }
  } finally {
    global.fetch = oldFetch;
    names.forEach((name, i) => { if (old[i] === undefined) delete process.env[name]; else process.env[name] = old[i]; });
  }
});
