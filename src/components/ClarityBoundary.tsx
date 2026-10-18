import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/router";
import { CLARITY_PROJECT_ID, installClarityBoundary, isClarityPage } from "@/lib/clarity";

export default function ClarityBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const publicDocument = useRef(isClarityPage(router.pathname)).current;
  const publicPage = isClarityPage(router.pathname) && isClarityPage(router.asPath);

  useEffect(() => {
    const cleanup = installClarityBoundary(router, publicDocument, url => window.location.assign(url));
    if (publicDocument && isClarityPage(window.location.href) && !document.getElementById("microsoft-clarity")) {
      const clarityWindow = window as typeof window & {
        clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
      };
      clarityWindow.clarity = clarityWindow.clarity || Object.assign(
        (...args: unknown[]) => { (clarityWindow.clarity!.q ||= []).push(args); },
        { q: [] as unknown[][] },
      );
      const script = document.createElement("script");
      script.id = "microsoft-clarity";
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
      document.head.appendChild(script);
    }
    return cleanup;
  }, [router, publicDocument]);

  // Defense in depth: never render protected content into a recorded document,
  // even if a navigation bypasses the normal router event.
  useEffect(() => {
    if (publicPage !== publicDocument) window.location.assign(router.asPath);
  }, [publicPage, publicDocument, router.asPath]);

  if (publicDocument !== publicPage) return null;
  return children;
}
