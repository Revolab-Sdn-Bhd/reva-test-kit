import type React from "react";
import { useState } from "react";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { SubAccountFormInput } from "@/types/accounts";

interface SubAccountDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	isConnected: boolean;
}

const SubAccountDialog: React.FC<SubAccountDialogProps> = ({
	isOpen,
	onClose,
	onSuccess,
	isConnected,
}) => {
	const [formData, setFormData] = useState<SubAccountFormInput>({
		accountNumber: "",
		accountBalance: 0,
		currency: "USD",
		currencySymbol: "$",
		currencyAccountName: "United States Dollar",
		enabledCardTransactions: "ALLOW",
		enabledAutoFund: "ENABLE",
		visibility: true,
		orderIndex: 0,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currencyOptions = [
		{ code: "USD", symbol: "$", name: "United States Dollar" },
		{ code: "EUR", symbol: "€", name: "Euro" },
		{ code: "GBP", symbol: "£", name: "British Pound" },
		{ code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
	];

	const handleCurrencyChange = (currency: string) => {
		const selected = currencyOptions.find((opt) => opt.code === currency);
		if (selected) {
			setFormData({
				...formData,
				currency: selected.code,
				currencySymbol: selected.symbol,
				currencyAccountName: selected.name,
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/account-experience/v1/sub-accounts`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(formData),
				},
			);

			if (response.ok) {
				alert("Sub-account created successfully!");
				onSuccess();
				handleClose();
			} else {
				const error = await response.json();
				alert(
					`Failed to create sub-account: ${error.error || "Unknown error"}`,
				);
			}
		} catch (error) {
			console.error("Error creating sub-account:", error);
			alert("Failed to create sub-account. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setFormData({
			accountNumber: "",
			accountBalance: 0,
			currency: "USD",
			currencySymbol: "$",
			currencyAccountName: "United States Dollar",
			enabledCardTransactions: "ALLOW",
			enabledAutoFund: "ENABLE",
			visibility: true,
			orderIndex: 0,
		});
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-blue-400">Add Sub-Account</h2>
					<button
						type="button"
						onClick={handleClose}
						className="text-gray-400 hover:text-white"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-300">
							Account Number <span className="text-red-500">*</span>
						</label>
						<input
							type="text"
							value={formData.accountNumber}
							onChange={(e) =>
								setFormData({ ...formData, accountNumber: e.target.value })
							}
							required
							className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., 1234567890"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-300">
							Account Balance <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							value={formData.accountBalance}
							onChange={(e) =>
								setFormData({
									...formData,
									accountBalance: Number.parseFloat(e.target.value),
								})
							}
							required
							min="0"
							step="0.01"
							className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="e.g., 1000.00"
						/>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-300">
							Currency <span className="text-red-500">*</span>
						</label>
						<select
							value={formData.currency}
							onChange={(e) => handleCurrencyChange(e.target.value)}
							className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{currencyOptions.map((option) => (
								<option key={option.code} value={option.code}>
									{option.symbol} - {option.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block mb-1 text-sm font-medium text-gray-300">
							Order Index
						</label>
						<input
							type="number"
							value={formData.orderIndex}
							onChange={(e) =>
								setFormData({
									...formData,
									orderIndex: Number.parseInt(e.target.value, 10),
								})
							}
							min="0"
							className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<p className="mt-1 text-xs text-gray-400">
							Display order in the account list
						</p>
					</div>

					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-sm text-gray-300">
							<input
								type="checkbox"
								checked={formData.visibility}
								onChange={(e) =>
									setFormData({ ...formData, visibility: e.target.checked })
								}
								className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
							/>
							Visible
						</label>
					</div>

					<div className="flex gap-2 pt-4">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || isConnected}
							className="flex-1 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "Creating..." : "Create Sub-Account"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SubAccountDialog;
