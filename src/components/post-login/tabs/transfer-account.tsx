import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Stack,
	Switch,
	Text,
	TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { IoAdd, IoRefresh, IoTrash } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";

interface TransferAccountSectionProps {
	isConnected: boolean;
}

interface ReflectAccount {
	id: number;
	name: string;
	mobileNumber: string;
}

interface IbanSavedBeneficiary {
	beneficiaryId: string;
	accountNumber: string;
	fullName: string;
	nickName: string;
}

interface CLiQAccount {
	id: number;
	name: string;
	nickName: string;
	mobileNumber: string;
	alias: string;
}

const TransferAccountSection = ({
	isConnected,
}: TransferAccountSectionProps) => {
	const [reflectAccounts, setReflectAccounts] = useState<ReflectAccount[]>([]);
	const [ibanAccounts, setIbanAccounts] = useState<IbanSavedBeneficiary[]>([]);
	const [cliqAccounts, setCliqAccounts] = useState<CLiQAccount[]>([]);

	const [showReflectForm, setShowReflectForm] = useState(false);
	const [showCliQForm, setShowCliQForm] = useState(false);
	const [showIbanForm, setShowIbanForm] = useState(false);

	const [ibanFullName, setIbanFullName] = useState("");
	const [ibanNickName, setIbanNickName] = useState("");

	const [cliqFullName, setCliqFullName] = useState("");
	const [cliqNickName, setCliqNickName] = useState("");
	const [cliqMobileNumber, setCliqMobileNumber] = useState("");
	const [cliqAlias, setCliqAlias] = useState("");

	const [isLoading, setIsLoading] = useState(false);
	const [ibanIsLoading, setIbanIsLoading] = useState(false);
	const [cliqLoading, setCliqLoading] = useState(false);
	const [cliqIsLoading, setCliqIsLoading] = useState(false);

	const [reflectName, setReflectName] = useState("");
	const [reflectMobileNumber, setReflectMobileNumber] = useState("");

	const [cliqEnabled, setCliqEnabled] = useState(false);

	useEffect(() => {
		fetchReflectAccounts();
		fetchIBANAccounts();
		fetchCliqStatus();
		fetchCliQAccounts();
	}, []);

	const fetchCliqStatus = async () => {
		setCliqLoading(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/enable-cliq`,
			);
			if (response.ok) {
				const data = await response.json();
				setCliqEnabled(data.data.results === 1);
			}
		} catch (error) {
			console.error("Error fetching CliQ status:", error);
			notifications.show({
				title: "Error",
				message: "Failed to fetch CliQ status.",
				color: "red",
			});
		} finally {
			setCliqLoading(false);
		}
	};

	const handleToggleCliq = async (checked: boolean) => {
		setCliqLoading(true);
		try {
			const enableValue = checked ? 1 : 0;
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/enable-cliq?enable=${enableValue}`,
				{
					method: "POST",
				},
			);

			if (response.ok) {
				setCliqEnabled(checked);
				notifications.show({
					title: "Success",
					message: `CliQ (main user) ${checked ? "enabled" : "disabled"}`,
					color: "green",
				});
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to update CliQ status",
					color: "red",
				});
				// Revert the toggle on error
				setCliqEnabled(!checked);
			}
		} catch (error) {
			console.error("Error updating CliQ status:", error);
			notifications.show({
				title: "Error",
				message: "Failed to update CliQ status",
				color: "red",
			});
			// Revert the toggle on error
			setCliqEnabled(!checked);
		} finally {
			setCliqLoading(false);
		}
	};

	const fetchReflectAccounts = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/payments/account`,
			);
			if (response.ok) {
				const data = await response.json();
				setReflectAccounts(data.data.results || []);
			}
		} catch (error) {
			console.error("Error fetching reflect accounts:", error);
			notifications.show({
				title: "Error",
				message: "Failed to fetch reflect accounts. Please try again.",
				color: "red",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const fetchIBANAccounts = async () => {
		setIbanIsLoading(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/beneficiary/account`,
			);
			if (response.ok) {
				const data = await response.json();
				setIbanAccounts(data.data.results || []);
			}
		} catch (error) {
			console.error("Error fetching IBAN accounts:", error);
			notifications.show({
				title: "Error",
				message: "Failed to fetch IBAN accounts. Please try again.",
				color: "red",
			});
		} finally {
			setIbanIsLoading(false);
		}
	};

	const handleAddReflectAccount = async () => {
		if (!reflectName || !reflectMobileNumber) {
			notifications.show({
				title: "Validation Error",
				message: "Please fill in all required fields.",
				color: "orange",
			});
			return;
		}

		try {
			const newReflect = {
				name: reflectName,
				mobileNumber: reflectMobileNumber,
			};

			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/payments/account`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(newReflect),
				},
			);
			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "Reflect account added successfully.",
					color: "green",
				});

				setReflectName("");
				setReflectMobileNumber("");
				setShowReflectForm(false);

				fetchReflectAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to add reflect account.",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error adding reflect account:", error);
			notifications.show({
				title: "Error",
				message: "Failed to add reflect account. Please try again.",
				color: "red",
			});
		}
	};

	const handleAddIBAN = async () => {
		if (!ibanFullName || !ibanNickName) {
			notifications.show({
				title: "Validation Error",
				message: "Please fill in all required fields.",
				color: "orange",
			});
			return;
		}

		try {
			const newIban = {
				fullName: ibanFullName,
				nickName: ibanNickName,
			};

			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/beneficiary/account`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(newIban),
				},
			);
			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "IBAN added successfully.",
					color: "green",
				});

				setIbanFullName("");
				setIbanNickName("");
				setShowIbanForm(false);

				fetchIBANAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to add IBAN.",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error adding IBAN:", error);
			notifications.show({
				title: "Error",
				message: "Failed to add IBAN. Please try again.",
				color: "red",
			});
		}
	};

	const handelDeleteReflect = async (id: number) => {
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/payments/account?id=${id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "Reflect account deleted successfully",
					color: "green",
				});
				fetchReflectAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to delete reflect account",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error deleting reflect account:", error);
			notifications.show({
				title: "Error",
				message: "Failed to delete reflect account",
				color: "red",
			});
		}
	};

	const handelDeleteIban = async (beneficiaryId: string) => {
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/beneficiary/account?beneficiaryId=${beneficiaryId}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "IBAN deleted successfully",
					color: "green",
				});
				fetchIBANAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to delete IBAN",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error deleting IBAN:", error);
			notifications.show({
				title: "Error",
				message: "Failed to delete IBAN",
				color: "red",
			});
		}
	};

	const fetchCliQAccounts = async () => {
		setCliqIsLoading(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/cliq-account`,
			);
			if (response.ok) {
				const data = await response.json();
				setCliqAccounts(data.data.results || []);
			}
		} catch (error) {
			console.error("Error fetching CliQ accounts:", error);
			notifications.show({
				title: "Error",
				message: "Failed to fetch CliQ accounts. Please try again.",
				color: "red",
			});
		} finally {
			setCliqIsLoading(false);
		}
	};

	const handleAddCliQ = async () => {
		if (!cliqFullName || !cliqNickName || !cliqMobileNumber || !cliqAlias) {
			notifications.show({
				title: "Validation Error",
				message: "Please fill in all required fields.",
				color: "orange",
			});
			return;
		}

		try {
			const newCliQ = {
				fullName: cliqFullName,
				nickName: cliqNickName,
				mobileNumber: cliqMobileNumber,
				alias: cliqAlias,
			};

			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/cliq-account`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(newCliQ),
				},
			);
			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "CliQ account added successfully.",
					color: "green",
				});

				setCliqFullName("");
				setCliqNickName("");
				setCliqMobileNumber("");
				setCliqAlias("");
				setShowCliQForm(false);
				fetchCliQAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to add CliQ account.",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error adding CliQ account:", error);
			notifications.show({
				title: "Error",
				message: "Failed to add CliQ account. Please try again.",
				color: "red",
			});
		}
	};

	const handelDeleteCliq = async (id: number) => {
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/cliq/payment/v1/cliq-account?id=${id}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "CliQ account deleted successfully",
					color: "green",
				});
				fetchCliQAccounts();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to delete CliQ account",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error deleting CliQ account:", error);
			notifications.show({
				title: "Error",
				message: "Failed to delete CliQ account",
				color: "red",
			});
		}
	};

	return (
		<div className="space-y-4">
			{/* reflect account section */}
			<div className="space-y-4">
				{/* header */}
				<Group justify="space-between">
					<Text size="lg" fw={600} c="white">
						Reflect Account
					</Text>
					<Group gap="xs">
						<ActionIcon
							variant="light"
							color="blue"
							onClick={fetchReflectAccounts}
							disabled={isLoading}
						>
							<IoRefresh size={18} />
						</ActionIcon>
						<Button
							leftSection={<IoAdd />}
							size="sm"
							onClick={() => setShowReflectForm(!showReflectForm)}
							disabled={isConnected}
						>
							{showReflectForm ? "Cancel" : "Add Reflect Account"}
						</Button>
					</Group>
				</Group>

				{/* add account form */}
				{showReflectForm && (
					<Paper p="md" withBorder>
						<Stack gap="md">
							<Text size="sm" fw={600}>
								Add Reflect Account (Creditor Info)
							</Text>
							<TextInput
								label="Name"
								placeholder="e.g., Ahmed"
								value={reflectName}
								onChange={(e) => setReflectName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Mobile Number (With Country Code)"
								placeholder="e.g., +962 79 1234567"
								value={reflectMobileNumber}
								onChange={(e) => setReflectMobileNumber(e.target.value)}
								required
								size="xs"
							/>
							<Group justify="flex-end" mt="xs">
								<Button size="xs" onClick={handleAddReflectAccount}>
									Add Reflect Account
								</Button>
							</Group>
						</Stack>
					</Paper>
				)}
			</div>

			{/* reflect account list */}
			{isLoading ? (
				<Text c="dimmed" size="sm">
					Loading reflect accounts...
				</Text>
			) : reflectAccounts.length === 0 ? (
				<Text c="dimmed" size="sm">
					{`No Reflect account yet. Click "Reflect Account" to create one.`}
				</Text>
			) : (
				<Stack gap="sm">
					{reflectAccounts.map((account) => (
						<Paper key={account.id} p="md" withBorder>
							<Group justify="space-between" align="center">
								<Stack gap={4} style={{ flex: 1 }}>
									<Text size="sm" fw={500} c="white">
										{account.name}
									</Text>
									<Text size="xs" c="dimmed">
										{account.mobileNumber}
									</Text>
								</Stack>
								<ActionIcon
									color="red"
									variant="subtle"
									onClick={() => handelDeleteReflect(account.id)}
									disabled={isConnected}
								>
									<IoTrash size={16} />
								</ActionIcon>
							</Group>
						</Paper>
					))}
				</Stack>
			)}

			{/* cliq account section */}
			<div className="space-y-4">
				{/* header */}
				<Group justify="space-between">
					<Text size="lg" fw={600} c="white">
						CliQ Account
					</Text>
					<Group gap="xs">
						<Switch
							checked={cliqEnabled}
							onChange={(event) =>
								handleToggleCliq(event.currentTarget.checked)
							}
							disabled={isConnected || cliqLoading}
							label={cliqEnabled ? "Enabled" : "Disabled"}
							size="sm"
							color="green"
						/>
						<ActionIcon
							variant="light"
							color="blue"
							onClick={fetchCliQAccounts}
							disabled={cliqIsLoading}
						>
							<IoRefresh size={18} />
						</ActionIcon>
						<Button
							leftSection={<IoAdd />}
							size="sm"
							onClick={() => setShowCliQForm(!showCliQForm)}
							disabled={isConnected}
						>
							{showCliQForm ? "Cancel" : "Add CliQ Account"}
						</Button>
					</Group>
				</Group>
			</div>

			{/* add cliq form */}
			{showCliQForm && (
				<Paper p="md" withBorder>
					<Stack gap="md">
						<Text size="sm" fw={600}>
							Add CliQ Account
						</Text>

						<div className="grid grid-cols-2 gap-4">
							<TextInput
								label="Name"
								placeholder="e.g., Ahmed Quwais"
								value={cliqFullName}
								onChange={(e) => setCliqFullName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Nick Name"
								placeholder="e.g., Ahmed"
								value={cliqNickName}
								onChange={(e) => setCliqNickName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Mobile Number"
								placeholder="e.g., +962 79 1234567"
								value={cliqMobileNumber}
								onChange={(e) => setCliqMobileNumber(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Alias"
								placeholder="e.g., RANEEM99"
								value={cliqAlias}
								onChange={(e) => setCliqAlias(e.target.value)}
								required
								size="xs"
							/>
						</div>

						<Group justify="flex-end" mt="xs">
							<Button size="xs" onClick={handleAddCliQ}>
								Add CliQ Account
							</Button>
						</Group>
					</Stack>
				</Paper>
			)}

			{/* cliq account list */}
			{cliqIsLoading ? (
				<Text c="dimmed" size="sm">
					Loading CliQ accounts...
				</Text>
			) : cliqAccounts.length === 0 ? (
				<Text c="dimmed" size="sm">
					{`No CliQ account yet. Click "Add CliQ Account" to create one.`}
				</Text>
			) : (
				<Stack gap="sm">
					{cliqAccounts.map((account) => (
						<Paper key={account.id} p="md" withBorder>
							<Group justify="space-between" align="center">
								<Stack gap={4} style={{ flex: 1 }}>
									<Text size="sm" fw={500} c="white">
										{account.name}
									</Text>
									<Text size="xs" c="dimmed">
										Nick Name: {account.nickName}
									</Text>
									<Text size="xs" c="dimmed">
										Mobile Number: {account.mobileNumber}
									</Text>
									<Text size="xs" c="dimmed">
										Alias: {account.alias}
									</Text>
								</Stack>
								<ActionIcon
									color="red"
									variant="subtle"
									onClick={() => handelDeleteCliq(account.id)}
									disabled={isConnected}
								>
									<IoTrash size={16} />
								</ActionIcon>
							</Group>
						</Paper>
					))}
				</Stack>
			)}

			{/* iban account section */}
			<div className="space-y-4">
				{/* header */}
				<Group justify="space-between">
					<Text size="lg" fw={600} c="white">
						IBAN (Saved Beneficiary)
					</Text>
					<Group gap="xs">
						<ActionIcon
							variant="light"
							color="blue"
							onClick={fetchIBANAccounts}
							disabled={ibanIsLoading}
						>
							<IoRefresh size={18} />
						</ActionIcon>
						<Button
							leftSection={<IoAdd />}
							size="sm"
							onClick={() => setShowIbanForm(!showIbanForm)}
							disabled={isConnected}
						>
							{showIbanForm ? "Cancel" : "Add IBAN"}
						</Button>
					</Group>
				</Group>

				{/* add iban form */}
				{showIbanForm && (
					<Paper p="md" withBorder>
						<Stack gap="md">
							<Text size="sm" fw={600}>
								Add IBAN (Saved Beneficiary)
							</Text>
							{/* IBAN form fields go here */}
							<TextInput
								label="Full Name"
								placeholder="e.g., Ahmed Quwais"
								value={ibanFullName}
								onChange={(e) => setIbanFullName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Nick Name"
								placeholder="e.g., Ahmed"
								value={ibanNickName}
								onChange={(e) => setIbanNickName(e.target.value)}
								required
								size="xs"
							/>
							<Group justify="flex-end" mt="xs">
								<Button size="xs" onClick={handleAddIBAN}>
									Add IBAN
								</Button>
							</Group>
						</Stack>
					</Paper>
				)}

				{/* iban account list */}
				{ibanIsLoading ? (
					<Text c="dimmed" size="sm">
						Loading IBAN accounts...
					</Text>
				) : ibanAccounts.length === 0 ? (
					<Text c="dimmed" size="sm">
						{`No IBAN account yet. Click "Add IBAN" to create one.`}
					</Text>
				) : (
					<Stack gap="sm">
						{ibanAccounts.map((account) => (
							<Paper key={account.beneficiaryId} p="md" withBorder>
								<Group justify="space-between" align="center">
									<Stack gap={4} style={{ flex: 1 }}>
										<Text size="sm" fw={500} c="white">
											{account.fullName}
										</Text>
										<Text size="xs" c="dimmed">
											Nick Name: {account.nickName}
										</Text>
										<Text size="xs" c="dimmed">
											IBAN: {account.accountNumber}
										</Text>
									</Stack>
									<ActionIcon
										color="red"
										variant="subtle"
										onClick={() => handelDeleteIban(account.beneficiaryId)}
										disabled={isConnected}
									>
										<IoTrash size={16} />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</Stack>
				)}
			</div>
		</div>
	);
};

export default TransferAccountSection;
