import { createTheme, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { ConfigProvider } from "@/hooks/useConfig";
import { EnvConfigProvider } from "@/hooks/useEnvConfig";
import { LivekitConnectionProvider } from "@/hooks/useLivekitConnection";

import "@livekit/components-styles/components/participant";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/globals.css";
import { modals } from "@/lib/modal";

const theme = createTheme({
	primaryColor: "blue",
});

export default function App({ Component, pageProps }: AppProps) {
	const getLayout =
		(
			Component as typeof Component & {
				getLayout?: (page: React.ReactElement) => React.ReactNode;
			}
		).getLayout ?? ((page) => page);

	return (
		<MantineProvider theme={theme} forceColorScheme="dark">
			<ModalsProvider modals={modals}>
				<Notifications position="top-right" />
				<EnvConfigProvider>
					<ConfigProvider>
						<LivekitConnectionProvider>
							<Toaster position="top-right" />
							{getLayout(<Component {...pageProps} />)}
						</LivekitConnectionProvider>
					</ConfigProvider>
				</EnvConfigProvider>
			</ModalsProvider>
		</MantineProvider>
	);
}
