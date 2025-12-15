import type { NextApiRequest, NextApiResponse } from "next";
import {
	createSubAccount,
	deleteSubAccount,
	getAllSubAccounts,
	getUser,
	upsertUser,
} from "../../../../../../../lib/cache";
import type { UserAccountCreationRequest } from "../../../../../../../types/accounts";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method === "POST") {
		try {
			const data = req.body as UserAccountCreationRequest;

			// Validate request
			if (!data.user || !data.primaryAccount) {
				return res.status(400).json({
					error: "User info and primary account are required",
				});
			}

			// Check if user already exists
			let user = getUser();
			if (user) {
				return res.status(409).json({
					error:
						"User already exists. Delete existing user first or use a different endpoint to add sub-accounts.",
				});
			}

			// Create user
			user = upsertUser({
				name: data.user.name,
				virtualIban: data.user.virtualIban,
			});

			// Create primary account
			const primaryAccount = createSubAccount(user.id, {
				...data.primaryAccount,
				orderIndex: 0, // Primary account is always first
			});

			// Create sub-accounts
			const createdSubAccounts = [];
			if (data.subAccounts && data.subAccounts.length > 0) {
				for (let i = 0; i < data.subAccounts.length; i++) {
					const subAccount = createSubAccount(user.id, {
						...data.subAccounts[i],
						orderIndex: i + 1, // Start from 1 after primary
					});
					createdSubAccounts.push(subAccount);
				}
			}

			res.status(201).json({
				message: "User and accounts created successfully",
				user,
				primaryAccount,
				subAccounts: createdSubAccounts,
				totalAccounts: 1 + createdSubAccounts.length,
			});
		} catch (error: any) {
			console.error("Error creating user and accounts:", error);
			res.status(500).json({ error: error.message });
		}
	} else if (req.method === "GET") {
		try {
			const subAccounts = getAllSubAccounts();

			res.status(200).json({
				metadata: {
					queryParameters: {},
				},
				links: [
					{
						rel: "self",
						href: "/api/neobanking/account-experience/v1/sub-accounts",
						method: "GET",
					},
				],
				data: subAccounts,
			});
		} catch (error: any) {
			console.error("Error fetching sub-accounts:", error);
			res.status(500).json({ error: error.message });
		}
	} else if (req.method === "DELETE") {
		try {
			const { subAccountId } = req.query;

			if (!subAccountId || typeof subAccountId !== "string") {
				return res.status(400).json({ error: "subAccountId is required" });
			}

			const deleted = deleteSubAccount(subAccountId);

			if (!deleted) {
				return res.status(404).json({ error: "Sub-account not found" });
			}

			res.status(200).json({
				message: "Sub-account deleted successfully",
			});
		} catch (error: any) {
			console.error("Error deleting sub-account:", error);
			res.status(500).json({ error: error.message });
		}
	} else {
		res.setHeader("Allow", ["POST", "GET", "DELETE"]);
		res.status(405).end(`Method ${req.method} Not Allowed`);
	}
}
