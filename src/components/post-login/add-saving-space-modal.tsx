import {
	ActionIcon,
	Button,
	Group,
	Loader,
	NumberInput,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import type { ContextModalProps } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type React from "react";
import { useEffect, useState } from "react";
import { IoAdd, IoTrash } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { SubAccount } from "@/types/accounts";
import type { SavingSpaceItem } from "@/types/savingSpaces";

interface AddSavingSpaceFormProps {
	isConnected: boolean;
	onSuccess: () => void;
}

interface SavingSpaceWithId extends SavingSpaceItem {
	id: string;
}

const AddSavingSpaceModal = ({
	context,
	id,
	innerProps,
}: ContextModalProps<AddSavingSpaceFormProps>) => {
	const { isConnected, onSuccess } = innerProps;

	const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
	const [selectedSubAccountId, setSelectedSubAccountId] = useState<string>("");
	const [isLoadingSubAccounts, setIsLoadingSubAccounts] = useState(false);

	const [savingSpaces, setSavingSpaces] = useState<SavingSpaceWithId[]>([
		{
			id: crypto.randomUUID(),
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

	useEffect(() => {
		fetchSubAccounts();
	}, []);

	const fetchSubAccounts = async () => {
		setIsLoadingSubAccounts(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/account-experience/v1/sub-accounts`,
			);
			if (response.ok) {
				const data = await response.json();
				setSubAccounts(data.data || []);
			}
		} catch (error) {
			console.error("Error fetching sub-accounts:", error);
			notifications.show({
				title: "Error",
				message: "Failed to load sub-accounts",
				color: "red",
			});
		} finally {
			setIsLoadingSubAccounts(false);
		}
	};

	const handleSavingSpaceChange = (
		index: number,
		field: keyof SavingSpaceItem,
		value: any,
	) => {
		const updatedSpaces = [...savingSpaces];
		updatedSpaces[index] = {
			...updatedSpaces[index],
			[field]: value,
		};
		setSavingSpaces(updatedSpaces);
	};

	const addSavingSpace = () => {
		setSavingSpaces([
			...savingSpaces,
			{
				id: crypto.randomUUID(),
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

		if (!selectedSubAccountId) {
			notifications.show({
				title: "Validation Error",
				message: "Please select a sub-account",
				color: "orange",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const selectedAccount = subAccounts.find(
				(acc) => acc.id === selectedSubAccountId,
			);
			if (!selectedAccount) {
				throw new Error("Selected sub-account not found");
			}

			// Transform saving spaces to API format (with Amount objects)
			const transformedSpaces = savingSpaces.map(
				({ id, targetAmount, savedAmount, ...space }) => ({
					...space,
					targetAmount: {
						currency: selectedAccount.currency,
						amount: targetAmount,
					},
					savedAmount:
						savedAmount > 0
							? {
									currency: selectedAccount.currency,
									amount: savedAmount,
								}
							: undefined,
				}),
			);

			const response = await fetch(
				`${AB_API_ENDPOINT}/customer-experience/v1/saving-spaces?subAccountId=${selectedSubAccountId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						savingSpaces: transformedSpaces,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create saving spaces");
			}

			const result = await response.json();

			notifications.show({
				title: "Success",
				message: `Created ${result.count} saving space(s) for account ${selectedAccount.accountNumber}`,
				color: "green",
			});

			// Reset form
			setSelectedSubAccountId("");
			setSavingSpaces([
				{
					id: crypto.randomUUID(),
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

			onSuccess();
		} catch (error) {
			console.error("Error creating saving spaces:", error);
			notifications.show({
				title: "Error",
				message: `Failed to create saving spaces: ${error instanceof Error ? error.message : "Unknown error"}`,
				color: "red",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const frequencyOptions = [
		{ value: "DAILY", label: "Daily" },
		{ value: "WEEKLY", label: "Weekly" },
		{ value: "MONTHLY", label: "Monthly" },
		{ value: "YEARLY", label: "Yearly" },
	];

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="md">
				{/* Sub-Account Selection */}
				<div>
					<Text size="sm" fw={600} mb="xs">
						Select Sub-Account
					</Text>
					{isLoadingSubAccounts ? (
						<Group gap="xs">
							<Loader size="xs" />
							<Text size="sm" c="dimmed">
								Loading sub-accounts...
							</Text>
						</Group>
					) : subAccounts.length === 0 ? (
						<Text size="sm" c="yellow">
							No sub-accounts found. Please create a user account first.
						</Text>
					) : (
						<Select
							placeholder="-- Select Sub-Account --"
							data={subAccounts.map((acc) => ({
								value: acc.id,
								label: `${acc.accountNumber} - ${acc.currency} ${acc.accountBalance.toFixed(2)}`,
							}))}
							value={selectedSubAccountId}
							onChange={(value) => setSelectedSubAccountId(value || "")}
							required
						/>
					)}
				</div>

				{/* Saving Spaces */}
				<div>
					<Group justify="space-between" mb="xs">
						<Text size="sm" fw={600}>
							Saving Spaces
						</Text>
						<Button
							size="xs"
							variant="light"
							leftSection={<IoAdd />}
							onClick={addSavingSpace}
						>
							Add Space
						</Button>
					</Group>

					<Stack gap="sm">
						{savingSpaces.map((space, index) => (
							<Paper key={space.id} p="sm" withBorder>
								<Group justify="space-between" mb="xs">
									<Text size="xs" fw={500}>
										Saving Space #{index + 1}
									</Text>
									{savingSpaces.length > 1 && (
										<ActionIcon
											size="xs"
											color="red"
											variant="subtle"
											onClick={() => removeSavingSpace(index)}
										>
											<IoTrash />
										</ActionIcon>
									)}
								</Group>

								<Stack gap="xs">
									<TextInput
										label="Category Name"
										placeholder="e.g., Vacation, Emergency Fund"
										size="xs"
										value={space.categoryName}
										onChange={(e) =>
											handleSavingSpaceChange(
												index,
												"categoryName",
												e.target.value,
											)
										}
										required
									/>

									<Select
										label="Frequency"
										size="xs"
										data={frequencyOptions}
										value={space.frequency}
										onChange={(value) =>
											handleSavingSpaceChange(index, "frequency", value)
										}
										required
									/>

									<Group grow>
										<NumberInput
											label="Target Amount"
											placeholder="0.00"
											size="xs"
											value={space.targetAmount}
											onChange={(value) =>
												handleSavingSpaceChange(
													index,
													"targetAmount",
													Number(value),
												)
											}
											min={0}
											decimalScale={2}
											required
										/>

										<NumberInput
											label="Saved Amount"
											placeholder="0.00"
											size="xs"
											value={space.savedAmount}
											onChange={(value) =>
												handleSavingSpaceChange(
													index,
													"savedAmount",
													Number(value),
												)
											}
											min={0}
											decimalScale={2}
										/>
									</Group>

									<TextInput
										label="Target Date"
										type="date"
										size="xs"
										value={space.targetDate}
										onChange={(e) =>
											handleSavingSpaceChange(
												index,
												"targetDate",
												e.target.value,
											)
										}
										required
									/>

									<TextInput
										label="Description"
										placeholder="Optional description"
										size="xs"
										value={space.description}
										onChange={(e) =>
											handleSavingSpaceChange(
												index,
												"description",
												e.target.value,
											)
										}
									/>
								</Stack>
							</Paper>
						))}
					</Stack>
				</div>

				<Group justify="flex-end" mt="md">
					<Button
						type="submit"
						loading={isSubmitting}
						disabled={isConnected || subAccounts.length === 0}
					>
						{isSubmitting ? "Creating..." : "Create Saving Spaces"}
					</Button>
				</Group>
			</Stack>
		</form>
	);
};

export default AddSavingSpaceModal;
