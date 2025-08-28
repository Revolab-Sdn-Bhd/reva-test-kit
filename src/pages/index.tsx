import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";
import Head from "next/head";
import { useCallback, useState } from "react";

import Playground from "@/components/playground/Playground";
import { LanguageSelectionDialog } from "@/components/dialog/LanguageSelectionDialog";
import { useConfig } from "@/hooks/useConfig";
import { ConnectionProvider, useConnection } from "@/hooks/useConnection";
import { toast } from "sonner";

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

export default function Home() {
  return (
    <ConnectionProvider>
      <HomeInner />
    </ConnectionProvider>
  );
}

export function HomeInner() {
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
    <>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main className="relative flex flex-col items-center justify-center w-full h-full px-4 bg-black repeating-square-background">
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
      </main>
    </>
  );
}
