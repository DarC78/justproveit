const { links } = require('../shared/email-links.json');

// Only version-controlled destinations can be followed. Caller URLs and tokens
// never override the destination or get forwarded.
module.exports = async function emailLink(context, req) {
  const id = req.query?.id;
  const destination = typeof id === 'string' && Object.hasOwn(links, id) ? links[id] : null;
  const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  if (!destination) {
    context.res = { status: 400, headers, body: 'Invalid email link.' };
    return;
  }
  const url = new URL(destination);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    context.res = { status: 400, headers, body: 'Invalid email link.' };
    return;
  }
  context.res = { status: 302, headers: { ...headers, Location: url.href }, body: '' };
};
