import type {
	BillPaymentAccountItem,
	BillPaymentAccountWidget,
	BillPaymentItem,
	BillPaymentListWidget,
} from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const BillPaymentWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: BillPaymentListWidget | BillPaymentAccountWidget;
	messageId: string;
}) => {
	const { sendAction } = useWebSocketContext();

	const isBillPaymentItem = (
		item: BillPaymentItem | BillPaymentAccountItem,
	): item is BillPaymentItem => {
		return "payload" in item;
	};

	const isAccountWidget = (w: typeof widget): w is BillPaymentAccountWidget => {
		return w.items.some((item) => "fees" in item);
	};

	const handleItemClick = (payload: { event: string; data: string }) => {
		if (messageId) {
			sendAction({ event: payload.event, data: payload.data }, messageId);
		}
	};

	const showAsAccount = isAccountWidget(widget);

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.billerCode}-${index}`}
						className={`rounded-2xl ${
							showAsAccount
								? "border border-gray-600 bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4"
								: "cursor-pointer bg-gray-900 hover:bg-gray-850 transition-colors p-3"
						}`}
						onClick={
							!showAsAccount && isBillPaymentItem(item)
								? () => handleItemClick(item.payload)
								: undefined
						}
					>
						{showAsAccount && "fees" in item ? (
							<>
								{/* Header Section with Icon and Title */}
								<div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-600">
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
									<div className="flex-1">
										<h4 className="font-semibold text-white text-base">
											{item.title}
										</h4>
										<p className="text-sm text-gray-300">
											{item.customerIdentifier}, {item.serviceType}
										</p>
										<p className="text-xs text-gray-400 mt-1">
											{item.paymentType}
										</p>
									</div>
								</div>

								{/* Details Section */}
								<div className="space-y-3 mb-4">
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-300">Fees</span>
										<span className="text-sm text-white font-medium">
											{item.fees.amount.toLocaleString()} {item.fees.currency}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-gray-300">Amount Due</span>
										<span className="text-sm text-white font-medium">
											{item.dueAmount.amount.toLocaleString()}{" "}
											{item.dueAmount.currency}
										</span>
									</div>
								</div>

								{/* Minimum Due Badge */}
								<div className="flex justify-between items-center mb-4">
									<span className="text-sm text-gray-300">Minimum Due</span>
									<span className="px-4 py-2 bg-gray-700/50 rounded-full text-sm text-white font-medium">
										{item.minimumDueAmount.amount.toLocaleString()}
										{item.minimumDueAmount.currency}
									</span>
								</div>

								{/* Current Account Balance */}
								<div className="flex items-center gap-2 text-sm text-gray-300">
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
											{item.customerIdentifier}
										</p>
										<p className="text-xs text-gray-400">{item.nickName}</p>
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

export default BillPaymentWidgetComponent;
