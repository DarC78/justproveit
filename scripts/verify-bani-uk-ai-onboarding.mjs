import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { calendar } = require('../api/shared/baniUkAiCalendar.js');
const origin = 'https://www.justproveit.co.uk';
const request = (path, options = {}) => fetch(origin + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(20000) });
const page = await request('/bani-uk-multumim/');
assert.equal(page.status, 200);
assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');
assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
const html = await page.text();
assert.ok(html.includes('https://www.justproveit.co.uk/bani-uk-multumim/'), 'canonical must use renamed route');
for (const legacy of ['/bani-uk-ai-multumim', '/bani-uk-ai-multumim/']) {
  const redirect = await request(`${legacy}?session_id=cs_live_redirectcheck123456`);
  assert.equal(redirect.status, 301);
  const target = new URL(redirect.headers.get('location'), origin);
  assert.equal(target.pathname, '/bani-uk-multumim/');
  assert.equal(target.searchParams.get('session_id'), 'cs_live_redirectcheck123456');
}
assert.match(html, /noindex, nofollow/);
assert.ok(!html.includes('Plată confirmată'), 'unverified SSR must not claim payment confirmation');
const ics = await request('/bani-uk-ai-sesiuni.ics');
assert.equal(ics.status, 200);
assert.equal(await ics.text(), calendar());
assert.equal((await request('/bani-uk-ai-anulare.txt')).status, 200);
const capacity = await request('/api/bani-uk-ai/capacity');
assert.equal(capacity.status, 200);
assert.equal((await capacity.json()).capacity, 100);
for (const sessionId of ['invalid', 'cs_live_syntheticinvalid1234567890']) {
  const response = await request('/api/bani-uk-ai/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).paid, false);
}
const webhook = await request('/api/bani-uk-ai/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
assert.equal(webhook.status, 400);
console.log('Live onboarding checks passed: page/noindex, exact calendar, cancellation form, capacity, invalid sessions and unsigned webhook rejection.');
