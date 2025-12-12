import type React from "react";
import { useEffect, useState } from "react";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { UserAccount } from "@/types/savingSpaces";
import SavingSpaceDialog from "../saving-space-dialog";

interface AccountSectionProps {
	isConnected: boolean;
}

const AccountSection: React.FC<AccountSectionProps> = ({ isConnected }) => {
	const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
	const [isLoadingRecords, setIsLoadingRecords] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Fetch saved records on component mount
	useEffect(() => {
		fetchSavedRecords();
	}, []);

	const fetchSavedRecords = async () => {
		setIsLoadingRecords(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/saving-spaces?page=1&size=100`,
			);
			if (response.ok) {
				const data = await response.json();
				setUserAccounts(data.data.results || []);
			}
		} catch (error) {
			console.error("Error fetching saved records:", error);
		} finally {
			setIsLoadingRecords(false);
		}
	};

	const handleDialogSuccess = () => {
		fetchSavedRecords();
	};

	const handleDeleteAccount = async (userId: string, accountName: string) => {
		if (
			!confirm(
				`Are you sure you want to delete the account for "${accountName}"? This will also delete all associated saving spaces.`,
			)
		) {
			return;
		}

		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/saving-spaces?userId=${userId}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				alert(`Account for "${accountName}" deleted successfully!`);
				fetchSavedRecords();
			} else {
				const error = await response.json();
				alert(`Failed to delete account: ${error.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			alert("Failed to delete account. Please try again.");
		}
	};

	return (
		<>
			<div className="space-y-4 text-sm text-white">
				{/* Header with Add Button */}
				<div className="flex items-center justify-between">
					<h3 className="text-base font-semibold text-purple-400">
						Saved Accounts & Saving Spaces
					</h3>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={fetchSavedRecords}
							disabled={isLoadingRecords}
							className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
						>
							{isLoadingRecords ? "Loading..." : "Refresh"}
						</button>
						<button
							type="button"
							onClick={() => setIsDialogOpen(true)}
							disabled={isConnected}
							className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
						>
							+ Add New
						</button>
					</div>
				</div>

				{/* Content */}
				{isLoadingRecords ? (
					<div className="p-4 text-center text-gray-400">
						Loading records...
					</div>
				) : userAccounts.length === 0 ? (
					<div className="p-4 text-center text-gray-400">
						No saved records yet. Click &quot;+ Add New&quot; to create saving
						spaces!
					</div>
				) : (
					<div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
						{userAccounts.map((account) => (
							<div
								key={`${account.name}-${account.accountNumber}`}
								className="p-4 border border-purple-500 rounded-lg bg-gray-800/50"
							>
								{/* Account Header */}
								<div className="pb-3 mb-3 border-b border-gray-700">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="text-base font-semibold text-white">
												{account.name}
											</h4>
											<p className="text-sm text-gray-400">
												Account: {account.accountNumber}
											</p>
											<p className="text-sm font-medium text-white">
												Balance: {account.currency}{" "}
												{account.accountBalance.toFixed(2)}
											</p>
										</div>
										<div className="flex items-center gap-2">
											<span className="px-2 py-1 text-xs font-medium text-purple-300 bg-purple-900 rounded">
												{account.savingSpaces.length} Space
												{account.savingSpaces.length !== 1 ? "s" : ""}
											</span>
											<button
												type="button"
												onClick={() =>
													handleDeleteAccount(account.id, account.name)
												}
												disabled={isConnected}
												className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
												title="Delete account and all saving spaces"
											>
												Delete
											</button>
										</div>
									</div>
								</div>

								{/* Saving Spaces */}
								<div className="space-y-3">
									{account.savingSpaces.map((record) => (
										<div
											key={record.savingSpaceId}
											className="p-3 border border-green-500 rounded bg-gray-900/50"
										>
											<div className="grid grid-cols-2 gap-2 text-xs">
												<div className="col-span-2">
													<span className="text-base font-medium text-green-400">
														{record.categoryName}
													</span>
												</div>
												<div>
													<span className="font-medium text-gray-400">
														Status:
													</span>
													<span
														className={`ml-2 px-2 py-0.5 rounded text-xs ${
															record.status === "ACTIVE"
																? "bg-green-900 text-green-300"
																: record.status === "PAUSED"
																	? "bg-yellow-900 text-yellow-300"
																	: record.status === "COMPLETED"
																		? "bg-blue-900 text-blue-300"
																		: "bg-red-900 text-red-300"
														}`}
													>
														{record.status}
													</span>
												</div>
												<div>
													<span className="font-medium text-gray-400">
														Frequency:
													</span>
													<span className="ml-2 text-white">
														{record.frequency}
													</span>
												</div>
												<div>
													<span className="font-medium text-gray-400">
														Target:
													</span>
													<span className="ml-2 text-white">
														{record.targetAmount.currency}{" "}
														{record.targetAmount.amount.toFixed(2)}
													</span>
												</div>
												<div>
													<span className="font-medium text-gray-400">
														Saved:
													</span>
													<span className="ml-2 text-white">
														{record.savedAmount.currency}{" "}
														{record.savedAmount.amount.toFixed(2)}
													</span>
												</div>
												<div className="col-span-2">
													<span className="font-medium text-gray-400">
														Progress:
													</span>
													<div className="flex items-center gap-2 mt-1">
														<div className="flex-1 h-2 overflow-hidden bg-gray-700 rounded-full">
															<div
																className="h-full bg-green-500 rounded-full"
																style={{
																	width: `${Math.min(100, record.savedPercentage)}%`,
																}}
															/>
														</div>
														<span className="text-sm text-white">
															{record.savedPercentage.toFixed(1)}%
														</span>
													</div>
												</div>
												{record.description && (
													<div className="col-span-2">
														<span className="font-medium text-gray-400">
															Description:
														</span>
														<span className="ml-2 text-white">
															{record.description}
														</span>
													</div>
												)}
												{(record.startDate || record.targetDate) && (
													<div className="col-span-2 pt-2 border-t border-gray-700">
														{record.startDate && (
															<span className="mr-4 text-gray-400">
																Start: {record.startDate}
															</span>
														)}
														{record.targetDate && (
															<span className="text-gray-400">
																Target: {record.targetDate}
															</span>
														)}
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Dialog */}
			<SavingSpaceDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				isConnected={isConnected}
				onSuccess={handleDialogSuccess}
			/>
		</>
	);
};

export default AccountSection;
