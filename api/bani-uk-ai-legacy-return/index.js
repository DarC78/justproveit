// SWA's static redirect drops query parameters. Preserve checkout references
// through a fixed local destination; callers cannot override the redirect URL.
module.exports = async function legacyReturn(context, req) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query || {})) {
    if (typeof value === 'string') query.set(key, value);
  }
  const suffix = query.toString();
  context.res = {
    status: 301,
    headers: {
      Location: '/bani-uk-multumim/' + (suffix ? '?' + suffix : ''),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
    body: '',
  };
};
