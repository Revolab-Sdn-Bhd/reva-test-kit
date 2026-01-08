import type { TransactionOptionWidget } from "@/lib/useWebSocket";
import { EventType } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const TransactionOptionWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: TransactionOptionWidget;
	messageId: string;
}) => {
	const { sendAction, sendMessage } = useWebSocketContext();

	const handleItemClick = (payload: { event: string; data: string }) => {
		if (payload.event === EventType.SELECT_CONTACT) {
			sendAction(
				{ event: payload.event, data: "AHMED ABU QUWAIS:+962 79 123 4567" },
				messageId,
			);
		}

		if (
			payload.event === EventType.SELECT_TRANSFER_OPTION ||
			payload.event === EventType.SELECT_ONE_TIME_TRANSFER ||
			payload.event === EventType.SELECT_REQUEST_OPTION ||
			payload.event === EventType.SELECT_ONE_TIME_REQUEST
		) {
			sendMessage(
				JSON.stringify({
					event: payload.event,
					data: payload.data,
				}),
				payload.data,
			);
		}

		sendAction({ event: payload.event, data: payload.data }, messageId);
	};

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.title}-${index}`}
						className="cursor-pointer bg-gray-900 p-3"
						onClick={() => handleItemClick(item.payload)}
					>
						<div className="flex items-start gap-3">
							{item.icon && (
								<img
									src={item.icon}
									alt={item.title}
									className="object-cover w-12 h-12 rounded-lg"
									onError={(e) => {
										e.currentTarget.style.display = "none";
									}}
								/>
							)}
							{item.type === "CONTACTLIST" && (
								<div className="text-sm bg-gray-500">
									Contact is hardcoded: AHMED ABU QUWAIS:+962 79 123 4567
								</div>
							)}
							<div className="flex-1 min-w-0">
								<h4 className="font-medium text-white">{item.title}</h4>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TransactionOptionWidgetComponent;
