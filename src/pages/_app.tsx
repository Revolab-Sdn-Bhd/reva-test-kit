import { CloudProvider } from "@/cloud/useCloud";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import getConfig from "next/config";

export default function App({ Component, pageProps }: AppProps) {
  const { publicRuntimeConfig } = getConfig();
  console.log("@test", { publicRuntimeConfig });
  return (
    <CloudProvider>
      <Component {...pageProps} />
    </CloudProvider>
  );
}

App.getInitialProps = () => ({});
