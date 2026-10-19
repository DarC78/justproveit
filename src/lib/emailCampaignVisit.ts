import sourceConfig from '@/config/email-attribution.json';
import content from '../../api/shared/email-attribution-content.json';

type Pilot = { enabled: boolean; tokenSha256: string | null; preparedAt: string | null; expiresAt: string | null };
const config: { enabled: boolean; endpoint: string; pilot?: Pilot } = sourceConfig;
const KEY = 'proveit-advertising-consent-v1';
type Choice = { choice: 'unknown' | 'granted' | 'denied'; version: string; purposes: string[]; at?: string };
type Attribution = { token: string; visitId: string; eventId: string; ttclid?: string };
type VisitWindow = Window & {
  proveitEmailToken?: string; proveitEmailAttribution?: Attribution;
  proveitAdvertising?: unknown;
  fbq?: (...args: unknown[]) => void;
  ttq?: { track?: (...args: unknown[]) => void };
};
type VisitState = { context: Attribution; sent: Set<string>; meta: boolean; tiktok: boolean; generation: number; active: boolean; timers: Set<ReturnType<typeof setTimeout>>; expiresAt?: number; expiryTimer?: ReturnType<typeof setTimeout> };
let state: VisitState | undefined;
const salesPage = () => window.location.protocol === 'https:' && ['www.justproveit.co.uk', 'justproveit.co.uk'].includes(window.location.hostname) && /^\/bani-uk-ai\/?$/.test(window.location.pathname);
function pilotExpiry(): number | null {
  const pilot = config.pilot;
  if (!pilot?.enabled || !/^[a-f0-9]{64}$/.test(pilot.tokenSha256 || '') || !pilot.preparedAt || !pilot.expiresAt) return null;
  const prepared = Date.parse(pilot.preparedAt), expiry = Date.parse(pilot.expiresAt), now = Date.now();
  return Number.isFinite(prepared) && Number.isFinite(expiry) && prepared <= now && expiry > now && expiry > prepared && expiry - prepared <= 3600000 ? expiry : null;
}
const permitted = (visit: VisitState) => visit.active && salesPage() && (visit.expiresAt === undefined || Date.now() < visit.expiresAt);
export function emailVisitChoice(): Choice {
  const unknown: Choice = { choice: 'unknown', version: KEY, purposes: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!['granted', 'denied'].includes(saved?.value) || !Number.isFinite(saved.expires) || saved.expires <= Date.now()) return unknown;
    const at = saved.at ? Date.parse(saved.at) : saved.expires - 180 * 86400000;
    if (!Number.isFinite(at) || at < Date.now() - 181 * 86400000 || at > Date.now() + 300000) return unknown;
    return { choice: saved.value, version: KEY, purposes: [], at: new Date(at).toISOString() };
  } catch { return unknown; }
}
function identifiers(context: Attribution, consent: Choice) {
  if (consent.choice === 'denied') return {};
  const result: Record<string, string> = {};
  try {
    const cookies = new Map(document.cookie.split(';').map(value => {
      const index = value.indexOf('='); return [value.slice(0, index).trim(), value.slice(index + 1)] as const;
    }));
    for (const [cookie, field] of [['_fbp', 'fbp'], ['_fbc', 'fbc'], ['_ttp', 'ttp']]) {
      const value = cookies.get(cookie);
      if (value && /^[A-Za-z0-9._-]{1,256}$/.test(value)) result[field] = value;
    }
    if (context.ttclid && /^[A-Za-z0-9._-]{1,256}$/.test(context.ttclid)) result.ttclid = context.ttclid;
  } catch { /* Identifiers are optional. */ }
  return result;
}
function browserEvents(visit: VisitState, consent: Choice) {
  if (!permitted(visit) || consent.choice === 'denied') return;
  const w = window as VisitWindow;
  if (!w.proveitAdvertising) return;
  try { if (!visit.meta && w.fbq) { w.fbq('track', 'ViewContent', {}, { eventID: visit.context.eventId }); visit.meta = true; } } catch { /* SDK failures never block the other platform. */ }
  try { if (!visit.tiktok && w.ttq?.track) { w.ttq.track('ViewContent', content, { event_id: visit.context.eventId }); visit.tiktok = true; } } catch { /* Background attribution is independent. */ }
}
function send(visit: VisitState, consent: Choice) {
  if (!permitted(visit)) return;
  const signature = JSON.stringify(consent);
  if (visit.sent.has(signature)) return;
  visit.sent.add(signature);
  visit.timers.forEach(clearTimeout); visit.timers.clear();
  const generation = ++visit.generation;
  const body = JSON.stringify({ token: visit.context.token, visitId: visit.context.visitId, eventId: visit.context.eventId, pagePath: '/bani-uk-ai/', dedupVersion: 'email-view-v1', consent, ...identifiers(visit.context, consent) });
  if (new TextEncoder().encode(body).length >= 8192) return;
  const attempt = async (number: number) => {
    if (!permitted(visit) || visit.generation !== generation) return;
    try {
      const response = await fetch(config.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, signal: AbortSignal.timeout(5000) });
      if (response.status !== 503) return; // 202 is generic acceptance, not proof of identity or delivery.
    } catch { /* At most two delayed retries with the exact body and event IDs. */ }
    if (number < 3 && permitted(visit) && visit.generation === generation) {
      const timer = setTimeout(() => { visit.timers.delete(timer); void attempt(number + 1); }, number * 1000);
      visit.timers.add(timer);
    }
  };
  void attempt(1);
}
export function clearEmailCampaignVisit() {
  if (state) { state.active = false; state.timers.forEach(clearTimeout); if (state.expiryTimer !== undefined) clearTimeout(state.expiryTimer); state = undefined; }
  const w = window as VisitWindow;
  delete w.proveitEmailAttribution; delete w.proveitEmailToken;
}
export function installEmailCampaignVisit() {
  if (!salesPage()) return () => {};
  const context = (window as VisitWindow).proveitEmailAttribution;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  if (!context || !/^[A-Za-z0-9_-]{43}$/.test(context.token) || !uuid.test(context.visitId) || !uuid.test(context.eventId)) return () => {};
  if (config.enabled && config.pilot?.enabled) return () => {}; // Ambiguous mode fails closed.
  if (config.enabled) return startVisit(context);
  const expiry = pilotExpiry();
  if (expiry === null || !globalThis.crypto?.subtle) return () => {};
  let disposed = false;
  let cleanup = () => {};
  // The hash is an isolation gate, never authentication. Backend validates the
  // actual token, fixture binding, expiry and vendor test-mode settings again.
  void Promise.resolve().then(() => crypto.subtle.digest('SHA-256', new TextEncoder().encode(context.token))).then(bytes => {
    const digest = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
    if (!disposed && digest === config.pilot?.tokenSha256 && pilotExpiry() !== null && salesPage() && (window as VisitWindow).proveitEmailAttribution === context) cleanup = startVisit(context, expiry);
  }).catch(() => { /* Fail closed if secure crypto is unavailable. */ });
  return () => { disposed = true; cleanup(); };
}
function startVisit(context: Attribution, expiresAt?: number) {
  if (!state || state.context !== context) state = { context, sent: new Set(), meta: false, tiktok: false, generation: 0, active: true, timers: new Set() };
  const visit = state;
  if (expiresAt !== undefined && visit.expiryTimer === undefined) {
    visit.expiresAt = expiresAt;
    visit.expiryTimer = setTimeout(clearEmailCampaignVisit, Math.max(0, expiresAt - Date.now()));
  }
  const sync = () => { const consent = emailVisitChoice(); browserEvents(visit, consent); send(visit, consent); };
  const ready = () => browserEvents(visit, emailVisitChoice());
  const choiceChanged = (event: Event) => {
    const value = (event as CustomEvent<{ value?: string; at?: string }>).detail;
    if (!value || !['granted', 'denied'].includes(value.value || '') || !value.at || !Number.isFinite(Date.parse(value.at))) return;
    const consent: Choice = { choice: value.value as 'granted' | 'denied', at: value.at, version: KEY, purposes: [] };
    browserEvents(visit, consent); send(visit, consent);
  };
  sync();
  window.addEventListener('proveit-advertising-ready', ready);
  window.addEventListener('proveit-advertising-choice', choiceChanged);
  window.addEventListener('storage', sync);
  window.addEventListener('pagehide', clearEmailCampaignVisit);
  return () => {
    // StrictMode remounts reuse the same visit/context and in-flight request.
    window.removeEventListener('proveit-advertising-ready', ready);
    window.removeEventListener('proveit-advertising-choice', choiceChanged);
    window.removeEventListener('storage', sync);
    window.removeEventListener('pagehide', clearEmailCampaignVisit);
  };
}
