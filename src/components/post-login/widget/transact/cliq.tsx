import { useState } from "react";
import type { CliqTransferWidget, CliqWidget } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const CliqWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: CliqWidget;
	messageId: string;
}) => {
	const { sendAction, sendMessage } = useWebSocketContext();

	const [amount, setAmount] = useState<string>("0.000");

	const isTransferWidget = (w: CliqWidget): w is CliqTransferWidget => {
		return w.type === "CLIQTRANSFERDETAIL";
	};

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		if (/^\d*\.?\d{0,3}$/.test(value) || value === "") {
			setAmount(value);
		}
	};

	const handleButtonClick = (
		button: {
			id?: string;
			type: string;
			label: string;
			payload: { event: string; data: string };
		},
		item: (typeof widget.items)[0],
	) => {
		let data = button.payload.data;

		if (button.id === "transfer" || button.id === "request") {
			const amountValue = parseFloat(amount) || 0;
			data =
				button.id === "transfer"
					? `Transfer ${amountValue.toFixed(3)} ${item.amount.currency}`
					: `Request ${amountValue.toFixed(3)} ${item.amount.currency}`;

			sendMessage(
				JSON.stringify({
					event: button.payload.event,
					data: data,
				}),
				data,
			);
		} else if (button.id === "changealias") {
			if (messageId) {
				sendAction(
					{ event: button.payload.event, data: button.payload.data },
					messageId,
				);
			}
		}
	};

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.contactName}-${index}`}
						className="rounded-2xl border border-gray-600 bg-gradient-to-br from-gray-700/40 to-gray-800/40 p-4"
					>
						{/* contact info section */}
						<div className="">
							<div className="">
								{item.icon ? (
									<img
										src={item.icon}
										alt={item.contactName || "Contact"}
										className="object-cover w-12 h-12 rounded-full"
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
								) : (
									<div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
										RS
									</div>
								)}
								<div>
									<h4 className="font-semibold text-white text-base">
										{item.contactName || ""}
									</h4>
									<p className="text-sm text-gray-300">{item.contactNumber}</p>
								</div>
							</div>

							{/* Change alias Button */}
							{item.buttons && item.buttons.length > 1 && (
								<button
									onClick={() => handleButtonClick(item.buttons[1], item)}
									className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
								>
									{item.buttons[1].label}
								</button>
							)}
						</div>

						{/* amount section */}
						<div className="mb-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-gray-300">Amount</span>
								{/* Transfer Button */}
								{item.buttons && item.buttons.length > 0 && (
									<button
										onClick={() => handleButtonClick(item.buttons[0], item)}
										className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-full hover:bg-gray-500 transition-colors"
										disabled={!amount || parseFloat(amount) === 0}
									>
										{item.buttons[0].label}
									</button>
								)}
							</div>

							{/* Amount Display/Input */}
							<div className="bg-gray-700/50 rounded-xl p-4">
								{item.amount.type === "editable" ? (
									<div className="flex items-baseline gap-2">
										<span className="text-lg text-gray-300">
											{item.amount.currency}
										</span>
										<input
											type="text"
											value={amount}
											onChange={handleAmountChange}
											className="flex-1 bg-transparent text-4xl font-bold text-white outline-none"
											placeholder="0.000"
										/>
									</div>
								) : (
									<div className="flex items-baseline gap-2">
										<span className="text-lg text-gray-300">
											{item.amount.currency}
										</span>
										<span className="text-4xl font-bold text-white">
											{item.amount.amount.toFixed(3)}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Available Balance */}
						{isTransferWidget(widget) && "availableBalance" in item && (
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
									Available Balance: {item.availableBalance.amount.toFixed(3)}{" "}
									{item.availableBalance.currency}
								</span>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
};

export default CliqWidgetComponent;
