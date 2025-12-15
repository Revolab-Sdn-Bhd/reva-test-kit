import { randomBytes } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import fxRateData from "@/mock/fx-rate.json";

interface Amount {
	currency: string;
	amount: number;
}

interface PaymentAnalysisRequest {
	transactionAmount: Amount;
	receivingAmount: Amount;
}

interface PaymentAnalysisResponse {
	data: {
		receivingAmount: Amount;
		chargesAmount: Amount;
		totalTransactionAmount: Amount;
		fxRate: number;
		confirmationToken: string;
		reciprocalFlag: string;
		transactionAmount: Amount;
	};
	links: Array<{
		rel: string;
		href: string;
		method: string;
	}>;
	metadata: {
		queryParameters: Record<string, any>;
	};
}

const calculateFxRate = (fromCurrency: string, toCurrency: string): number => {
	const { base, rates } = fxRateData;

	// If same currency, rate is 1
	if (fromCurrency === toCurrency) {
		return 1;
	}

	// If from base currency
	if (fromCurrency === base) {
		return rates[toCurrency as keyof typeof rates] || 0;
	}

	// If to base currency
	if (toCurrency === base) {
		const rate = rates[fromCurrency as keyof typeof rates];
		return rate ? 1 / rate : 0;
	}

	// Cross rate calculation
	const fromRate = rates[fromCurrency as keyof typeof rates];
	const toRate = rates[toCurrency as keyof typeof rates];

	if (!fromRate || !toRate) {
		return 0;
	}

	return toRate / fromRate;
};

const generateConfirmationToken = (): string => {
	return randomBytes(16).toString("hex");
};

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<PaymentAnalysisResponse | { error: string }>,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { transactionAmount, receivingAmount } =
			req.body as PaymentAnalysisRequest;

		// Validate request
		if (!transactionAmount || !receivingAmount) {
			return res.status(400).json({
				error: "transactionAmount and receivingAmount are required",
			});
		}

		if (!transactionAmount.currency || !receivingAmount.currency) {
			return res.status(400).json({
				error: "currency is required for both amounts",
			});
		}

		const supportedCurrencies = ["JOD", "USD", "EUR", "GBP"];
		if (
			!supportedCurrencies.includes(transactionAmount.currency) ||
			!supportedCurrencies.includes(receivingAmount.currency)
		) {
			return res.status(400).json({
				error: `Unsupported currency. Supported currencies: ${supportedCurrencies.join(", ")}`,
			});
		}

		// Calculate FX rate
		const fxRate = calculateFxRate(
			transactionAmount.currency,
			receivingAmount.currency,
		);

		if (fxRate === 0) {
			return res.status(400).json({
				error: "Unable to calculate exchange rate",
			});
		}

		// Get fixed charges from fx-rate.json
		const commissionRate = fxRateData.commissionRate;
		const chargesAmountValue = transactionAmount.amount * commissionRate;

		// Calculate amounts
		const totalTransactionAmountValue = transactionAmount.amount;
		const transactionAmountAfterCharges =
			transactionAmount.amount - chargesAmountValue;
		const receivingAmountValue = transactionAmount.amount * fxRate;

		// Generate confirmation token
		const confirmationToken = generateConfirmationToken();

		// Prepare response
		const response: PaymentAnalysisResponse = {
			data: {
				receivingAmount: {
					amount: receivingAmountValue,
					currency: receivingAmount.currency,
				},
				chargesAmount: {
					amount: chargesAmountValue,
					currency: fxRateData.base, // Fixed charges currency from fx-rate.json
				},
				totalTransactionAmount: {
					amount: totalTransactionAmountValue,
					currency: transactionAmount.currency,
				},
				fxRate,
				confirmationToken,
				reciprocalFlag: "N",
				transactionAmount: {
					amount: transactionAmountAfterCharges,
					currency: transactionAmount.currency,
				},
			},
			links: [
				{
					rel: "self",
					href: "/neobanking/account-experience/v1/sub-accounts/payment/analysis",
					method: "POST",
				},
			],
			metadata: {
				queryParameters: {},
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error analyzing payment:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
