import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ConfigProvider } from "@/hooks/useConfig";
import { ConnectionProvider } from "@/hooks/useConnection";
import { EnvConfigProvider } from "@/hooks/useEnvConfig";

import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<EnvConfigProvider>
			<ConfigProvider>
				<ConnectionProvider>
					<Toaster position="top-right" />
					<Component {...pageProps} />
				</ConnectionProvider>
			</ConfigProvider>
		</EnvConfigProvider>
	);
}
