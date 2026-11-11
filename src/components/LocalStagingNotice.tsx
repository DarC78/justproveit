import { useEffect, useState } from "react";

export default function LocalStagingNotice() {
  const [blocked, setBlocked] = useState("");
  useEffect(() => {
    const preventLiveCheckout = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      const url = new URL(target.href, window.location.href);
      if (/^(?:[^.]+\.)?(?:stripe\.com|calendly\.com)$/.test(url.hostname)) {
        event.preventDefault();
        event.stopPropagation();
        setBlocked(`This ${url.hostname} action requires a designated provider sandbox. The live destination was not opened.`);
      }
    };
    document.addEventListener("click", preventLiveCheckout, true);
    document.addEventListener("auxclick", preventLiveCheckout, true);
    return () => {
      document.removeEventListener("click", preventLiveCheckout, true);
      document.removeEventListener("auxclick", preventLiveCheckout, true);
    };
  }, []);
  return (
    <div style={{ background: "#fef3c7", color: "#78350f", padding: "8px 16px", textAlign: "center", fontWeight: 600 }}>
      <p role="status">Local staging · Synthetic data only · Provider results are simulated where supported</p>
      {blocked ? <p role="alert">{blocked}</p> : null}
    </div>
  );
}
