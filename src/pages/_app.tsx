import { CloudProvider } from "@/cloud/useCloud";
import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastProvider } from "@/components/toast/ToasterProvider";
import { ConfigProvider } from "@/hooks/useConfig";
import Layout from "./layout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CloudProvider>
      <ToastProvider>
        <ConfigProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ConfigProvider>
      </ToastProvider>
    </CloudProvider>
  );
}
