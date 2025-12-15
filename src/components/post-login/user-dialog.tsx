import type React from "react";
import { useState } from "react";
import { AB_API_ENDPOINT } from "@/lib/constant";

interface UserDialogProps {
	isOpen: boolean;
	onClose: () => void;
	isConnected: boolean;
	onSuccess: () => void;
}

const UserDialog: React.FC<UserDialogProps> = ({
	isOpen,
	onClose,
	isConnected,
	onSuccess,
}) => {
	const [userData, setUserData] = useState({
		name: "",
		accountNumber: "",
		accountBalance: 0,
		currency: "JOD",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleUserDataChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;
		setUserData((prev) => ({
			...prev,
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/customer-experience/v1/saving-spaces`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userData,
						savingSpaces: [], // Empty array, just creating user
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create user account");
			}

			alert(`Success! User account created for "${userData.name}".`);

			// Reset form
			setUserData({
				name: "",
				accountNumber: "",
				accountBalance: 0,
				currency: "JOD",
			});

			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error creating user:", error);
			alert(
				`Failed to create user account: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center text-white bg-black/50">
			<div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-purple-500 rounded-lg shadow-xl">
				<div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
					<h2 className="text-xl font-semibold text-purple-400">
						Create User Account
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-white"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-6">
					{/* User Data Section */}
					<div className="p-4 space-y-4 border border-purple-500 rounded-lg bg-gray-800/50">
						<h3 className="text-lg font-semibold text-purple-300">
							User Information
						</h3>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block mb-1 text-sm font-medium text-gray-300">
									Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="name"
									value={userData.name}
									onChange={handleUserDataChange}
									required
									className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="Enter name"
								/>
							</div>

							<div>
								<label className="block mb-1 text-sm font-medium text-gray-300">
									Account Number <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="accountNumber"
									value={userData.accountNumber}
									onChange={handleUserDataChange}
									required
									className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="Enter account number"
								/>
							</div>

							<div>
								<label className="block mb-1 text-sm font-medium text-gray-300">
									Account Balance <span className="text-red-500">*</span>
								</label>
								<input
									type="number"
									name="accountBalance"
									value={userData.accountBalance}
									onChange={handleUserDataChange}
									required
									step="0.01"
									min="0"
									className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
									placeholder="0.00"
								/>
							</div>

							<div>
								<label className="block mb-1 text-sm font-medium text-gray-300">
									Currency <span className="text-red-500">*</span>
								</label>
								<select
									name="currency"
									value={userData.currency}
									onChange={handleUserDataChange}
									required
									className="w-full px-3 py-2 text-sm text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
								>
									<option value="JOD">JOD</option>
									<option value="USD">USD</option>
									<option value="EUR">EUR</option>
									<option value="GBP">GBP</option>
								</select>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={isSubmitting}
							className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting || isConnected}
							className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
						>
							{isSubmitting ? "Creating..." : "Create User"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default UserDialog;
