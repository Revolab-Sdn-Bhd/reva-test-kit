import { useState } from "react";
import type { Form } from "@/lib/useWebSocket";

import { useWebSocketContext } from "@/lib/WebSocketProvider";

type PreConfirmationProps = {
	chatId: string;
	messageId: string;
	eventType: string;
	form: Form;
};

const PreConfirmationCard = ({
	chatId,
	messageId,
	eventType,
	form,
}: PreConfirmationProps) => {
	const { sendPostConfirmation, sendAction } = useWebSocketContext();
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleButtonClick = (button: Form["buttons"][0]) => {
		if (button.type === "PAYLOAD") {
			// Handle confirm/transfer button
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

	// Separate cancel button from other buttons
	const cancelButton = form.buttons.find((btn) => btn.type === "CANCEL");
	const actionButtons = form.buttons.filter((btn) => btn.type !== "CANCEL");

	return (
		<div className="p-4 mt-3 bg-gray-800 rounded-lg relative">
			<div className="flex justify-between items-start mb-4">
				{/* Success State */}
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
							Transaction Success
						</h3>
					</div>
				) : (
					<>
						<h3 className="text-lg font-semibold text-white">{form.title}</h3>

						{/* Close/Cancel Button */}
						{cancelButton && (
							<button
								type="button"
								onClick={() => handleButtonClick(cancelButton)}
								className="text-gray-400 hover:text-white transition-colors"
								aria-label="Cancel"
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

			{/* Form Fields */}
			<div className="space-y-3 mb-4">
				{form.fields.map((field) => (
					<div
						key={`${messageId}-${field.label}`}
						className="flex justify-between items-center p-3 bg-gray-900 rounded-lg gap-6"
					>
						<span className="text-sm text-gray-400">{field.label}</span>
						<span className="text-sm font-medium text-white">
							{field.value}
						</span>
					</div>
				))}
			</div>

			{/* Action Buttons - Hidden when submitted */}
			{!isSubmitted && (
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

export default PreConfirmationCard;
