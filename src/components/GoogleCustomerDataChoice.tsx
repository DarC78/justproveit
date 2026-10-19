import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/router';
import config from '@/config/google-advertising.json';
import { saveGoogleChoice, type GoogleChoice } from '@/lib/googleAdvertising';

export default function GoogleCustomerDataChoice() {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [personalization, setPersonalization] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const token = useSyncExternalStore(() => () => {}, () => (window as Window & { proveitEmailToken?: string }).proveitEmailToken || null, () => null);
  if (!config.customerDataConsentEnabled || router.pathname !== '/bani-uk-ai') return null;
  if (!token) return null;
  async function choose(deny = false) {
    if (!token) return;
    setBusy(true);
    try {
      const choice: GoogleChoice = { adUserData: !deny && sharing ? 'granted' : 'denied', adPersonalization: !deny && personalization ? 'granted' : 'denied', version: 'google-customer-data-v1', at: new Date().toISOString() };
      await saveGoogleChoice(choice, token);
      setMessage('Cererea ta a fost primită.');
    } catch (error) { setMessage(error instanceof Error && error.message.includes('re-consent') ? 'Pentru a schimba un refuz, contactează-ne la adrian@proveitweb.co.uk.' : 'Nu am putut confirma salvarea. Poți reîncerca sau ne poți contacta.'); }
    finally { setBusy(false); }
  }
  return <aside aria-label="Preferințe Google" style={{ padding: 24, margin: '24px auto', maxWidth: 720, background: '#dbe9ff', color: '#111', borderRadius: 12 }}>
    <h2>Preferințe pentru publicitatea Google</h2>
    <p>Dacă dorești, putem folosi datele de contact asociate e-mailului din care ai venit pentru potrivire cu Google. Poți folosi pagina și fără să accepți.</p>
    <p><label><input type="checkbox" checked={sharing} onChange={event => setSharing(event.target.checked)} /> Permit folosirea datelor mele de contact pentru măsurarea publicității Google.</label></p>
    <p><label><input type="checkbox" checked={personalization} onChange={event => setPersonalization(event.target.checked)} /> Permit personalizarea publicității Google, inclusiv includerea în audiențe.</label></p>
    <p><a href="https://www.proveitweb.co.uk/privacypolicy">Politica de confidențialitate</a></p>
    <button type="button" disabled={busy} onClick={() => void choose()}>Salvează preferințele</button>{' '}
    <button type="button" disabled={busy} onClick={() => void choose(true)}>Refuz ambele</button>
    <p role="status">{message}</p>
  </aside>;
}
