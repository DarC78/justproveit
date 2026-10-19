import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import type { AppProps } from "next/app";
import ClarityBoundary from "@/components/ClarityBoundary";
import AdvertisingConsent from "@/components/AdvertisingConsent";
import GoogleCustomerDataChoice from "@/components/GoogleCustomerDataChoice";
import EmailCampaignVisit from "@/components/EmailCampaignVisit";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClarityBoundary>
      <AuthProvider>
        <Component {...pageProps} />
        <AdvertisingConsent />
        <EmailCampaignVisit />
        <GoogleCustomerDataChoice />
      </AuthProvider>
    </ClarityBoundary>
  );
}
