import { useEffect, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const ChatMessageSection = () => {
	const { messages, sendAction } = useWebSocketContext();

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
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

							{/* Audio message */}
							{msg.type === "audio" ? (
								<div className="flex items-center gap-3 pb-1">
									<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#c59100]">
										<FaMicrophone />
									</div>
									<div className="flex flex-col">
										<span className="text-sm font-medium">Voice Message</span>
										{msg.content && (
											<span className="text-xs opacity-80">{msg.content}</span>
										)}
									</div>
								</div>
							) : (
								<div>{msg.content}</div>
							)}

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
	);
};

export default ChatMessageSection;
