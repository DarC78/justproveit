const { validSignature } = require('../shared/baniUkAiStripe');
const course = require('../shared/bani-uk-ai-course.json');

// Dedicated Stripe subscription: its durable retries are independent of welcome
// email fulfillment. Do not register it before the backend and keys are ready.
module.exports = async function googlePurchaseCallback(context, req) {
  const reply = (status, body) => { context.res = { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body }; };
  if (!validSignature(req.rawBody, req.headers?.['stripe-signature'], process.env.BANI_UK_AI_GOOGLE_STRIPE_WEBHOOK_SECRET)) { reply(400, { error: 'Invalid signature' }); return; }
  try {
    const event = JSON.parse(Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody);
    if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type) || event.data?.object?.payment_link !== course.paymentLinkId) { reply(200, { ignored: true }); return; }
    if (!/^evt_[A-Za-z0-9]+$/.test(event.id || '')) { reply(400, { error: 'Invalid event' }); return; }
    if (process.env.BANI_UK_AI_GOOGLE_CALLBACK_ENABLED !== 'true' || !process.env.BANI_UK_AI_GOOGLE_CALLBACK_KEY) { reply(503, { retryable: true }); return; }
    // Only the event ID crosses the boundary. LaunchingStack independently
    // retrieves Stripe event/session and validates value, live mode and consent.
    const result = await fetch('https://launchingstack-func-dev.azurewebsites.net/api/justproveit/internal/google-course-purchases', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-functions-key': process.env.BANI_UK_AI_GOOGLE_CALLBACK_KEY },
      body: JSON.stringify({ stripeEventId: event.id }), signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) { reply(503, { retryable: true }); return; }
    reply(200, { received: true });
  } catch { reply(503, { retryable: true }); }
};
