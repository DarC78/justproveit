import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isClarityPage } from "@/lib/clarity";
import styles from "@/styles/advertising-consent.module.css";

const KEY = "proveit-advertising-consent-v1";
type Choice = "granted" | "denied";
type AdvertisingWindow = Window & { proveitAdvertising?: { page: () => void; revoke: () => void } };

function loadPixels() {
  if (!isClarityPage(window.location.href)) return;
  const advertising = (window as AdvertisingWindow).proveitAdvertising;
  if (advertising) { advertising.page(); return; }
  if (document.getElementById("proveit-advertising-loader")) return;
  const script = document.createElement("script");
  script.id = "proveit-advertising-loader";
  script.src = "/advertising-pixels.js";
  script.async = true;
  script.onerror = () => script.remove();
  script.onload = () => {
    // Consent may have changed in another tab while the file was downloading.
    if (!(window as AdvertisingWindow).proveitAdvertising) script.remove();
  };
  document.head.appendChild(script);
}

export default function AdvertisingConsent() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const publicPage = isClarityPage(router.pathname) && isClarityPage(router.asPath);

  useEffect(() => {
    const sync = () => {
      let value: Choice | null = null;
      try {
        const stored = JSON.parse(localStorage.getItem(KEY) || "null");
        if (stored?.expires > Date.now() && ["granted", "denied"].includes(stored.value)) value = stored.value;
      } catch { /* No usable choice: advertising remains off. */ }
      if (value !== "granted" && (window as AdvertisingWindow).proveitAdvertising) {
        (window as AdvertisingWindow).proveitAdvertising?.revoke();
        window.location.reload();
        return;
      }
      setChoice(value);
      setReady(true);
      if (value === "granted") loadPixels();
    };
    sync();
    window.addEventListener("storage", sync);
    router.events.on("routeChangeComplete", sync);
    return () => {
      window.removeEventListener("storage", sync);
      router.events.off("routeChangeComplete", sync);
    };
  }, [router]);

  function choose(value: Choice) {
    // If storage is unavailable, do not turn on tracking without a usable record.
    try { localStorage.setItem(KEY, JSON.stringify({ value, expires: Date.now() + 180 * 86400000 })); }
    catch {
      setChoice("denied"); setOpen(false);
      if ((window as AdvertisingWindow).proveitAdvertising) {
        (window as AdvertisingWindow).proveitAdvertising?.revoke();
        window.location.reload();
      }
      return;
    }
    setChoice(value);
    setOpen(false);
    if (value === "granted") loadPixels();
    else {
      (window as AdvertisingWindow).proveitAdvertising?.revoke();
      // Destroy SDK listeners and remove the advertising cookies we control.
      const cookieNames = document.cookie.split(";").map(cookie => cookie.trim().split("=")[0]);
      for (const name of new Set(["_fbp", "_fbc", "_ttp", "_tt_enable_cookie", "ttcsid", ...cookieNames.filter(name => name.startsWith("ttcsid_"))])) {
        for (const domain of ["", "; Domain=justproveit.co.uk", "; Domain=www.justproveit.co.uk"]) {
          document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`;
        }
      }
      if ((window as AdvertisingWindow).proveitAdvertising || document.getElementById("proveit-advertising-loader")) window.location.reload();
    }
  }

  if (!ready || !publicPage) return null;
  return <>
    <button type="button" className={styles.settings} onClick={() => setOpen(true)}>Preferințe publicitate</button>
    {(choice === null || open) && <section className={styles.banner} aria-label="Preferințe pentru cookie-urile de publicitate">
      <div><h2>Cookie-uri de publicitate</h2><p>Cu acordul tău, folosim Meta (Facebook și Instagram) și TikTok pentru a măsura vizitele și a-ți afișa reclame relevante. Aceste servicii pot primi informații despre vizita ta și pot folosi cookie-uri. Poți refuza sau modifica alegerea oricând.</p>
        <p><a href="https://www.proveitweb.co.uk/privacypolicy">Confidențialitate Proveit</a> · <a href="https://www.facebook.com/privacy/policy/">Meta</a> · <a href="https://www.tiktok.com/legal/page/eea/privacy-policy/en">TikTok</a></p></div>
      <div className={styles.actions}><button type="button" onClick={() => choose("denied")}>Refuz publicitatea</button><button type="button" onClick={() => choose("granted")}>Accept publicitatea</button></div>
    </section>}
  </>;
}
