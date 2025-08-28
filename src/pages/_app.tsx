import { CloudProvider } from "@/cloud/useCloud";
import { EnvConfigProvider } from "@/hooks/useEnvConfig";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EnvConfigProvider>
      <CloudProvider>
        <Component {...pageProps} />
      </CloudProvider>
    </EnvConfigProvider>
  );
}
