import type React from "react";
import type { SetStateAction } from "react";
import { useEnvConfig } from "@/hooks/useEnvConfig";

interface ConnectionTabProps {
	platform: "web" | "mobile";
	setPlatform: React.Dispatch<React.SetStateAction<"web" | "mobile">>;
	isConnected: boolean;
	language: "en" | "ar";
	setLanguage: React.Dispatch<React.SetStateAction<"en" | "ar">>;
	token: string;
	setToken: React.Dispatch<SetStateAction<string>>;
	sessionId?: string;
	setSessionId: React.Dispatch<SetStateAction<string>>;
	wsPath: string;
	setWsPath: React.Dispatch<SetStateAction<string>>;
	handleConnect: () => void;
	handleDisconnect: () => void;
}

const ConnectionTab: React.FC<ConnectionTabProps> = ({
	platform,
	setPlatform,
	isConnected,
	language,
	setLanguage,
	token,
	setToken,
	sessionId,
	setSessionId,
	wsPath,
	setWsPath,
	handleConnect,
	handleDisconnect,
}) => {
	const { envConfig } = useEnvConfig();

	const renderWsUrl = () => {
		const isDevelopment = process.env.NODE_ENV === "development";
		const wsProtocol = isDevelopment ? "ws://" : "wss://";
		const wsHost = isDevelopment
			? "localhost:3000"
			: envConfig?.CHAT_SERVICE_URL;
		const sessionIdParam = sessionId ? `&sessionId=${sessionId}` : "";
		return `${wsProtocol}${wsHost}${wsPath}?token=${token}&language=${language}&platform=${platform}${sessionIdParam}`;
	};

	return (
		<div className="space-y-4 text-sm">
			<div className="grid grid-cols-2">
				<div>
					<div className="block mb-2 text-sm font-medium text-gray-300">
						Platform
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setPlatform("web")}
							disabled={isConnected}
							className={`px-4 py-2 rounded ${
								platform === "web"
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Web
						</button>
						<button
							type="button"
							onClick={() => setPlatform("mobile")}
							disabled={isConnected}
							className={`px-4 py-2 rounded ${
								platform === "mobile"
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Mobile
						</button>
					</div>
				</div>

				<div>
					<div className="block mb-2 text-sm font-medium text-gray-300">
						Language
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setLanguage("en")}
							disabled={isConnected}
							className={`px-4 py-2 rounded ${
								language === "en"
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							English
						</button>
						<button
							type="button"
							onClick={() => setLanguage("ar")}
							disabled={isConnected}
							className={`px-4 py-2 rounded ${
								language === "ar"
									? "bg-blue-600 text-white"
									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
							} ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
						>
							Arabic
						</button>
					</div>
				</div>
			</div>

			<div className="flex flex-row items-center w-full gap-2">
				<div className="flex-1">
					<label
						htmlFor="token-input"
						className="block mb-2 text-sm font-medium text-gray-300"
					>
						Token
					</label>
					<input
						id="token-input"
						type="text"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						disabled={isConnected}
						className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
						placeholder="Enter token"
					/>
				</div>

				<div className="flex-1">
					<label
						htmlFor="session-id-input"
						className="block mb-2 text-sm font-medium text-gray-300"
					>
						Session ID <span className="text-xs text-gray-500">(Optional)</span>
					</label>
					<input
						id="session-id-input"
						type="text"
						value={sessionId}
						onChange={(e) => setSessionId(e.target.value)}
						disabled={isConnected}
						className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
						placeholder="Enter session ID"
					/>
				</div>
			</div>

			<div>
				<label
					htmlFor="ws-path-input"
					className="block mb-2 text-sm font-medium text-gray-300"
				>
					WebSocket Path
				</label>
				<input
					id="ws-path-input"
					type="text"
					value={wsPath}
					onChange={(e) => setWsPath(e.target.value)}
					disabled={isConnected}
					className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
					placeholder="/ws/chat"
				/>
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={isConnected ? handleDisconnect : handleConnect}
					className={`flex-1 px-4 py-2 rounded font-medium ${
						isConnected
							? "bg-red-600 hover:bg-red-700 text-white"
							: "bg-green-600 hover:bg-green-700 text-white"
					}`}
				>
					{isConnected ? "Disconnect" : "Start Connection"}
				</button>
			</div>

			<div className="font-mono text-sm text-gray-400 break-all">
				{renderWsUrl()}
			</div>
		</div>
	);
};

export default ConnectionTab;
