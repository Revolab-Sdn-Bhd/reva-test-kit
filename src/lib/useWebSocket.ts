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

export type ChatMessage = {
	id: string;
	sender: "user" | "agent";
	content: string;
	timestamp: string;
	actions?: MessageAction[];
	extraMsg?: string;
};

type WebSocketConfig = {
	url: string;
	token: string;
	language: string;
	platform: string;
};

export const useWebSocket = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const wsRef = useRef<WebSocket | null>(null);

	const addLog = useCallback((type: LogEntry["type"], message: string) => {
		const timestamp = new Date().toLocaleTimeString();
		const id = `${Date.now()}-${Math.random()}`;
		setLogs((prev) => [...prev, { timestamp, type, message, id }]);
	}, []);

	const addMessage = useCallback(
		(sender: "user" | "agent", content: string) => {
			const message: ChatMessage = {
				id: Date.now().toString(),
				sender,
				content,
				timestamp: new Date().toLocaleTimeString(),
			};
			setMessages((prev) => [...prev, message]);
		},
		[],
	);

	const connect = useCallback(
		(config: WebSocketConfig) => {
			if (wsRef.current) {
				addLog("error", "WebSocket already connected");
				return;
			}

			const wsUrl = `${config.url}?token=${encodeURIComponent(
				config.token,
			)}&language=${config.language}&platform=${config.platform}`;

			addLog("info", `Connecting to ${wsUrl}`);

			try {
				const ws = new WebSocket(wsUrl);

				ws.onopen = () => {
					setIsConnected(true);
					addLog("info", "WebSocket connected successfully");
				};

				ws.onmessage = (event) => {
					addLog("receive", `Received: ${event.data}`);
					try {
						const parsed = JSON.parse(event.data);
						// Handle new message format with event and data
						if (parsed.event === "MESSAGE" && parsed.data) {
							if (parsed.data.type === "to") {
								// skip
								return;
							}

							const msgData = parsed.data;
							const message: ChatMessage = {
								id: msgData.messageId || Date.now().toString(),
								sender: "agent",
								content: msgData.message || event.data,
								timestamp: new Date().toLocaleTimeString(),
								actions: msgData.actions,
								extraMsg: msgData.extra_msg,
							};
							setMessages((prev) => [...prev, message]);
						}
					} catch {
						addMessage("agent", event.data);
					}
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
				addLog("send", `Sent: ${payload}`);
				// Use displayMessage if provided, otherwise extract content from payload
				const messageToDisplay =
					displayMessage ||
					(() => {
						try {
							const parsed = JSON.parse(payload);
							// Handle new format: { event: "...", data: "..." or { message: "..." } }
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
				addMessage("user", messageToDisplay);
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
		clearLogs,
		clearMessages,
	};
};
