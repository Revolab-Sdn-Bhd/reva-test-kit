import { useCallback, useEffect, useRef, useState } from "react";

export type LogEntry = {
	id: string;
	timestamp: string;
	type: "info" | "error" | "send" | "receive";
	message: string;
};

export type MessageAction = {
	name: string;
	event: string;
	value: string;
	description: string;
};

export type PostConfirmation = {
	partyId: string;
	chatId: string;
	eventType: string;
	transactionStatus: string;
	transactionId: string;
};

export type SavingSpaceWidget = {
	type: string;
	text: string;
	items: SavingSpaceItem[];
};

export type MultiCurrencyWidget = {
	type: string;
	text: string;
	items: MultiCurrencyItem[];
};

export type SavingSpaceItem = {
	title: string;
	icon: string;
	type: string;
	savingSpaceId: string;
	availableBalance: {
		currency: string;
		amount: number;
	};
	savingSpaceTargetBalance?: {
		currency: string;
		amount: number;
	};
	buttons: WidgetButton[];
	payload: {
		event: string;
		data: string;
	};
};

export type MultiCurrencyItem = {
	title: string;
	icon: string;
	type: string;
	accountNumber: string;
	availableBalance: {
		currency: string;
		amount: number;
	};
	buttons: WidgetButton[];
	payload: {
		event: string;
		data: string;
	};
};

type WidgetButton = {
	type: string;
	title: string;
	payload: {
		event: string;
		data: string;
	};
};

export interface ButtonWidget extends BaseWidget {
	type: WidgetType.BUTTON;
	buttons: Array<
		| {
				type: "URL";
				label: string;
				link: string;
		  }
		| {
				type: "NAVIGATE";
				label: string;
				navigationId: string;
		  }
	>;
}

interface BaseWidget {
	type: WidgetType;
	response: string;
}

export enum WidgetType {
	CAROUSEL = "CAROUSEL",
	BUTTON = "BUTTON",
	VIDEO = "VIDEO",
	CALLENDED = "CALLENDED",
}

export type MessageWidget =
	| ButtonWidget
	| SavingSpaceWidget
	| MultiCurrencyWidget;

export type PreConfirmPayload = SavingSpacePayload | MultiCurrencyPayload;

export interface Form {
	title: string;
	fields: {
		label: string;
		value: string;
	}[];
}

export interface SavingSpacePayload {
	savingSpaceId: string;
	savingSpaceName: string;
	instructedAmount: {
		currency: string;
		amount: number;
	};
}

export interface MultiCurrencyPayload {
	confirmationToken: string;
}

export type ChatMessage = {
	id: string;
	sender: "user" | "agent";
	content: string;
	timestamp: string;
	actions?: MessageAction[];
	widgets?: MessageWidget[];
	eventType?: string;
	form?: Form;
	payload?: PreConfirmPayload;
	extraMsg?: string;
	type?: "message" | "audio";
	audioUrl?: string;
};

type WebSocketConfig = {
	url: string;
	token: string;
	language: string;
	platform: string;
	sessionId?: string;
};

export enum EventType {
	AUTH = "AUTH",
	MESSAGE = "MESSAGE",
	AUDIO = "AUDIO",
	RATE = "RATE",
	LANGUAGE = "LANGUAGE",
	ASSISTANCE = "ASSISTANCE",
	DELETEAUDIO = "DELETEAUDIO",
	USERRATEREPLY = "USERRATEREPLY",
	ERROR = "ERROR",
	ALERT = "ALERT",
	RENEW_TOKEN = "RENEW_TOKEN",
	ENDSESSION = "ENDSESSION",
	LIVE_AGENT_MESSAGE = "LIVE_AGENT_MESSAGE",
	NAVIGATE = "NAVIGATE",
	HISTORYMESSAGE = "HISTORYMESSAGE",
	SESSION_LANGUAGE = "SESSION_LANGUAGE",
	CALL_STATUS = "CALL_STATUS",
	POST_CONFIRMATION = "POST_CONFIRMATION",
	SELECT_ACCOUNT = "SELECT_ACCOUNT",
	PRE_CONFIRMATION = "PRE_CONFIRMATION",
}

export const useWebSocket = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const wsRef = useRef<WebSocket | null>(null);
	const configRef = useRef<WebSocketConfig | null>(null);

	const [chatInfo, setChatInfo] = useState<{
		chatId: string;
		sessionId: string;
	} | null>(null);

	const addLog = useCallback((type: LogEntry["type"], message: string) => {
		const timestamp = new Date().toLocaleTimeString();
		const id = `${Date.now()}-${Math.random()}`;
		setLogs((prev) => [...prev, { timestamp, type, message, id }]);
	}, []);

	const addMessage = useCallback(
		(
			sender: "user" | "agent",
			content: string,
			type: "message" | "audio" = "message",
		) => {
			const message: ChatMessage = {
				id: Date.now().toString(),
				sender,
				content,
				timestamp: new Date().toLocaleTimeString(),
				type,
			};
			setMessages((prev) => [...prev, message]);
		},
		[],
	);

	const handleMessageReceived = (ws: WebSocket, event: MessageEvent) => {
		addLog("receive", `${event.data}`);
		setIsTranscribing(false);
		try {
			const parsed = JSON.parse(event.data);

			if (parsed.data) {
				switch (parsed.event) {
					case EventType.MESSAGE:
						{
							if (parsed.data.type === "to") {
								const chatId = parsed.data.chatId;
								const sessionId = parsed.data.id;

								setChatInfo({ chatId, sessionId });
								return;
							}
							const msgData = parsed.data;
							const message: ChatMessage = {
								id: msgData.messageId || Date.now().toString(),
								sender: "agent",
								content: msgData.message,
								timestamp: new Date().toLocaleTimeString(),
								actions: msgData.actions,
								widgets: msgData.widgets,
								extraMsg: msgData.extra_msg,
							};
							setMessages((prev) => [...prev, message]);
						}
						break;
					case EventType.RENEW_TOKEN:
						{
							const newSessionId = parsed.data.id;
							addLog("info", `Received new session ID: ${newSessionId}`);

							ws.send(
								JSON.stringify({
									event: "AUTH",
									data: newSessionId,
								}),
							);
						}
						break;
					case EventType.HISTORYMESSAGE:
						{
							const historyMessages = parsed.data.message;
							if (Array.isArray(historyMessages)) {
								const formattedMessages: ChatMessage[] = historyMessages.map(
									(msg: any, idx: number) => ({
										id: `${Date.now()}-${idx}`,
										sender: msg.type === "from" ? "agent" : "user",
										content: msg.message,
										timestamp: new Date(msg.timestamp).toLocaleTimeString(),
									}),
								);
								setMessages((prev) => [...prev, ...formattedMessages]);
							}
						}
						break;
					case EventType.SESSION_LANGUAGE:
						{
							const chatId = parsed.data.chatId;
							const sessionId = parsed.data.id;

							setChatInfo({ chatId, sessionId });
						}
						break;

					case EventType.AUDIO:
						{
							// Handle audio transcription response
							if (parsed.data.type === "to" && parsed.data.message) {
								const message: ChatMessage = {
									id: parsed.data.messageId || Date.now().toString(),
									sender: "agent",
									content: parsed.data.message,
									timestamp: new Date().toLocaleTimeString(),
									type: "audio",
									audioUrl: parsed.data.audio_url,
									actions: parsed.data.actions,
								};
								setMessages((prev) => [...prev, message]);
							}
						}
						break;
					case EventType.RATE:
						{
							if (parsed.data.type === "to") {
								const chatId = parsed.data.chatId;
								const sessionId = parsed.data.id;

								setChatInfo({ chatId, sessionId });
								return;
							}
							// Handle rate response
							const msgData = parsed.data;
							const message: ChatMessage = {
								id: msgData.messageId || Date.now().toString(),
								sender: "agent",
								content: msgData.message,
								timestamp: new Date().toLocaleTimeString(),
								actions: msgData.actions,
							};
							setMessages((prev) => [...prev, message]);
						}
						break;
					case EventType.ASSISTANCE:
						{
							if (parsed.data.type === "to") {
								const chatId = parsed.data.chatId;
								const sessionId = parsed.data.id;

								setChatInfo({ chatId, sessionId });
								return;
							}
							const msgData = parsed.data;
							const message: ChatMessage = {
								id: msgData.messageId || Date.now().toString(),
								sender: "agent",
								content: msgData.message,
								timestamp: new Date().toLocaleTimeString(),
								actions: msgData.actions,
							};
							setMessages((prev) => [...prev, message]);
						}
						break;
					case EventType.SELECT_ACCOUNT:
						break;
					case EventType.PRE_CONFIRMATION:
						{
							const msgData = parsed.data;
							const message: ChatMessage = {
								id: msgData.messageId || Date.now().toString(),
								sender: "agent",
								content: msgData.message,
								timestamp: new Date().toLocaleTimeString(),
								eventType: msgData.eventType,
								form: msgData.form,
								payload: msgData.payload,
							};
							setMessages((prev) => [...prev, message]);
						}
						break;
					default:
						addLog("error", `Unhandled event type: ${parsed.event}`);
						break;
				}
			}
		} catch {
			addMessage("agent", event.data);
		}
	};

	const connect = useCallback(
		(config: WebSocketConfig) => {
			if (wsRef.current) {
				addLog("error", "WebSocket already connected");
				return;
			}

			// Store config for reconnection
			configRef.current = config;

			let wsUrl = `${config.url}?token=${encodeURIComponent(
				config.token,
			)}&language=${config.language}&platform=${config.platform}`;

			// Add sessionId if provided
			if (config.sessionId) {
				wsUrl += `&sessionId=${encodeURIComponent(config.sessionId)}`;
			}

			addLog("info", `Connecting to ${wsUrl}`);

			try {
				const ws = new WebSocket(wsUrl);

				ws.onopen = () => {
					setIsConnected(true);
					addLog("info", "WebSocket connected successfully");
				};

				ws.onmessage = (event) => {
					handleMessageReceived(ws, event);
				};

				ws.onerror = () => {
					addLog("error", "WebSocket error occurred");
				};

				ws.onclose = (event) => {
					setIsConnected(false);
					addLog(
						"info",
						`WebSocket closed. Code: ${event.code}, Reason: ${
							event.reason || "No reason"
						}`,
					);
					wsRef.current = null;

					clearMessages();
				};

				wsRef.current = ws;
			} catch (error) {
				addLog("error", `Failed to connect: ${error}`);
			}
		},
		[addLog, addMessage],
	);

	const disconnect = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
			setIsConnected(false);
			addLog("info", "Disconnecting WebSocket");
		}
	}, [addLog]);

	const sendMessage = useCallback(
		(payload: string, displayMessage?: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				addLog("error", "WebSocket is not connected");
				return false;
			}

			if (!payload.trim()) {
				return false;
			}

			try {
				wsRef.current.send(payload);
				addLog("send", payload);

				const parsed = JSON.parse(payload);

				switch (parsed.event) {
					case EventType.AUDIO:
						setIsTranscribing(true);
						break;
					case EventType.CALL_STATUS:
						{
							const duration = parsed.data?.durationSeconds || 0;
							const messageToDisplay = `Call ended. Duration: ${Math.floor(
								duration / 60,
							)}:${(duration % 60).toString().padStart(2, "0")}`;
							addMessage("user", messageToDisplay, "audio");
						}
						break;
					case EventType.POST_CONFIRMATION:
						break;
					case EventType.SELECT_ACCOUNT:
						break;
					default: {
						const messageToDisplay =
							displayMessage ||
							(() => {
								try {
									if (typeof parsed.data === "string") {
										return parsed.data;
									}
									if (parsed.data?.message) {
										return parsed.data.message;
									}
									return payload;
								} catch {
									return payload;
								}
							})();

						if (messageToDisplay) {
							addMessage("user", messageToDisplay);
						}

						break;
					}
				}

				return true;
			} catch (error) {
				addLog("error", `Failed to send message: ${error}`);
				return false;
			}
		},
		[addLog, addMessage],
	);

	const sendAction = useCallback(
		(action: MessageAction, messageId?: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				addLog("error", "WebSocket is not connected");
				return false;
			}

			try {
				let payload: object;

				if (action.event === "RATE") {
					payload = {
						event: "RATE",
						data: {
							messageId: messageId || "",
							isHelpful: action.value === "yes" ? "yes" : "no",
						},
					};
				} else if (action.event === "ENDSESSION") {
					payload = {
						event: "ENDSESSION",
						data: {},
					};
				} else if (action.event === "SELECT_ACCOUNT") {
					payload = {
						event: action.event,
						data: action.value,
					};
					const payloadStr = JSON.stringify(payload);
					wsRef.current.send(payloadStr);
					addLog("send", `Sent action: ${payloadStr}`);
					return true;
				} else {
					// Generic action handler
					payload = {
						event: action.event,
						data: action.value,
					};
				}

				const payloadStr = JSON.stringify(payload);
				wsRef.current.send(payloadStr);
				addLog("send", `Sent action: ${payloadStr}`);
				addMessage("user", action.name);
				return true;
			} catch (error) {
				addLog("error", `Failed to send action: ${error}`);
				return false;
			}
		},
		[addLog, addMessage],
	);

	const sendPostConfirmation = useCallback(
		(data: PostConfirmation, event: string) => {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				addLog("error", "WebSocket is not connected");
				return false;
			}

			try {
				let payload: object = {};

				payload = {
					event: event,
					data: {
						partyId: data.partyId,
						chatId: data.chatId,
						eventType: data.eventType,
						transactionId: data.transactionId,
						transactionStatus: data.transactionStatus,
					},
				};

				const payloadStr = JSON.stringify(payload);
				wsRef.current.send(payloadStr);
				addLog("send", `Sent Post Confirmation: ${payloadStr}`);
				return true;
			} catch (error) {
				addLog("error", `Failed to send action: ${error}`);
				return false;
			}
		},
		[addLog],
	);

	const clearLogs = useCallback(() => {
		setLogs([]);
	}, []);

	const clearMessages = useCallback(() => {
		setMessages([]);
		setChatInfo(null);
	}, []);

	useEffect(() => {
		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
		};
	}, []);

	return {
		isConnected,
		logs,
		messages,
		connect,
		disconnect,
		sendMessage,
		sendAction,
		sendPostConfirmation,
		clearLogs,
		clearMessages,
		chatInfo,
		isTranscribing,
		clearTranscribing: () => {
			setIsTranscribing(false);
		},
	};
};
