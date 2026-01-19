import type { NextApiRequest, NextApiResponse } from "next";
import { getNameByIbanAccountNumber, getUser } from "@/lib/cache";

interface Creditor {
	identification: {
		type: string;
		value: string;
	};
	address: string;
	city: string;
	country: string;
	bankSwiftBic: string;
	name: string;
	bankName?: string;
	iban?: string;
}

interface Debitor {
	casRecordId: string;
	identification: {
		type: string;
		value: string;
	};
	country: string;
	name: string;
	city: string;
	address: string;
}

interface IbanAnalysisResponse {
	metadata: {
		queryParameters: Record<string, any>;
	};
	links: Array<{
		href: string;
		rel: string;
		method: string;
	}>;
	data: IbanAnalysisResult;
}

interface IbanAnalysisResult {
	creditorInfo: Creditor;
	debitorInfo: Debitor;
	instructedAmount: {
		amount: number;
		currency: string;
	};
	totalAmount: {
		amount: number;
		currency: string;
	};
	remittanceInfo: {
		purposeCode: string;
		purposeDescription: string;
	};
}

interface PaymentAnalysisRequest {
	instructedAmount: {
		amount: number;
		currency: string;
	};
	aliasNickName: string;
	saveBeneficiary: string;
	remittanceInfo: {
		purposeCode: string;
		purposeDescription: string;
	};
	creditorInfo: Creditor;
	oneTimeTransfer: string;
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		IbanAnalysisResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "POST") {
		try {
			const {
				instructedAmount,
				saveBeneficiary,
				remittanceInfo,
				creditorInfo,
				oneTimeTransfer,
			}: PaymentAnalysisRequest = req.body;

			if (!oneTimeTransfer) {
				return res.status(400).json({
					error: "aliasNickName and oneTimeTransfer are required",
				});
			}

			if (!instructedAmount?.amount || !instructedAmount.currency) {
				return res.status(400).json({
					error:
						"instructedAmount.amount and instructedAmount.currency are required",
				});
			}

			if (
				!remittanceInfo?.purposeCode ||
				remittanceInfo?.purposeDescription === undefined
			) {
				return res.status(400).json({
					error:
						"remittanceInfo.purposeCode and remittanceInfo.purposeDescription are required",
				});
			}

			if (!saveBeneficiary) {
				return res.status(400).json({
					error: "saveBeneficiary are required",
				});
			}

			if (
				!creditorInfo.identification.type ||
				!creditorInfo.identification.value
			) {
				return res.status(400).json({
					error:
						"creditorInfo.identification.type and creditorInfo.identification.value are required",
				});
			}

			const user = getUser();
			if (!user) {
				return res.status(400).json({
					error: "User account not found",
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

			const result: IbanAnalysisResult = {
				creditorInfo: {
					identification: {
						type: creditorInfo.identification.type,
						value: creditorInfo.identification.value,
					},
					address: creditorInfo.address,
					city: creditorInfo.city,
					country: creditorInfo.country,
					iban: creditorInfo.identification.value,
					bankSwiftBic: creditorInfo.bankSwiftBic,
					name: creditorName,
				},
				debitorInfo: {
					casRecordId: "122",
					identification: {
						type: "IBAN",
						value: user.virtualIban,
					},
					country: "JO",
					name: user.name,
					city: "HITTEN CUMP",
					address: "Street 14, AMMAN, JORDAN",
				},
				instructedAmount: {
					amount: instructedAmount.amount,
					currency: instructedAmount.currency,
				},
				totalAmount: {
					amount: instructedAmount.amount,
					currency: instructedAmount.currency,
				},
				remittanceInfo: {
					purposeCode: remittanceInfo.purposeCode,
					purposeDescription: remittanceInfo.purposeDescription,
				},
			};

			const response: IbanAnalysisResponse = {
				links: [
					{
						rel: "self",
						href: "/neobanking/revolab/cliq/payment/v1/outgoing-payment/validation",
						method: "POST",
					},
				],
				metadata: {
					queryParameters: {},
				},
				data: result,
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error payment analysis iban", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
