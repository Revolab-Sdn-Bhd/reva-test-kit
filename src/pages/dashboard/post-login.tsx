import {
	LiveKitRoom,
	RoomAudioRenderer,
	StartAudio,
} from "@livekit/components-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ChatScreen from "@/components/post-login/chat-screen";
import ConnectionTab from "@/components/post-login/tabs/connection";
import CustomPayloadTab from "@/components/post-login/tabs/custom-payload";
import WebsocketLogs from "@/components/post-login/websocket-logs";
import { useEnvConfig } from "@/hooks/useEnvConfig";
import {
	LivekitConnectionProvider,
	useLivekitConnection,
} from "@/hooks/useLivekitConnection";
import {
	useWebSocketContext,
	WebSocketProvider,
} from "@/lib/WebSocketProvider";

type ConfigTab = "connection" | "custom-json";

function PostLoginContent() {
	const [platform, setPlatform] = useState<"web" | "mobile">("web");
	const [language, setLanguage] = useState<"en" | "ar">("en");
	const [token, setToken] = useState("reflect123");
	const [sessionId, setSessionId] = useState("");
	const [wsPath, setWsPath] = useState("/ws/chat");

	const { envConfig } = useEnvConfig();

	const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState<ConfigTab>("connection");

	const { isConnected, connect, disconnect } = useWebSocketContext();
	const { disconnect: livekitDisconnect } = useLivekitConnection();

	const handleConnect = () => {
		const isDevelopment = process.env.NODE_ENV === "development";
		const wsProtocol = isDevelopment ? "ws://" : "wss://";
		const wsHost = isDevelopment
			? "localhost:3000"
			: envConfig?.CHAT_SERVICE_URL;
		const wsUrl = `${wsProtocol}${wsHost}${wsPath}`;

		connect({
			url: wsUrl,
			token,
			language,
			platform,
			sessionId: sessionId || undefined,
		});
	};

	const handleDisconnect = () => {
		disconnect();
		livekitDisconnect();
	};

	return (
		<div className="flex h-full gap-4 p-4 bg-gray-900">
			{/* Left Panel - Configuration & Logs */}
			<div className="flex flex-col w-1/2 gap-4">
				{/* Configuration */}
				<div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
					<button
						type="button"
						onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
						className="flex items-center justify-between w-full p-6 text-left"
					>
						<h2 className="text-xl font-bold text-white">
							WebSocket Configuration
						</h2>
						<svg
							className={`w-5 h-5 text-gray-400 transition-transform ${
								isConfigCollapsed ? "" : "rotate-180"
							}`}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{!isConfigCollapsed && (
						<div className="px-6 pb-6 space-y-4">
							{/* Tabs */}
							<div className="flex border-b border-gray-700">
								<button
									type="button"
									onClick={() => setActiveTab("connection")}
									className={`px-4 py-2 text-sm font-medium transition-colors ${
										activeTab === "connection"
											? "text-blue-400 border-b-2 border-blue-400"
											: "text-gray-400 hover:text-gray-300"
									}`}
								>
									Connection Config
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("custom-json")}
									className={`px-4 py-2 text-sm font-medium transition-colors ${
										activeTab === "custom-json"
											? "text-blue-400 border-b-2 border-blue-400"
											: "text-gray-400 hover:text-gray-300"
									}`}
								>
									Custom JSON
								</button>
							</div>
							{activeTab === "connection" && (
								<ConnectionTab
									platform={platform}
									setPlatform={(platform) => setPlatform(platform)}
									language={language}
									setLanguage={(language) => setLanguage(language)}
									isConnected={isConnected}
									token={token}
									setToken={setToken}
									sessionId={sessionId}
									setSessionId={setSessionId}
									wsPath={wsPath}
									setWsPath={setWsPath}
									handleConnect={handleConnect}
									handleDisconnect={handleDisconnect}
								/>
							)}{" "}
							{/* Custom JSON Tab */}
							{activeTab === "custom-json" && (
								<CustomPayloadTab isConnected={isConnected} />
							)}
						</div>
					)}
				</div>

				<WebsocketLogs />
			</div>

			<ChatScreen token={token} language={language} />
		</div>
	);
}

function PostLoginWithLiveKit() {
	const { shouldConnect, wsUrl, token: lkToken } = useLivekitConnection();

	return (
		<LiveKitRoom
			className="flex flex-col w-full h-full"
			serverUrl={wsUrl}
			token={lkToken}
			connect={shouldConnect}
			onError={(e) => {
				toast.error(e.message);
				console.error(e);
			}}
		>
			<PostLoginContent />
			<RoomAudioRenderer />
			<StartAudio label="Click to enable audio playback" />
		</LiveKitRoom>
	);
}

export default function PostLoginPage() {
	return (
		<LivekitConnectionProvider>
			<WebSocketProvider>
				<PostLoginWithLiveKit />
			</WebSocketProvider>
		</LivekitConnectionProvider>
	);
}

PostLoginPage.getLayout = (page: React.ReactNode) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};
