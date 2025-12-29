/* eslint-disable @next/next/no-img-element */
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
						className={`p-3 rounded-lg ${
							showAsAccount
								? "border border-gray-700"
								: "cursor-pointer bg-gray-900 hover:bg-gray-850 transition-colors"
						}`}
						onClick={
							!showAsAccount && isMultiCurrencyItem(item)
								? () => handleItemClick(item.payload)
								: undefined
						}
					>
						{/* Content Section */}
						<div className="flex items-start gap-3 mb-3">
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
								<h4 className="font-medium text-white">{item.title}</h4>
								<p className="text-xs text-gray-400">
									Account Number: {item.accountNumber}
								</p>

								{showAsAccount && "availableBalance" in item && (
									<>
										<p className="text-xs text-gray-400">
											Available Balance: {item.availableBalance.amount}{" "}
											{item.availableBalance.currency}
										</p>
										<p className="text-xs text-gray-400">
											Current Account Balance:{" "}
											{item.currentAccountBalance.amount}{" "}
											{item.currentAccountBalance.currency}
										</p>
									</>
								)}
							</div>
						</div>

						{/* Buttons Section - Only for Account Widget */}
						{showAsAccount &&
							"buttons" in item &&
							item.buttons &&
							item.buttons.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{item.buttons.map((button) => (
										<button
											key={button.id}
											onClick={() => handleButtonClick(button.payload)}
											className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800"
										>
											{button.label}
										</button>
									))}
								</div>
							)}
					</div>
				))}
			</div>
		</div>
	);
};

export default MultiCurrencyWidgetComponent;
