import { EnvConfigProvider } from "@/hooks/useEnvConfig";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ConfigProvider } from "@/hooks/useConfig";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EnvConfigProvider>
      <ConfigProvider>
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </ConfigProvider>
    </EnvConfigProvider>
  );
}
