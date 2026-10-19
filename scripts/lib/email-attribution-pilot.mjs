import { createHash } from 'node:crypto';

// Pure preparation. Only BE can issue a real fixture token; never generate one
// here, infer readiness, or submit a visit as a side effect.
export function preparePilot(input, current, google, now = Date.now()) {
  if (current.enabled || google.customerDataConsentEnabled || google.purchaseEnabled || google.purchaseDestinationVerified) throw new Error('General rollout and Google must remain disabled');
  if (!input || input.syntheticFixture !== true || input.backendMode !== 'test' || input.vendorTestReady !== true || input.backendPilotIsolated !== true) throw new Error('Explicit synthetic fixture, isolated backend pilot and vendor-test readiness required');
  if (typeof input.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(input.token)) throw new Error('A BE-issued 43-character fixture token is required');
  const expiry = typeof input.expiresAt === 'string' ? Date.parse(input.expiresAt) : NaN;
  if (!Number.isFinite(expiry) || expiry <= now || expiry - now > 3600000) throw new Error('Pilot expiry must be in the next 60 minutes');
  return { ...current, enabled: false, pilot: {
    enabled: true,
    tokenSha256: createHash('sha256').update(input.token, 'utf8').digest('hex'),
    preparedAt: new Date(now).toISOString(), expiresAt: new Date(expiry).toISOString(),
  } };
}
