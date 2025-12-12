import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ConfigProvider } from "@/hooks/useConfig";
import { EnvConfigProvider } from "@/hooks/useEnvConfig";
import { LivekitConnectionProvider } from "@/hooks/useLivekitConnection";

import "@livekit/components-styles/components/participant";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
	const getLayout =
		(
			Component as typeof Component & {
				getLayout?: (page: React.ReactElement) => React.ReactNode;
			}
		).getLayout ?? ((page) => page);

	return (
		<EnvConfigProvider>
			<ConfigProvider>
				<LivekitConnectionProvider>
					<Toaster position="top-right" />
					{getLayout(<Component {...pageProps} />)}
				</LivekitConnectionProvider>
			</ConfigProvider>
		</EnvConfigProvider>
	);
}
