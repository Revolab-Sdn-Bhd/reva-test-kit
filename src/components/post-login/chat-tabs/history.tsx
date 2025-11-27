import { useEffect, useState } from "react";
import { useEnvConfig } from "@/hooks/useEnvConfig";
import {
	type ChatHistory,
	type ChatSession,
	generateIntrospectToken,
	getChatHistory,
	getPaginatedChatSessions,
} from "@/lib/api/post-login";
import { getChatUrl } from "@/lib/util";

interface ChatHistoryProps {
	token: string;
}

const ChatHistoryTab = ({ token }: ChatHistoryProps) => {
	const { envConfig } = useEnvConfig();

	const chatUrl = getChatUrl(envConfig);

	const [introspectToken, setIntrospectToken] = useState<string | null>(null);
	const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
	const [isLoadingSessions, setIsLoadingSessions] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// History tab functions
	const handleLoadSessions = async () => {
		if (!token.trim()) {
			setError("Please enter a token");
			return;
		}

		setError(null);
		setIsLoadingSessions(true);
		setChatSessions([]);
		setSelectedSessionId(null);
		setChatHistory([]);

		try {
			const jwt = await generateIntrospectToken(chatUrl, token);
			setIntrospectToken(jwt);

			const response = await getPaginatedChatSessions(chatUrl, jwt);
			if (response.code === 200) {
				setChatSessions(response.data);
			} else {
				setError(`Failed to load sessions: ${response.message}`);
			}
		} catch (err) {
			setError(
				`Error loading sessions: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setIsLoadingSessions(false);
		}
	};

	const handleLoadChatHistory = async (sessionId: string) => {
		if (!introspectToken) return;

		setSelectedSessionId(sessionId);
		setIsLoadingHistory(true);
		setError(null);

		try {
			const response = await getChatHistory(
				chatUrl,
				introspectToken,
				sessionId,
			);
			if (response.code === 200) {
				setChatHistory(response.data);
			} else {
				setError(`Failed to load history: ${response.message}`);
			}
		} catch (err) {
			setError(
				`Error loading history: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const renderContent = () => {
		if (isLoadingHistory) {
			return (
				<div className="py-8 text-sm text-center text-gray-400">
					Loading history...
				</div>
			);
		}

		if (chatHistory.length === 0) {
			return (
				<div className="py-8 text-sm text-center text-gray-400">
					{selectedSessionId
						? "No messages in this session."
						: "Select a session from the left to view its chat history."}
				</div>
			);
		}

		return chatHistory.map((msg) => (
			<div
				key={msg.id}
				className={`flex ${
					msg.role === "to" ? "justify-end" : "justify-start"
				}`}
			>
				<div
					className={`max-w-[80%] rounded-lg p-3 ${
						msg.role === "to"
							? "bg-blue-600 text-white"
							: "bg-gray-700 text-gray-100"
					}`}
				>
					<div className="mb-1 text-xs font-medium">
						{msg.role === "to" ? "User" : "Agent"}
					</div>
					<div className="text-sm">{msg.message}</div>
					<div className="flex items-center justify-between mt-2">
						<div
							className={`text-xs ${
								msg.role === "to" ? "text-blue-100" : "text-gray-400"
							}`}
						>
							{new Date(msg.timestamp).toLocaleString()}
						</div>
						{msg.isHelpful !== null && (
							<div className="text-xs">
								{msg.isHelpful ? "👍 Helpful" : "👎 Not helpful"}
							</div>
						)}
					</div>
				</div>
			</div>
		));
	};

	useEffect(() => {
		if (envConfig?.CHAT_SERVICE_URL) {
			handleLoadSessions();
		}
	}, [token, envConfig?.CHAT_SERVICE_URL]);

	return (
		<div className="flex flex-1 min-h-0">
			{/* Left: Sessions List */}
			<div className="flex flex-col w-1/3 border-r border-gray-700">
				<div className="flex-1 overflow-y-auto">
					{chatSessions.length === 0 ? (
						<div className="p-4 text-sm text-center text-gray-400">
							{isLoadingSessions
								? "Loading sessions..."
								: "No sessions loaded. Enter token and click Load Sessions."}
						</div>
					) : (
						<div className="p-2 space-y-1">
							{chatSessions.map((session) => (
								<button
									key={session.id}
									type="button"
									onClick={() => handleLoadChatHistory(session.sessionId)}
									className={`w-full text-left p-3 rounded transition-colors ${
										selectedSessionId === session.sessionId
											? "bg-blue-600 text-white"
											: "bg-gray-700 text-gray-300 hover:bg-gray-600"
									}`}
								>
									<div className="text-sm font-medium truncate">
										{session.title || "Untitled Session"}
									</div>
									<div className="mt-1 text-xs text-gray-400">
										{new Date(session.startDate).toLocaleString()}
									</div>
									{session.rating !== null && (
										<div className="mt-1 text-xs">
											Rating: {session.rating}/5
										</div>
									)}
								</button>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Right: Chat History */}
			<div className="flex flex-col flex-1">
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
					<h3 className="text-sm font-semibold text-white">
						{selectedSessionId
							? "Chat History"
							: "Select a session to view history"}
					</h3>
				</div>
				<div className="flex-1 p-4 space-y-3 overflow-y-auto">
					{renderContent()}
				</div>
			</div>
		</div>
	);
};

export default ChatHistoryTab;
