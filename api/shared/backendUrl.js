// Server-side API forwarding must use the configured backend; local staging never falls back to Azure.
function backendUrl(route) {
  const configured = process.env.JUSTPROVEIT_API_BASE_URL;
  if (!configured) throw new Error('JUSTPROVEIT_API_BASE_URL is required');
  const base = new URL(configured);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid backend URL');
  if (process.env.LocalStaging === 'true' && !['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) throw new Error('Local staging backend must use loopback');
  return base.href.replace(/\/$/, '') + '/' + route.replace(/^\//, '');
}
module.exports = { backendUrl };
