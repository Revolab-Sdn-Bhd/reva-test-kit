import type {
	MultiCurrencyAccountItem,
	MultiCurrencyAccountWidget,
	MultiCurrencyItem,
	MultiCurrencyListWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const MultiCurrencyWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: MultiCurrencyListWidget | MultiCurrencyAccountWidget;
	messageId: string;
}) => {
	const { sendAction, sendMessage } = useWebSocketContext();

	const isMultiCurrencyItem = (
		item: MultiCurrencyItem | MultiCurrencyAccountItem,
	): item is MultiCurrencyItem => {
		return "payload" in item;
	};

	const isAccountWidget = (
		w: typeof widget,
	): w is MultiCurrencyAccountWidget => {
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

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.accountNumber}-${index}`}
						className={`rounded-2xl ${
							showAsAccount
								? "border border-gray-600 bg-gradient-to-br from-gray-700/40 to-gray-800/40 p-4"
								: "cursor-pointer bg-gray-900 hover:bg-gray-850 transition-colors p-3"
						}`}
						onClick={
							!showAsAccount && isMultiCurrencyItem(item)
								? () => handleItemClick(item.payload)
								: undefined
						}
					>
						{showAsAccount && "availableBalance" in item ? (
							<>
								{/* Header with Currency Flag/Icon and Title with Add Money Button */}
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-2">
										{item.icon ? (
											<img
												src={item.icon}
												alt={item.title}
												className="object-cover w-6 h-6 rounded"
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										) : (
											<span className="text-lg">🇦🇪</span>
										)}
										<h4 className="font-medium text-white text-base">
											{item.title}
										</h4>
									</div>
									{item.buttons && item.buttons.length > 0 && (
										<button
											onClick={() => handleButtonClick(item.buttons[0].payload)}
											className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
										>
											{item.buttons[0].label}
										</button>
									)}
								</div>

								{/* Available Balance */}
								<div className="mb-3">
									<div className="flex items-baseline gap-1">
										<span className="text-sm text-gray-300">
											{item.availableBalance.currency === "AED"
												? "د.إ"
												: item.availableBalance.currency === "USD"
													? "$"
													: item.availableBalance.currency === "EUR"
														? "€"
														: item.availableBalance.currency === "GBP"
															? "£"
															: "₪"}
										</span>
										<span className="text-4xl font-bold text-white">
											{item.availableBalance.amount.toLocaleString()}
										</span>
									</div>
								</div>

								{/* Current Account Balance with Info Icon */}
								<div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
									<svg
										className="w-4 h-4"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fillRule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clipRule="evenodd"
										/>
									</svg>
									<span>
										Current Account Balance:{" "}
										{item.currentAccountBalance.amount.toLocaleString()}
										{item.currentAccountBalance.currency}
									</span>
								</div>

								{/* Additional Buttons */}
								{item.buttons && item.buttons.length > 1 && (
									<div>
										{item.buttons.slice(1).map((button) => (
											<button
												key={button.id}
												onClick={() => handleButtonClick(button.payload)}
												className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
											>
												{button.label}
											</button>
										))}
									</div>
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
										<p className="text-xs text-gray-400">
											Account Number: {item.accountNumber}
										</p>
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

export default MultiCurrencyWidgetComponent;
