import { useState } from "react";
import type {
	InsufficientConfirmButton,
	InsufficientConfirmWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const InsufficientConfirmWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: InsufficientConfirmWidget;
	messageId: string;
}) => {
	const { sendMessage, sendAction } = useWebSocketContext();
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

	const handleLinkClick = (url: string, linkText: string) => {
		if (url.startsWith("action:selectbank")) {
			const bank = "Arab Bank";
			setSelectedBank(bank);

			if (messageId) {
				sendAction(
					{
						event: "SELECT_BANK",
						data: bank,
					},
					messageId,
				);
			}
		}
	};

	const renderText = () => {
		let text = widget.text;

		// If bank is selected, replace the entire phrase
		if (selectedBank) {
			text = text.replace(
				/\. Please \[([^\]]+)\]\(([^)]+)\), or simply confirm to proceed without a selection/,
				` at ${selectedBank}`,
			);
			return (
				<div className="mb-6 text-base text-white leading-relaxed">{text}</div>
			);
		}

		// Split text by markdown links and create elements
		const parts = text.split(/(\[[^\]]+\]\([^)]+\))/);
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;

		const elements = parts.map((part) => {
			const match = part.match(linkRegex);

			if (match) {
				const linkText = match[1];
				const url = match[2];
				return (
					<button
						key={`link-${url}-${linkText}`}
						onClick={() => handleLinkClick(url, linkText)}
						className="font-semibold underline hover:opacity-80 transition-opacity"
					>
						{linkText}
					</button>
				);
			}

			return part ? (
				<span key={`text-${part.substring(0, 20)}`}>{part}</span>
			) : null;
		});

		return (
			<div className="mb-6 text-base text-white leading-relaxed">
				{elements}
			</div>
		);
	};

	return (
		<div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl">
			{renderText()}

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
	);
};

export default InsufficientConfirmWidgetComponent;
