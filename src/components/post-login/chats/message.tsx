import { useEffect, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import type {
	MessageWidget,
	MultiCurrencyWidget,
	SavingSpaceWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";
import PreConfirmationCard from "../pre-confirm-card";
import MultiCurrencyWidgetComponent from "../widget/multi-currency";
import SavingSpaceWidgetComponent from "../widget/saving-space";

const ChatMessageSection = () => {
	const { messages, sendAction } = useWebSocketContext();

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const renderWidget = (widget: MessageWidget, messageId: string) => {
		if (widget.type === "savingspace") {
			return (
				<SavingSpaceWidgetComponent
					widget={widget as SavingSpaceWidget}
					messageId={messageId}
				/>
			);
		}
		if (widget.type === "multicurrency") {
			return (
				<MultiCurrencyWidgetComponent
					widget={widget as MultiCurrencyWidget}
					messageId={messageId}
				/>
			);
		}
		return null;
	};

	return (
		<div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
			{messages.length === 0 ? (
				<div className="py-8 text-center text-gray-400">
					No messages yet. Send a message to start the conversation.
				</div>
			) : (
				messages.map((msg) => {
					const hasPreConfirmation = msg.eventType && msg.form && msg.payload;
					if (!msg.content && !hasPreConfirmation) return null;
					return (
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
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-3">
											<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#c59100]">
												<FaMicrophone />
											</div>
											<div className="flex flex-col flex-1">
												<span className="text-sm font-medium">
													Voice Message
												</span>
												{msg.content && (
													<span className="text-sm opacity-90">
														{msg.content}
													</span>
												)}
											</div>
										</div>
										{msg.audioUrl && (
											<audio controls className="w-full" src={msg.audioUrl}>
												<track kind="captions" />
											</audio>
										)}
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

								{/* Widget Section */}
								{msg.widgets && msg.widgets.length > 0 && (
									<div className="flex flex-col gap-3 mt-3">
										{msg.widgets.map((widget, index) => (
											<div key={`${msg.id}-widget-${index}`}>
												{renderWidget(widget, msg.id)}
											</div>
										))}
									</div>
								)}

								{/* Pre Confirm Section */}
								{msg.eventType && msg.form && msg.payload && (
									<PreConfirmationCard
										messageId={msg.id}
										eventType={msg.eventType}
										form={msg.form}
									/>
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
					);
				})
			)}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default ChatMessageSection;
