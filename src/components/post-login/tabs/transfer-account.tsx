import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Stack,
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

const TransferAccountSection = ({
	isConnected,
}: TransferAccountSectionProps) => {
	const [reflectAccounts, setReflectAccounts] = useState<ReflectAccount[]>([]);

	const [showReflectForm, setShowReflectForm] = useState(false);
	const [showCliQForm, setShowCliQForm] = useState(false);
	const [showIbanForm, setShowIbanForm] = useState(false);

	const [isLoading, setIsLoading] = useState(false);

	const [reflectName, setReflectName] = useState("");
	const [reflectMobileNumber, setReflectMobileNumber] = useState("");

	useEffect(() => {
		fetchReflectAccounts();
	}, []);

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
						<ActionIcon
							variant="light"
							color="blue"
							// onClick={fetchBillProfiles}
							// disabled={isLoading}
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

			{/* iban account section */}
			<div className="space-y-4">
				{/* header */}
				<Group justify="space-between">
					<Text size="lg" fw={600} c="white">
						IBAN Account
					</Text>
					<Group gap="xs">
						<ActionIcon
							variant="light"
							color="blue"
							// onClick={fetchBillProfiles}
							// disabled={isLoading}
						>
							<IoRefresh size={18} />
						</ActionIcon>
						<Button
							leftSection={<IoAdd />}
							size="sm"
							onClick={() => setShowIbanForm(!showIbanForm)}
							disabled={isConnected}
						>
							{showIbanForm ? "Cancel" : "Add IBAN Account"}
						</Button>
					</Group>
				</Group>
			</div>
		</div>
	);
};

export default TransferAccountSection;
