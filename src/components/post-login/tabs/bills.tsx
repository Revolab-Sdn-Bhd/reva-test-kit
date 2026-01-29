import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type React from "react";
import { useEffect, useState } from "react";
import { IoAdd, IoRefresh, IoTrash } from "react-icons/io5";
import { AB_API_ENDPOINT } from "@/lib/constant";

interface BillingInfo {
	status: string;
	billerName: string;
	paymentType: string;
	serviceType: string;
	iconLink: string;
	billerCode: string;
	customerIdentifier: string;
	nickName: string;
}

interface BillProfile {
	billingInfo: BillingInfo[];
	customerProviderIdentifier: string;
}

interface BillsSectionProps {
	isConnected: boolean;
}

const BillsSection: React.FC<BillsSectionProps> = ({ isConnected }) => {
	const [billProfiles, setBillProfiles] = useState<BillProfile[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);

	// Form state
	const [billerName, setBillerName] = useState("");
	const [serviceType, setServiceType] = useState("Electricity");
	const [paymentType, setPaymentType] = useState("Postpaid");
	const [billerCode, setBillerCode] = useState("");
	const [customerIdentifier, setCustomerIdentifier] = useState("");
	const [nickName, setNickName] = useState("");
	const [customerProviderIdentifier, setCustomerProviderIdentifier] =
		useState("");
	const [dueAmount, setDueAmount] = useState("");

	const serviceTypes = [
		{ value: "Electricity", label: "Electricity" },
		{ value: "Water", label: "Water" },
		{ value: "Gas", label: "Gas" },
		{ value: "Internet", label: "Internet" },
		{ value: "Telecommunications", label: "Telecommunications" },
		{ value: "Insurance", label: "Insurance" },
	];

	const paymentTypes = [
		{ value: "Postpaid", label: "Postpaid" },
		{ value: "Prepaid", label: "Prepaid" },
	];

	useEffect(() => {
		fetchBillProfiles();
	}, []);

	const fetchBillProfiles = async () => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/bills/profile`,
			);
			if (response.ok) {
				const data = await response.json();
				setBillProfiles(data.data.results || []);
			}
		} catch (error) {
			console.error("Error fetching bill profiles:", error);
			notifications.show({
				title: "Error",
				message: "Failed to fetch bill profiles",
				color: "red",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddBill = async () => {
		if (
			!billerName ||
			!billerCode ||
			!customerIdentifier ||
			!nickName ||
			!customerProviderIdentifier ||
			!dueAmount
		) {
			notifications.show({
				title: "Validation Error",
				message: "Please fill in all required fields",
				color: "orange",
			});
			return;
		}

		try {
			const newBill = {
				billingInfo: [
					{
						status: "Active",
						billerName,
						paymentType,
						serviceType,
						iconLink:
							"https://storage.googleapis.com/download/storage/v1/b/ab-gcp-tst02-gcs-neocms-scanned/o/collections%2Fbiller-logos%2F39%2F280458.png?generation=1630932751310874&alt=media",
						billerCode,
						customerIdentifier,
						nickName,
						dueAmount,
					},
				],
				customerProviderIdentifier,
			};

			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/bills/profile`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(newBill),
				},
			);

			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "Bill profile added successfully",
					color: "green",
				});

				// Reset form
				setBillerName("");
				setBillerCode("");
				setCustomerIdentifier("");
				setNickName("");
				setCustomerProviderIdentifier("");
				setServiceType("Electricity");
				setPaymentType("Postpaid");
				setShowAddForm(false);
				setDueAmount("");

				fetchBillProfiles();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to add bill profile",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error adding bill:", error);
			notifications.show({
				title: "Error",
				message: "Failed to add bill profile",
				color: "red",
			});
		}
	};

	const handleDeleteBill = async (customerProviderId: string) => {
		try {
			const response = await fetch(
				`${AB_API_ENDPOINT}/payment-experience/v1/bills/profile?customerProviderIdentifier=${customerProviderId}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				notifications.show({
					title: "Success",
					message: "Bill profile deleted successfully",
					color: "green",
				});
				fetchBillProfiles();
			} else {
				const error = await response.json();
				notifications.show({
					title: "Error",
					message: error.error || "Failed to delete bill profile",
					color: "red",
				});
			}
		} catch (error) {
			console.error("Error deleting bill:", error);
			notifications.show({
				title: "Error",
				message: "Failed to delete bill profile",
				color: "red",
			});
		}
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<Group justify="space-between">
				<Text size="lg" fw={600} c="white">
					Bill Profiles
				</Text>
				<Group gap="xs">
					<ActionIcon
						variant="light"
						color="blue"
						onClick={fetchBillProfiles}
						disabled={isLoading}
					>
						<IoRefresh size={18} />
					</ActionIcon>
					<Button
						leftSection={<IoAdd />}
						size="sm"
						onClick={() => setShowAddForm(!showAddForm)}
						disabled={isConnected}
					>
						{showAddForm ? "Cancel" : "Add Bill"}
					</Button>
				</Group>
			</Group>

			{/* Add Bill Form */}
			{showAddForm && (
				<Paper p="md" withBorder>
					<Stack gap="xs">
						<Text size="sm" fw={600}>
							Add New Bill Profile
						</Text>
						<Group grow>
							<TextInput
								label="Biller Name"
								placeholder="e.g., Madfooat2"
								value={billerName}
								onChange={(e) => setBillerName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Due Amount (JOD)"
								placeholder="e.g., 100"
								value={dueAmount}
								onChange={(e) => setDueAmount(e.target.value)}
								required
								size="xs"
							/>
						</Group>
						<Group grow>
							<Select
								label="Service Type"
								data={serviceTypes}
								value={serviceType}
								onChange={(value) => setServiceType(value || "Electricity")}
								size="xs"
							/>
							<Select
								label="Payment Type"
								data={paymentTypes}
								value={paymentType}
								onChange={(value) => setPaymentType(value || "Postpaid")}
								size="xs"
							/>
						</Group>
						<Group grow>
							<TextInput
								label="Biller Code"
								placeholder="e.g., 39"
								value={billerCode}
								onChange={(e) => setBillerCode(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Customer Identifier"
								placeholder="e.g., 8282"
								value={customerIdentifier}
								onChange={(e) => setCustomerIdentifier(e.target.value)}
								required
								size="xs"
							/>
						</Group>
						<Group grow>
							<TextInput
								label="Nick Name"
								placeholder="e.g., Electricity"
								value={nickName}
								onChange={(e) => setNickName(e.target.value)}
								required
								size="xs"
							/>
							<TextInput
								label="Customer Provider ID"
								placeholder="e.g., 1763748"
								value={customerProviderIdentifier}
								onChange={(e) => setCustomerProviderIdentifier(e.target.value)}
								required
								size="xs"
							/>
						</Group>
						<Group justify="flex-end" mt="xs">
							<Button size="xs" onClick={handleAddBill}>
								Add Bill Profile
							</Button>
						</Group>
					</Stack>
				</Paper>
			)}

			{/* Bill Profiles List */}
			{isLoading ? (
				<Text c="dimmed" size="sm">
					Loading bill profiles...
				</Text>
			) : billProfiles.length === 0 ? (
				<Text c="dimmed" size="sm">
					{`No bill profiles yet. Click "Add Bill" to create one.`}
				</Text>
			) : (
				<Stack gap="sm">
					{billProfiles.map((profile) => (
						<Paper key={profile.customerProviderIdentifier} p="md" withBorder>
							<Group justify="space-between" mb="xs">
								<Text size="sm" fw={600} c="blue">
									Provider ID: {profile.customerProviderIdentifier}
								</Text>
								<ActionIcon
									color="red"
									variant="subtle"
									onClick={() =>
										handleDeleteBill(profile.customerProviderIdentifier)
									}
									disabled={isConnected}
								>
									<IoTrash size={16} />
								</ActionIcon>
							</Group>
							<Stack gap="xs">
								{profile.billingInfo.map((bill) => (
									<div
										key={bill.billerCode}
										className="p-2 rounded bg-gray-800/50"
									>
										<Group justify="space-between" wrap="nowrap">
											<div>
												<Text size="sm" fw={500} c="white">
													{bill.nickName}
												</Text>
												<Text size="xs" c="dimmed">
													{bill.billerName}
												</Text>
											</div>
											<div className="text-right">
												<Text size="xs" c="dimmed">
													{bill.serviceType}
												</Text>
												<Text size="xs" c="dimmed">
													{bill.paymentType}
												</Text>
											</div>
										</Group>
										<Group gap="xs" mt="xs">
											<Text size="xs" c="dimmed">
												Code: {bill.billerCode}
											</Text>
											<Text size="xs" c="dimmed">
												•
											</Text>
											<Text size="xs" c="dimmed">
												ID: {bill.customerIdentifier}
											</Text>
											<Text size="xs" c="dimmed">
												•
											</Text>
											<Text
												size="xs"
												c={bill.status === "Active" ? "green" : "gray"}
											>
												{bill.status}
											</Text>
										</Group>
									</div>
								))}
							</Stack>
						</Paper>
					))}
				</Stack>
			)}
		</div>
	);
};

export default BillsSection;
