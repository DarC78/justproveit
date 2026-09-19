import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

type Provider = { provider: string; username: string; password: string; url: string; notes: string };
type Vault = { providers: Provider[]; sourceDocuments?: { label: string; text: string }[]; sourceSheetRows?: Record<string, string>[] };
type Case = {
  id: string; version: number; fullName: string; email?: string; phone?: string; caseNumber?: number | null;
  status: string; actionType: string; nextAction: string; dueDate: string | null; priority: string; assignee?: string;
  importReviewed?: boolean; importedNotes?: string; reviewReasons?: string[]; payment?: { amount: string; refunded: string; status: string; paidAt: string };
  activity?: { id: number; actor: string; kind: string; createdAt: string; detail: { text?: string; before?: Record<string, unknown>; after?: Record<string, unknown> } }[];
};
type Listing = { cases: Case[]; statuses: string[]; actionTypes: string[] };
const fresh = (): Case => ({ id: '', version: 0, fullName: '', email: '', phone: '', status: 'new client', actionType: '', nextAction: '', dueDate: null, priority: 'normal', assignee: 'adrian@proveitweb.co.uk' });
const closed = (c: Case) => /^(Complet|Duplicat|Oprit)/.test(c.status);
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
const overdue = (c: Case, date = today()) => !closed(c) && Boolean(c.dueDate && c.dueDate < date);
class PensionError extends Error { constructor(message: string, public status: number) { super(message); } }
const message = (e: unknown) => e instanceof Error ? e.message : 'Operațiunea nu a reușit.';

export default function PrivatePensionsPanel({ token }: { token: string }) {
  const [listing, setListing] = useState<Listing>({ cases: [], statuses: [], actionTypes: [] });
  const [selected, setSelected] = useState<Case | null>(null);
  const [draft, setDraft] = useState<Case | null>(null);
  const [query, setQuery] = useState(''); const [status, setStatus] = useState(''); const [due, setDue] = useState('');
  const [note, setNote] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState(''); const [vault, setVault] = useState<Vault | null>(null);
  const [vaultDirty, setVaultDirty] = useState(false);
  const [unlock, setUnlock] = useState<{ token: string; expiresAt: string; authToken: string } | null>(null);
  const { refreshSession } = useAuth();
  const [conflict, setConflict] = useState(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const operation = useRef(false);
  const authToken = useRef(token);
  authToken.current = token;
  const [day, setDay] = useState(today);
  const vaultRequests = useRef(new Set<AbortController>());
  function lock() {
    generation.current++;
    vaultRequests.current.forEach(controller => controller.abort());
    vaultRequests.current.clear();
    setVault(null); setVaultDirty(false); setUnlock(null); setPassword('');
  }
  function begin() {
    if (operation.current) return false;
    operation.current = true; setBusy(true); setError(''); setNotice('');
    return true;
  }
  function end() { operation.current = false; if (mounted.current) setBusy(false); }
  async function api<T>(path = '', method = 'GET', body?: unknown, vaultToken?: string): Promise<T> {
    const protectedRequest = path === '/unlock' || path.endsWith('/vault');
    const controller = new AbortController();
    if (protectedRequest) vaultRequests.current.add(controller);
    const base = API_BASE_URL.replace(/\/+$/, '');
    try {
      const res = await fetch(`${base}${base.endsWith('/api') ? '' : '/api'}/justproveit/admin/crm/private-pensions${path}`, {
        method, cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(vaultToken ? { 'x-pension-unlock': vaultToken } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401 && mounted.current && authToken.current === token) {
          lock(); void refreshSession();
        }
        throw new PensionError(res.status === 409
          ? 'Conflict: dosarul a fost modificat. Ciorna este păstrată. Reîncarcă dosarul pentru a verifica ultima versiune.'
          : res.status === 404 ? 'Dosarul nu mai este disponibil. Reîncarcă lista.'
          : res.status === 401 ? 'Sesiunea a expirat. Se reînnoiește autentificarea; verifică înainte de a reîncerca.'
          : data?.error?.message || `Operațiunea nu a reușit (${res.status}). Reîncearcă.`, res.status);
      }
      return data as T;
    } finally { vaultRequests.current.delete(controller); }
  }
  function fail(e: unknown, protectedRequest = false) {
    if (!mounted.current || authToken.current !== token) return;
    if (e instanceof Error && e.name === 'AbortError') return;
    if (e instanceof PensionError && e.status === 409) setConflict(true);
    if (protectedRequest && e instanceof PensionError && (e.status === 403 || e.status === 401)) lock();
    setError(message(e));
  }
  async function refresh() {
    setLoading(true); setError('');
    try { const data = await api<Listing>(); if (mounted.current && authToken.current === token) setListing(data); }
    catch (e) { fail(e); }
    finally { if (mounted.current && authToken.current === token) setLoading(false); }
  }
  useEffect(() => {
    mounted.current = true; lock(); void refresh();
    const requests = vaultRequests.current;
    const epoch = generation;
    return () => {
      mounted.current = false; epoch.current++;
      requests.forEach(controller => controller.abort());
      requests.clear();
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!unlock) return;
    const timer = window.setTimeout(lock, Math.max(0, Date.parse(unlock.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [unlock]);
  useEffect(() => {
    const hide = () => { if (document.hidden) lock(); setDay(today()); };
    const timer = window.setInterval(() => setDay(today()), 30000);
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); window.clearInterval(timer); };
  }, []);
  const dirty = Boolean(note || (draft && JSON.stringify(draft) !== JSON.stringify(selected)));
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || vaultDirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, vaultDirty]);
  function canSwitch() { return !(dirty || vaultDirty) || window.confirm('Renunți la modificările nesalvate?'); }
  async function openCase(c: Case) {
    if (operation.current || !canSwitch() || !begin()) return;
    lock();
    try {
      const full = await api<Case>(`/${encodeURIComponent(c.id)}`);
      if (mounted.current && authToken.current === token) { setSelected(full); setDraft(full); setNote(''); setConflict(false); }
    } catch (e) { fail(e); } finally { end(); }
  }
  function newCase() {
    if (operation.current || !canSwitch()) return;
    lock(); const c = fresh(); setSelected(c); setDraft(c); setNote(''); setError(''); setNotice(''); setConflict(false);
  }
  function change<K extends keyof Case>(key: K, value: Case[K]) { setDraft(c => c ? { ...c, [key]: value } : c); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!draft || conflict || !begin()) return;
    try {
      if (!draft.fullName.trim()) throw new Error('Completează numele.');
      const { fullName, email = '', phone = '', status, actionType, nextAction, dueDate, priority, assignee = '', version, importReviewed } = draft;
      const body = { fullName, email, phone, status, actionType, nextAction, dueDate, priority, assignee, ...(importReviewed !== undefined ? { importReviewed } : {}), ...(draft.id ? { version, ...(note.trim() ? { note } : {}) } : {}) };
      const saved = await api<Case>(draft.id ? `/${encodeURIComponent(draft.id)}` : '', draft.id ? 'PATCH' : 'POST', body);
      if (mounted.current && authToken.current === token) {
        setSelected(saved); setDraft(saved); setNote(''); setNotice('Dosarul a fost salvat.');
        setListing(l => ({ ...l, cases: [...l.cases.filter(c => c.id !== saved.id), saved] }));
      }
    } catch (e) { fail(e); } finally { end(); }
  }
  async function unlockVault(event: FormEvent) {
    event.preventDefault(); if (!draft?.id || document.hidden || !begin()) return;
    const current = ++generation.current;
    const valid = () => current === generation.current && mounted.current && authToken.current === token && !document.hidden;
    try {
      const pending = api<{ token: string; expiresAt: string }>('/unlock', 'POST', { password });
      setPassword('');
      const grant = await pending;
      if (!valid()) return;
      if (!Number.isFinite(Date.parse(grant.expiresAt)) || Date.parse(grant.expiresAt) <= Date.now()) throw new Error('Accesul temporar a expirat.');
      setUnlock({ ...grant, authToken: token });
      const data = await api<Vault>(`/${encodeURIComponent(draft.id)}/vault`, 'GET', undefined, grant.token);
      if (valid() && Date.parse(grant.expiresAt) > Date.now()) setVault(data);
    } catch (e) { if (valid()) fail(e, true); } finally { end(); }
  }
  async function saveProviders() {
    if (!draft?.id || !vault || !unlock || conflict || !begin()) return;
    const current = generation.current;
    try {
      if (Date.parse(unlock.expiresAt) <= Date.now() || document.hidden) { lock(); return; }
      await api(`/${encodeURIComponent(draft.id)}/vault`, 'PUT', { version: draft.version, providers: vault.providers }, unlock.token);
      if (mounted.current && authToken.current === token) {
        // PUT increments exactly once; preserve unrelated case edits and the conflict base.
        setSelected(c => c ? { ...c, version: c.version + 1 } : c);
        setDraft(c => c ? { ...c, version: c.version + 1 } : c);
        if (current === generation.current) { setVaultDirty(false); setNotice('Datele furnizorilor au fost salvate.'); }
      }
    } catch (e) { fail(e, true); } finally { end(); }
  }
  const filtered = useMemo(() => listing.cases.filter(c =>
    (!status || c.status === status) && (!query || `${c.fullName} ${c.email} ${c.phone} ${c.caseNumber ?? ''}`.toLowerCase().includes(query.toLowerCase())) &&
    (!due || (due === 'overdue' ? overdue(c, day) : due === 'review' ? Boolean(c.reviewReasons?.length && !c.importReviewed) : c.dueDate === day))
  ).sort((a,b) => Number(overdue(b, day))-Number(overdue(a, day)) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999')), [listing, query, status, due, day]);
  return <section className="pensions">
    <header><div><h2>Livrare Pensii Private</h2><p>{listing.cases.length} dosare · {listing.cases.filter(c => !closed(c)).length} active · {listing.cases.filter(c => overdue(c, day)).length} restante</p></div><button disabled={busy} onClick={newCase}>+ Dosar nou</button><button disabled={busy || loading} onClick={() => void refresh()}>Reîncarcă</button></header>
    {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status">{notice}</p>}{conflict && draft?.id && <button disabled={busy} onClick={() => void openCase(draft)}>Reîncarcă dosarul curent (renunță la ciornă)</button>}
    <div className="filters"><label>Caută<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nume, email, telefon, dosar" /></label>
      <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Toate statusurile</option>{listing.statuses.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Urmărire<select value={due} onChange={e => setDue(e.target.value)}><option value="">Toate dosarele</option><option value="overdue">Termen depășit</option><option value="today">De contactat astăzi</option><option value="review">Import de verificat</option></select></label>
    </div>
    <div className="layout"><div className="list" aria-busy={loading}>
      <p role="status">{loading ? 'Se încarcă…' : `${filtered.length} rezultate`}</p>
      {!loading && !filtered.length && <p>Niciun dosar pentru filtrele selectate.</p>}
      {filtered.map(c => <button className={`case ${draft?.id === c.id ? 'selected' : ''}`} key={c.id} disabled={busy} onClick={() => void openCase(c)}>
        <strong>{c.caseNumber != null ? `#${c.caseNumber} · ` : ''}{c.fullName}</strong><span>{c.status}</span><small>{c.email}</small>
        {c.dueDate && <small className={overdue(c) ? 'error' : ''}>{overdue(c) ? 'Restant: ' : 'Următorul contact: '}{c.dueDate}</small>}
        {!!c.reviewReasons?.length && !c.importReviewed && <small>Import de verificat</small>}
      </button>)}
    </div><div className="detail">
      {!draft ? <p>Selectează un dosar pentru detalii și următoarea acțiune.</p> : <>
        <form onSubmit={save}><fieldset disabled={busy}><legend>{draft.id ? 'Detalii dosar' : 'Dosar nou'}</legend>
          {!!draft.reviewReasons?.length && <div className="review">Verifică asocierea și datele importate înainte de a continua. {draft.reviewReasons.join(', ')}<label><input type="checkbox" checked={Boolean(draft.importReviewed)} onChange={e => change('importReviewed', e.target.checked)} />Am verificat sursa originală (nu unește și nu corectează automat dosarele)</label></div>}
          <div className="grid"><label>Nume<input required maxLength={300} value={draft.fullName} onChange={e => change('fullName',e.target.value)} /></label>
          <label>Email<input maxLength={500} value={draft.email ?? ''} onChange={e => change('email',e.target.value)} /></label>
          <label>Telefon<input maxLength={100} value={draft.phone ?? ''} onChange={e => change('phone',e.target.value)} /></label>
          <label>Responsabil<input maxLength={320} value={draft.assignee ?? ''} onChange={e => change('assignee',e.target.value)} /></label>
          <label>Status<select value={draft.status} onChange={e => change('status',e.target.value)}>{Array.from(new Set([draft.status, ...listing.statuses])).map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Prioritate<select value={draft.priority} onChange={e => change('priority',e.target.value)}><option value="normal">Normală</option><option value="high">Ridicată</option><option value="urgent">Urgentă</option></select></label>
          <label>Tip acțiune<select value={draft.actionType ?? ''} onChange={e => change('actionType',e.target.value)}>{Array.from(new Set(['', draft.actionType, ...listing.actionTypes])).map(s => <option key={s} value={s}>{s || 'Nespecificat'}</option>)}</select></label>
          <label>Data următorului contact<input type="date" value={draft.dueDate || ''} onChange={e => change('dueDate',e.target.value || null)} /></label></div>
          <label>Următoarea acțiune<textarea maxLength={2000} value={draft.nextAction ?? ''} onChange={e => change('nextAction',e.target.value)} /></label>
          {draft.id && <label>Adaugă notă<textarea maxLength={20000} value={note} onChange={e => setNote(e.target.value)} placeholder="Ce s-a întâmplat și ce urmează" /></label>}
          <button type="submit" disabled={conflict}>{busy ? 'Se salvează…' : 'Salvează dosarul'}</button>{dirty && <small> Modificări nesalvate</small>}
        </fieldset></form>
        {draft.payment && <p>Plată: £{draft.payment.amount} · Rambursat: £{draft.payment.refunded} · {draft.payment.status} · Data plății: {draft.payment.paidAt || '—'}. Metadate importate, nu sold curent.</p>}
        {draft.importedNotes && <details open><summary>Observații importate</summary><p className="preserve">{draft.importedNotes}</p></details>}
        {draft.id && <section className="vault" data-clarity-mask="true" data-private="true"><h3>Acces furnizori și dosar original</h3>
          {unlock?.authToken === token && <button onClick={lock}>Blochează acum</button>}
          {!vault || unlock?.authToken !== token ? <form onSubmit={unlockVault}><label>Parola specială<input type="password" disabled={busy} required autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>Deblochează</button></form> : <>
            <p>Acces temporar, până la {new Date(unlock!.expiresAt).toLocaleTimeString('ro-RO')}. Blocarea elimină modificările nesalvate ale furnizorilor. Se blochează când părăsești fereastra.</p>
            {vault.providers.map((p,i) => <fieldset key={i} disabled={busy}><legend>Furnizor {i+1}</legend>{(['provider','username','password','url','notes'] as const).map(key => <label key={key}>{{provider:'Furnizor',username:'Utilizator',password:'Parolă',url:'Adresă portal',notes:'Detalii / extras importat'}[key]}
              <textarea value={p[key]} autoComplete="off" maxLength={10000} onChange={e => { setVaultDirty(true); setVault(v => v ? { ...v, providers: v.providers.map((item,j) => i === j ? { ...item, [key]: e.target.value } : item) } : v); }} /></label>)}<button type="button" onClick={() => { setVaultDirty(true); setVault(v => v ? { ...v, providers: v.providers.filter((_, j) => j !== i) } : v); }}>Șterge furnizorul</button></fieldset>)}
            <button disabled={busy || vault.providers.length >= 50} onClick={() => { setVaultDirty(true); setVault(v => v ? { ...v, providers: [...v.providers, { provider:'',username:'',password:'',url:'',notes:'' }] } : v); }}>Adaugă furnizor</button>
            <button disabled={busy || conflict} onClick={() => void saveProviders()}>Salvează furnizorii</button>
            {vault.sourceDocuments?.map((s,i) => <details key={i}><summary>{s.label} — sursa originală</summary><pre>{s.text}</pre></details>)}
            {vault.sourceSheetRows?.map((row,i) => <details key={i}><summary>Rând original din registrul de statusuri</summary><dl>{Object.entries(row).filter(([k,v]) => k && v).map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details>)}
          </>}
        </section>}
        <h3>Istoric activitate</h3>{!draft.activity?.length && <p>Nicio activitate nouă.</p>}
        {draft.activity?.map(a => <article key={a.id}><strong>{a.kind === 'note' ? 'Notă' : a.kind}</strong> · {new Date(a.createdAt).toLocaleString('ro-RO')} · {a.actor}
          {a.detail.text && <p className="preserve">{a.detail.text}</p>}{a.detail.after && <ul>{Object.entries(a.detail.after).filter(([k,v]) => JSON.stringify(a.detail.before?.[k]) !== JSON.stringify(v)).map(([k,v]) => <li className="preserve" key={k}>{k}: {String(a.detail.before?.[k] ?? '—')} → {String(v ?? '—')}</li>)}</ul>}</article>)}
      </>}
    </div></div>
    <style jsx>{`
      .pensions{color:#162235}header,.filters{display:flex;gap:16px;align-items:end;flex-wrap:wrap;margin-bottom:20px}header>div{flex:1}h2{font-size:24px;margin:0}h3{margin-top:24px}p{margin:10px 0}.layout{display:grid;grid-template-columns:minmax(260px,340px) 1fr;gap:24px}.list{max-height:80vh;overflow:auto}.case{display:flex;flex-direction:column;align-items:start;width:100%;text-align:left;margin-bottom:8px;gap:6px;background:#fff}.selected{border-color:#e86626;background:#fff5ed}.detail{min-width:0;background:white;border:1px solid #d9e1e8;border-radius:12px;padding:20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}label{display:flex;flex-direction:column;gap:5px;margin:8px 0;font-size:14px}input,select,textarea{border:1px solid #bbc6d3;border-radius:6px;padding:10px;background:white;color:#162235;max-width:100%}textarea{min-height:78px;width:100%}button{border:1px solid #bbc6d3;border-radius:8px;padding:10px 14px;cursor:pointer}button:disabled{opacity:.5;cursor:wait}fieldset{border:0;padding:0;margin:0 0 20px;min-width:0}legend{font-weight:600;margin-bottom:10px}.error{color:#a72820}.review{white-space:pre-wrap;padding:12px;background:#fff4d8}.preserve,pre,dd{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-family:inherit;font-size:14px}details,article{padding:12px 0;border-bottom:1px solid #e2e8f0}summary{cursor:pointer;font-weight:600}.vault{border:1px solid #bbc6d3;border-radius:8px;padding:16px;margin-top:20px}.vault fieldset{margin-top:20px}small{color:#526278}dt{font-weight:600}dd{margin:4px 0 14px}@media(max-width:900px){.layout{grid-template-columns:1fr}.list{max-height:350px}.grid{grid-template-columns:1fr}}
    `}</style>
  </section>;
}
