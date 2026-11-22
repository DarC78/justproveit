import { useState } from 'react';
import { savePaidCheckoutChoice, type PaidCheckoutReference } from '@/lib/googlePurchaseConsent';
import {purchaseCopy, type PurchaseLanguage} from '@/lib/googlePurchaseCopy';
export default function GooglePurchaseConsent({ reference, language='ro' }: { reference: PaidCheckoutReference; language?: PurchaseLanguage }) {
  const [sharing,setSharing]=useState(false),[personalization,setPersonalization]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const t=purchaseCopy[language];
  async function choose(deny=false) {
    setBusy(true);
    try {
      const result=await savePaidCheckoutChoice(reference,!deny&&sharing,!deny&&personalization);
      setMessage(!deny&&sharing&&result.adUserData!=='granted'?t.prior:t.saved);
    } catch { setMessage(t.error); }
    finally { setBusy(false); }
  }
  const button={padding:'10px 14px',border:'1px solid #173b8f',borderRadius:6,background:'#fff',color:'#173b8f',fontWeight:600,margin:'4px 8px 4px 0'};
  return <aside aria-label={t.optional} style={{padding:24,margin:'24px 0',border:'1px solid #cbd5e1',borderRadius:12,background:'#f8fafc'}}>
    <h2>{t.optional}</h2><p>{t.complete}</p><p>{t.description}</p>
    <p><label><input type="checkbox" checked={sharing} onChange={e=>setSharing(e.target.checked)} /> {t.sharing}</label></p>
    <p><label><input type="checkbox" checked={personalization} onChange={e=>setPersonalization(e.target.checked)} /> {t.personalization}</label></p>
    <p>{t.withdraw}</p><p><a href="https://www.proveitweb.co.uk/privacypolicy" rel="noreferrer">{t.privacy}</a></p>
    <button type="button" style={button} disabled={busy} onClick={()=>void choose()}>{t.save}</button>
    <button type="button" style={button} disabled={busy} onClick={()=>void choose(true)}>{t.deny}</button>
    <p role="status">{message}</p>
  </aside>;
}
