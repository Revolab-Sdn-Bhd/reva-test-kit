import { useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useEnvConfig } from "@/hooks/useEnvConfig";
import {
  type ChatHistory,
  type ChatSession,
  generateIntrospectToken,
  getChatHistory,
  getPaginatedChatSessions,
} from "@/lib/api/post-login";
import { useWebSocketContext } from "@/lib/WebSocketProvider";
import {
  BarVisualizer,
  useConnectionState,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useConnection } from "@/hooks/useConnection";
import { LoadingSVG } from "@/components/button/LoadingSVG";

type TabType = "chat" | "history" | "voiceCall";

interface ChatScreenProps {
  token: string;
}

const ChatScreen = ({ token }: ChatScreenProps) => {
  const {
    isConnected,
    chatInfo,
    messages,
    clearMessages,
    sendAction,
    sendMessage,
  } = useWebSocketContext();
  const { envConfig } = useEnvConfig();

  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const [introspectToken, setIntrospectToken] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice call functionality
  const { connect: connectVoiceCall, disconnect: disconnectVoiceCall } =
    useConnection();
  const voiceAssistant = useVoiceAssistant();
  const roomState = useConnectionState();

  const isDevelopment = process.env.NODE_ENV === "development";
  const protocol = isDevelopment ? "http://" : "https://";
  const host = isDevelopment ? "localhost:3000" : envConfig?.CHAT_SERVICE_URL;
  const chatUrl = `${protocol}${host}`;

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const payload = {
      event: "MESSAGE",
      data: inputMessage,
    };

    if (sendMessage(JSON.stringify(payload), inputMessage)) {
      setInputMessage("");
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check your permissions.");
    }
  };

  const handleStopRecording = async () => {
    try {
      const base64Audio = await stopRecording();

      // Send audio via WebSocket
      const payload = {
        event: "AUDIO",
        data: base64Audio,
      };

      sendMessage(JSON.stringify(payload), "🎤 Audio message");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      alert("Failed to process audio recording.");
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
        `Error loading sessions: ${err instanceof Error ? err.message : String(err)}`
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
        sessionId
      );
      if (response.code === 200) {
        setChatHistory(response.data);
      } else {
        setError(`Failed to load history: ${response.message}`);
      }
    } catch (err) {
      setError(
        `Error loading history: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (envConfig?.CHAT_SERVICE_URL) {
      handleLoadSessions();
    }
  }, [token, envConfig?.CHAT_SERVICE_URL]);

  return (
    <div className="flex flex-col w-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow">
      {/* Header with Tabs */}
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
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "chat" ?
                "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Current Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "history" ?
                "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-300"
            }`}
          >
            History
          </button>
        </div>
      </div>
      {/* Tab Content */}
      {activeTab === "voiceCall" ?
        /* Voice Call Tab */
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <div className="w-full max-w-md">
            <div className="p-8 space-y-6 text-center bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-white">Voice Call</h3>

              {roomState === ConnectionState.Disconnected && (
                <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p>No agent audio track. Connecting...</p>
                </div>
              )}

              {roomState === ConnectionState.Connecting && (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <LoadingSVG />
                  <p>Connecting to voice assistant...</p>
                </div>
              )}

              {roomState === ConnectionState.Connected &&
                !voiceAssistant.audioTrack && (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <LoadingSVG />
                    <p>Waiting for agent audio track...</p>
                  </div>
                )}

              {roomState === ConnectionState.Connected &&
                voiceAssistant.audioTrack && (
                  <div className="flex items-center justify-center w-full h-48 [--lk-va-bar-width:30px] [--lk-va-bar-gap:20px] [--lk-fg:#10b981]">
                    <BarVisualizer
                      state={voiceAssistant.state}
                      trackRef={voiceAssistant.audioTrack}
                      barCount={5}
                      options={{ minHeight: 20 }}
                    />
                  </div>
                )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    disconnectVoiceCall();
                    setActiveTab("chat");
                  }}
                  className="flex-1 px-4 py-2 font-medium text-white bg-red-600 rounded hover:bg-red-700"
                >
                  End Call
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="flex-1 px-4 py-2 font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Back to Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      : activeTab === "chat" ?
        <>
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
                        msg.sender === "user" ?
                          "text-blue-100"
                        : "text-gray-400"
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
            {isRecording ?
              <div className="flex items-center gap-3">
                <div className="flex items-center flex-1 gap-3 px-4 py-3 border border-red-700 rounded bg-red-900/30">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-mono text-white">
                    Recording: {formatRecordingTime(recordingTime)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="px-4 py-2 font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
                  title="Cancel recording"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-4 py-2 font-medium text-white bg-red-600 rounded hover:bg-red-700"
                  title="Stop and send recording"
                >
                  Stop & Send
                </button>
              </div>
            : <div className="flex gap-2">
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
                    isConnected ? "Type a message..." : (
                      "Connect to start chatting"
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("voiceCall");
                    connectVoiceCall("en");
                  }}
                  disabled={!isConnected}
                  className="px-4 py-2 font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                  title="Start voice call"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!isConnected}
                  className="px-4 py-2 font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                  title="Record audio message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                  className="px-6 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            }
          </div>
        </>
      : /* History Tab */
        <div className="flex flex-1 min-h-0">
          {/* Left: Sessions List */}
          <div className="flex flex-col w-1/3 border-r border-gray-700">
            <div className="flex-1 overflow-y-auto">
              {chatSessions.length === 0 ?
                <div className="p-4 text-sm text-center text-gray-400">
                  {isLoadingSessions ?
                    "Loading sessions..."
                  : "No sessions loaded. Enter token and click Load Sessions."}
                </div>
              : <div className="p-2 space-y-1">
                  {chatSessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleLoadChatHistory(session.sessionId)}
                      className={`w-full text-left p-3 rounded transition-colors ${
                        selectedSessionId === session.sessionId ?
                          "bg-blue-600 text-white"
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
              }
            </div>
          </div>

          {/* Right: Chat History */}
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-white">
                {selectedSessionId ?
                  "Chat History"
                : "Select a session to view history"}
              </h3>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {isLoadingHistory ?
                <div className="py-8 text-sm text-center text-gray-400">
                  Loading history...
                </div>
              : chatHistory.length === 0 ?
                <div className="py-8 text-sm text-center text-gray-400">
                  {selectedSessionId ?
                    "No messages in this session."
                  : "Select a session from the left to view its chat history."}
                </div>
              : chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "to" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "to" ?
                          "bg-blue-600 text-white"
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
                            msg.role === "to" ?
                              "text-blue-100"
                            : "text-gray-400"
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
                ))
              }
            </div>
          </div>
        </div>
      }
    </div>
  );
};

export default ChatScreen;
