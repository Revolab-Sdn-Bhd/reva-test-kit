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

function validateJodNumber(mobileNumber: string): boolean {
	/**
	 * Validate Jordanian mobile numbers.
	 *
	 * Acceptable formats:
	 * - Local: 07XXXXXXXX
	 * - International: +9627XXXXXXX
	 * - Spaces allowed between digits for display (will be ignored)
	 */

	// Remove spaces and dashes
	const cleaned = mobileNumber.replace(/[\s-]/g, "");

	// Regex: local or international format
	// Matches: +9627[7895]XXXXXXX or 07[7895]XXXXXXX
	const pattern = /^(?:\+9627[7895]\d{7}|07[7895]\d{7})$/;

	return pattern.test(cleaned);
}

/**
 * Normalizes Jordanian mobile numbers to a standard format: +962791234567
 *
 * Converts all formats to: +962XXXXXXXXX (no spaces)
 *
 * Examples:
 * - "0791234567" → "+962791234567"
 * - "00962791234567" → "+962791234567"
 * - "+962 79 123 4567" → "+962791234567"
 * - "962791234567" → "+962791234567"
 */
function normalizeJordanMobile(mobileNumber: string): string {
	// Remove all spaces, dashes, and parentheses
	let normalized = mobileNumber.replace(/[\s\-()]/g, "");

	// Convert "00962" to "+962"
	if (normalized.startsWith("00962")) {
		normalized = `+${normalized.substring(2)}`;
	}
	// Convert "0962" to "+962" (in case someone types 0962 instead of 00962)
	else if (normalized.startsWith("0962")) {
		normalized = `+${normalized.substring(1)}`;
	}
	// Convert "07X" (local format) to "+9627X"
	else if (normalized.startsWith("07")) {
		normalized = `+962${normalized.substring(1)}`;
	}
	// Convert "962" (without prefix) to "+962"
	else if (normalized.startsWith("962")) {
		normalized = `+${normalized}`;
	}
	// If it already starts with +962, keep as is
	else if (normalized.startsWith("+962")) {
		// Already in correct format
	}

	return normalized;
}
