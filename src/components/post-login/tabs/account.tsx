import { ActionIcon, Button } from "@mantine/core";
import { openContextModal, useModals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type React from "react";
import { useEffect, useState } from "react";
import { IoAdd, IoRefresh } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { SubAccount } from "@/types/accounts";

interface AccountSectionProps {
	isConnected: boolean;
}

const AccountSection: React.FC<AccountSectionProps> = ({ isConnected }) => {
	const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
	const [isLoadingRecords, setIsLoadingRecords] = useState(false);
	const modals = useModals();

	// Fetch saved records on component mount
	useEffect(() => {
		fetchSavedRecords();
	}, []);

	const fetchSavedRecords = async () => {
		setIsLoadingRecords(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/account-experience/v1/sub-accounts`,
			);
			if (response.ok) {
				const data = await response.json();
				setSubAccounts(data.data || []);
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

	const handleDeleteAccount = async (
		subAccountId: string,
		accountNumber: string,
		isPrimary: boolean,
	) => {
		const warningMessage = isPrimary
			? `Are you sure you want to delete the PRIMARY account "${accountNumber}"? This will DELETE THE USER and ALL SUB-ACCOUNTS with their saving spaces. You will need to create a new user from scratch.`
			: `Are you sure you want to delete account "${accountNumber}"? This will also delete all associated saving spaces.`;

		modals.openConfirmModal({
			title: isPrimary ? "⚠️ Delete User & All Accounts" : "Delete Account",
			children: warningMessage,
			labels: { confirm: "Delete", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onConfirm: async () => {
				try {
					const response = await fetch(
						`${AB_API_ENDPOINT}/account-experience/v1/sub-accounts?subAccountId=${subAccountId}`,
						{
							method: "DELETE",
						},
					);

					if (response.ok) {
						notifications.show({
							title: "Success",
							message: `Account "${accountNumber}" deleted successfully!`,
							color: "green",
						});
						fetchSavedRecords();
					} else {
						const error = await response.json();
						notifications.show({
							title: "Error",
							message: `Failed to delete account: ${error.error || "Unknown error"}`,
							color: "red",
						});
					}
				} catch (error) {
					console.error("Error deleting account:", error);
					notifications.show({
						title: "Error",
						message: "Failed to delete account. Please try again.",
						color: "red",
					});
				}
			},
		});
	};

	const openCreateUserModal = () => {
		openContextModal({
			modal: "createUserAccount",
			title: "Create User & Accounts",
			size: "xl",
			innerProps: {
				isConnected,
				onSuccess: () => {
					modals.closeAll();
					fetchSavedRecords();
				},
			},
		});
	};

	const openAddSavingSpaceModal = () => {
		openContextModal({
			modal: "addSavingSpace",
			title: "Add Saving Spaces",
			size: "xl",
			innerProps: {
				isConnected,
				onSuccess: () => {
					modals.closeAll();
					fetchSavedRecords();
				},
			},
		});
	};

	return (
		<div className="space-y-4 text-sm text-white">
			{/* Header with Add Button */}
			<div className="flex items-center justify-between">
				<h3 className="text-base font-semibold text-purple-400">Accounts</h3>
				<div className="flex items-center gap-2">
					<ActionIcon onClick={fetchSavedRecords} loading={isLoadingRecords}>
						<IoRefresh />
					</ActionIcon>
					<Button
						disabled={isConnected || subAccounts.length > 0}
						variant="outline"
						onClick={openCreateUserModal}
						size="compact-sm"
						leftSection={<IoAdd />}
					>
						Accounts
					</Button>
					<Button
						leftSection={<IoAdd />}
						onClick={openAddSavingSpaceModal}
						disabled={isConnected}
						size="compact-sm"
					>
						Saving Space
					</Button>
				</div>
			</div>

			{/* Content */}
			{isLoadingRecords ? (
				<div className="p-4 text-center text-gray-400">Loading records...</div>
			) : subAccounts.length === 0 ? (
				<div className="p-4 text-center text-gray-400">
					No accounts yet. Click &quot;+ Create User & Accounts&quot; to get
					started!
				</div>
			) : (
				<div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
					{subAccounts.map((account) => (
						<div
							key={account.id}
							className="p-4 border border-purple-500 rounded-lg bg-gray-800/50"
						>
							{/* Account Header */}
							<div className="pb-3 mb-3 border-b border-gray-700">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<h4 className="text-base font-semibold text-white">
											{account.currencyAccountName}{" "}
											{account.orderIndex === 0 && "(Primary)"}
										</h4>
										<p className="text-sm text-gray-400">
											Account: {account.accountNumber}
										</p>
										<p className="text-sm font-medium text-white">
											Balance: {account.currencySymbol}{" "}
											{account.accountBalance.toFixed(2)} {account.currency}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<span className="px-2 py-1 text-xs font-medium text-purple-300 bg-purple-900 rounded">
											{account.savingSpaces?.length || 0} Space
											{(account.savingSpaces?.length || 0) !== 1 ? "s" : ""}
										</span>
										<button
											type="button"
											onClick={() =>
												handleDeleteAccount(
													account.id,
													account.accountNumber,
													account.orderIndex === 0,
												)
											}
											disabled={isConnected}
											className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
											title={
												account.orderIndex === 0
													? "Delete user and all accounts"
													: "Delete account and all saving spaces"
											}
										>
											Delete
										</button>
									</div>
								</div>
							</div>

							{/* Saving Spaces */}
							<div className="space-y-3">
								{account.savingSpaces && account.savingSpaces.length > 0 ? (
									account.savingSpaces.map((record: any) => (
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
									))
								) : (
									<div className="py-2 text-xs text-center text-gray-400">
										No saving spaces yet
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AccountSection;
