import type { NextApiRequest, NextApiResponse } from "next";
import { getAllSubAccounts } from "@/lib/cache";

interface BillRequest {
	billerCode: string;
	paymentType: string;
	customerProviderIdentifier: string;
	serviceType: string;
	customerBillingIdentifier: string;
	billerName: string;
}

interface BillAnalysisResult {
	dueAmount: number;
	customerBillNo: string;
	outstandingAmount: number;
	openDate: string;
	decimalAllowed: boolean;
	billerCode: string;
	billStatus: string;
	billerName: string;
	currency: string;
	dueDate: string;
	referenceNumber: string;
	statusMessage: string;
	minimumAmount: number;
	partialPaymentallowed: boolean;
	closeDate: string;
	serviceType: string;
	additionalInfo: {
		subscriberName: string;
		freeText: string;
	};
	feeAmount: number;
	maximumAmount: number;
	expiryDate: string;
	customerBillingIdentifier: string;
	issuedOn: string;
}

interface AnalysisResponse {
	data: {
		results: BillAnalysisResult[];
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<AnalysisResponse | { error: string; message?: string }>,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { bills } = req.body;

		if (!bills || !Array.isArray(bills) || bills.length === 0) {
			return res.status(400).json({
				error: "bills array is required and must not be empty",
			});
		}

		// Get primary account (orderIndex = 0) to check balance
		const subAccounts = getAllSubAccounts();
		const primaryAccount = subAccounts.find((acc) => acc.orderIndex === 0);

		if (!primaryAccount) {
			return res.status(400).json({
				error: "Primary account not found",
			});
		}

		const results: BillAnalysisResult[] = bills.map((bill: BillRequest) => {
			// Generate random due amount between 50 and 150
			const dueAmount = Math.floor(Math.random() * 100) + 50;

			// Check if primary account has sufficient balance
			const hasSufficientBalance = primaryAccount.accountBalance >= dueAmount;
			const billStatus = hasSufficientBalance ? "BillNew" : "InsufficientFunds";
			const statusMessage = hasSufficientBalance
				? "SUCCESS"
				: "INSUFFICIENT_BALANCE";

			// Generate reference number
			const referenceNumber = Math.floor(Math.random() * 900000000) + 100000000;

			// Set due date to 30 days from now
			const dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + 30);
			const dueDateStr = dueDate.toISOString().split("T")[0];

			// Set issued on to today
			const issuedOn = new Date().toISOString().split("T")[0];

			return {
				dueAmount,
				customerBillNo: bill.customerBillingIdentifier,
				outstandingAmount: dueAmount,
				openDate: "",
				decimalAllowed: true,
				billerCode: bill.billerCode,
				billStatus,
				billerName: bill.billerName,
				currency: primaryAccount.currency,
				dueDate: dueDateStr,
				referenceNumber: referenceNumber.toString(),
				statusMessage,
				minimumAmount: 1,
				partialPaymentallowed: true,
				closeDate: "",
				serviceType: bill.serviceType,
				additionalInfo: {
					subscriberName: "Test Subscriber",
					freeText: `${bill.billerName} Support team`,
				},
				feeAmount: 0,
				maximumAmount: dueAmount * 2,
				expiryDate: "",
				customerBillingIdentifier: bill.customerBillingIdentifier,
				issuedOn,
			};
		});

		const response: AnalysisResponse = {
			data: {
				results,
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error analyzing bill payment:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
