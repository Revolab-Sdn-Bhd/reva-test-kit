import { useWebSocketContext } from "@/lib/WebSocketProvider";
import { TabType } from "../chat-screen";

const ChatHeaderSection = ({
	activeTab,
	setActiveTab,
}: {
	activeTab: TabType;
	setActiveTab: (tab: TabType) => void;
}) => {
	const { chatInfo, clearMessages } = useWebSocketContext();

	return (
		<div className="border-b border-gray-700">
			<div className="flex items-center justify-between px-4 py-3">
				<div className="flex flex-col">
					<h2 className="text-xl font-bold text-white">Chat Window</h2>
					{activeTab === "chat" && chatInfo && (
						<div className="text-sm text-gray-400">
							<div>Chat ID: {chatInfo.chatId}</div>
							<div>Session ID: {chatInfo.sessionId}</div>
						</div>
					)}
				</div>
				{activeTab === "chat" && (
					<button
						type="button"
						onClick={clearMessages}
						className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
					>
						Clear
					</button>
				)}
			</div>
			{/* Tabs */}
			<div className="flex px-4">
				<button
					type="button"
					onClick={() => setActiveTab(TabType.CHAT)}
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "chat"
							? "text-blue-400 border-b-2 border-blue-400"
							: "text-gray-400 hover:text-gray-300"
					}`}
				>
					Current Chat
				</button>
				<button
					type="button"
					onClick={() => setActiveTab(TabType.HISTORY)}
					className={`px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "history"
							? "text-blue-400 border-b-2 border-blue-400"
							: "text-gray-400 hover:text-gray-300"
					}`}
				>
					History
				</button>
			</div>
		</div>
	);
};

export default ChatHeaderSection;
