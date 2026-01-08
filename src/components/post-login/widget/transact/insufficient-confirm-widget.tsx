import { useState } from "react";
import type {
	InsufficientConfirmButton,
	InsufficientConfirmWidget,
} from "@/lib/useWebSocket";
import { EventType } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const InsufficientConfirmWidgetComponent = ({
	widget,
}: {
	widget: InsufficientConfirmWidget;
}) => {
	const { sendMessage } = useWebSocketContext();
	const [showBankSelector, setShowBankSelector] = useState(false);
	const [selectedBank, setSelectedBank] = useState<string | null>(null);

	const handleButtonClick = (button: InsufficientConfirmButton) => {
		if ("payload" in button && button.payload) {
			sendMessage(
				JSON.stringify({
					event: button.payload.event,
					data: button.payload.data,
				}),
				button.payload.data,
			);
		}

		if ("navigationId" in button && button.navigationId) {
			console.log("Navigate to:", button.navigationId);
		}
	};

	const handlePlaceholderClick = (placeholder: any) => {
		if (placeholder.action?.type === "OPEN_WIDGET") {
			setShowBankSelector(true);
		}
	};

	const handleBankSelect = (bank: string) => {
		setSelectedBank(bank);
		setShowBankSelector(false);

		sendMessage(
			JSON.stringify({
				event: EventType.SELECT_BANK,
				data: bank,
			}),
			bank,
		);
	};

	const renderText = () => {
		if (!widget.placeholders || widget.placeholders.length === 0) {
			return <div className="mb-4 text-base text-white">{widget.text}</div>;
		}

		const textParts = widget.text;
		const elements: React.ReactNode[] = [];
		let lastIndex = 0;

		widget.placeholders.forEach((placeholder, index) => {
			const placeholderPattern = `{${placeholder.id}}`;
			const placeholderIndex = textParts.indexOf(placeholderPattern, lastIndex);

			if (placeholderIndex !== -1) {
				if (placeholderIndex > lastIndex) {
					elements.push(
						<span key={`${placeholder.id}-${index}`}>
							{textParts.substring(lastIndex, placeholderIndex)}
						</span>,
					);
				}

				elements.push(
					<button
						key={`${placeholder.id}-${index}`}
						onClick={() => handlePlaceholderClick(placeholder)}
						className="font-semibold underline hover:opacity-80 transition-opacity"
					>
						{placeholder.label}
					</button>,
				);

				lastIndex = placeholderIndex + placeholderPattern.length;
			}
		});

		if (lastIndex < textParts.length) {
			elements.push(
				<span key="text-end">{textParts.substring(lastIndex)}</span>,
			);
		}

		return (
			<div className="mb-6 text-base text-white leading-relaxed">
				{elements}
			</div>
		);
	};

	const banks = [
		"Arab Bank",
		"Cairo Amman Bank",
		"Jordan Kuwait Bank",
		"Housing Bank",
	];

	return (
		<>
			<div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl">
				{renderText()}

				{selectedBank && (
					<div className="mb-4 p-3 bg-gray-700/50 rounded-lg text-sm text-white">
						Selected Bank: <span className="font-semibold">{selectedBank}</span>
					</div>
				)}

				<div className="flex flex-wrap gap-2">
					{widget.buttons.map((button) => (
						<button
							key={button.id}
							onClick={() => handleButtonClick(button)}
							className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800"
						>
							{button.label}
						</button>
					))}
				</div>
			</div>

			{/* Bank Selector Drawer */}
			{showBankSelector && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
					onClick={() => setShowBankSelector(false)}
				>
					<div
						className="w-full bg-gray-800 rounded-t-2xl p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-white text-xl font-semibold">Select Bank</h3>
							<button
								onClick={() => setShowBankSelector(false)}
								className="text-gray-400 hover:text-white"
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
						</div>
						<div className="space-y-3">
							{banks.map((bank) => (
								<button
									key={bank}
									onClick={() => handleBankSelect(bank)}
									className="w-full p-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors text-left font-medium"
								>
									{bank}
								</button>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default InsufficientConfirmWidgetComponent;
