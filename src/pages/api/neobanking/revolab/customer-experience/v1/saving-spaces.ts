import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import {
	createSavingSpace,
	deleteSubAccount,
	getAllSubAccounts,
	getUser,
} from "@/lib/cache";
import type {
	Amount,
	SavingSpace,
	SavingsStatusLifecycle,
} from "@/types/savingSpaces";

// Helper function to generate UUID
const generateUUID = (): string => {
	return uuidv4();
};

// Helper function to calculate remaining amount and percentages
const calculateMetrics = (
	savedAmount: number,
	targetAmount: number,
): {
	remainingAmount: number;
	remainingPercentage: number;
	savedPercentage: number;
} => {
	const remainingAmount = targetAmount - savedAmount;
	const savedPercentage =
		targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0;
	const remainingPercentage =
		targetAmount > 0 ? (remainingAmount / targetAmount) * 100 : 0;

	return {
		remainingAmount: Math.max(0, remainingAmount),
		remainingPercentage: Math.max(0, Math.min(100, remainingPercentage)),
		savedPercentage: Math.max(0, Math.min(100, savedPercentage)),
	};
};

// Helper function to create Amount object
const createAmount = (currency: string, amount: number): Amount => ({
	currency,
	amount,
});

// Helper function to create lifecycle entry
const createLifecycleEntry = (
	status: string,
	description: string,
): SavingsStatusLifecycle => ({
	status,
	statusChangeDate: new Date().toISOString(),
	description,
});

// POST handler - Create new saving spaces for a sub-account
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const { subAccountId } = req.query;
		const { savingSpaces } = req.body;

		// Validate sub-account ID
		if (!subAccountId || typeof subAccountId !== "string") {
			return res
				.status(400)
				.json({ error: "subAccountId query parameter is required" });
		}

		if (
			!savingSpaces ||
			!Array.isArray(savingSpaces) ||
			savingSpaces.length === 0
		) {
			return res
				.status(400)
				.json({ error: "At least one saving space is required" });
		}

		// Create saving spaces for the sub-account
		const newSavingSpaces: SavingSpace[] = [];
		for (const item of savingSpaces) {
			// Generate IDs
			const savingSpaceId = generateUUID();
			const apiInteractionId = item.apiInteractionId || generateUUID();
			const categoryPictureId = item.categoryPictureId || generateUUID();

			// Calculate metrics
			const savedAmount = item.savedAmount?.amount || 0;
			const targetAmount = item.targetAmount.amount;
			const metrics = calculateMetrics(savedAmount, targetAmount);

			// Create saving space object
			const newSavingSpace: SavingSpace = {
				savingSpaceId,
				apiInteractionId,
				categoryPictureId,
				name: "", // Will be filled from sub-account/user data when retrieved
				description: item.description || "",
				accountNumber: "", // Will be filled from sub-account data when retrieved
				categoryName: item.categoryName,
				frequency: item.frequency || "MONTHLY",
				status: item.status || "ACTIVE",
				categoryPictureUrl: item.categoryPictureUrl || "",
				targetDate: item.targetDate,
				startDate: item.startDate || new Date().toISOString().split("T")[0],
				partyId: item.partyId || "PARTY123",
				targetAmount: item.targetAmount,
				savedAmount:
					item.savedAmount || createAmount(item.targetAmount.currency, 0),
				remainingAmount: createAmount(
					item.targetAmount.currency,
					metrics.remainingAmount,
				),
				savedPercentage: metrics.savedPercentage,
				remainingPercentage: metrics.remainingPercentage,
				savingsStatusLifeCycles: [
					createLifecycleEntry(item.status || "ACTIVE", "CREATED"),
				],
			};

			// Save to database
			createSavingSpace(subAccountId, newSavingSpace);
			newSavingSpaces.push(newSavingSpace);
		}

		return res.status(201).json({
			success: true,
			message: "Saving spaces created successfully",
			count: newSavingSpaces.length,
		});
	} catch (error) {
		console.error("Error creating saving space:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

// GET handler - Retrieve all saving spaces
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const user = getUser();

		// Get query parameters
		const page = parseInt((req.query.page as string) || "0", 10);
		const size = parseInt((req.query.size as string) || "10", 10);

		// Get all sub-accounts and extract all saving spaces
		const allSubAccounts = getAllSubAccounts();
		const allSavingSpaces: any[] = [];

		// Flatten all saving spaces from all sub-accounts
		allSubAccounts.forEach((subAccount: any) => {
			if (subAccount.savingSpaces && subAccount.savingSpaces.length > 0) {
				subAccount.savingSpaces.forEach((space: any) => {
					allSavingSpaces.push({
						...space,
						accountNumber: subAccount.accountNumber,
					});
				});
			}
		});

		// Calculate pagination
		const totalRecords = allSavingSpaces.length;
		const totalPages = Math.ceil(totalRecords / size);
		const startIndex = page * size;
		const endIndex = startIndex + size;
		const paginatedSpaces = allSavingSpaces.slice(startIndex, endIndex);
		const hasNext = page < totalPages - 1;

		// Build response
		const response = {
			metadata: {
				queryParameters: {
					page: page.toString(),
					size: size.toString(),
				},
				pagination: {
					totalRecords,
					totalPages,
					hasNext,
				},
			},
			data: {
				results: paginatedSpaces,
			},
			links: [
				{
					rel: "self",
					href: `/neobanking/customer-experience/v1/saving-spaces?page=${page}&size=${size}`,
					method: "GET",
				},
			],
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error retrieving saving spaces:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

// DELETE handler - Delete sub-account and all saving spaces
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const { subAccountId } = req.query;

		if (!subAccountId || typeof subAccountId !== "string") {
			return res
				.status(400)
				.json({ error: "subAccountId query parameter is required" });
		}

		const deleted = deleteSubAccount(subAccountId);

		if (!deleted) {
			return res.status(404).json({ error: "Sub-account not found" });
		}

		return res.status(200).json({
			success: true,
			message: "Sub-account and all saving spaces deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting sub-account:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

// Main API handler
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method === "POST") {
		return handlePost(req, res);
	}

	if (req.method === "GET") {
		return handleGet(req, res);
	}

	if (req.method === "DELETE") {
		return handleDelete(req, res);
	}

	return res.status(405).json({ error: "Method not allowed" });
}
