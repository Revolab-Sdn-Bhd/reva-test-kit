import type React from "react";
import { useState } from "react";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { SavingSpaceItem } from "@/types/savingSpaces";

interface SavingSpaceDialogProps {
	isOpen: boolean;
	onClose: () => void;
	isConnected: boolean;
	onSuccess: () => void;
}

interface SavingSpaceWithId extends SavingSpaceItem {
	id: string;
}

const SavingSpaceDialog: React.FC<SavingSpaceDialogProps> = ({
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

	const [savingSpaces, setSavingSpaces] = useState<SavingSpaceWithId[]>([
		{
			id: crypto.randomUUID(),
			name: "",
			categoryName: "",
			frequency: "MONTHLY",
			targetAmount: 0,
			savedAmount: 0,
			targetDate: "",
			startDate: "",
			status: "ACTIVE",
			description: "",
			categoryPictureUrl: "",
		},
	]);

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

	const handleSavingSpaceChange = (
		index: number,
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;
		const updatedSpaces = [...savingSpaces];
		updatedSpaces[index] = {
			...updatedSpaces[index],
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		};
		setSavingSpaces(updatedSpaces);
	};

	const addSavingSpace = () => {
		setSavingSpaces([
			...savingSpaces,
			{
				id: crypto.randomUUID(),
				name: "",
				categoryName: "",
				frequency: "MONTHLY",
				targetAmount: 0,
				savedAmount: 0,
				targetDate: "",
				startDate: "",
				status: "ACTIVE",
				description: "",
				categoryPictureUrl: "",
			},
		]);
	};

	const removeSavingSpace = (index: number) => {
		if (savingSpaces.length > 1) {
			setSavingSpaces(savingSpaces.filter((_, i) => i !== index));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Remove the id field from savingSpaces before sending
			const cleanedSpaces = savingSpaces.map(({ id, ...space }) => space);

			const response = await fetch(
				`${AB_API_ENDPOINT}/customer-experience/v1/accounts`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userData,
						savingSpaces: cleanedSpaces,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create saving spaces");
			}

			const result = await response.json();

			alert(
				`Success! Created ${result.count} saving space(s) for "${userData.name}".`,
			);

			// Reset form
			setUserData({
				name: "",
				accountNumber: "",
				accountBalance: 0,
				currency: "JOD",
			});
			setSavingSpaces([
				{
					id: crypto.randomUUID(),
					name: "",
					categoryName: "",
					frequency: "MONTHLY",
					targetAmount: 0,
					savedAmount: 0,
					targetDate: "",
					startDate: "",
					status: "ACTIVE",
					description: "",
					categoryPictureUrl: "",
				},
			]);

			// Notify parent to refresh
			onSuccess();
			onClose();
		} catch (error) {
			console.error("Error creating saving spaces:", error);
			alert("Error creating saving spaces. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-xl font-bold text-white">Create Saving Spaces</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-white"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Body */}
				<form
					onSubmit={handleSubmit}
					className="flex flex-col flex-1 overflow-hidden"
				>
					<div className="flex-1 p-6 space-y-4 overflow-y-auto text-sm">
						{/* User Information Section */}
						<div className="p-4 border border-blue-500 rounded-lg bg-gray-800/50">
							<h3 className="mb-3 text-base font-semibold text-blue-400">
								User Information
							</h3>
							<div className="grid grid-cols-2 gap-4">
								{/* Name */}
								<div>
									<label
										htmlFor="name"
										className="block mb-2 text-sm font-medium text-gray-300"
									>
										Name <span className="text-red-500">*</span>
									</label>
									<input
										id="name"
										name="name"
										type="text"
										value={userData.name}
										onChange={handleUserDataChange}
										disabled={isConnected}
										required
										className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
										placeholder="Enter user name"
									/>
								</div>

								{/* Account Number */}
								<div>
									<label
										htmlFor="accountNumber"
										className="block mb-2 text-sm font-medium text-gray-300"
									>
										Account Number <span className="text-red-500">*</span>
									</label>
									<input
										id="accountNumber"
										name="accountNumber"
										type="text"
										value={userData.accountNumber}
										onChange={handleUserDataChange}
										disabled={isConnected}
										required
										className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
										placeholder="Enter account number"
									/>
								</div>

								{/* Account Balance */}
								<div>
									<label
										htmlFor="accountBalance"
										className="block mb-2 text-sm font-medium text-gray-300"
									>
										Account Balance
									</label>
									<input
										id="accountBalance"
										name="accountBalance"
										type="number"
										step="0.01"
										value={userData.accountBalance}
										onChange={handleUserDataChange}
										disabled={isConnected}
										className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
										placeholder="0.00"
									/>
								</div>

								{/* Currency */}
								<div>
									<label
										htmlFor="currency"
										className="block mb-2 text-sm font-medium text-gray-300"
									>
										Currency
									</label>
									<select
										id="currency"
										name="currency"
										value={userData.currency}
										onChange={handleUserDataChange}
										disabled={isConnected}
										className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
									>
										<option value="JOD">JOD</option>
										<option value="USD">USD</option>
										<option value="EUR">EUR</option>
										<option value="GBP">GBP</option>
										<option value="MYR">MYR</option>
									</select>
								</div>
							</div>
						</div>

						{/* Saving Spaces Section */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-base font-semibold text-green-400">
									Saving Spaces
								</h3>
								<button
									type="button"
									onClick={addSavingSpace}
									disabled={isConnected}
									className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
								>
									+ Add Space
								</button>
							</div>

							{savingSpaces.map((space, index) => (
								<div
									key={space.id}
									className="p-4 border border-green-500 rounded-lg bg-gray-800/50"
								>
									<div className="flex items-center justify-between mb-3">
										<h4 className="text-sm font-medium text-gray-300">
											Saving Space #{index + 1}
										</h4>
										{savingSpaces.length > 1 && (
											<button
												type="button"
												onClick={() => removeSavingSpace(index)}
												disabled={isConnected}
												className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
											>
												Remove
											</button>
										)}
									</div>

									<div className="grid grid-cols-2 gap-4">
										{/* Category Name */}
										<div>
											<label
												htmlFor={`categoryName-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Category Name <span className="text-red-500">*</span>
											</label>
											<input
												id={`categoryName-${index}`}
												name="categoryName"
												type="text"
												value={space.categoryName}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												required
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
												placeholder="e.g., Vacation, Emergency Fund"
											/>
										</div>

										{/* Frequency */}
										<div>
											<label
												htmlFor={`frequency-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Frequency
											</label>
											<select
												id={`frequency-${index}`}
												name="frequency"
												value={space.frequency}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
											>
												<option value="DAILY">Daily</option>
												<option value="WEEKLY">Weekly</option>
												<option value="MONTHLY">Monthly</option>
												<option value="QUARTERLY">Quarterly</option>
												<option value="YEARLY">Yearly</option>
											</select>
										</div>

										{/* Target Amount */}
										<div>
											<label
												htmlFor={`targetAmount-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Target Amount
											</label>
											<input
												id={`targetAmount-${index}`}
												name="targetAmount"
												type="number"
												step="0.01"
												value={space.targetAmount}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
												placeholder="0.00"
											/>
										</div>

										{/* Saved Amount */}
										<div>
											<label
												htmlFor={`savedAmount-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Saved Amount
											</label>
											<input
												id={`savedAmount-${index}`}
												name="savedAmount"
												type="number"
												step="0.01"
												value={space.savedAmount}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
												placeholder="0.00"
											/>
										</div>

										{/* Target Date */}
										<div>
											<label
												htmlFor={`targetDate-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Target Date
											</label>
											<input
												id={`targetDate-${index}`}
												name="targetDate"
												type="date"
												value={space.targetDate}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
											/>
										</div>

										{/* Start Date */}
										<div>
											<label
												htmlFor={`startDate-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Start Date
											</label>
											<input
												id={`startDate-${index}`}
												name="startDate"
												type="date"
												value={space.startDate}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
											/>
										</div>

										{/* Status */}
										<div>
											<label
												htmlFor={`status-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Status
											</label>
											<select
												id={`status-${index}`}
												name="status"
												value={space.status}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
											>
												<option value="ACTIVE">Active</option>
												<option value="PAUSED">Paused</option>
												<option value="COMPLETED">Completed</option>
												<option value="CANCELLED">Cancelled</option>
											</select>
										</div>

										{/* Description */}
										<div>
											<label
												htmlFor={`description-${index}`}
												className="block mb-2 text-sm font-medium text-gray-300"
											>
												Description
											</label>
											<input
												id={`description-${index}`}
												name="description"
												type="text"
												value={space.description}
												onChange={(e) => handleSavingSpaceChange(index, e)}
												disabled={isConnected}
												className="w-full px-3 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900 disabled:cursor-not-allowed"
												placeholder="Enter a brief description"
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Footer */}
					<div className="flex gap-3 p-4 border-t border-gray-700">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 font-medium text-white bg-gray-700 rounded hover:bg-gray-600"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isConnected || isSubmitting}
							className="flex-1 px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSubmitting
								? "Creating..."
								: `Create ${savingSpaces.length} Saving Space(s)`}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SavingSpaceDialog;
