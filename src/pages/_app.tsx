import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import type { AppProps } from "next/app";
import ClarityBoundary from "@/components/ClarityBoundary";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClarityBoundary>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ClarityBoundary>
  );
}
