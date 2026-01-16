import { useEffect, useState } from "react";
import { IoChevronForward, IoPersonCircleOutline } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { TransactionOptionWidget } from "@/lib/useWebSocket";
import { EventType } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

interface ReflectAccount {
	id: number;
	name: string;
	mobileNumber: string;
}

const TransactionOptionWidgetComponent = ({
	widget,
	messageId,
}: {
	widget: TransactionOptionWidget;
	messageId: string;
}) => {
	const { sendAction, sendMessage } = useWebSocketContext();
	const [contacts, setContacts] = useState<ReflectAccount[]>([]);
	const [loadingContacts, setLoadingContacts] = useState(false);
	const [showContactList, setShowContactList] = useState(false);

	const hasContactList = widget.items.some(
		(item) => item.type === "CONTACTLIST",
	);

	const fetchContacts = async () => {
		setLoadingContacts(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/payments/account`,
			);
			const data = await response.json();

			if (data.data?.results && Array.isArray(data.data.results)) {
				setContacts(data.data.results);
				console.log("Contacts loaded:", data.data.results.length);
			}
		} catch (error) {
			console.error("Error fetching contacts:", error);
		} finally {
			setLoadingContacts(false);
		}
	};

	useEffect(() => {
		if (hasContactList) {
			fetchContacts();
		}
	}, []);

	const handleItemClick = async (
		payload: { event: string; data: string },
		itemType?: string,
	) => {
		if (itemType === "CONTACTLIST") {
			if (contacts.length === 0) {
				await fetchContacts();
			}
			setShowContactList(true);
			return;
		}

		if (payload.event === EventType.SELECT_CONTACT) {
			sendAction({ event: payload.event, data: payload.data }, messageId);
			setShowContactList(false);
		} else if (
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
		} else {
			sendAction({ event: payload.event, data: payload.data }, messageId);
		}
	};

	const handleContactSelect = (contact: ReflectAccount) => {
		const contactData = `${contact.name}:${contact.mobileNumber}`;
		handleItemClick(
			{ event: EventType.SELECT_CONTACT, data: contactData },
			undefined,
		);
	};

	if (showContactList) {
		return (
			<div className="p-3 bg-gray-800 rounded-lg">
				<div className="mb-3">
					<button
						type="button"
						onClick={() => setShowContactList(false)}
						className="text-sm text-blue-400 hover:text-blue-300"
					>
						← Back
					</button>
				</div>
				<div className="mb-3 text-sm text-gray-300">Select a contact</div>

				{loadingContacts ? (
					<div className="p-4 text-center text-gray-400">
						Loading contacts...
					</div>
				) : contacts.length === 0 ? (
					<div className="p-4 text-center text-gray-400">
						No contacts found
						<button
							type="button"
							onClick={fetchContacts}
							className="block mx-auto mt-2 text-sm text-blue-400 hover:text-blue-300"
						>
							Retry
						</button>
					</div>
				) : (
					<div className="space-y-2">
						{contacts.map((contact) => (
							<div
								key={contact.id}
								className="cursor-pointer bg-gray-900 p-3 rounded hover:bg-gray-700 transition-colors"
								onClick={() => handleContactSelect(contact)}
							>
								<div className="flex items-center gap-3">
									<IoPersonCircleOutline className="text-gray-400" size={32} />
									<div className="flex-1 min-w-0">
										<h4 className="font-medium text-white">{contact.name}</h4>
										<p className="text-sm text-gray-400">
											{contact.mobileNumber}
										</p>
									</div>
									<IoChevronForward className="text-gray-500" size={20} />
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="p-3 bg-gray-800 rounded-lg">
			<div className="mb-3 text-sm text-gray-300">{widget.text}</div>
			<div className="space-y-3">
				{widget.items.map((item, index) => (
					<div
						key={`${item.title}-${index}`}
						className="cursor-pointer bg-gray-900 p-3 rounded hover:bg-gray-700 transition-colors"
						onClick={() => handleItemClick(item.payload, item.type)}
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
							<div className="flex-1 min-w-0">
								<h4 className="font-medium text-white">{item.title}</h4>

								{item.type === "CONTACTLIST" && (
									<p className="text-xs text-gray-500">
										{loadingContacts
											? "Loading..."
											: contacts.length > 0
												? `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} available`
												: "Click to view contacts"}
									</p>
								)}
							</div>

							{item.iban && (
								<div className="flex-1 min-w-0">
									<h4 className="font-medium text-white">{item.iban}</h4>
								</div>
							)}

							<IoChevronForward className="text-gray-500" size={20} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default TransactionOptionWidgetComponent;
