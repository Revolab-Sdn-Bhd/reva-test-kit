import { useState } from "react";
import ChatHistoryTab from "./chat-tabs/history";
import ChatHeaderSection from "./chats/header";
import ChatInputSection from "./chats/input";
import ChatMessageSection from "./chats/message";

export type TabType = "chat" | "history";

interface ChatScreenProps {
	token: string;
}

const ChatScreen = ({ token }: ChatScreenProps) => {
	const [activeTab, setActiveTab] = useState<TabType>("chat");

	return (
		<div className="flex flex-col w-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow">
			<ChatHeaderSection activeTab={activeTab} setActiveTab={setActiveTab} />

			{activeTab === "chat" ? (
				<>
					<ChatMessageSection />
					<ChatInputSection />
				</>
			) : (
				<ChatHistoryTab token={token} />
			)}
		</div>
	);
};

export default ChatScreen;
