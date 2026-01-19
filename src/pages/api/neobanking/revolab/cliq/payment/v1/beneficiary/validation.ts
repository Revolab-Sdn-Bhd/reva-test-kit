import type { NextApiRequest, NextApiResponse } from "next";
import { getNameByIbanAccountNumber } from "@/lib/cache";

interface CreditorInfo {
	address: string;
	bankName: string;
	country: string;
	identification: {
		type: string;
		value: string;
	};
	city: string;
	name: string;
	bankSwiftBic: string;
	iban?: string;
}

interface ValidateIbanRequest {
	creditorInfo: CreditorInfo;
}

interface Creditor {
	identification: {
		type: string;
		value: string;
	};
	bankName: string;
	address: string;
	city: string;
	country: string;
	creditorType: string;
	bankSwiftBic: string;
	name: string;
}

interface ValidateIbanResponse {
	metadata: {
		queryParameters: Record<string, any>;
	};
	links: Array<{
		href: string;
		rel: string;
		method: string;
	}>;
	data: {
		creditorInfo: Creditor;
		lookupDetails: Array<{
			descriptionAr: string;
			descriptionEn: string;
			code: string;
		}>;
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		ValidateIbanResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "POST") {
		try {
			const { creditorInfo }: ValidateIbanRequest = req.body;

			if (!creditorInfo.identification.value) {
				return res.status(400).json({
					error: "creditorInfo.identification.value are required",
				});
			}

			if (creditorInfo.identification.type !== "IBAN") {
				return res.status(400).json({
					error: "creditorInfo.identification.type not allowed",
				});
			}

			const creditorName = getNameByIbanAccountNumber(
				creditorInfo.identification.value,
			);
			if (creditorName === null) {
				return res.status(404).json({
					error: "Creditor not exist",
				});
			}

			// if (creditorName.match(creditorInfo.name)) {
			//     return res.status(404).json({
			//         error: "Creditor name not match"
			//     })
			// }

			const result: Creditor = {
				identification: {
					type: creditorInfo.identification.type,
					value: creditorInfo.identification.value,
				},
				bankName: creditorInfo.bankName,
				address: creditorInfo.address,
				city: creditorInfo.city,
				country: creditorInfo.country,
				creditorType: creditorInfo.identification.type,
				bankSwiftBic: creditorInfo.bankSwiftBic,
				name: creditorName,
			};

			const purpose = [
				{
					descriptionAr: "",
					descriptionEn: "Transfer to friend / Family",
					code: "1111XYZ10",
				},
				{
					descriptionAr: "",
					descriptionEn: "Transfer to Own Account",
					code: "1111XYZ20",
				},
				{
					descriptionAr: "",
					descriptionEn: "Goods / Services payment",
					code: "2111XYZ30",
				},
			];

			const response: ValidateIbanResponse = {
				links: [
					{
						href: "/neobanking/revolab/cliq/payment/v1/beneficiary/validation",
						rel: "self",
						method: "GET",
					},
				],
				metadata: {
					queryParameters: {},
				},
				data: {
					creditorInfo: result,
					lookupDetails: purpose,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error validate iban", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
