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
    (sender: "user" | "agent", content: string) => {
      const message: ChatMessage = {
        id: Date.now().toString(),
        sender,
        content,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, message]);
    },
    []
  );

  const connect = useCallback(
    (config: WebSocketConfig) => {
      if (wsRef.current) {
        addLog("error", "WebSocket already connected");
        return;
      }

      // Store config for reconnection
      configRef.current = config;

      let wsUrl = `${config.url}?token=${encodeURIComponent(
        config.token
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
                      content: msgData.message || event.data,
                      timestamp: new Date().toLocaleTimeString(),
                      actions: msgData.actions,
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
                      })
                    );
                  }
                  break;
                case EventType.HISTORYMESSAGE:
                  {
                    const historyMessages = parsed.data.message;
                    if (Array.isArray(historyMessages)) {
                      const formattedMessages: ChatMessage[] =
                        historyMessages.map((msg: any, idx: number) => ({
                          id: `${Date.now()}-${idx}`,
                          sender: msg.type === "from" ? "agent" : "user",
                          content: msg.message,
                          timestamp: new Date(
                            msg.timestamp
                          ).toLocaleTimeString(),
                        }));
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
                default:
                  addLog("error", `Unhandled event type: ${parsed.event}`);
                  break;
              }
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
            }`
          );
          wsRef.current = null;

          clearMessages();
        };

        wsRef.current = ws;
      } catch (error) {
        addLog("error", `Failed to connect: ${error}`);
      }
    },
    [addLog, addMessage]
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

        // Use displayMessage if provided, otherwise extract content from payload
        const messageToDisplay =
          displayMessage ||
          (() => {
            try {
              if (parsed.event === EventType.AUDIO) {
                return null;
              }

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

        if (parsed.event === EventType.AUDIO) {
          setIsTranscribing(true);
        }

        return true;
      } catch (error) {
        addLog("error", `Failed to send message: ${error}`);
        return false;
      }
    },
    [addLog, addMessage]
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
    [addLog]
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
    clearLogs,
    clearMessages,
    chatInfo,
    isTranscribing,
  };
};
