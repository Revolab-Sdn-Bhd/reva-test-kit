import type { NextApiRequest, NextApiResponse } from "next";
import { getAllSubAccounts, getUser } from "@/lib/cache";
import type {
	AccountDashboardResponse,
	PrimaryAccount,
	SubAccountResponse,
} from "@/types/accounts";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "GET") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		// Get the main user
		const user = getUser();

		if (!user) {
			// Return empty response if no user
			const response: AccountDashboardResponse = {
				metadata: {
					queryParameters: {},
				},
				links: [
					{
						rel: "self",
						href: "/neobanking/account-experience/v1/sub-accounts/dashboard",
						method: "GET",
					},
				],
				data: {
					primaryAccount: {
						totalBalance: {
							amount: 0,
							currency: "JOD",
						},
						currencyFlag: "🇯🇴",
						totalOutstandingBalance: {
							amount: 0,
							currency: "JOD",
						},
						name: "",
						virtualIban: "",
					},
					subAccounts: [],
				},
			};

			return res.status(200).json(response);
		}

		// Get all sub-accounts for this user
		const subAccounts = getAllSubAccounts();

		// Calculate totals across all sub-accounts
		const primaryCurrency = subAccounts[0]?.currency || "JOD";

		// Map currency to flags
		const currencyFlags: Record<string, string> = {
			USD: "🇺🇸",
			EUR: "🇪🇺",
			GBP: "🇬🇧",
			JOD: "🇯🇴",
		};

		// Build primary account from aggregated data
		const primaryAccount: PrimaryAccount = {
			totalBalance: {
				amount: subAccounts.reduce((sum, acc) => sum + acc.accountBalance, 0),
				currency: primaryCurrency,
			},
			currencyFlag: currencyFlags[primaryCurrency] || "🌍",
			totalOutstandingBalance: {
				amount: subAccounts.reduce((sum, acc) => {
					return (
						sum +
						(acc.savingSpaces?.reduce(
							(spaceSum: number, space: any) =>
								spaceSum + space.savedAmount.amount,
							0,
						) || 0)
					);
				}, 0),
				currency: primaryCurrency,
			},
			name: user.name,
			virtualIban: user.virtualIban,
		};

		// Convert sub-accounts to response format
		const subAccountsResponse: SubAccountResponse[] = subAccounts.map(
			(account) => {
				const accountOutstanding =
					account.savingSpaces?.reduce(
						(sum: number, space: any) => sum + space.savedAmount.amount,
						0,
					) || 0;

				return {
					enabledCardTransactions: account.enabledCardTransactions,
					totalOutstandingBalance: {
						amount: accountOutstanding,
						currency: account.currency,
					},
					accountNumber: account.accountNumber,
					currencyFlag: currencyFlags[account.currency] || "🌍",
					enabledAutoFund: account.enabledAutoFund,
					currencySymbol: account.currencySymbol,
					currencyAccountName: account.currencyAccountName,
					visibility: account.visibility,
					order: account.orderIndex,
					totalBalance: {
						amount: account.accountBalance,
						currency: account.currency,
					},
					name: user.name,
					virtualIban: user.virtualIban,
				};
			},
		);

		const response: AccountDashboardResponse = {
			metadata: {
				queryParameters: {},
			},
			links: [
				{
					rel: "self",
					href: "/neobanking/account-experience/v1/sub-accounts/dashboard",
					method: "GET",
				},
			],
			data: {
				primaryAccount,
				subAccounts: subAccountsResponse,
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error retrieving account dashboard:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
