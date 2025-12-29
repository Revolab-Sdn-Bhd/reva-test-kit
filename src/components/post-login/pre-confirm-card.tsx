import type { Form } from "@/lib/useWebSocket";

import { useWebSocketContext } from "@/lib/WebSocketProvider";

type PreConfirmationProps = {
	messageId: string;
	eventType: string;
	form: Form;
};

const PreConfirmationCard = ({
	messageId,
	eventType,
	form,
}: PreConfirmationProps) => {
	const { sendPostConfirmation } = useWebSocketContext();

	const handleConfirm = () => {
		sendPostConfirmation(
			{
				partyId: "XXXXX",
				chatId: "XXXX",
				eventType,
				transactionId: "XXXX",
				transactionStatus: "SUCCESS",
			},
			"POST_CONFIRMATION",
		);
	};

	return (
		<div className="p-4 mt-3 bg-gray-800 rounded-lg">
			{/* Title */}
			<h3 className="mb-4 text-lg font-semibold text-white">{form.title}</h3>

			{/* Form Fields */}
			<div className="space-y-3 mb-4">
				{form.fields.map((field) => (
					<div
						key={`${messageId}-${field.label}`}
						className="flex justify-between items-center p-3 bg-gray-900 rounded-lg gap-1"
					>
						<span className="text-sm text-gray-400">{field.label}</span>
						<span className="text-sm font-medium text-white">
							{field.value}
						</span>
					</div>
				))}
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3">
				{form.buttons.map((button) => (
					<button
						key={button.id}
						type="button"
						onClick={handleConfirm}
						className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
					>
						{button.label}
					</button>
				))}
			</div>
		</div>
	);
};

export default PreConfirmationCard;
