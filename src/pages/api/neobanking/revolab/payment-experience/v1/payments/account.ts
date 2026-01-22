import type { NextApiRequest, NextApiResponse } from "next";
import {
	createReflectAccount,
	deleteReflectAccountById,
	getAccountByID,
	getAllReflectAccount,
	getNameByNumber,
	getUser,
	type ReflectAccount,
} from "@/lib/cache";
import { normalizeJordanMobile, validateJodNumber } from "@/lib/util";

interface ReflectAccountResponse {
	data: {
		results: ReflectAccount[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		ReflectAccountResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			const profiles = getAllReflectAccount();

			const response: ReflectAccountResponse = {
				data: {
					results: profiles,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error fetching reflect accounts:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	if (req.method === "POST") {
		try {
			const { name, mobileNumber } = req.body;

			if (!name || !mobileNumber) {
				return res.status(400).json({
					error: "name and mobileNumber is required",
				});
			}

			const validateJODNumber = validateJodNumber(mobileNumber);
			if (!validateJODNumber) {
				return res.status(400).json({
					error: "Must put correct JOD Number Format",
				});
			}

			const normalizedMobile = normalizeJordanMobile(mobileNumber);

			const existingReflectUser = getNameByNumber(normalizedMobile);
			if (existingReflectUser != null) {
				return res.status(400).json({
					error: "Reflect user with mobile number already exists",
				});
			}

			const user = getUser();
			if (!user) {
				return res.status(400).json({
					error: "User account not found",
				});
			}

			const newReflectAccount = createReflectAccount({
				name,
				mobileNumber: normalizedMobile,
			});

			return res.status(201).json({
				data: {
					results: [newReflectAccount],
				},
			});
		} catch (error) {
			console.error("Error creating reflect account:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	if (req.method === "DELETE") {
		try {
			const { id } = req.query;

			if (!id) {
				return res.status(400).json({
					error: "id query parameter is required",
				});
			}

			const reflectId = Number(id);

			if (Number.isNaN(reflectId) || reflectId <= 0) {
				return res.status(400).json({
					error: "id must be a valid positive number",
				});
			}

			const existingReflectAccount = getAccountByID(reflectId);
			if (existingReflectAccount === null) {
				return res.status(404).json({ error: "Reflect account not found" });
			}

			deleteReflectAccountById(reflectId);

			return res.status(200).json({
				data: {
					results: [],
				},
			});
		} catch (error) {
			console.error("Error deleting reflect account:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
