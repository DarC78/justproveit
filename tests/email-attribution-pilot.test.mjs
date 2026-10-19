import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preparePilot } from '../scripts/lib/email-attribution-pilot.mjs';
const now = Date.now();
const input = { token: 'a'.repeat(43), expiresAt: new Date(now + 1800000).toISOString(), syntheticFixture: true, backendMode: 'test', vendorTestReady: true, backendPilotIsolated: true };
const current = { enabled: false, campaignKey: 'CRM_PROMO_BANI_UK_AI_1' };
const google = { customerDataConsentEnabled: false, purchaseEnabled: false, purchaseDestinationVerified: false };
test('pilot preparation stores only a digest, keeps rollout off, and changes no Google setting', () => {
  const result = preparePilot(input, current, google, now);
  assert.equal(result.enabled, false); assert.equal(result.pilot.enabled, true);
  assert.match(result.pilot.tokenSha256, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(result).includes(input.token));
  assert.equal(current.pilot, undefined); assert.equal(google.purchaseEnabled, false);
});
test('preparation refuses missing test readiness, real-customer declarations, bad expiry and enabled rollout/Google', () => {
  for (const patch of [{ syntheticFixture: false }, { vendorTestReady: false }, { backendPilotIsolated: false }, { backendMode: 'live' }, { token: 'invalid' }, { expiresAt: new Date(now - 1).toISOString() }, { expiresAt: new Date(now + 7200000).toISOString() }]) assert.throws(() => preparePilot({ ...input, ...patch }, current, google, now));
  assert.throws(() => preparePilot(input, { ...current, enabled: true }, google, now));
  assert.throws(() => preparePilot(input, current, { ...google, purchaseEnabled: true }, now));
});
