import type { NextApiRequest, NextApiResponse } from "next";
import { getCliQNameByNumber, getNameByAlias } from "@/lib/cache";

interface Creditor {
	identification: {
		type: string;
		value: string;
	};
	bankName: string;
	address: string;
	city: string;
	country: string;
	bankSwiftBic: string;
	name: string;
}

interface ValidateAliasRequest {
	paymentType: string;
	creditorInfo: {
		bankSwiftBic: string;
		identification: {
			value: string;
			type: string;
		};
		bankName: string;
	};
}

interface ValidateAliasResponse {
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
		| ValidateAliasResponse
		| { error: string; message?: string }
		| {
				code: string;
				url: string;
				errors: [
					{ path: string; errorCode: string; message: string; url: string },
				];
				message: string;
				id: string;
		  }
	>,
) {
	if (req.method === "POST") {
		try {
			const { creditorInfo, paymentType }: ValidateAliasRequest = req.body;

			if (!paymentType) {
				return res.status(400).json({
					error: "paymentType are required",
				});
			}

			if (
				!creditorInfo.identification.type ||
				!creditorInfo.identification.value
			) {
				return res.status(400).json({
					error: "identification.value and identification.type  are required",
				});
			}

			if (paymentType !== "OUTWARD" && paymentType !== "REQUESTTOPAY") {
				return res.status(400).json({
					error: "paymentType not allowed",
				});
			}

			let creditorName: any;

			if (creditorInfo.identification.type === "ALIAS") {
				creditorName = getNameByAlias(creditorInfo.identification.value);

				if (creditorName === null) {
					return res.status(400).json({
						code: "010",
						url: "",
						errors: [
							{
								path: "",
								errorCode: "400.010",
								message: "Alias profile not found",
								url: "",
							},
						],
						message: "Alias profile not found",
						id: "",
					});
				}
			}

			if (creditorInfo.identification.type === "MOBL") {
				creditorName = getCliQNameByNumber(creditorInfo.identification.value);

				if (creditorName === null) {
					return res.status(400).json({
						code: "010",
						url: "",
						errors: [
							{
								path: "",
								errorCode: "400.010",
								message: "Alias profile not found",
								url: "",
							},
						],
						message: "Alias profile not found",
						id: "",
					});
				}
			}

			const result: Creditor = {
				identification: {
					type: creditorInfo.identification.type,
					value: creditorInfo.identification.value,
				},
				bankName: creditorInfo.bankName,
				address: "56, London Street",
				city: "AMMAN",
				country: "JO",
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

			const response: ValidateAliasResponse = {
				links: [
					{
						href: "/neobanking/revolab/cliq/payment/v1/alias/validation",
						rel: "self",
						method: "POST",
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
			console.error("Error validate alias", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
