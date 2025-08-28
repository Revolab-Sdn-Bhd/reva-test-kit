import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import { useCallback, useState } from "react";
import Playground from "@/components/playground/Playground";
import { LanguageSelectionDialog } from "@/components/dialog/LanguageSelectionDialog";

import { useConnection } from "@/hooks/useConnection";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import useConfigStore from "@/hooks/useConfig";

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
const LivecallPage = () => {
  const { shouldConnect, wsUrl, token, connect, disconnect } = useConnection();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const settings = useConfigStore(state => state.userSettings);

  const handleConnect = useCallback(
    async (c: boolean) => {
      if (c) {
        setShowLanguageDialog(true);
      } else {
        disconnect();
      }
    },
    [disconnect]
  );

  const handleLanguageSelect = useCallback(
    async (language: "en" | "ar") => {
      await connect(language);
    },
    [connect]
  );

  return (
    <DashboardLayout>
      <main className="relative flex flex-col items-center justify-center w-full h-full px-4 bg-gray-50">
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
          accentColor={settings.theme_color}
        />
      </main>
    </DashboardLayout>
  );
};

export default LivecallPage;
