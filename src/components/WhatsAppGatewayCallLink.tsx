import {useRef, useState} from 'react';
import {gatewayCallLink, gatewayCallTargets, type GatewayCall, type GatewayCallLinkBody, type GatewayTarget} from '@/lib/whatsappGateway';

export default function WhatsAppGatewayCallLink({token, call, onSaved, onRefresh}: {token: string; call: GatewayCall; onSaved: () => void; onRefresh: () => Promise<GatewayCall | undefined>}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [targets, setTargets] = useState<GatewayTarget[]>([]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [conflict, setConflict] = useState(false);
  const locked = useRef(false);
  const searchVersion = useRef(0);
  const attempt = useRef<GatewayCallLinkBody | null>(null);
  const baseline = useRef<string | null>(null);
  const blocked = busy || uncertain;
  async function search() {
    const version = ++searchVersion.current;
    setSearching(true); setError(''); setSelected('');
    try {
      const result = await gatewayCallTargets(token, query);
      if (version === searchVersion.current) setTargets(result.rows);
    } catch { if (version === searchVersion.current) setError('Unable to search CRM leads. Please retry.'); }
    finally { if (version === searchVersion.current) setSearching(false); }
  }
  async function save(contactId: string | null) {
    if (locked.current || reason.trim().length < 3 || (!contactId && !call.contactId && !call.customerId && !attempt.current)) return;
    locked.current = true; setBusy(true); setError(''); setStatus('');
    attempt.current ??= {requestId: crypto.randomUUID(), callToken: call.callToken, expectedSnapshot: baseline.current ?? call.linkSnapshot, contactId, reason: reason.trim()};
    try {
      const result = await gatewayCallLink(token, call.linkKey, attempt.current);
      attempt.current = null; setUncertain(false); setConflict(false); setOpen(false); setReason(''); setSelected('');
      setStatus(result.contactId ? `Call linked to ${result.leadName || 'the selected lead'}.` : 'Call returned to review.');
      onSaved();
    } catch (e) {
      const code = (e as {status?: number}).status;
      if (code && code < 500) {
        attempt.current = null; setUncertain(false);
        setConflict(code === 409);
        setError(code === 409 ? 'This call changed. Refresh the call before confirming again; your note is retained.' : 'Unable to save this link. Refresh the call and check the selected lead.');
      } else {
        setUncertain(true);
        setError('The result could not be confirmed. Retry the same action to check its saved result.');
      }
    } finally { locked.current = false; setBusy(false); }
  }
  return <div style={{padding: 12, background: '#f8fafc'}}>
    <p>{call.contactId ? <>Linked lead: <strong>{call.leadName || call.contactId}</strong></> : 'No lead linked — needs review.'}{call.customerId && !call.contactId ? ' An existing customer association is present.' : ''}</p>
    {status && <p role="status">{status}</p>}
    <button type="button" disabled={blocked} onClick={() => {if (!open) baseline.current = call.linkSnapshot; setOpen(v => !v);}}>{open ? 'Close lead linking' : call.contactId ? 'Change linked lead' : 'Link to lead'}</button>
    {open && <div>
      <p>Choose the lead you verified for this call. This changes only this call’s CRM association; later observed updates follow your choice. It does not identify which agent placed the call.</p>
      <label>Find a CRM lead <input value={query} disabled={blocked} maxLength={100} onChange={e => {searchVersion.current++; setSearching(false); setQuery(e.target.value); setSelected(''); setTargets([]);}} /></label>{' '}
      <button type="button" disabled={blocked || searching || query.trim().length < 2} onClick={() => void search()}>{searching ? 'Searching…' : 'Find leads'}</button>
      <ul>{targets.map(target => <li key={target.id}><label><input type="radio" name={`call-lead-${call.linkKey}`} disabled={blocked} checked={selected === target.id} onChange={() => setSelected(target.id)} />{target.name} · {target.phone || 'No phone'} · {target.email || 'No email'} <small>({target.id})</small></label></li>)}</ul>
      <label>Verification note <input value={reason} disabled={blocked} minLength={3} maxLength={500} onChange={e => setReason(e.target.value)} /></label>
      <p><button type="button" disabled={blocked || conflict || !selected || reason.trim().length < 3} onClick={() => void save(selected)}>Confirm link to selected lead</button>{' '}
      {(call.contactId || call.customerId) && <button type="button" disabled={blocked || conflict || reason.trim().length < 3} onClick={() => void save(null)}>Unlink call and return to review</button>}
      {uncertain && <button type="button" disabled={busy} onClick={() => void save(attempt.current?.contactId ?? null)}>Retry same action</button>}
      {conflict && <button type="button" disabled={busy} onClick={async () => {setBusy(true); try {const fresh = await onRefresh(); if (!fresh) throw Error(); baseline.current = fresh.linkSnapshot; setConflict(false); setError('');} catch {setError('Unable to refresh this call. Please retry refreshing.');} finally {setBusy(false);}}}>Refresh call</button>}</p>
    </div>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
