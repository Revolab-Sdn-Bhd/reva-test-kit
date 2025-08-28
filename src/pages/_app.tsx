import { EnvConfigProvider } from "@/hooks/useEnvConfig";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ConnectionProvider } from "@/hooks/useConnection";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EnvConfigProvider>
      <ConnectionProvider>
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </ConnectionProvider>
    </EnvConfigProvider>
  );
}
