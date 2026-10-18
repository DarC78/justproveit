const crypto = require('node:crypto');
const course = require('./bani-uk-ai-course.json');
const { onboardingEmail } = require('./baniUkAiEmail');
const { TableClient } = require('@azure/data-tables');
const PARTITION = 'FondatoriBaniUkAi';
function json(status, body) { return { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }, body }; }
async function stripe(path, options = {}) {
  const key = process.env.BANI_UK_AI_STRIPE_SECRET_KEY;
  if (!key) throw new Error('Course Stripe configuration unavailable');
  const response = await fetch(`https://api.stripe.com/v1${path}`, { ...options, headers: { Authorization: `Bearer ${key}`, ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw Object.assign(new Error(`Stripe request failed (${response.status})`), { status: response.status });
  return response.json();
}
function paidCourseSession(session) {
  return session.payment_link === course.paymentLinkId && session.status === 'complete' && session.mode === 'payment' && session.payment_status === 'paid' && session.currency === 'gbp' && Number.isSafeInteger(session.amount_total) && session.amount_total > 0 && /^cs_(live|test)_[A-Za-z0-9]+$/.test(session.id || '') && session.livemode === (process.env.BANI_UK_AI_STRIPE_TEST_MODE !== 'true');
}
async function table() {
  if (!process.env.BANI_UK_AI_STORAGE_CONNECTION) throw new Error('Course storage configuration unavailable');
  const client = TableClient.fromConnectionString(process.env.BANI_UK_AI_STORAGE_CONNECTION, 'BaniUkAiFounders');
  await client.createTable().catch(error => { if (error.statusCode !== 409) throw error; });
  return client;
}
async function record(client, id) {
  try { return await client.getEntity(PARTITION, id); } catch (error) { if (error.statusCode === 404) return null; throw error; }
}
async function verify(context, req) {
  const id = req.body?.sessionId;
  if (typeof id !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(id)) { context.res = json(400, { paid: false }); return; }
  try {
    const session = await stripe(`/checkout/sessions/${encodeURIComponent(id)}`);
    if (!paidCourseSession(session)) { context.res = json(400, { paid: false }); return; }
    const client = await table();
    const saved = await record(client, id);
    // Never return the customer's name, email, address or complete Stripe object.
    context.res = json(200, { paid: true, sessionId: session.id, value: session.amount_total / 100, currency: 'GBP', emailSent: Boolean(saved?.emailId) });
  } catch (error) { context.res = error.status === 404 ? json(400, { paid: false }) : json(503, { paid: false, retryable: true }); }
}
function validSignature(raw, header, secret, now = Date.now()) {
  if (!secret || !raw || typeof header !== 'string') return false;
  const fields = header.split(',').map(item => item.split('='));
  const timestamp = fields.find(([key]) => key === 't')?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const digest = crypto.createHmac('sha256', secret).update(timestamp + '.').update(raw).digest();
  return fields.filter(([key]) => key === 'v1').some(([, value]) => /^[a-f0-9]{64}$/.test(value || '') && crypto.timingSafeEqual(digest, Buffer.from(value, 'hex')));
}
async function fulfill(session, client, sendEmail) {
  if (!paidCourseSession(session) || !session.customer_details?.email) throw new Error('Ineligible checkout session');
  let saved = await record(client, session.id);
  if (saved?.emailId) return { duplicate: true };
  const now = Date.now();
  if (saved?.leaseUntil > now) throw new Error('Fulfillment already in progress');
  // Resend idempotency lasts 24h. If delivery became ambiguous beyond that
  // window, require reconciliation instead of risking another onboarding email.
  if (saved?.firstAttempt && now - saved.firstAttempt > 23 * 3600000) throw new Error('Delivery requires reconciliation');
  const entity = { partitionKey: PARTITION, rowKey: session.id, course: course.key, email: session.customer_details.email, name: session.customer_details.name || '', amountPence: session.amount_total, currency: 'GBP', status: 'paid', paidAt: new Date(session.created * 1000).toISOString(), leaseUntil: now + 120000, firstAttempt: saved?.firstAttempt || now };
  if (!saved) await client.createEntity(entity);
  else await client.updateEntity(entity, 'Merge', { etag: saved.etag });
  try {
    const result = await sendEmail(onboardingEmail(session), `bani-uk-ai-onboarding-${session.id}`);
    if (!result.id) throw new Error('No email receipt');
    await client.updateEntity({ partitionKey: PARTITION, rowKey: session.id, emailId: result.id, sentAt: new Date().toISOString(), leaseUntil: 0 }, 'Merge');
    return { duplicate: false };
  } catch (error) {
    await client.updateEntity({ partitionKey: PARTITION, rowKey: session.id, leaseUntil: 0 }, 'Merge').catch(() => {});
    throw error;
  }
}
async function webhook(context, req) {
  const raw = req.rawBody;
  if (!validSignature(raw, req.headers?.['stripe-signature'], process.env.BANI_UK_AI_WEBHOOK_SECRET)) { context.res = json(400, { error: 'Invalid signature' }); return; }
  try {
    const event = JSON.parse(Buffer.isBuffer(raw) ? raw.toString('utf8') : raw);
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) || event.data?.object?.payment_link !== course.paymentLinkId || event.data.object.payment_status !== 'paid') { context.res = json(200, { ignored: true }); return; }
    const session = await stripe(`/checkout/sessions/${encodeURIComponent(event.data.object.id)}`);
    if (!paidCourseSession(session)) { context.res = json(200, { ignored: true }); return; }
    const client = await table();
    await fulfill(session, client, async (payload, key) => {
      if (!process.env.BANI_UK_AI_RESEND_API_KEY) throw new Error('Email configuration unavailable');
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.BANI_UK_AI_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`Onboarding send failed (${response.status})`);
      return response.json();
    });
    const link = await stripe(`/payment_links/${course.paymentLinkId}`);
    if (link.active && link.restrictions?.completed_sessions?.count >= course.capacity) {
      await stripe(`/payment_links/${course.paymentLinkId}`, { method: 'POST', body: new URLSearchParams({ active: 'false' }) });
    }
    context.res = json(200, { received: true });
  } catch { context.res = json(503, { error: 'Please retry fulfillment' }); }
}
async function capacity(context) {
  try {
    const link = await stripe(`/payment_links/${course.paymentLinkId}`);
    const sold = link.restrictions?.completed_sessions?.count;
    context.res = json(200, { capacity: course.capacity, sold: typeof sold === 'number' ? sold : null, soldOut: !link.active || (typeof sold === 'number' && sold >= course.capacity) });
  } catch { context.res = json(503, { error: 'Capacity temporarily unavailable' }); }
}
module.exports = { verify, webhook, capacity, paidCourseSession, validSignature, fulfill };
