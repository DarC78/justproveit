import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      {/* Session replay is disabled: authenticated CRM pages contain protected credentials. */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
