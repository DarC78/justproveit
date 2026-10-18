import Image from "next/image";
import styles from "@/styles/bani-uk-ai.module.css";
const CONTACT = "adriandefta@proveitweb.co.uk";
export default function BaniUkAiFooter() { return (
<footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerTop}><div><Image src="/branding/proveit-logo.png" width={98} height={61} alt="ProveIt" /><p>Proveit ajută comunitatea<br />să își apere drepturile.</p><strong>JustProveIt este o denumire comercială<br />(trading style) a ProveIt Ltd.</strong></div><div><h2>Contactați-ne</h2><a href="tel:+447447707829">+44 7447 707829</a><a href={`mailto:${CONTACT}`}>{CONTACT}</a><span>United Kingdom</span></div><div><h2>Informații legale</h2><a href="https://www.proveitweb.co.uk/privacypolicy">Politica de confidențialitate</a><a href="https://www.proveitweb.co.uk/termsandconditions">Termene și condiții</a></div></div>

            <div className={styles.company}><p>ProveIt Ltd este o companie înregistrată în Anglia și Țara Galilor, cu numărul de înregistrare 14007642. Sediul social: Ty Merlin, Caerphilly Business Park, Caerphilly, CF83 8DP, Regatul Unit. ProveIt Ltd este înregistrată la Information Commissioner’s Office (ICO) cu numărul de înregistrare ZB520180. ProveIt Ltd nu este broker de credite și nu este instituție de credit.</p><p>ProveIt Ltd poate primi un comision de la anumiți parteneri atunci când utilizatorii accesează, prin intermediul platformei noastre, site-urile partenerilor. Acest lucru nu influențează informațiile furnizate sau serviciile oferite.</p></div>
            <p className={styles.copyright}>Copyright 2026 © Proveit. Toate drepturile rezervate.</p>
          </div>
        </footer>
); }
