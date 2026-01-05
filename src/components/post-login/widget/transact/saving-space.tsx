import type {
	SavingSpaceAccountItem,
	SavingSpaceAccountWidget,
	SavingSpaceItem,
	SavingSpaceListWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const SavingSpaceWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: SavingSpaceListWidget | SavingSpaceAccountWidget;
	messageId: string;
}) => {
	const { sendAction, sendMessage } = useWebSocketContext();

	const isSavingSpaceItem = (
		item: SavingSpaceItem | SavingSpaceAccountItem,
	): item is SavingSpaceItem => {
		return "payload" in item;
	};

	const isAccountWidget = (w: typeof widget): w is SavingSpaceAccountWidget => {
		return w.items.some((item) => "buttons" in item);
	};

	const handleItemClick = (payload: { event: string; data: string }) => {
		if (messageId) {
			sendAction({ event: payload.event, data: payload.data }, messageId);
		}
	};

	const handleButtonClick = (payload: { event: string; data: string }) => {
		sendMessage(
			JSON.stringify({
				event: payload.event,
				data: payload.data,
			}),
			payload.data,
		);
	};

	const showAsAccount = isAccountWidget(widget);

	// Calculate progress percentage
	const calculateProgress = (saved: number, goal: number) => {
		return Math.min((saved / goal) * 100, 100);
	};

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.savingSpaceId}-${index}`}
						className={`rounded-2xl ${
							showAsAccount
								? "bg-gray-900 p-4"
								: "cursor-pointer bg-gray-900 p-3"
						}`}
						onClick={
							!showAsAccount && isSavingSpaceItem(item)
								? () => handleItemClick(item.payload)
								: undefined
						}
					>
						{showAsAccount && "savedAmount" in item ? (
							<>
								{/* Header with Title and Add Money Button */}
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-3">
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
										<h4 className="font-semibold text-white text-lg">
											{item.title}
										</h4>
									</div>
									{item.buttons && item.buttons.length > 0 && (
										<button
											onClick={() => handleButtonClick(item.buttons[0].payload)}
											className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-700 transition-colors"
										>
											{item.buttons[0].label}
										</button>
									)}
								</div>

								{/* Saved Amount */}
								<div className="mb-3">
									<p className="text-base text-white font-medium mb-2">
										Saved Amount: {item.savedAmount.amount.toLocaleString()}{" "}
										{item.savedAmount.currency}
									</p>

									{/* Progress Bar */}
									<div className="relative w-full h-2 bg-gray-600 rounded-full overflow-hidden">
										<div
											className="absolute top-0 left-0 h-full bg-cyan-400 transition-all duration-300"
											style={{
												width: `${calculateProgress(
													item.savedAmount.amount,
													item.goal.amount,
												)}%`,
											}}
										/>
									</div>
								</div>

								{/* Goal */}
								<div className="flex justify-between items-center mb-4">
									<span className="text-sm text-gray-300">Goal</span>
									<span className="text-base text-white font-medium">
										{item.goal.amount.toLocaleString()} {item.goal.currency}
									</span>
								</div>

								{/* Additional Buttons */}
								{item.buttons && item.buttons.length > 0 && (
									<button
										key={item.buttons[1].id}
										onClick={() => handleButtonClick(item.buttons[1].payload)}
										className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
									>
										{item.buttons[1].label}
									</button>
								)}
							</>
						) : (
							<>
								{/* List View */}
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
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-white">{item.title}</h4>
										<p className="text-xs text-gray-400">Type: {item.type}</p>
									</div>
								</div>
							</>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default SavingSpaceWidgetComponent;
