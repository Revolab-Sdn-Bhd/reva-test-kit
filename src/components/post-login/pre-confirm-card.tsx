import { useState } from "react";
import type { Form } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

type ConfirmationCardProps = {
	chatId?: string;
	messageId: string;
	eventType?: string;
	form: Form;
};

const ConfirmationCard = ({
	chatId,
	messageId,
	eventType,
	form,
}: ConfirmationCardProps) => {
	const { sendPostConfirmation, sendAction } = useWebSocketContext();
	const [isSubmitted, setIsSubmitted] = useState(false);

	const isPostConfirm = !eventType;

	const statusButton = form.buttons?.find(
		(btn) => btn.type === "SUCCESS" || btn.type === "FAILED",
	);
	const cancelButton = form.buttons?.find((btn) => btn.type === "CANCEL");
	const actionButtons = form.buttons?.filter((btn) => btn.type === "PAYLOAD");

	const isSuccess = statusButton?.type === "SUCCESS";

	const handleButtonClick = (button: Form["buttons"][0]) => {
		if (button.type === "PAYLOAD" && chatId && eventType) {
			sendPostConfirmation(
				{
					partyId: "222222",
					chatId: chatId,
					eventType,
					transactionId: "11111",
					transactionStatus: "SUCCESS",
				},
				"POST_CONFIRMATION",
			);
			setIsSubmitted(true);
		} else if (button.type === "CANCEL") {
			sendAction(
				{ event: "CANCEL_TRANSACTION", data: button.label },
				messageId,
			);
		}
	};

	return (
		<div
			className={`p-4 mt-3 rounded-lg relative ${isPostConfirm ? "bg-gray-800 border border-gray-700 shadow-lg" : "bg-gray-800"}`}
		>
			{/* ================= HEADER ================= */}
			{!isPostConfirm ? (
				<div className="flex justify-between items-start mb-4">
					{isSubmitted ? (
						<div className="w-full text-center">
							<div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-green-500/20">
								<svg
									className="w-6 h-6 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-white">
								Processing...
							</h3>
						</div>
					) : (
						<>
							<h3 className="text-lg font-semibold text-white">{form.title}</h3>
							{cancelButton && (
								<button
									type="button"
									onClick={() => handleButtonClick(cancelButton)}
									className="text-gray-400 hover:text-white transition-colors"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							)}
						</>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center mb-6 mt-2 text-center">
					<div
						className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full ${isSuccess ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
					>
						{isSuccess ? (
							<svg
								className="w-8 h-8"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						) : (
							<svg
								className="w-8 h-8"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={3}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						)}
					</div>
					<h3 className="text-xl font-bold text-white">{form.title}</h3>
				</div>
			)}

			{/* ================= FORM BODY ================= */}
			<div className="space-y-3 mb-4">
				{form.fields?.map((field, index) => (
					<div
						key={`${messageId}-${field.label}-${index}`}
						className="flex justify-between items-center p-3 bg-gray-900 rounded-lg gap-6"
					>
						<span className="text-sm text-gray-400">{field.label}</span>
						<span className="text-sm font-medium text-white text-right break-words">
							{field.value}
						</span>
					</div>
				))}
			</div>

			{/* ================= FOOTER ================= */}
			{!isPostConfirm &&
				!isSubmitted &&
				actionButtons &&
				actionButtons.length > 0 && (
					<div className="flex gap-3">
						{actionButtons.map((button) => (
							<button
								key={button.id}
								type="button"
								onClick={() => handleButtonClick(button)}
								className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
							>
								{button.label}
							</button>
						))}
					</div>
				)}
		</div>
	);
};

export default ConfirmationCard;
