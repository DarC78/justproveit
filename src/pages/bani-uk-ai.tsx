import Head from "next/head";
import BaniUkAiFooter from "@/components/BaniUkAiFooter";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BANI_UK_AI_CHECKOUT_URL, BANI_UK_AI_DEADLINE, BANI_UK_AI_SOURCES, courseCheckoutUrl } from "@/lib/baniUkAi";
import styles from "@/styles/bani-uk-ai.module.css";

const CONTACT = "adriandefta@proveitweb.co.uk";
const sessions = [
  { day: "03", title: "Verificări cu AI", description: "Bonusuri bancare · Taxa de consiliu · Pensii private pierdute.", outcome: "Ai verificat dacă nu pierzi bani la taxa de consiliu, dacă nu ai o pensie privată pierdută și ai netezit calea de a obține bonusuri de la bănci." },
  { day: "10", title: "£150–£250 bonusuri de la bănci", description: "O sesiune, pas cu pas, despre cum să poți obține bonusuri de £150–£250 de la bănci, folosind AI.", outcome: "Înțelegi exact procesul de a folosi AI pentru a obține £150–£250 de la bănci și știi exact ce trebuie să faci pentru a obține primul bonus." },
  { day: "17", title: "Încă 6 modalități de a câștiga bani cu AI", description: "Taxe pe salariu · Cashback la cumpărături · Marriage Allowance · Cheltuieli de serviciu · Ajutoare și beneficii · Reducerea facturilor.", outcome: "Mai ai încă 6 verificări și știi exact dacă pierzi bani și ce trebuie să faci pentru a câștiga bani." },
  { day: "24", title: "Sistemul tău pentru tot anul", description: "O rutină de aproximativ 30 de minute pe lună, după pregătirea inițială.", outcome: "Calendarul pe 12 luni și trackerul „Cât am câștigat”." },
];
const bonuses = ["Prompturi AI gata făcute, în română", "Trackerul „Cât am câștigat”", "Calendar de urmărire a ofertelor pe 12 luni", "Înregistrările tuturor sesiunilor", "Acces la cursul complet din ianuarie 2027"];
const faqs = [
  ["Îmi afectează istoricul de credit?", "Deschiderea unui cont nou poate implica o verificare de credit, iar mai multe cereri pot afecta istoricul tău. Un cont separat nu elimină acest efect. Învățăm să verificăm condițiile și să planificăm pașii; AI-ul nu poate garanta eligibilitatea sau un anumit scor."],
  ["Trebuie să știu engleză bine?", "Nu. Sesiunile sunt în română. Înveți să folosești AI pentru a traduce și explica termenii, apoi verifici informațiile în oferta oficială a băncii."],
  ["Trebuie să investesc sau să iau un credit?", "Nu. Metoda folosește un cont curent nou, dedicat, și cumpărături pe care le faci oricum. Nu presupune investiții sau împrumuturi. Contul tău principal, în care primești salariul, rămâne separat."],
  ["Îmi spuneți ce bancă să aleg?", "Te învățăm cum să compari și să alegi singur ofertele potrivite situației tale. Cursul oferă educație și informații generale, nu recomandări personale de produse financiare."],
  ["E sigur să folosesc AI cu datele mele bancare?", "Lucrăm cu exemple și date anonimizate. Nu trimite AI-ului parole, coduri de autentificare, numere complete de cont sau documente bancare neanonimizate. Verifică întotdeauna răspunsurile AI în sursele oficiale."],
  ["Ce se întâmplă dacă nu pot participa live?", "Primești înregistrările după fiecare sesiune și le poți urmări în ritmul tău. Ai acces și la prompturi, tracker și calendar."],
  ["Cât durează până văd bani?", "Depinde de ofertă și de îndeplinirea condițiilor. Bonusurile bancare pot necesita câteva săptămâni sau mai mult. La JamDoughnut primești puncte în portofelul aplicației; retragerea lor este supusă condițiilor și pragurilor aplicației."],
  ["Sunt garantate cele £1.000 pe an?", "Nu. £1.000 este un obiectiv de lucru, nu un venit minim garantat. Rezultatele depind de eligibilitate, ofertele disponibile, cheltuielile tale și pașii aplicați. Nu cumpăra mai mult doar pentru cashback."],
];

function Arrow() {
  return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function BaniUkAiPage() {
  const [closed, setClosed] = useState(false);
  const [capacity, setCapacity] = useState<{ sold: number | null; soldOut: boolean } | null>(null);
  const checkout = courseCheckoutUrl(BANI_UK_AI_CHECKOUT_URL);
  useEffect(() => {
    let active = true;
    const update = () => fetch('/api/bani-uk-ai/capacity', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(value => {
      if (active && value && typeof value.soldOut === 'boolean') setCapacity(value);
    }).catch(() => {});
    update(); const timer = window.setInterval(update, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    const update = () => setClosed(Date.now() > Date.parse(BANI_UK_AI_DEADLINE));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const purchase = () => closed || capacity?.soldOut ? (
    <div><p className={styles.closed} role="status">Înscrierile pentru această cohortă s-au încheiat.</p><a className={styles.cta} href="mailto:adriandefta@proveitweb.co.uk?subject=Lista%20de%20asteptare%20Bani%20UK%20AI%20ianuarie">Înscrie-te pe lista de așteptare pentru ianuarie</a></div>
  ) : checkout ? (
    <>
      <a className={styles.cta} href={checkout}><span>Vreau locul meu de fondator <span className={styles.buttonPrices}><del aria-label="Preț standard 97 de lire">£97</del> <strong>£39</strong></span></span><Arrow /></a>
      <p className={styles.ctaNote}>Cod precompletat: DISC58 · £97 − £58 = £39. Verifică totalul înainte de plată.</p>
      {typeof capacity?.sold === 'number' && <p className={styles.ctaNote}>{capacity.sold} din 100 de locuri rezervate.</p>}
    </>
  ) : (
    <div className={styles.pending}>
      <button className={styles.cta} type="button" disabled>Înscrierile se deschid în curând<Arrow /></button>
      <p>Ai o întrebare? <a href={`mailto:${CONTACT}?subject=Bani%20%C3%AEn%20UK%20cu%20AI`}>Scrie-i lui Adrian</a>.</p>
    </div>
  );

  return (
    <>
      <Head>
        <title>Bani în UK cu AI | 4 sesiuni live cu Adrian Defta și înregistrările lor | JustProveIt</title>
        <meta name="description" content="Învață în română cum să compari bonusurile bancare și să folosești cashback cu ajutorul AI. Patru sesiuni live din 3 noiembrie 2026. Loc de fondator: £39." />
        <meta httpEquiv="content-language" content="ro-GB" />
        <link rel="canonical" href="https://www.justproveit.co.uk/bani-uk-ai/" />
        <meta property="og:title" content="Bani în UK cu AI — învață metoda, pas cu pas" />
        <meta property="og:description" content="Bonusuri bancare, cashback și AI. 4 sesiuni live în română cu Adrian. Din 3 noiembrie. £39, o singură plată." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ro_RO" />
        <meta property="og:url" content="https://www.justproveit.co.uk/bani-uk-ai/" />
      </Head>

      <div className={styles.page} lang="ro">
        <a className={styles.skip} href="#continut">Sari la conținut</a>
        <header className={styles.header}>
          <div className={styles.container}>
            <div className={styles.brand}><Image src="/branding/proveit-logo.png" width={96} height={60} alt="ProveIt" priority /><span className={styles.brandDivider} /><span>Educație practică.<br />Pentru românii din UK.</span></div>
            <span className={styles.headerNote}>O experiență JustProveIt</span>
          </div>
        </header>

        <main id="continut">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={`${styles.container} ${styles.heroGrid}`}>
              <div className={styles.heroCopy}>
                <div className={styles.heroIntro}>
                <p className={styles.eyebrow}><span /> Bani în UK cu AI · Ediția fondatorilor</p>
                <h1 id="hero-title">În UK ai multe avantaje financiare.<br /><span>Învață să le obții cu AI.</span></h1>
                <p className={styles.heroLead}>Un plan cu un obiectiv de <strong className={styles.highlight}>£1.000 în plus pe an</strong>: bonusuri de £150–£250 de la bănci, cu cereri care pot dura sub 15 minute; găsirea pensiilor private pierdute; recuperarea taxei de consiliu plătite în plus; și multe altele.</p>
                <p className={styles.heroSecondary}>Metoda pe care eu și soția mea o folosim. O învățăm împreună, în română, cu AI la fiecare pas. Contul tău principal rămâne separat.</p>
                </div>
                <div className={styles.heroPurchase}>
                {purchase()}
                <p className={styles.ctaNote}>4 sesiuni live cu Adrian Defta și înregistrările lor · Din 3 noiembrie 2026 · 100 de locuri</p>
                <p className={styles.disclaimer}>£1.000 este un obiectiv, nu o sumă garantată. Rezultatele variază în funcție de eligibilitate, cheltuieli și ofertele disponibile.</p>
                </div>
              </div>
              <div className={styles.courseCover} aria-label="Bani în UK cu AI: patru sesiuni live, din 3 noiembrie, preț fondator 39 de lire">
                <div className={styles.coverTop}><span>PROVEIT / LIVE</span><span>EDIȚIA 2026</span></div>
                <p className={styles.coverTitle}>BANI<br />ÎN UK<br /><span>CU AI.</span></p>
                <div className={styles.coverLine} />
                <div className={styles.coverTopics}><span>Bonusuri bancare</span><span>Pensii și taxe</span><span>Cashback și economii</span></div>
                <div className={styles.coverBottom}><div><span>EDIȚIA FONDATORILOR</span><strong>03 NOV / 2026</strong></div><div className={styles.priceStamp}>£39<span>o singură plată</span></div></div>
              </div>
            </div>
          </section>

          <div className={styles.facts}><div className={styles.container}><span><strong>4</strong> sesiuni live + înregistrările</span><span><strong>100%</strong> în română</span><span><strong>30 min</strong> rutină lunară*</span><span><strong>£39</strong> o singură plată</span></div></div>

          <section className={`${styles.section} ${styles.container}`} aria-labelledby="problema">
            <div className={styles.sectionIntro}><p className={styles.eyebrow}>Sună cunoscut?</p><h2 id="problema">Banii rămân pe masă.<br />Nu trebuie să rămână acolo.</h2><p>Băncile din UK plătesc bani ca să le devii client. Magazinele de unde cumperi oricum îți pot da bani înapoi. Dar între termeni în engleză, lipsa timpului și grija pentru contul de salariu, e ușor să amâni.</p></div>
            <div className={styles.fears}>{["Mi-e frică să nu-mi afectez istoricul de credit.", "Nu înțeleg engleza din termenii ofertei.", "Nu am timp să caut și să compar oferte.", "Nu vreau să-mi mut contul în care primesc salariul."].map((text, index) => <div key={text}><span>0{index + 1}</span><p>„{text}”</p></div>)}</div>
            <p className={styles.sectionFoot}>Începem cu aceste întrebări. Apoi construim un plan pe care îl înțelegi și îl poți verifica.</p>
          </section>

          <section className={styles.method} aria-labelledby="metoda"><div className={`${styles.container} ${styles.section}`}>
            <div className={styles.sectionIntro}><p className={styles.eyebrow}>Cum funcționează</p><h2 id="metoda"><span className={styles.highlight}>Mai mult de 10 surse de bani.</span><br />AI-ul care le ține în ordine.</h2><p>Nu investești și nu te împrumuți. Nu te abonezi la nimic. Lucrezi cu versiunile gratuite de AI.</p></div>
            <div className={styles.methodGrid}>
              {BANI_UK_AI_SOURCES.map(source => <article key={source.label}><span className={styles.step}>{source.label}</span><h3>{source.title}</h3><p>{source.text}</p><div className={styles.methodDetail}>{source.detail}</div></article>)}
            </div>
            <p className={styles.sectionFoot}>Nouă direcții de pornire, cu mai mult de 10 oportunități de verificat: de la taxe și ajutoare pentru familie până la energie, internet și mobil. Unele înseamnă bani recuperați, altele economii sau pensii pentru viitor.</p>
            <p className={styles.disclaimer}>Deschiderea unui cont poate implica verificări de credit. O schimbare completă închide contul mutat; de aceea lucrăm cu un cont dedicat. AI-ul poate greși: verifică informațiile în sursele oficiale.</p>
          </div></section>

          <section className={styles.aiSection} aria-labelledby="sistem-ai">
            <div className={`${styles.container} ${styles.section}`}>
              <div className={styles.aiIntro}>
                <div>
                  <p className={styles.eyebrow}>Sistemul AI · Inclus în curs</p>
                  <h2 id="sistem-ai">Mai puțin de căutat.<br /><span className={styles.highlight}>AI-ul te ajută la fiecare dintre cei 9 pași.</span></h2>
                  <p className={styles.largeText}>Întrebi în română. Înțelegi oferta. Pregătești următorul pas.</p>
                  <p>Lucrăm cu versiunile gratuite de AI. Primești prompturi gata făcute și înveți să le adaptezi situației tale: traduci engleza complicată, organizezi informațiile, compari condițiile și redactezi cereri pe care le verifici înainte să le trimiți.</p>
                  <p>Tu păstrezi controlul: verifici informațiile în sursele oficiale și decizi ce aplici. AI-ul te ajută să te pregătești; banca, HMRC, consiliul sau furnizorul confirmă rezultatul.</p>
                </div>
                <div className={styles.promptCard}>
                  <span className={styles.step}>UN PROMPT. UN PAS CONCRET.</span>
                  <h3>„Explică-mi pe înțelesul meu.”</h3>
                  <blockquote>„Explică-mi în română condițiile din acest text. Fă o listă cu eligibilitatea, documentele, costurile și termenele. Arată-mi ce informații lipsesc și ce trebuie să verific în sursa oficială. Nu presupune că mă calific.”</blockquote>
                  <p>Îl adaptăm împreună pentru fiecare oportunitate. Folosești texte publice sau exemple anonimizate.</p>
                </div>
              </div>
              <h3 className={styles.aiListTitle}>Cum pui AI-ul la treabă, pentru fiecare sursă</h3>
              <ol className={styles.aiChecklist}>
                {BANI_UK_AI_SOURCES.map((source, index) => <li key={source.label}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><p>{source.ai}</p></li>)}
              </ol>
              <div className={styles.aiTools}>
                <p><strong>Prompturi în română</strong><span>Știi ce să întrebi și cum să verifici răspunsul.</span></p>
                <p><strong>Trackerul „Cât am câștigat”</strong><span>Separi banii primiți, economiile și pensiile identificate.</span></p>
                <p><strong>Calendarul tău</strong><span>Urmărești cererile, termenele și răspunsurile într-un singur loc.</span></p>
              </div>
              <p className={styles.disclaimer}>Nu ai nevoie de un abonament AI plătit; versiunile gratuite pot avea limite de utilizare. Nu introduci parole, coduri, National Insurance number sau documente neanonimizate. AI-ul poate greși. Rutină orientativă: aproximativ 30 de minute pe lună după pregătire; unele cereri necesită timp suplimentar.</p>
            </div>
          </section>

          <section className={`${styles.container} ${styles.section} ${styles.adrian}`} aria-labelledby="adrian">
            <div><p className={styles.eyebrow}>Cu cine înveți</p><h2 id="adrian">Salut, sunt <span className={styles.highlight}>Adrian.</span></h2><p className={styles.award}>Și sunt unul dintre <strong className={styles.highlight}>Top 100 Români de Pretutindeni!</strong><br />Premiu decernat de Președinția României!</p></div>
            <div><p className={styles.largeText}>Eu folosesc AI-ul pentru a face toate verificările necesare să nu pierd bani în UK, ba chiar să și câștig. Folosesc AI-ul și în cadrul companiei mele, astfel încât să facă o mulțime de lucruri fără să plătesc pe altcineva să le facă.</p><p>Am peste 20 de ani de experiență în servicii financiare și în tehnologie. La ProveIt, explic lucrurile practic, în română, ca să înțelegi ce faci și de ce. Am fost numit în Top 100 Români de Pretutindeni. Firma ProveIt este de 4 ani în slujba românilor și avem review-uri foarte bune.</p><p className={styles.signature}>Adrian Defta <span>/ ProveIt</span></p></div>
          </section>

          <section className={`${styles.container} ${styles.section} ${styles.curriculum}`} aria-labelledby="program">
            <div className={styles.sectionIntro}><p className={styles.eyebrow}>Calendarul tău de noiembrie</p><h2 id="program"><span className={styles.highlight}>Patru seri.</span><br />Un plan pe care îl poți folosi tot anul.</h2><p>Live cu Adrian, în fiecare marți, din 3 noiembrie 2026. Primești și înregistrările, dacă nu poți participa.</p></div>
            <div className={styles.sessionList}>{sessions.map((session, index) => <article key={session.day} className={styles.session}><div className={styles.date}><strong>{session.day}</strong><span>NOV 2026</span><small>MARȚI</small></div><div className={styles.sessionBody}><span className={styles.step}>SESIUNEA 0{index + 1}</span><h3>{session.title}</h3><p>{session.description}</p></div><div className={styles.outcome}><span>CU CE PLECI</span><p>{session.outcome}</p></div></article>)}</div>
            <div className={styles.bonuses}><div><p className={styles.eyebrow}>Incluse în cei £39</p><h3>Instrumentele rămân cu tine.</h3></div><ul>{bonuses.map(bonus => <li key={bonus}><span aria-hidden="true">✓</span>{bonus}</li>)}</ul></div>
          </section>

          <section className={styles.audience}><div className={`${styles.container} ${styles.section}`}><p className={styles.eyebrow}>E potrivit pentru tine?</p><h2>Practic, de la primul pas.</h2><div className={styles.audienceGrid}><div><h3>Da, dacă…</h3><ul>{["Locuiești în UK.", "Cheltui lunar pe cumpărături, facturi, cadouri sau vacanțe.", "Vrei să înțelegi bonusurile și cashback-ul, fără investiții sau împrumuturi.", "Poți aloca 30 de minute pe săptămână pentru pregătire și apoi pentru o rutină lunară."].map(item => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul></div><div className={styles.notFor}><h3>Nu e momentul dacă…</h3><ul><li><span aria-hidden="true">—</span>Cauți o schemă de îmbogățire rapidă sau un câștig garantat.</li></ul></div></div></div></section>

          <section className={`${styles.container} ${styles.section} ${styles.offerGrid}`} id="inscriere" aria-labelledby="oferta">
            <div><p className={styles.eyebrow}>Ediția membrilor fondatori</p><h2 id="oferta">Hai să construim<br /><span className={styles.highlight}>sistemul împreună.</span></h2><p className={styles.largeText}>100 de locuri. Patru sesiuni live. Grup de WhatsApp de suport. Toate instrumentele. Acces pe viață la cursul complet.</p><p>În schimb, te rog să-mi spui ce rezultate ai obținut. Experiența ta ne ajută să facem cursul mai bun pentru cei care vin după tine.</p><p>Preț planificat pentru lansarea din ianuarie 2027: £97. Ca membru fondator, accesul la cursul complet este inclus.</p></div>
            <div className={styles.offerCard}><p className={styles.step}>LOCUL TĂU DE MEMBRU FONDATOR</p><div className={styles.offerPrice}>£39<span>o singură plată<br />fără abonament</span></div><ul>{["4 sesiuni live cu Adrian Defta și înregistrările lor", "Grup de WhatsApp de suport", "Prompturi, tracker și calendar", "Înregistrările tuturor sesiunilor", "Cursul complet din ianuarie inclus"].map(item => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul>{purchase()}<p className={styles.offerDeadline}>Înscrieri până duminică, 1 noiembrie 2026, ora 23:59 (UK), sau până se ocupă cele 100 de locuri.</p><a className={styles.smallLink} href="#garantie">Vezi garanția și condițiile</a></div>
          </section>

          <section className={`${styles.container} ${styles.guarantee}`} id="garantie" aria-labelledby="garantie-titlu"><div className={styles.guaranteeSeal} aria-hidden="true"><strong>90</strong><span>DE ZILE</span></div><div><p className={styles.eyebrow}>Garanția „îți recuperezi banii”</p><h2 id="garantie-titlu">Aplici pașii. Sau îți returnăm cei £39.</h2><p>Dacă participi la sesiuni sau urmărești înregistrările, aplici pașii și în 90 de zile de la prima sesiune nu ai primit cel puțin £39 din bonusuri și cashback, îți returnăm integral prețul cursului.</p><details className={styles.guaranteeDetails}><summary>Cum funcționează garanția</summary><p>Trimite cererea la <a href={`mailto:${CONTACT}`}>{CONTACT}</a>, cu dovada achiziției și capturi anonimizate care arată pașii încercați și sumele primite. Nu trimite parole, coduri sau numere complete de cont. Garanția acoperă taxa de £39 a cursului și nu reprezintă o promisiune de câștig de £1.000.</p><p>Garanția comercială este separată de drepturile tale legale de anulare și nu le limitează. Pentru întrebări despre anulare sau despre accesul la materialele digitale, scrie-ne pe e-mail.</p></details></div></section>

          <section className={`${styles.container} ${styles.section} ${styles.faq}`} aria-labelledby="intrebari"><div className={styles.sectionIntro}><p className={styles.eyebrow}>Înainte să începi</p><h2 id="intrebari"><span className={styles.highlight}>Întrebări bune.</span><br />Răspunsuri directe.</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

          <section className={styles.finalCta}><div className={styles.container}><p className={styles.eyebrow}>Ne vedem pe 3 noiembrie</p><h2>Un cont separat.<br />Un plan clar. <span className={styles.highlight}>AI-ul alături.</span></h2><p>Învață să compari ofertele și să folosești cumpărăturile de zi cu zi în avantajul tău. În română, pas cu pas, cu Adrian.</p>{purchase()}<p className={styles.ctaNote}>£39, o singură dată · Garanție de 90 de zile, conform condițiilor</p><p className={styles.finalContact}>Ai întrebări? <a href={`mailto:${CONTACT}`}>Scrie-mi pe e-mail</a> sau <a href="https://wa.me/447447707829">pe WhatsApp</a>.</p></div></section>
        </main>

        <aside className={styles.editorial}><div className={styles.container}><h2>Cum funcționează acest site?</h2><p>Credem că este important să înțelegeți punctele forte și limitările site-ului. Suntem un site jurnalistic și ne propunem să oferim cele mai bune ghiduri, sfaturi, instrumente și tehnici pentru a economisi bani, dar nu putem garanta că vom fi perfecți. Utilizați informațiile pe propriul risc.</p><p>Aceste informații nu constituie sfaturi financiare. Faceți întotdeauna propria cercetare pentru a vă asigura că sunt potrivite circumstanțelor dvs. specifice. Prețurile, condițiile produselor și ofertele se pot modifica; verificați întotdeauna informațiile direct la furnizor. Nu investigăm solvabilitatea companiilor menționate și nu suntem responsabili pentru conținutul site-urilor externe.</p><p>Acest website este proprietatea companiei ProveIt și nu face parte din niciun grup de companii. Suntem independenți din punct de vedere editorial și punem consumatorii pe primul loc.</p></div></aside>
        <BaniUkAiFooter />
      </div>
    </>
  );
}
