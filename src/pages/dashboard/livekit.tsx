import {
	LiveKitRoom,
	RoomAudioRenderer,
	StartAudio,
} from "@livekit/components-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { LanguageSelectionDialog } from "@/components/dialog/LanguageSelectionDialog";
import Playground from "@/components/playground/Playground";
import { useConfig } from "@/hooks/useConfig";
import { useConnection } from "@/hooks/useConnection";

const themeColors = [
	"cyan",
	"green",
	"amber",
	"blue",
	"violet",
	"rose",
	"pink",
	"teal",
];

const LiveKitPage = () => {
	const { shouldConnect, wsUrl, token, connect, disconnect } = useConnection();
	const [showLanguageDialog, setShowLanguageDialog] = useState(false);

	const { config } = useConfig();

	const handleConnect = useCallback(
		async (c: boolean) => {
			if (c) {
				setShowLanguageDialog(true);
			} else {
				disconnect();
			}
		},
		[disconnect],
	);

	const handleLanguageSelect = useCallback(
		async (language: "en" | "ar") => {
			await connect(language);
		},
		[connect],
	);

	return (
		<div className="relative flex flex-col items-center justify-center w-full h-full px-4 bg-black repeating-square-background">
			<LiveKitRoom
				className="flex flex-col w-full h-full"
				serverUrl={wsUrl}
				token={token}
				connect={shouldConnect}
				onError={(e) => {
					toast.error(e.message);
					console.error(e);
				}}
			>
				<Playground
					themeColors={themeColors}
					onConnect={(c) => {
						handleConnect(c);
					}}
				/>
				<RoomAudioRenderer />
				<StartAudio label="Click to enable audio playback" />
			</LiveKitRoom>

			<LanguageSelectionDialog
				isOpen={showLanguageDialog}
				onLanguageSelect={handleLanguageSelect}
				onClose={() => setShowLanguageDialog(false)}
				accentColor={config.settings.theme_color}
			/>
		</div>
	);
};

export default LiveKitPage;

LiveKitPage.getLayout = (page: React.ReactNode) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};
