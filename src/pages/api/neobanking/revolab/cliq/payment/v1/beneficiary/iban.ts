import type { NextApiRequest, NextApiResponse } from "next";
import { getAllIBAN, getUser, type Iban } from "@/lib/cache";

interface SavedBeneficiaryResult {
	beneficiaryId: string;
	branchName: string;
	accountNumber: string;
	beneficiaryType: string;
	bankName: string;
	address: string;
	fullName: string;
	nickName: string;
	city: string;
	country: string;
	status: string;
	swiftCode: string;
}

interface RetrieveSavedBeneficiaryResponse {
	metadata: {
		queryParameters: Record<string, any>;
	};
	links: Array<{
		href: string;
		rel: string;
		method: string;
	}>;
	data: {
		results: SavedBeneficiaryResult[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		RetrieveSavedBeneficiaryResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			const user = getUser();
			if (!user) {
				return res.status(400).json({
					error: "User not found",
				});
			}

			const listSavedIban: Iban[] = getAllIBAN();

			const mappedIbans: SavedBeneficiaryResult[] = listSavedIban.map(
				(item) => ({
					beneficiaryId: item.beneficiaryId,
					branchName: "AMMAN",
					accountNumber: item.accountNumber,
					beneficiaryType: "INDIVIDUAL",
					bankName: "ARAB BANK PLC",
					address: "Street 12",
					fullName: item.fullName,
					nickName: item.nickName,
					city: "Amman City",
					country: "JO",
					status: "ACTIVE",
					swiftCode: "ARABJOAXXXX",
				}),
			);

			const response: RetrieveSavedBeneficiaryResponse = {
				data: {
					results: mappedIbans,
				},
				metadata: {
					queryParameters: {},
				},
				links: [
					{
						href: "/neobanking/revolab/cliq/payment/v1/beneficiary/iban",
						rel: "self",
						method: "GET",
					},
				],
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error retrieving saved beneficiary", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
