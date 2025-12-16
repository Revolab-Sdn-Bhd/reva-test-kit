/* eslint-disable @next/next/no-img-element */
import type { SavingSpaceWidget } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const SavingSpaceWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: SavingSpaceWidget;
	messageId: string;
}) => {
	const { sendAction } = useWebSocketContext();

	const handleItemClick = (payload: { event: string; data: string }) => {
		sendAction(
			{
				event: payload.event,
				data: payload.data,
			},
			messageId,
		);
	};

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.savingSpaceId}-${index}`}
						className="p-3 transition-colors bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-850"
						onClick={() => handleItemClick(item.payload)}
					>
						<div className="flex items-start gap-3">
							{/* Icon */}
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

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-2">
									<div>
										<h4 className="font-medium text-white">{item.title}</h4>
										<p className="text-xs text-gray-400">Type: {item.type}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default SavingSpaceWidgetComponent;
