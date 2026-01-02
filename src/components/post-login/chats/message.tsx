import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useRef } from "react";
import { FaMicrophone } from "react-icons/fa";
import {
	type BillPaymentWidget,
	type ButtonWidget,
	type InsufficientConfirmWidget,
	type MessageWidget,
	MessageWidgetType,
	type MultiCurrencyWidget,
	type SavingSpaceWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";
import PreConfirmationCard from "../pre-confirm-card";
import ButtonWidgetComponent from "../widget/button";
import BillPaymentWidgetComponent from "../widget/transact/bill-payment";
import InsufficientConfirmWidgetComponent from "../widget/transact/insufficient-confirm-widget";
import MultiCurrencyWidgetComponent from "../widget/transact/multi-currency";
import SavingSpaceWidgetComponent from "../widget/transact/saving-space";

const ChatMessageSection = () => {
	const { messages, sendAction } = useWebSocketContext();

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const renderWidget = (widget: MessageWidget, messageId: string) => {
		if (
			widget.type === MessageWidgetType.SAVINGSPACEACCOUNTLIST ||
			widget.type === MessageWidgetType.SAVINGSPACEACCOUNT
		) {
			return (
				<SavingSpaceWidgetComponent
					widget={widget as SavingSpaceWidget}
					messageId={messageId}
				/>
			);
		}
		if (
			widget.type === MessageWidgetType.MULTICURRENCYACCOUNTLIST ||
			widget.type === MessageWidgetType.MULTICURRENCYACCOUNT
		) {
			return (
				<MultiCurrencyWidgetComponent
					widget={widget as MultiCurrencyWidget}
					messageId={messageId}
				/>
			);
		}
		if (
			widget.type === MessageWidgetType.BILLERACCOUNTLIST ||
			widget.type === MessageWidgetType.BILLERS
		) {
			return (
				<BillPaymentWidgetComponent
					widget={widget as BillPaymentWidget}
					messageId={messageId}
				/>
			);
		}
		//support confirm widget and insufficient balance widget
		if (
			widget.type === MessageWidgetType.SAVINGSPACENOACCOUNT ||
			widget.type === MessageWidgetType.MULTICURRENCYNOACCOUNT ||
			widget.type === MessageWidgetType.BILLERNOACCOUNT ||
			widget.type === MessageWidgetType.CURRENTACCOUNTINSUFFICIENTBALANCE ||
			widget.type === MessageWidgetType.SAVINGSPACEACCOUNTINSUFFICIENTBALANCE ||
			widget.type ===
				MessageWidgetType.MULTICURRENCYACCOUNTINSUFFICIENTBALANCE ||
			widget.type === MessageWidgetType.CURRENTACCOUNTAVAILABLEBALANCE ||
			widget.type === MessageWidgetType.SAVINGSPACEACCOUNTAVAILABLEBALANCE ||
			widget.type === MessageWidgetType.MULTICURRENCYACCOUNTAVAILABLEBALANCE
		) {
			return (
				<InsufficientConfirmWidgetComponent
					widget={widget as InsufficientConfirmWidget}
				/>
			);
		}
		if (widget.type === MessageWidgetType.BUTTON) {
			return <ButtonWidgetComponent widget={widget as ButtonWidget} />;
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
					const hasWidgets = msg.widgets && msg.widgets.length > 0;

					if (!msg.content && !hasPreConfirmation && !hasWidgets) return null;
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

								{/* info */}
								{msg.info && (
									<div className="flex items-center gap-2 text-sm italic text-gray-300">
										<svg
											className="w-4 h-4"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
												clipRule="evenodd"
											/>
										</svg>
										<span>{msg.info}</span>
									</div>
								)}

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
									<div
										className="message-content"
										// biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized with DOMPurify
										dangerouslySetInnerHTML={{
											__html: DOMPurify.sanitize(marked(msg.content) as string),
										}}
									></div>
								)}

								{/* Widget Section */}
								{msg.widgets && msg.widgets.length > 0 && (
									<div className="mt-3 space-y-2">
										{msg.widgets.map((widget, index) => (
											<div key={`${msg.id}-widget-${index}`}>
												{renderWidget(widget, msg.id)}
											</div>
										))}
									</div>
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
											>
												{action.name}
											</button>
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
