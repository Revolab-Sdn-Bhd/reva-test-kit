import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { type LogEntry, useWebSocket } from "@/lib/useWebSocket";

export default function PostLoginPage() {
  const [platform, setPlatform] = useState<"web" | "mobile">("web");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [token, setToken] = useState("reflect123");
  const [inputMessage, setInputMessage] = useState("");
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    logs,
    messages,
    connect,
    disconnect,
    sendMessage,
    sendAction,
    clearLogs,
    clearMessages,
  } = useWebSocket();

  const handleConnect = () => {
    const isDevelopment = process.env.NODE_ENV === "development";
    const wsProtocol = isDevelopment ? "ws://" : "wss://";
    const wsHost = process.env.CHAT_SERVICE_URL || "";
    const wsUrl = `${wsProtocol}${wsHost}/ws/chat`;

    connect({
      url: wsUrl,
      token,
      language,
      platform,
    });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // TODO: handle different message types
    const payload = {
      event: "MESSAGE",
      data: inputMessage,
    };

    if (sendMessage(JSON.stringify(payload), inputMessage)) {
      setInputMessage("");
    }
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "send":
        return "text-blue-400";
      case "receive":
        return "text-green-400";
      default:
        return "text-gray-400";
    }
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
              <div>
                <div className="block mb-2 text-sm font-medium text-gray-300">
                  Platform
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPlatform("web")}
                    disabled={isConnected}
                    className={`px-4 py-2 rounded ${
                      platform === "web" ?
                        "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Web
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatform("mobile")}
                    disabled={isConnected}
                    className={`px-4 py-2 rounded ${
                      platform === "mobile" ?
                        "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div>
                <div className="block mb-2 text-sm font-medium text-gray-300">
                  Language
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    disabled={isConnected}
                    className={`px-4 py-2 rounded ${
                      language === "en" ?
                        "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("ar")}
                    disabled={isConnected}
                    className={`px-4 py-2 rounded ${
                      language === "ar" ?
                        "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Arabic
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="token-input"
                  className="block mb-2 text-sm font-medium text-gray-300"
                >
                  Token
                </label>
                <input
                  id="token-input"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isConnected}
                  className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
                  placeholder="Enter token"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={isConnected ? handleDisconnect : handleConnect}
                  className={`flex-1 px-4 py-2 rounded font-medium ${
                    isConnected ?
                      "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isConnected ? "Disconnect" : "Start Connection"}
                </button>
              </div>

              <div className="font-mono text-sm text-gray-400 break-all">
                {(() => {
                  const isDevelopment = process.env.NODE_ENV === "development";
                  const wsProtocol = isDevelopment ? "ws://" : "wss://";
                  let wsHost = "localhost:3000";
                  if (!isDevelopment && typeof globalThis !== "undefined") {
                    wsHost = globalThis.location?.host || "";
                  }
                  return `${wsProtocol}${wsHost}/ws/chat?token=${token}&language=${language}&platform=${platform}`;
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="flex flex-col flex-1 min-h-0 p-6 bg-gray-800 border border-gray-700 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">WebSocket Logs</h2>
            <button
              type="button"
              onClick={clearLogs}
              className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 p-3 space-y-1 overflow-y-auto font-mono text-sm bg-gray-900 rounded">
            {logs.length === 0 ?
              <div className="py-4 text-center text-gray-500">
                No logs yet. Start a connection to see logs.
              </div>
            : logs.map((log) => (
                <div key={log.id} className={getLogColor(log.type)}>
                  <span className="text-gray-500">[{log.timestamp}]</span>{" "}
                  <span className="font-semibold">
                    [{log.type.toUpperCase()}]
                  </span>{" "}
                  {log.message}
                </div>
              ))
            }
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex flex-col w-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Chat Window</h2>
          <button
            type="button"
            onClick={clearMessages}
            className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>{" "}
        {/* Messages */}
        <div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
          {messages.length === 0 ?
            <div className="py-8 text-center text-gray-400">
              No messages yet. Send a message to start the conversation.
            </div>
          : messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === "user" ?
                      "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <div className="mb-1 text-sm font-medium">
                    {msg.sender === "user" ? "You" : "Agent"}
                  </div>
                  <div>{msg.content}</div>

                  {/* Extra message */}
                  {msg.extraMsg && (
                    <div className="mt-2 text-sm italic text-gray-300">
                      {msg.extraMsg}
                    </div>
                  )}

                  {/* Action chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.actions.map((action) => (
                        <button
                          key={`${msg.id}-${action.event}-${action.value}`}
                          type="button"
                          onClick={() => sendAction(action, msg.id)}
                          className="px-3 py-1 text-xs font-medium text-gray-900 transition-colors bg-gray-200 rounded-full hover:bg-gray-300"
                          title={action.description}
                        >
                          {action.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-xs mt-1 ${
                      msg.sender === "user" ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))
          }
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!isConnected}
              className="flex-1 px-4 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
              placeholder={
                isConnected ? "Type a message..." : "Connect to start chatting"
              }
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!isConnected || !inputMessage.trim()}
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

PostLoginPage.getLayout = (page: React.ReactNode) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};
