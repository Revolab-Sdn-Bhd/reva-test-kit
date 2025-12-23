import type { NextApiRequest, NextApiResponse } from "next";
import {
	type BillProfile,
	createBillProfile,
	deleteBillProfile,
	getAllBillProfiles,
	getBillProfileById,
} from "@/lib/cache";

interface BillProfileResponse {
	data: {
		results: BillProfile[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		BillProfileResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			const profiles = getAllBillProfiles();

			const response: BillProfileResponse = {
				data: {
					results: profiles,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error fetching bill profiles:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	if (req.method === "POST") {
		try {
			const { billingInfo, customerProviderIdentifier } = req.body;

			if (!billingInfo || !Array.isArray(billingInfo)) {
				return res.status(400).json({
					error: "billingInfo array is required",
				});
			}

			if (!customerProviderIdentifier) {
				return res.status(400).json({
					error: "customerProviderIdentifier is required",
				});
			}

			// Check if profile already exists
			const existingProfile = getBillProfileById(customerProviderIdentifier);
			if (existingProfile) {
				return res.status(400).json({
					error:
						"Bill profile with this customerProviderIdentifier already exists",
				});
			}

			const newProfile: BillProfile = {
				billingInfo,
				customerProviderIdentifier,
			};

			createBillProfile(newProfile);

			return res.status(201).json({
				data: {
					results: [newProfile],
				},
			});
		} catch (error) {
			console.error("Error creating bill profile:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	if (req.method === "DELETE") {
		try {
			const { customerProviderIdentifier } = req.query;

			if (
				!customerProviderIdentifier ||
				typeof customerProviderIdentifier !== "string"
			) {
				return res.status(400).json({
					error: "customerProviderIdentifier query parameter is required",
				});
			}

			const existingProfile = getBillProfileById(customerProviderIdentifier);
			if (!existingProfile) {
				return res.status(404).json({ error: "Bill profile not found" });
			}

			deleteBillProfile(customerProviderIdentifier);

			return res.status(200).json({
				data: {
					results: [],
				},
			});
		} catch (error) {
			console.error("Error deleting bill profile:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
