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
				value: payload.data,
				name: payload.data,
				description: "",
			},
			messageId,
		);
	};

	const handleButtonClick = (payload: { event: string; data: string }) => {
		sendAction(
			{
				event: payload.event,
				value: payload.data,
				name: payload.data,
				description: "",
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
									<div className="text-right">
										<div className="font-semibold text-white">
											{item.availableBalance.currency}{" "}
											{item.availableBalance.amount.toFixed(2)}
										</div>
									</div>
								</div>

								{/* Buttons */}
								{item.buttons && item.buttons.length > 0 && (
									<div className="flex gap-2 mt-3">
										{item.buttons.map((button, btnIndex) => (
											<button
												key={`${item.savingSpaceId}-btn-${btnIndex}`}
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleButtonClick(button.payload);
												}}
												className="px-3 py-1 text-xs font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
											>
												{button.title}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default SavingSpaceWidgetComponent;
