const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { calendar } = require('../api/shared/baniUkAiCalendar');
const { onboardingEmail } = require('../api/shared/baniUkAiEmail');
const { paidCourseSession, validSignature, fulfill, verify, webhook } = require('../api/shared/baniUkAiStripe');
const course = require('../api/shared/bani-uk-ai-course.json');
const paid = { id: 'cs_live_synthetic1234567890', payment_link: course.paymentLinkId, mode: 'payment', status: 'complete', payment_status: 'paid', currency: 'gbp', amount_total: 3900, livemode: true, created: 1792360000, customer_details: { email: 'fixture@example.test', name: 'Ana Popescu' } };

test('only paid, complete GBP sessions from the exact live course link qualify', () => {
  assert.equal(paidCourseSession(paid), true);
  for (const patch of [{ payment_status: 'unpaid' }, { payment_link: 'plink_other' }, { status: 'open' }, { amount_total: 0 }, { amount_total: '3900' }, { currency: 'eur' }, { livemode: false }, { mode: 'subscription' }, { id: 'fake' }]) assert.equal(paidCourseSession({ ...paid, ...patch }), false, JSON.stringify(patch));
});
test('webhook signatures reject changes, missing secrets and replayed timestamps', () => {
  const raw = JSON.stringify({ type: 'checkout.session.completed' });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac('sha256', 'test_secret').update(timestamp + '.' + raw).digest('hex');
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(validSignature(raw, header, 'test_secret'), true);
  assert.equal(validSignature(raw + ' ', header, 'test_secret'), false);
  assert.equal(validSignature(raw, header, ''), false);
  assert.equal(validSignature(raw, header, 'test_secret', Date.now() + 600000), false);
});
test('invalid browser sessions and unsigned webhook requests fail before external work', async () => {
  const a = {}, b = {};
  await verify(a, { body: { sessionId: 'fake' } }); assert.equal(a.res.status, 400);
  await webhook(b, { rawBody: '{}', headers: {} }); assert.equal(b.res.status, 400);
});
class FakeTable {
  constructor() { this.rows = new Map(); }
  async getEntity(_, id) { if (!this.rows.has(id)) throw Object.assign(new Error(), { statusCode: 404 }); return { ...this.rows.get(id), etag: 'fixture' }; }
  async createEntity(row) { if (this.rows.has(row.rowKey)) throw Object.assign(new Error(), { statusCode: 409 }); this.rows.set(row.rowKey, { ...row }); }
  async updateEntity(row) { this.rows.set(row.rowKey, { ...this.rows.get(row.rowKey), ...row }); }
}
test('durable fulfillment reuses one session key and prevents duplicate onboarding', async () => {
  const table = new FakeTable(); let sends = 0;
  const send = async (payload, key) => { sends++; assert.equal(payload.to[0], 'fixture@example.test'); assert.equal(key, `bani-uk-ai-onboarding-${paid.id}`); return { id: 'message-fixture' }; };
  await fulfill(paid, table, send); await fulfill(paid, table, send);
  assert.equal(sends, 1);
  assert.equal(table.rows.get(paid.id).partitionKey, 'FondatoriBaniUkAi');
  assert.equal(table.rows.get(paid.id).amountPence, 3900);
});
test('concurrent webhook delivery cannot acquire the same new session twice', async () => {
  const table = new FakeTable(); let sends = 0;
  const result = await Promise.allSettled([fulfill(paid, table, async () => { sends++; return { id: 'one' }; }), fulfill(paid, table, async () => { sends++; return { id: 'two' }; })]);
  assert.equal(sends, 1); assert.ok(result.some(r => r.status === 'fulfilled'));
});
test('ambiguous delivery beyond provider idempotency window requires reconciliation', async () => {
  const table = new FakeTable();
  await table.createEntity({ partitionKey: 'FondatoriBaniUkAi', rowKey: paid.id, firstAttempt: Date.now() - 25 * 3600000, leaseUntil: 0 });
  await assert.rejects(() => fulfill(paid, table, async () => { throw new Error('must not send'); }), /reconciliation/);
});
test('calendar has four Europe/London sessions, 90 minute durations and reminders', () => {
  const ics = calendar();
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 4);
  assert.equal((ics.match(/TRIGGER:-PT1H/g) || []).length, 4);
  for (const day of ['03', '10', '17', '24']) { assert.ok(ics.includes(`DTSTART;TZID=Europe/London:202611${day}T200000`)); assert.ok(ics.includes(`DTEND;TZID=Europe/London:202611${day}T213000`)); }
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});
test('email uses real amount, first name, safe escaping and matching calendar attachment', () => {
  const email = onboardingEmail({ ...paid, amount_total: 9700 });
  assert.ok(email.text.includes('Salut, Ana,')); assert.ok(email.text.includes('£97.00'));
  assert.equal(Buffer.from(email.attachments[0].content, 'base64').toString(), calendar());
  assert.equal(email.reply_to, 'adriandefta@proveitweb.co.uk');
  assert.ok(onboardingEmail({ ...paid, customer_details: { email: 'fixture@example.test' } }).text.startsWith('Salut,'));
  assert.ok(!onboardingEmail({ ...paid, customer_details: { email: 'fixture@example.test', name: '<img>' } }).html.includes('Salut, <img>'));
});
test('verified purchase queues actual amount once per vendor/session and never accepts a forged result', () => {
  const exports = {}, stored = new Map(), meta = [], tiktok = [];
  const window = { fbq: (...args) => meta.push(args), ttq: { track: (...args) => tiktok.push(args) } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/baniUkAiPurchase.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, window, localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  const purchase = { paid: true, sessionId: paid.id, value: 97, currency: 'GBP', emailSent: true };
  exports.trackVerifiedCoursePurchase(purchase); exports.trackVerifiedCoursePurchase(purchase);
  exports.trackVerifiedCoursePurchase({ ...purchase, paid: false });
  assert.equal(meta.length, 1); assert.equal(tiktok.length, 1); assert.equal(window.dataLayer.length, 1);
  assert.equal(meta[0][2].value, 97); assert.equal(meta[0][3].eventID, paid.id);
  assert.equal(window.dataLayer[0].ecommerce.transaction_id, paid.id);
});
