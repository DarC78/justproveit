import type { NextRouter } from "next/router";

export const CLARITY_PROJECT_ID = "xp8gw8yl07";

export function isClarityPage(url: string): boolean {
  try {
    const path = decodeURIComponent(new URL(url, "https://local.invalid").pathname)
      .replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase();
    return ![
      "/admin", "/login", "/reset-password", "/ro/raport-gratuit",
      // A private report accessed using a bearer link, even without a login screen.
      "/ro/rezultate-raport", "/ro/rezultate-simulare", "/api",
      "/bani-uk-multumim", "/bani-uk-ai-multumim",
    ].some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

// Crossing the recording boundary must destroy the entire document, including
// Clarity's observers. Removing its script element would not stop the recorder.
export function installClarityBoundary(
  router: NextRouter,
  publicDocument: boolean,
  navigate: (url: string) => void,
) {
  const crossesBoundary = (url: string) => isClarityPage(url) !== publicDocument;
  const onRouteChange = (url: string) => {
    if (!crossesBoundary(url)) return;
    const error = Object.assign(new Error("Full navigation across Clarity boundary"), { cancelled: true });
    router.events.emit("routeChangeError", error, url, { shallow: false });
    navigate(url);
    // Abort before Next updates its route state or mounts the target component.
    throw error;
  };
  router.events.on("routeChangeStart", onRouteChange);
  router.beforePopState(({ as }) => {
    if (!crossesBoundary(as)) return true;
    navigate(as);
    return false;
  });
  return () => {
    router.events.off("routeChangeStart", onRouteChange);
    router.beforePopState(() => true);
  };
}
