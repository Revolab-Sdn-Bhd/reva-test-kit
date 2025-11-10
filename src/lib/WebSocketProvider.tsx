import { createContext, type ReactNode, useContext } from "react";
import type { ChatMessage, LogEntry, MessageAction } from "./useWebSocket";
import { useWebSocket } from "./useWebSocket";

type WebSocketConfig = {
	url: string;
	token: string;
	language: string;
	platform: string;
	sessionId?: string;
};

type WebSocketContextType = {
	isConnected: boolean;
	logs: LogEntry[];
	messages: ChatMessage[];
	connect: (config: WebSocketConfig) => void;
	disconnect: () => void;
	sendMessage: (payload: string, displayMessage?: string) => boolean;
	sendAction: (action: MessageAction, messageId?: string) => boolean;
	clearLogs: () => void;
	clearMessages: () => void;
	chatInfo: {
		chatId: string;
		sessionId: string;
	} | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
	const websocket = useWebSocket();

	return (
		<WebSocketContext.Provider value={websocket}>
			{children}
		</WebSocketContext.Provider>
	);
};

export const useWebSocketContext = () => {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error(
			"useWebSocketContext must be used within a WebSocketProvider",
		);
	}
	return context;
};
