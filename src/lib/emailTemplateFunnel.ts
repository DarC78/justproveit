type FunnelWindow = Window & { proveitEmailToken?: string };
type Visit = { id: string; visitor: string; template: string | null; created: number };
let visit: Visit | null = null;
const templatePattern = /^ro-bani-uk-ai-email-\d{2}$/;
function denied() {
  try { const choice = JSON.parse(localStorage.getItem('proveit-advertising-consent-v1') || 'null'); return choice?.value === 'denied' && choice.expires > Date.now(); } catch { return false; }
}
function browserId() {
  try { const saved = JSON.parse(localStorage.getItem('proveit-funnel-browser-v1') || 'null'); if (saved?.expires > Date.now() && /^[a-f0-9-]{36}$/i.test(saved.id)) return saved.id as string;
    const id = crypto.randomUUID(); localStorage.setItem('proveit-funnel-browser-v1', JSON.stringify({ id, expires: Date.now() + 180 * 86400000 })); return id;
  } catch { return crypto.randomUUID(); }
}
export function installEmailTemplateFunnel() {
  if (typeof window === 'undefined' || !/^\/bani-uk-ai\/?$/.test(location.pathname) || denied()) return () => {};
  const template = new URL(location.href).searchParams.get('utm_content');
  if (!visit || Date.now() - visit.created > 2000) visit = { id: crypto.randomUUID(), visitor: browserId(), template: templatePattern.test(template || '') ? template : null, created: Date.now() };
  const current = visit;
  const send = (eventType: string, eventId: string) => {
    if (denied()) return;
    const token = (window as FunnelWindow).proveitEmailToken;
    const body = JSON.stringify({ eventId, visitorId: current.visitor, pageVisitId: current.id, eventType, templateKey: current.template, ...(token && /^[A-Za-z0-9_-]{43}$/.test(token) ? { emailToken: token } : {}) });
    void fetch('/api/bani-uk-ai-funnel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  };
  send('page_view', current.id);
  const click = (event: MouseEvent) => {
    if (denied() || (event.type === 'auxclick' && event.button !== 1)) return;
    const anchor = event.target instanceof Element ? event.target.closest('a') : null;
    if (!anchor) return;
    let target: URL; try { target = new URL(anchor.href); } catch { return; }
    if (target.origin !== 'https://buy.stripe.com' || target.pathname !== '/00wdR8gUP7548yvd7R4Ni1o') return;
    const id = crypto.randomUUID(); target.searchParams.set('client_reference_id', 'jpi_' + id); anchor.href = target.href;
    send('checkout_click', id);
  };
  document.addEventListener('click', click, true); document.addEventListener('auxclick', click, true);
  return () => { document.removeEventListener('click', click, true); document.removeEventListener('auxclick', click, true); };
}
