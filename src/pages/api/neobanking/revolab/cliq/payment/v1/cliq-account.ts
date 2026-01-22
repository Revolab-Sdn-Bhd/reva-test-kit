import type { NextApiRequest, NextApiResponse } from "next";
import {
	type CLiQAccount,
	createCliQAccount,
	deleteCliQById,
	getAllCliQAccount,
	getNameById,
	getUser,
} from "@/lib/cache";
import { normalizeJordanMobile, validateJodNumber } from "@/lib/util";

interface CliQAccountResponse {
	data: {
		results: CLiQAccount[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		CliQAccountResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			const cliqAccount = getAllCliQAccount();

			const response: CliQAccountResponse = {
				data: {
					results: cliqAccount,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error fetching cliq accounts:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	if (req.method === "POST") {
		try {
			const { fullName, nickName, mobileNumber, alias } = req.body;

			if (!fullName || !nickName || !mobileNumber || !alias) {
				return res.status(400).json({
					error: "fullName, nickName, mobileNumber and alias is required",
				});
			}

			const validateJODNumber = validateJodNumber(mobileNumber);
			if (!validateJODNumber) {
				return res.status(400).json({
					error: "Must put correct JOD Number Format",
				});
			}

			const normalizedMobile = normalizeJordanMobile(mobileNumber);

			const user = getUser();
			if (!user) {
				return res.status(400).json({
					error: "User account not found",
				});
			}

			const newCliQAccount = createCliQAccount({
				name: fullName,
				nickName,
				mobileNumber: normalizedMobile,
				alias,
			});

			return res.status(201).json({
				data: {
					results: [newCliQAccount],
				},
			});
		} catch (error) {
			console.error("Error creating cliq accounts:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	if (req.method === "DELETE") {
		try {
			const { id } = req.query;

			if (!id) {
				return res.status(400).json({
					error: "id is required",
				});
			}

			const cliqId = Number(id);

			const existingCliq = getNameById(cliqId);
			if (existingCliq === null) {
				return res.status(404).json({ error: "Cliq not found" });
			}

			deleteCliQById(cliqId);

			return res.status(200).json({
				data: {
					results: [],
				},
			});
		} catch (error) {
			console.error("Error deleting cliq accounts:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}
}
