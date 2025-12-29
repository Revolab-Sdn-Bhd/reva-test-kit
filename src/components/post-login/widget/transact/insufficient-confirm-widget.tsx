import type {
	InsufficientConfirmButton,
	InsufficientConfirmWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const InsufficientConfirmWidgetComponent = ({
	widget,
}: {
	widget: InsufficientConfirmWidget;
}) => {
	const { sendMessage } = useWebSocketContext();

	const handleButtonClick = (button: InsufficientConfirmButton) => {
		// Handle payload if exists
		if ("payload" in button && button.payload) {
			sendMessage(
				JSON.stringify({
					event: button.payload.event,
					data: button.payload.data,
				}),
				button.payload.data,
			);
		}

		// Handle navigationId if exists
		if ("navigationId" in button && button.navigationId) {
			console.log("Navigate to:", button.navigationId);
		}
	};

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
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
