import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import type { AppProps } from "next/app";
import ClarityBoundary from "@/components/ClarityBoundary";
import AdvertisingConsent from "@/components/AdvertisingConsent";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClarityBoundary>
      <AuthProvider>
        <Component {...pageProps} />
        <AdvertisingConsent />
      </AuthProvider>
    </ClarityBoundary>
  );
}
