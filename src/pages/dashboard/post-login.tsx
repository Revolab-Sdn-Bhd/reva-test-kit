import {
	LiveKitRoom,
	RoomAudioRenderer,
	StartAudio,
} from "@livekit/components-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import ChatScreen from "@/components/post-login/chat-screen";
import AccountSection from "@/components/post-login/tabs/account";
import BillsSection from "@/components/post-login/tabs/bills";
import ConnectionTab from "@/components/post-login/tabs/connection";
import CustomPayloadTab from "@/components/post-login/tabs/custom-payload";
import TransferAccountSection from "@/components/post-login/tabs/transfer-account";
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
import { Mode } from "@/types/connection";

enum ConfigTab {
	Connection = "connection",
	CustomJson = "custom-json",
	UserAccount = "user-account",
	Bills = "bills",
	TransferAccount = "transfer-account",
}

const Tabs = [
	{ label: "Connection", value: ConfigTab.Connection },
	{ label: "User Account", value: ConfigTab.UserAccount },
	{ label: "Bills", value: ConfigTab.Bills },
	{ label: "Transfer Account", value: ConfigTab.TransferAccount },
	{ label: "Custom JSON", value: ConfigTab.CustomJson },
];

function PostLoginContent() {
	const [platform, setPlatform] = useQueryState<"web" | "mobile">("platform", {
		defaultValue: "web",
		type: "single",
		parse: (val) => (val === "mobile" ? "mobile" : "web"),
	});
	const [language, setLanguage] = useQueryState<"en" | "ar">("language", {
		defaultValue: "en",
		type: "single",
		parse: (val) => (val === "ar" ? "ar" : "en"),
	});
	const [token, setToken] = useQueryState("token", {
		defaultValue: "reflect123",
	});
	const [sessionId, setSessionId] = useQueryState("sessionId", {
		defaultValue: "",
	});
	const [wsPath, setWsPath] = useQueryState("wsPath", {
		defaultValue: "/ws/v2/chat",
	});
	const [mode, setMode] = useQueryState<Mode>(
		"mode",
		parseAsStringEnum<Mode>(Object.values(Mode)).withDefault(
			Mode.POST_LOGIN_V2,
		),
	);

	useEffect(() => {
		switch (mode) {
			case Mode.PRE_LOGIN_V1: {
				setWsPath("/ws/chat");
				break;
			}
			case Mode.POST_LOGIN_V1: {
				setWsPath("/ws/chat");
				break;
			}
			case Mode.POST_LOGIN_V2: {
				setWsPath("/ws/v2/chat");
				break;
			}
			default: {
				toast.error("Unknown mode, defaulting to postlogin-v2");
				setMode(Mode.POST_LOGIN_V2);
				setWsPath("/ws/v2/chat");
				break;
			}
		}
	}, [mode]);

	const { envConfig } = useEnvConfig();

	const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useQueryState<ConfigTab>(
		"tab",
		parseAsStringEnum<ConfigTab>(Object.values(ConfigTab)).withDefault(
			ConfigTab.Connection,
		),
	);

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
		<div className="flex h-full gap-4 p-3 bg-gray-900">
			{/* Left Panel - Configuration & Logs */}
			<div className="flex flex-col w-1/2 gap-4">
				{/* Configuration */}
				<div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
					<button
						type="button"
						onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
						className="flex items-center justify-between w-full p-3 text-left"
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
							<div className="flex border-b border-gray-700">
								{Tabs.map(({ label, value }) => (
									<button
										key={label}
										type="button"
										onClick={() => setActiveTab(value)}
										className={`px-4 py-2 text-sm font-medium transition-colors ${
											activeTab === value
												? "text-blue-400 border-b-2 border-blue-400"
												: "text-gray-400 hover:text-gray-300"
										}`}
									>
										{label}
									</button>
								))}
							</div>
							{activeTab === ConfigTab.Connection && (
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
							)}

							{activeTab === ConfigTab.UserAccount && (
								<AccountSection isConnected={isConnected} />
							)}
							{activeTab === ConfigTab.Bills && (
								<BillsSection isConnected={isConnected} />
							)}
							{activeTab === ConfigTab.TransferAccount && (
								<TransferAccountSection isConnected={isConnected} />
							)}
							{activeTab === ConfigTab.CustomJson && (
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
