import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const ChatScreen = () => {
	const {
		isConnected,
		chatInfo,
		messages,
		clearMessages,
		sendAction,
		sendMessage,
	} = useWebSocketContext();

	console.log("@test", isConnected);

	const [inputMessage, setInputMessage] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
		<div className="flex flex-col w-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow">
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
				<div className="flex flex-col">
					<h2 className="text-xl font-bold text-white">Chat Window</h2>
					{chatInfo && (
						<div className="text-sm text-gray-400">
							<div>Chat ID: {chatInfo.chatId}</div>
							<div>Session ID: {chatInfo.sessionId}</div>
						</div>
					)}
				</div>
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
				{messages.length === 0 ? (
					<div className="py-8 text-center text-gray-400">
						No messages yet. Send a message to start the conversation.
					</div>
				) : (
					messages.map((msg) => (
						<div
							key={msg.id}
							className={`flex ${
								msg.sender === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[70%] rounded-lg p-3 ${
									msg.sender === "user"
										? "bg-blue-600 text-white"
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
				)}
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
	);
};

export default ChatScreen;
