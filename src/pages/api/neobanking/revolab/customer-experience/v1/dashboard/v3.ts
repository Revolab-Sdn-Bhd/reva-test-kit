import type { NextApiRequest, NextApiResponse } from "next";
import { getAllSubAccounts, getUser } from "@/lib/cache";

interface CustomerAccount {
	id: string;
	balance: number;
	currency: string;
	visible: boolean;
}

interface SavingSpaceAccount {
	id: string;
	balance: number;
	currency: string;
}

interface DashboardV3Response {
	metadata: {
		queryParameters: Record<string, any>;
		pagination: null;
	};
	links: Array<{
		href: string;
		method: string;
		rel: string;
	}>;
	data: {
		customerDetails: {
			name: string;
			gender: string;
			emailVerified: boolean;
		};
		customerAccounts: {
			totalBalance: number;
			currency: string;
			visible: boolean;
			wallet: {
				balance: number;
				currency: string;
				visible: boolean;
			};
			subAccounts: CustomerAccount[];
			savingSpace: SavingSpaceAccount[];
		};
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<DashboardV3Response | { error: string }>,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		// Get user and sub-accounts
		const user = getUser();
		const subAccounts = getAllSubAccounts();

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Calculate total balance (sum of all sub-accounts in base currency JOD)
		// For simplicity, we'll use the primary account (JOD) as the main balance
		const primaryAccount = subAccounts.find((acc) => acc.orderIndex === 0);
		const totalBalance = primaryAccount?.accountBalance || 0;

		// Map sub-accounts
		const subAccountsData: CustomerAccount[] = subAccounts.map((acc) => ({
			id: acc.id,
			balance: acc.accountBalance,
			currency: acc.currency,
			visible: acc.visibility,
		}));

		// Map all saving spaces from all sub-accounts
		const allSavingSpaces: SavingSpaceAccount[] = [];
		subAccounts.forEach((subAccount) => {
			if (subAccount.savingSpaces && subAccount.savingSpaces.length > 0) {
				subAccount.savingSpaces.forEach((space) => {
					allSavingSpaces.push({
						id: space.savingSpaceId,
						balance: space.savedAmount.amount,
						currency: space.savedAmount.currency,
					});
				});
			}
		});

		// Prepare response
		const response: DashboardV3Response = {
			metadata: {
				queryParameters: {},
				pagination: null,
			},
			links: [
				{
					href: "/neobanking/customer-experience/v1/dashboard/v3",
					method: "GET",
					rel: "self",
				},
			],
			data: {
				customerDetails: {
					name: user.name,
					gender: "Male", // Mock data - not stored in DB
					emailVerified: false, // Mock data - not stored in DB
				},
				customerAccounts: {
					totalBalance,
					currency: primaryAccount?.currency || "JOD",
					visible: false,
					wallet: {
						balance: totalBalance,
						currency: primaryAccount?.currency || "JOD",
						visible: false,
					},
					subAccounts: subAccountsData,
					savingSpace: allSavingSpaces,
				},
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error fetching dashboard v3:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
