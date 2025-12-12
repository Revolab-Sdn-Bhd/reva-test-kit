import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";
import { AB_API_ENDPOINT } from "@/lib/constant";
import {
	createSavingSpace,
	deleteUser,
	getAllUsers,
	getUserByAccount,
	upsertUser,
} from "../../../../../lib/cache";
import type {
	Amount,
	SavingSpace,
	SavingsStatusLifecycle,
	UserAccount,
	UserSavingSpacesFormData,
} from "../../../../../types/savingSpaces";

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

// POST handler - Create new saving space
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const formData: UserSavingSpacesFormData = req.body;

		// Validate required fields
		if (!formData.userData.name || !formData.userData.accountNumber) {
			return res
				.status(400)
				.json({ error: "Missing required user data fields" });
		}

		if (!formData.savingSpaces || formData.savingSpaces.length === 0) {
			return res
				.status(400)
				.json({ error: "At least one saving space is required" });
		}

		// Check if user exists
		const user = getUserByAccount(
			formData.userData.name,
			formData.userData.accountNumber,
		);

		let userId: string;

		if (user) {
			// Update existing user
			userId = user.id;
			upsertUser({
				id: userId,
				name: formData.userData.name,
				accountNumber: formData.userData.accountNumber,
				accountBalance: formData.userData.accountBalance,
				currency: formData.userData.currency,
			});
		} else {
			// Create new user
			userId = generateUUID();
			upsertUser({
				id: userId,
				name: formData.userData.name,
				accountNumber: formData.userData.accountNumber,
				accountBalance: formData.userData.accountBalance,
				currency: formData.userData.currency,
			});
		}

		// Create saving spaces
		const newSavingSpaces: SavingSpace[] = [];
		for (const item of formData.savingSpaces) {
			// Generate IDs
			const savingSpaceId = generateUUID();
			const apiInteractionId = generateUUID();
			const categoryPictureId = generateUUID();

			// Calculate metrics
			const metrics = calculateMetrics(
				item.savedAmount || 0,
				item.targetAmount,
			);

			// Create saving space object
			const newSavingSpace: SavingSpace = {
				savingSpaceId,
				apiInteractionId,
				categoryPictureId,
				name: formData.userData.name,
				description: item.description || "",
				accountNumber: formData.userData.accountNumber,
				categoryName: item.categoryName,
				frequency: item.frequency || "MONTHLY",
				status: "ACTIVE",
				categoryPictureUrl: "",
				targetDate: item.targetDate,
				startDate: new Date().toISOString(),
				partyId: "PARTY123",
				targetAmount: createAmount(
					formData.userData.currency,
					item.targetAmount,
				),
				savedAmount: createAmount(
					formData.userData.currency,
					item.savedAmount || 0,
				),
				remainingAmount: createAmount(
					formData.userData.currency,
					metrics.remainingAmount,
				),
				savedPercentage: metrics.savedPercentage,
				remainingPercentage: metrics.remainingPercentage,
				savingsStatusLifeCycles: [createLifecycleEntry("ACTIVE", "CREATED")],
			};

			// Save to database
			createSavingSpace(userId, newSavingSpace);
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

// GET handler - Retrieve all user accounts
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		// Get query parameters
		const page = parseInt((req.query.page as string) || "1", 10);
		const size = parseInt((req.query.size as string) || "10", 10);

		// Get all accounts from database
		const allAccounts: UserAccount[] = getAllUsers();

		// Fill in name and accountNumber for each saving space
		allAccounts.forEach((account) => {
			account.savingSpaces.forEach((space) => {
				space.name = account.name;
				space.accountNumber = account.accountNumber;
			});
		});

		// Calculate pagination
		const totalRecords = allAccounts.length;
		const totalPages = Math.ceil(totalRecords / size);
		const startIndex = (page - 1) * size;
		const endIndex = startIndex + size;
		const paginatedAccounts = allAccounts.slice(startIndex, endIndex);
		const hasNext = page < totalPages;

		// Build response with UserAccount data
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
				results: paginatedAccounts,
			},
			links: [
				{
					rel: "self",
					href: `${AB_API_ENDPOINT}/saving-spaces?page=${page}&size=${size}`,
					method: "GET",
				},
				...(hasNext
					? [
							{
								rel: "next",
								href: `${AB_API_ENDPOINT}/saving-spaces?page=${page + 1}&size=${size}`,
								method: "GET",
							},
						]
					: []),
				...(page > 1
					? [
							{
								rel: "prev",
								href: `${AB_API_ENDPOINT}/saving-spaces?page=${page - 1}&size=${size}`,
								method: "GET",
							},
						]
					: []),
			],
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error retrieving saving spaces:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
};

// DELETE handler - Delete user account and all saving spaces
const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const { userId } = req.query;

		if (!userId || typeof userId !== "string") {
			return res.status(400).json({ error: "User ID is required" });
		}

		const deleted = deleteUser(userId);

		if (!deleted) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.status(200).json({
			success: true,
			message: "User account and all saving spaces deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting user account:", error);
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
