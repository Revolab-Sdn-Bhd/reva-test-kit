
import { Button } from "./button/Button";
import { useState } from "react";
import { ConnectionMode } from "@/hooks/useConnection";
import useConfigStore from "@/hooks/useConfig";

type PlaygroundConnectProps = {
  accentColor: string;
  onConnectClicked: (mode: ConnectionMode) => void;
};

const TokenConnect = ({
  accentColor,
  onConnectClicked,
}: PlaygroundConnectProps) => {
  const settings = useConfigStore(state => state.userSettings);
  const setSettings = useConfigStore(state => state.setUserSettings);

  const [url, setUrl] = useState(settings.ws_url);
  const [token, setToken] = useState(settings.token);

  return (
    <div className="top-0 left-0 flex items-center justify-center w-full h-full text-center bg-white/90">
      <div className="flex flex-col w-full gap-4 p-8 text-gray-900 bg-white border-t border-gray-200">
        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="wss://url"
          ></input>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="room token..."
          ></textarea>
        </div>
        <Button
          accentColor={accentColor}
          className="w-full"
          onClick={() => {
            const newSettings = { ...settings };
            newSettings.ws_url = url;
            newSettings.token = token;
            setSettings(newSettings);
            onConnectClicked("manual");
          }}
        >
          Connect
        </Button>
      </div>
    </div>
  );
};

export const PlaygroundConnect = ({
  accentColor,
  onConnectClicked,
}: PlaygroundConnectProps) => {
  const copy = "Connect to playground with a URL and token";
  return (
    <div className="top-0 left-0 flex items-center justify-center w-full h-full gap-2 text-center bg-white/90">
      <div className="min-h-[540px]">
        <div className="flex flex-col bg-white w-full max-w-[480px] rounded-lg text-gray-900 border border-gray-200 shadow-lg">
          <div className="flex flex-col gap-2">
            <div className="px-10 py-6 space-y-2">
              <h1 className="text-2xl">Connect to playground</h1>
              <p className="text-sm text-gray-600">{copy}</p>
            </div>
          </div>
          <div className="flex flex-col flex-grow bg-gray-50/50">
            <TokenConnect
              accentColor={accentColor}
              onConnectClicked={onConnectClicked}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
