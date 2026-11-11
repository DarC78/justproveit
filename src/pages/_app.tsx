import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import type { AppProps } from "next/app";
import ClarityBoundary from "@/components/ClarityBoundary";
import AdvertisingConsent from "@/components/AdvertisingConsent";
import GoogleCustomerDataChoice from "@/components/GoogleCustomerDataChoice";
import EmailCampaignVisit from "@/components/EmailCampaignVisit";
import LocalStagingNotice from "@/components/LocalStagingNotice";

export default function App({ Component, pageProps }: AppProps) {
  if (process.env.NEXT_PUBLIC_LOCAL_STAGING === "true") {
    return (
      <AuthProvider>
        <LocalStagingNotice />
        <Component {...pageProps} />
        <AdvertisingConsent />
        <EmailCampaignVisit />
        <GoogleCustomerDataChoice />
      </AuthProvider>
    );
  }

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
