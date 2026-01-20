import type { NextApiRequest, NextApiResponse } from "next";
import { getNameByNumber, getUser } from "@/lib/cache";
import { normalizeMobileNumber } from "@/lib/util";

interface CreditorInfo {
	name: string;
	mobileNumber: string;
}

interface InstructedAmount {
	amount: number;
	currency: string;
}

interface RemittanceInfo {
	purposeCode: string;
	purposeDescription: string;
	imageUrl: string;
}

interface PaymentAnalysisRequest {
	creditorInfo: CreditorInfo;
	instructedAmount: InstructedAmount;
	remittanceInfo: RemittanceInfo;
	flowName: string | null;
	appVersion: string | null;
}

interface PaymentAnalysisResult {
	debitorInfo: {
		name: string;
		mobileNumber: string;
	};
	creditorInfo: {
		name: string;
		mobileNumber: string;
	};
	instructedAmount: InstructedAmount;
	remittanceInfo: RemittanceInfo;
}

interface PaymentAnalysisResponse {
	metadata: {
		queryParameters: Record<string, any>;
		pagination: {
			totalPages: number;
			totalRecords: number;
			hasNext: boolean;
		};
	};
	links: Array<{
		href: string;
		method: string;
		rel: string;
	}>;
	data: {
		results: PaymentAnalysisResult[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		PaymentAnalysisResponse | { error: string; message?: string }
	>,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const {
			creditorInfo,
			instructedAmount,
			remittanceInfo,
		}: PaymentAnalysisRequest = req.body;

		// Validate required fields
		if (!creditorInfo?.mobileNumber) {
			return res.status(400).json({
				error: "creditorInfo.mobileNumber is required",
			});
		}

		if (!instructedAmount?.amount || !instructedAmount?.currency) {
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

		// Get debitor info from the user (assuming single user)
		const user = getUser();
		if (!user) {
			return res.status(400).json({
				error: "User not found",
			});
		}

		const normalizedMobile = normalizeMobileNumber(creditorInfo.mobileNumber);
		// searching name by number
		const creditorName = getCreditorName(normalizedMobile);
		if (creditorName === null) {
			return res.status(404).json({
				error: "Creditor not exist",
			});
		}

		const formattedDebitorMobile = "+962775851126"; // Mock debitor mobile

		const result: PaymentAnalysisResult = {
			debitorInfo: {
				name: user.name,
				mobileNumber: formattedDebitorMobile,
			},
			creditorInfo: {
				name: creditorName,
				mobileNumber: normalizedMobile,
			},
			instructedAmount: {
				amount: instructedAmount.amount,
				currency: instructedAmount.currency,
			},
			remittanceInfo: {
				purposeCode: remittanceInfo.purposeCode,
				purposeDescription: remittanceInfo.purposeDescription,
				imageUrl: remittanceInfo.imageUrl || "",
			},
		};

		const response: PaymentAnalysisResponse = {
			metadata: {
				queryParameters: {},
				pagination: {
					totalPages: 1,
					totalRecords: 1,
					hasNext: false,
				},
			},
			links: [
				{
					href: "/neobanking/payment-experience/v1/payments/analysis",
					method: "POST",
					rel: "self",
				},
			],
			data: {
				results: [result],
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error analyzing payment:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

function getCreditorName(mobileNumber: string): string | null {
	const creditorName = getNameByNumber(mobileNumber);

	if (creditorName === null) {
		return null;
	}

	return creditorName;
}
