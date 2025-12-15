import type { NextApiRequest, NextApiResponse } from "next";
import { getAllSubAccounts, getUser } from "@/lib/cache";

// GET handler - Retrieve all sub-accounts with saving spaces
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const user = getUser();

		// Get query parameters
		const page = parseInt((req.query.page as string) || "1", 10);
		const size = parseInt((req.query.size as string) || "10", 10);

		// Get all sub-accounts from database
		const allSubAccounts = getAllSubAccounts();

		// Fill in name and accountNumber for each saving space
		allSubAccounts.forEach((subAccount: any) => {
			if (subAccount.savingSpaces) {
				subAccount.savingSpaces.forEach((space: any) => {
					space.name = user?.name || "";
					space.accountNumber = subAccount.accountNumber;
				});
			}
		});

		// Calculate pagination
		const totalRecords = allSubAccounts.length;
		const totalPages = Math.ceil(totalRecords / size);
		const startIndex = (page - 1) * size;
		const endIndex = startIndex + size;
		const paginatedAccounts = allSubAccounts.slice(startIndex, endIndex);
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
					href: `/api/neobanking/customer-experience/v1/accounts?page=${page}&size=${size}`,
					method: "GET",
				},
				...(hasNext
					? [
							{
								rel: "next",
								href: `/api/neobanking/customer-experience/v1/accounts?page=${page + 1}&size=${size}`,
								method: "GET",
							},
						]
					: []),
				...(page > 1
					? [
							{
								rel: "prev",
								href: `/api/neobanking/customer-experience/v1/accounts?page=${page - 1}&size=${size}`,
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

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method === "GET") {
		return handleGet(req, res);
	}

	return res.status(405).json({ error: "Method not allowed" });
}
