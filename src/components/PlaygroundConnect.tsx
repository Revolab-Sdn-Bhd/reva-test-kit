import { useState } from "react";
import { useConfig } from "@/hooks/useConfig";
import type { ConnectionMode } from "@/hooks/useConnection";
import { Button } from "./button/Button";

type PlaygroundConnectProps = {
	accentColor: string;
	onConnectClicked: (mode: ConnectionMode) => void;
};

const TokenConnect = ({
	accentColor,
	onConnectClicked,
}: PlaygroundConnectProps) => {
	const { setUserSettings, config } = useConfig();
	const [url, setUrl] = useState(config.settings.ws_url);
	const [token, setToken] = useState(config.settings.token);

	return (
		<div className="top-0 left-0 flex items-center justify-center w-full h-full text-center bg-black/80">
			<div className="flex flex-col w-full gap-4 p-8 text-white border-t border-gray-900 bg-gray-950">
				<div className="flex flex-col gap-2">
					<input
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className="px-3 py-2 text-sm text-white bg-transparent border border-gray-800 rounded-sm"
						placeholder="wss://url"
					></input>
					<textarea
						value={token}
						onChange={(e) => setToken(e.target.value)}
						className="px-3 py-2 text-sm text-white bg-transparent border border-gray-800 rounded-sm"
						placeholder="room token..."
					></textarea>
				</div>
				<Button
					accentColor={accentColor}
					className="w-full"
					onClick={() => {
						const newSettings = { ...config.settings };
						newSettings.ws_url = url;
						newSettings.token = token;
						setUserSettings(newSettings);
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
		<div className="top-0 left-0 flex items-center justify-center w-full h-full gap-2 text-center bg-black/80">
			<div className="min-h-[540px]">
				<div className="flex flex-col bg-gray-950 w-full max-w-[480px] rounded-lg text-white border border-gray-900">
					<div className="flex flex-col gap-2">
						<div className="px-10 py-6 space-y-2">
							<h1 className="text-2xl">Connect to playground</h1>
							<p className="text-sm text-gray-500">{copy}</p>
						</div>
					</div>
					<div className="flex flex-col flex-grow bg-gray-900/30">
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
