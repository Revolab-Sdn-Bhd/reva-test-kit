import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import {
	createIbanAccount,
	deleteIbanByBeneficiaryId,
	getAllIBAN,
	getNameByBeneficiaryId,
	getNameByIbanAccountNumber,
	getUser,
	type Iban,
} from "@/lib/cache";

interface IbanAccountResponse {
	data: {
		results: Iban[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		IbanAccountResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			const ibanAccount = getAllIBAN();

			const response: IbanAccountResponse = {
				data: {
					results: ibanAccount,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error fetching iban accounts:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	if (req.method === "POST") {
		try {
			const { fullName, nickName } = req.body;
			const beneficiaryId = randomUUID();
			const accountNumber = generateAccountNumber();

			if (!fullName || !nickName) {
				return res.status(400).json({
					error: "fullName and nickName is required",
				});
			}

			const existingBeneficiaryId = getNameByBeneficiaryId(beneficiaryId);
			if (existingBeneficiaryId != null) {
				return res.status(400).json({
					error: "Iban account already exist",
				});
			}

			const existingAccountNumber = getNameByIbanAccountNumber(accountNumber);
			if (existingAccountNumber != null) {
				return res.status(400).json({
					error: "Iban account already exist",
				});
			}

			const user = getUser();
			if (!user) {
				return res.status(400).json({
					error: "User account not found",
				});
			}

			const newIbanAccount = createIbanAccount({
				beneficiaryId,
				accountNumber,
				fullName,
				nickName,
			});

			return res.status(201).json({
				data: {
					results: [newIbanAccount],
				},
			});
		} catch (error) {
			console.error("Error creating iban accounts:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	if (req.method === "DELETE") {
		try {
			const { beneficiaryId } = req.query;

			if (!beneficiaryId) {
				return res.status(400).json({
					error: "beneficiary id is required",
				});
			}

			const existingIban = getNameByBeneficiaryId(beneficiaryId as string);
			if (existingIban === null) {
				return res.status(404).json({ error: "Iban account not found" });
			}

			deleteIbanByBeneficiaryId(beneficiaryId as string);

			return res.status(200).json({
				data: {
					results: [],
				},
			});
		} catch (error) {
			console.error("Error deleting iban account:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}

function generateAccountNumber(): string {
	const checkDigits = Math.floor(Math.random() * 100)
		.toString()
		.padStart(2, "0");

	let accountDigits = "";
	for (let i = 0; i < 22; i++) {
		accountDigits += Math.floor(Math.random() * 10);
	}

	return `JO${checkDigits}ARAB${accountDigits}`;
}
