import { useState } from "react";
import ChatHistoryTab from "./chat-tabs/history";
import ChatHeaderSection from "./chats/header";
import ChatInputSection from "./chats/input";
import ChatMessageSection from "./chats/message";
import VoiceChatSection from "./chats/voice";

export enum TabType {
	CHAT = "chat",
	HISTORY = "history",
	VOICE = "voice",
}

interface ChatScreenProps {
	token: string;
	language: "en" | "ar";
}

const ChatScreen = ({ token, language }: ChatScreenProps) => {
	const [activeTab, setActiveTab] = useState<TabType>(TabType.CHAT);

	return (
		<div className="flex flex-col w-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow">
			<ChatHeaderSection activeTab={activeTab} setActiveTab={setActiveTab} />

			{activeTab === TabType.CHAT && (
				<>
					<ChatMessageSection />
					<ChatInputSection
						redirectToVoiceCall={() => {
							setActiveTab(TabType.VOICE);
						}}
						language={language}
					/>
				</>
			)}

			{activeTab === TabType.HISTORY && <ChatHistoryTab token={token} />}

			{activeTab === TabType.VOICE && (
				<VoiceChatSection
					onFinishCall={() => {
						setActiveTab(TabType.CHAT);
					}}
				/>
			)}
		</div>
	);
};

export default ChatScreen;
