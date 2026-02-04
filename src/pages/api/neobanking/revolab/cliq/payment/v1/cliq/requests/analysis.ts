import type { NextApiRequest, NextApiResponse } from "next";
import { getCliQNameByNumber, getNameByAlias } from "@/lib/cache";
import { normalizeJordanMobile } from "@/lib/util";

interface CliqPaymentRequest {
	instructedAmount: {
		amount: number;
		currency: string;
	};
	oneTimeTransfer: string;
	receiverInfo: {
		bankSwiftBic: string;
		bankName: string;
		identificationValue: string;
		identificationType: string;
	};
	remittanceInfo: {
		purposeDescription: string;
		purposeCode: string;
	};
	saveBeneficiary: string;
	aliasNickName: string;
}

interface CliQResponse {
	receiverInfo: {
		identificationType: string;
		identificationValue: string;
		bankSwiftBic: string;
		bankName: string;
	};
	instructedAmount: {
		amount: number;
		currency: string;
	};
	chargeAmount: {
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

interface CliQPaymentAnalysisResponse {
	metadata: {
		queryParameters: Record<string, any>;
	};
	links: Array<{
		href: string;
		method: string;
		rel: string;
	}>;
	data: CliQResponse;
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		| CliQPaymentAnalysisResponse
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
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const {
			instructedAmount,
			receiverInfo,
			remittanceInfo,
		}: CliqPaymentRequest = req.body;

		if (!instructedAmount.amount || !instructedAmount.currency) {
			return res.status(400).json({
				error:
					"instructedAmount.amount and instructedAmount.currency are required",
			});
		}

		if (!receiverInfo.identificationType || !receiverInfo.identificationValue) {
			return res.status(400).json({
				error:
					"receiverInfo.identificationType and receiverInfo.identificationValue are required",
			});
		}

		if (!remittanceInfo.purposeCode || !remittanceInfo.purposeDescription) {
			return res.status(400).json({
				error:
					"remittanceInfo.purposeCode and remittanceInfo.purposeDescription are required",
			});
		}

		let receiverName: any;
		if (receiverInfo.identificationType === "ALIAS") {
			receiverName = getNameByAlias(receiverInfo.identificationValue);

			if (receiverName === null) {
				return res.status(400).json({
					code: "010",
					url: "",
					errors: [
						{
							path: "",
							errorCode: "400.010.PRFS1025",
							message: "Receiver not found",
							url: "",
						},
					],
					message: "Receiver not found",
					id: "",
				});
			}
		}

		if (receiverInfo.identificationType === "MOBL") {
			const normalizedMobile = normalizeJordanMobile(
				receiverInfo.identificationValue,
			);
			receiverName = getCliQNameByNumber(normalizedMobile);
			if (receiverName === null) {
				return res.status(400).json({
					code: "010",
					url: "",
					errors: [
						{
							path: "",
							errorCode: "400.010.PRFS1025",
							message: "Receiver not found",
							url: "",
						},
					],
					message: "Receiver not found",
					id: "",
				});
			}
		}

		const result: CliQResponse = {
			receiverInfo: {
				identificationType: receiverInfo.identificationType,
				identificationValue: receiverInfo.identificationValue,
				bankSwiftBic: receiverInfo.bankSwiftBic,
				bankName: receiverInfo.bankName,
			},
			instructedAmount: {
				amount: instructedAmount.amount,
				currency: instructedAmount.currency,
			},
			chargeAmount: {
				amount: 0,
				currency: "JOD",
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

		const response: CliQPaymentAnalysisResponse = {
			links: [
				{
					rel: "self",
					href: "/neobanking/revolab/cliq/payment/v1/cliq/requests/analysis",
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
		console.error("Error analyzing payment:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
