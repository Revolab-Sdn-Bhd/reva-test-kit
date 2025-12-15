import {
	ActionIcon,
	Button,
	Divider,
	Group,
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
import { useState } from "react";
import { IoAdd, IoTrash } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";
import type { SubAccountFormInput } from "@/types/accounts";

interface CreateUserAccountFormProps {
	isConnected: boolean;
	onSuccess: () => void;
}

interface SubAccountWithId extends SubAccountFormInput {
	id: string;
}

const CreateUserAccountModal = ({
	context,
	id,
	innerProps,
}: ContextModalProps<CreateUserAccountFormProps>) => {
	const { isConnected, onSuccess } = innerProps;

	const [userName, setUserName] = useState("");
	const [virtualIban, setVirtualIban] = useState("");

	const [primaryAccount, setPrimaryAccount] = useState<SubAccountFormInput>({
		accountNumber: "",
		accountBalance: 0,
		currency: "JOD",
		currencySymbol: "JD",
		currencyAccountName: "Jordanian Dinar",
		enabledCardTransactions: "ALLOW",
		enabledAutoFund: "ENABLE",
		visibility: true,
		orderIndex: 0,
	});

	const [subAccounts, setSubAccounts] = useState<SubAccountWithId[]>([
		{
			id: crypto.randomUUID(),
			accountNumber: "",
			accountBalance: 0,
			currency: "USD",
			currencySymbol: "$",
			currencyAccountName: "United States Dollar",
			enabledCardTransactions: "ALLOW",
			enabledAutoFund: "ENABLE",
			visibility: true,
			orderIndex: 1,
		},
	]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const currencyOptions = [
		{ value: "JOD", label: "🇯🇴 JD - Jordanian Dinar" },
		{ value: "USD", label: "🇺🇸 $ - United States Dollar" },
		{ value: "EUR", label: "🇪🇺 € - Euro" },
		{ value: "GBP", label: "🇬🇧 £ - British Pound" },
	];

	const currencyData = {
		JOD: { symbol: "JD", name: "Jordanian Dinar" },
		USD: { symbol: "$", name: "United States Dollar" },
		EUR: { symbol: "€", name: "Euro" },
		GBP: { symbol: "£", name: "British Pound" },
	};

	const handlePrimaryCurrencyChange = (currency: string | null) => {
		if (currency && currencyData[currency as keyof typeof currencyData]) {
			const data = currencyData[currency as keyof typeof currencyData];
			setPrimaryAccount({
				...primaryAccount,
				currency,
				currencySymbol: data.symbol,
				currencyAccountName: data.name,
			});
		}
	};

	const handleSubAccountCurrencyChange = (
		index: number,
		currency: string | null,
	) => {
		if (currency && currencyData[currency as keyof typeof currencyData]) {
			const data = currencyData[currency as keyof typeof currencyData];
			const updated = [...subAccounts];
			updated[index] = {
				...updated[index],
				currency,
				currencySymbol: data.symbol,
				currencyAccountName: data.name,
			};
			setSubAccounts(updated);
		}
	};

	const handleSubAccountChange = (
		index: number,
		field: keyof SubAccountFormInput,
		value: any,
	) => {
		const updated = [...subAccounts];
		updated[index] = {
			...updated[index],
			[field]: value,
		};
		setSubAccounts(updated);
	};

	const addSubAccount = () => {
		setSubAccounts([
			...subAccounts,
			{
				id: crypto.randomUUID(),
				accountNumber: "",
				accountBalance: 0,
				currency: "EUR",
				currencySymbol: "€",
				currencyAccountName: "Euro",
				enabledCardTransactions: "ALLOW",
				enabledAutoFund: "ENABLE",
				visibility: true,
				orderIndex: subAccounts.length + 1,
			},
		]);
	};

	const removeSubAccount = (index: number) => {
		if (subAccounts.length > 1) {
			setSubAccounts(subAccounts.filter((_, i) => i !== index));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const payload = {
				user: {
					name: userName,
					virtualIban: virtualIban,
				},
				primaryAccount: {
					...primaryAccount,
					orderIndex: 0,
				},
				subAccounts: subAccounts.map((acc, idx) => ({
					accountNumber: acc.accountNumber,
					accountBalance: acc.accountBalance,
					currency: acc.currency,
					currencySymbol: acc.currencySymbol,
					currencyAccountName: acc.currencyAccountName,
					enabledCardTransactions: acc.enabledCardTransactions,
					enabledAutoFund: acc.enabledAutoFund,
					visibility: acc.visibility,
					orderIndex: idx + 1,
				})),
			};

			const response = await fetch(
				`${AB_API_ENDPOINT}/account-experience/v1/sub-accounts`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				},
			);

			if (response.ok) {
				const result = await response.json();
				notifications.show({
					title: "Success",
					message: `User and ${result.totalAccounts} accounts created successfully!`,
					color: "green",
				});
				onSuccess();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: `Failed to create user: ${error.error || "Unknown error"}`,
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error creating user and accounts:", error);
			notifications.show({
				title: "Error",
				message: "Failed to create user. Please try again.",
				color: "red",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="md">
				{/* User Information */}
				<div>
					<Text size="sm" fw={600} mb="xs">
						User Information
					</Text>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<TextInput
							label="Name"
							placeholder="e.g., John Doe"
							value={userName}
							onChange={(e) => setUserName(e.target.value)}
							required
						/>
						<TextInput
							label="Virtual IBAN"
							placeholder="e.g., JO71ARAB0000000000000000000001"
							value={virtualIban}
							onChange={(e) => setVirtualIban(e.target.value)}
							required
						/>
					</div>
				</div>

				<Divider />

				<div>
					<Text size="sm" fw={600} mb="xs" c="blue">
						Primary Account
					</Text>
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<TextInput
							label="Account Number"
							placeholder="e.g., 1000000001"
							value={primaryAccount.accountNumber}
							onChange={(e) =>
								setPrimaryAccount({
									...primaryAccount,
									accountNumber: e.target.value,
								})
							}
							required
						/>
						<NumberInput
							label="Balance"
							placeholder="e.g., 10000.00"
							value={primaryAccount.accountBalance}
							onChange={(value) =>
								setPrimaryAccount({
									...primaryAccount,
									accountBalance: Number(value),
								})
							}
							min={0}
							decimalScale={2}
							required
						/>
						<Select
							label="Currency"
							data={currencyOptions}
							value={primaryAccount.currency}
							onChange={handlePrimaryCurrencyChange}
							required
						/>
					</div>
				</div>

				<Divider />

				{/* Sub-Accounts */}
				<div>
					<Group justify="space-between" mb="xs">
						<Text size="sm" fw={600} c="green">
							Sub-Accounts
						</Text>
						<Button
							size="xs"
							variant="light"
							leftSection={<IoAdd />}
							onClick={addSubAccount}
						>
							Add Sub-Account
						</Button>
					</Group>
					<Stack>
						{subAccounts.map((account, index) => (
							<Paper key={account.id} p="sm" withBorder>
								<Group justify="space-between" mb="xs">
									<Text size="xs" fw={500}>
										Sub-Account {index + 1}
									</Text>
									{subAccounts.length > 1 && (
										<ActionIcon
											size="xs"
											color="red"
											variant="subtle"
											onClick={() => removeSubAccount(index)}
										>
											<IoTrash />
										</ActionIcon>
									)}
								</Group>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
									<TextInput
										label="Account Number"
										placeholder="e.g., 2000000001"
										size="xs"
										value={account.accountNumber}
										onChange={(e) =>
											handleSubAccountChange(
												index,
												"accountNumber",
												e.target.value,
											)
										}
										required
									/>
									<NumberInput
										label="Balance"
										placeholder="e.g., 5000.00"
										size="xs"
										value={account.accountBalance}
										onChange={(value) =>
											handleSubAccountChange(
												index,
												"accountBalance",
												Number(value),
											)
										}
										min={0}
										decimalScale={2}
										required
									/>
									<Select
										label="Currency"
										size="xs"
										data={currencyOptions}
										value={account.currency}
										onChange={(value) =>
											handleSubAccountCurrencyChange(index, value)
										}
										required
									/>
								</div>
							</Paper>
						))}
					</Stack>
				</div>

				<Group justify="flex-end" mt="md">
					<Button type="submit" loading={isSubmitting} disabled={isConnected}>
						Create User + {1 + subAccounts.length} Accounts
					</Button>
				</Group>
			</Stack>
		</form>
	);
};

export default CreateUserAccountModal;
