const ORIGINS = ['https://www.justproveit.co.uk', 'https://justproveit.co.uk'];
function createHandler({ fetchImpl = fetch, env = process.env } = {}) {
  return async (context, req) => {
    const reply = (status, body) => { context.res = { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }, body }; };
    const origin = req.headers?.origin;
    if (!ORIGINS.includes(origin)) { reply(403, { error: 'Forbidden' }); return; }
    const b = req.body;
    if (!b || typeof b !== 'object' || Array.isArray(b) || JSON.stringify(b).length > 8192 || Object.keys(b).some(k => !['source','sessionId','action','adUserData','adPersonalization','version','at'].includes(k))) { reply(400, { error: 'Invalid request' }); return; }
    const base = env.AzureFunctionsWebHost__hostid === 'justproveit-inhouse' ? 'http://127.0.0.1:7076' : 'https://agents.launchingstack.com';
    try {
      const r = await fetchImpl(base + '/api/justproveit/public/google-purchase-consent', {
        method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Forwarded-For': String(req.headers?.['x-forwarded-for'] || '').slice(0,200) },
        body: JSON.stringify(b), signal: AbortSignal.timeout(15000),
      });
      const result = await r.json();
      reply(r.status, result);
    } catch { reply(503, { error: 'Nu am putut verifica plata sau salva preferințele. Poți reîncerca.' }); }
  };
}
module.exports = { createHandler, handler: createHandler() };
