import type { NextApiRequest, NextApiResponse } from "next";
import fxRateData from "@/mock/fx-rate.json";

interface Amount {
	currency: string;
	amount: number;
}

interface FxRateRequest {
	transactionAmount: Amount;
	receivingAmount: Amount;
}

interface FxRateResponse {
	data: {
		fxRate: number;
		receivingAmount: Amount;
		transactionAmount: Amount;
		fxCommissionFees: number;
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

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<FxRateResponse | { error: string }>,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { transactionAmount, receivingAmount } = req.body as FxRateRequest;

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

		// Calculate commission
		const commissionRate = fxRateData.commissionRate;
		const fxCommissionFees = transactionAmount.amount * commissionRate;

		// Calculate receiving amount with commission
		const baseReceivingAmount = transactionAmount.amount * fxRate;
		const finalReceivingAmount = baseReceivingAmount + fxCommissionFees;

		// Prepare response
		const response: FxRateResponse = {
			data: {
				fxRate,
				receivingAmount: {
					amount: finalReceivingAmount,
					currency: receivingAmount.currency,
				},
				transactionAmount: {
					amount: transactionAmount.amount,
					currency: transactionAmount.currency,
				},
				fxCommissionFees,
			},
			links: [
				{
					rel: "self",
					href: "/neobanking/account-experience/v1/sub-accounts/fx-rate",
					method: "POST",
				},
			],
			metadata: {
				queryParameters: {},
			},
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error calculating FX rate:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
