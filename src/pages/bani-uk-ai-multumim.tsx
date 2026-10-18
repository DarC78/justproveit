import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BaniUkAiFooter from "@/components/BaniUkAiFooter";
import course from "../../api/shared/bani-uk-ai-course.json";
import { validPurchase, trackVerifiedCoursePurchase, type VerifiedCoursePurchase } from "@/lib/baniUkAiPurchase";
import styles from "@/styles/bani-uk-ai-multumim.module.css";

const googleCalendar = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: 'Bani în UK cu AI – Sesiunea 1: Verificări cu AI', dates: '20261103T200000/20261103T213000', ctz: 'Europe/London', details: course.zoomNote, location: 'Online – Zoom' }).toString();

export default function BaniUkAiThankYou() {
  const [purchase, setPurchase] = useState<VerifiedCoursePurchase | null>(null);
  const [status, setStatus] = useState<'checking' | 'unverified' | 'paid'>('checking');
  const session = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (session.current === undefined) {
      const url = new URL(window.location.href);
      session.current = url.searchParams.get('session_id');
      // A checkout ID is a bearer reference: remove it before any vendor SDK loads.
      url.searchParams.delete('session_id');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    }
    if (!session.current) {
      // The external URL is intentionally inspected only after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('unverified'); return;
    }
    let active = true;
    const controller = new AbortController();
    fetch('/api/bani-uk-ai/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.current }), cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(result => { if (!active) return; if (validPurchase(result)) { setPurchase(result); setStatus('paid'); } else setStatus('unverified'); })
      .catch(() => { if (active) setStatus('unverified'); });
    return () => { active = false; controller.abort(); };
  }, []);
  useEffect(() => {
    if (!purchase) return;
    const w = window as Window & { proveitPurchaseVerified?: boolean };
    w.proveitPurchaseVerified = true;
    const track = () => trackVerifiedCoursePurchase(purchase);
    window.addEventListener('proveit-advertising-ready', track);
    window.dispatchEvent(new Event('proveit-purchase-verified'));
    track();
    return () => { window.removeEventListener('proveit-advertising-ready', track); };
  }, [purchase]);

  return <div className={styles.page}>
    <Head><title>Bun venit, membru fondator | Bani în UK cu AI</title><meta name="robots" content="noindex, nofollow" /><meta name="referrer" content="no-referrer" /><link rel="canonical" href="https://www.justproveit.co.uk/bani-uk-ai-multumim/" /></Head>
    <main className={styles.main}>
      <Image src="/branding/proveit-logo.png" width={98} height={61} alt="Proveit" />
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Ediția fondatorilor · {status === 'paid' ? 'Plată confirmată' : status === 'checking' ? 'Verificăm plata' : 'Informații pentru participanți'}</p>
        <h1>{status === 'paid' ? <>Gata. Ai locul tău de <span>membru fondator.</span></> : <>Bani în UK cu AI.<br /><span>Pașii următori.</span></>}</h1>
        <p>Bine ai venit în „Bani în UK cu AI”. Ne vedem marți, 3 noiembrie 2026, la <strong>20:00, ora UK (Europe/London)</strong>, live.</p>
        {status === 'paid' ? <><p>Plata ta de <strong>{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(purchase!.value)}</strong> este confirmată.</p><p>{purchase?.emailSent ? 'Ți-am trimis e-mailul de onboarding cu toate detaliile.' : 'E-mailul de onboarding este în curs de procesare.'} Dacă nu îl vezi în câteva minute, verifică și Spam sau Promoții, apoi scrie-ne dacă ai nevoie de ajutor. Chitanța Stripe este separată de e-mailul de onboarding.</p></> : <p role="status">{status === 'checking' ? 'Verificăm sesiunea în Stripe. Poți citi între timp pașii de mai jos.' : 'Nu am putut confirma plata din acest link. Această pagină nu ține loc de confirmare a achiziției. Dacă ai plătit, verifică e-mailul de confirmare sau contactează-ne cu referința plății.'}</p>}
      </header>
      <h2>Fă acum acești <span>3 pași.</span></h2>
      <section className={styles.card}><span className={styles.step}>PASUL 1</span><h3>Intră în grupul de WhatsApp</h3><p>Aici primești linkurile pentru sesiuni, reamintirile și răspunsuri la întrebări.</p><div className={styles.actions}><a className={styles.button} href={status === 'paid' && course.whatsappGroupUrl ? course.whatsappGroupUrl : course.whatsappContactUrl}>{status === 'paid' && course.whatsappGroupUrl ? 'Intră în grupul de WhatsApp' : 'Cere acces în grupul de WhatsApp'}</a></div><p className={styles.note}>În grupul de WhatsApp, numărul tău de telefon este vizibil celorlalți membri.</p></section>
      <section className={styles.card}><span className={styles.step}>PASUL 2</span><h3>Pune sesiunile în calendar</h3><p>Patru marți la rând, de la 20:00 la 21:30, ora UK (Europe/London):</p><ul>{course.sessions.map(item => <li key={item.date}><strong>{Number(item.date.slice(-2))} noiembrie:</strong> {item.detail}</li>)}</ul><div className={styles.actions}><a className={styles.button} href="/bani-uk-ai-sesiuni.ics" download>Descarcă toate sesiunile (.ics)</a><a className={`${styles.button} ${styles.secondary}`} href={googleCalendar} target="_blank" rel="noreferrer">Adaugă în Google Calendar</a></div><p className={styles.note}>Butonul Google Calendar adaugă sesiunea 1. Toate cele 4 sesiuni sunt incluse în fișierul .ics, cu un reminder cu o oră înainte.</p><p>{course.zoomNote}</p><p>Nu poți ajunge live? Primești înregistrarea după fiecare sesiune.</p></section>
      <section className={styles.card}><span className={styles.step}>PASUL 3</span><h3>Pregătește-te pentru 3 noiembrie (10 minute)</h3><ul>{course.preparation.map((item, i) => <li key={item}>{i === course.preparation.length - 1 ? <strong>{item}</strong> : item}</li>)}</ul></section>
      <aside className={styles.safety}><h2>Regula de siguranță</h2><p>{course.safety}</p></aside>
      <section className={styles.card}><h2>Garanția ta de <span>90 de zile.</span></h2><h3>Aplici pașii. Sau îți returnăm cei £39.</h3><p>{course.guarantee}</p><p>Cum ceri: scrie la <a href={`mailto:${course.supportEmail}`}>{course.supportEmail}</a> cu dovada achiziției și capturi anonimizate care arată pașii încercați și sumele primite. Nu trimite parole, coduri sau numere complete de cont.</p></section>
      <section className={styles.card}><h2>Dreptul tău de anulare</h2><p>{course.cancellation}</p><a href="/bani-uk-ai-anulare.txt" download>Descarcă formularul de anulare</a></section>
      <section className={styles.card}><h2>Ce urmează</h2><ul><li>Pe 2 noiembrie primești e-mailul „Mâine începem”.</li><li>Cu o oră înainte de fiecare sesiune primești linkul pe e-mail și pe WhatsApp.</li><li>Accesul la cursul complet din ianuarie 2027 este inclus pentru tine, ca membru fondator.</li></ul></section>
      <section><h2>O rugăminte</h2><p>Ești printre primii 100. Te rog să-mi spui, pe parcurs, ce rezultate obții. Experiența ta ne ajută să facem cursul mai bun pentru cei care vin după tine.</p><div className={styles.signature}><Image className={styles.portrait} src="/email-assets/bani-uk-ai/adrian-defta.jpg" width={125} height={145} alt="Adrian Defta" /><p>Mersi mult,<br /><strong>Adrian Defta</strong><br />Director Proveit<br />Top 100 Români de Pretutindeni</p></div><p>Întrebări? <a href={`mailto:${course.supportEmail}`}>{course.supportEmail}</a> · <a href="https://wa.me/447447707829">WhatsApp: +44 7447 707829</a></p></section>
    </main><BaniUkAiFooter />
  </div>;
}
