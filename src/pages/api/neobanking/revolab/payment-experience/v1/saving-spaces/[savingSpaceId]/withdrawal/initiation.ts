import type { NextApiRequest, NextApiResponse } from "next";
import {
	getSavingSpaceById,
	updateSavingSpaceAmounts,
	updateSubAccountBalance,
} from "../../../../../../../../../lib/cache";

interface InstructedAmount {
	currency: string;
	amount: number;
}

interface WithdrawalRequest {
	instructedAmount: InstructedAmount;
}

interface PaymentResponse {
	instructedAmount: InstructedAmount;
	chargesAmount: InstructedAmount;
	paymentDate: string;
	totalAmount: InstructedAmount;
	internalReferenceNumber: string;
	paymentStatus: string;
	paymentStatusDescription: string;
	externalReferenceNumber: string;
}

// Generate internal reference number
const generateReferenceNumber = (): string => {
	const timestamp = Date.now().toString();
	const random = Math.floor(Math.random() * 1000000)
		.toString()
		.padStart(6, "0");
	return timestamp + random;
};

// Calculate metrics after withdrawal
const calculateMetrics = (
	currentSaved: number,
	withdrawalAmount: number,
	targetAmount: number,
): {
	newSavedAmount: number;
	newRemainingAmount: number;
	savedPercentage: number;
	remainingPercentage: number;
} => {
	const newSavedAmount = Math.max(0, currentSaved - withdrawalAmount);
	const newRemainingAmount = targetAmount - newSavedAmount;
	const savedPercentage =
		targetAmount > 0 ? (newSavedAmount / targetAmount) * 100 : 0;
	const remainingPercentage =
		targetAmount > 0 ? (newRemainingAmount / targetAmount) * 100 : 0;

	return {
		newSavedAmount,
		newRemainingAmount: Math.max(0, newRemainingAmount),
		savedPercentage: Math.max(0, Math.min(100, savedPercentage)),
		remainingPercentage: Math.max(0, Math.min(100, remainingPercentage)),
	};
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { savingSpaceId } = req.query;
		const { instructedAmount } = req.body as WithdrawalRequest;

		// Validate saving space ID
		if (!savingSpaceId || typeof savingSpaceId !== "string") {
			return res.status(400).json({ error: "Invalid saving space ID" });
		}

		// Validate instructed amount
		if (
			!instructedAmount ||
			typeof instructedAmount.amount !== "number" ||
			instructedAmount.amount <= 0
		) {
			return res
				.status(400)
				.json({ error: "Invalid instructed amount. Amount must be positive." });
		}

		// Get saving space from database
		const savingSpace = getSavingSpaceById(savingSpaceId);

		if (!savingSpace) {
			console.error(`Saving space not found: ${savingSpaceId}`);
			return res.status(404).json({
				error: "Saving space not found",
				savingSpaceId: savingSpaceId,
				message:
					"The saving space ID does not exist in the database. Use GET /api/neobanking/customer-experience/v1/saving-spaces to see available saving spaces.",
			});
		}

		// Validate currency matches
		if (instructedAmount.currency !== savingSpace.targetAmount.currency) {
			return res.status(400).json({
				error: `Currency mismatch. Expected ${savingSpace.targetAmount.currency}, got ${instructedAmount.currency}`,
			});
		}

		// Validate sufficient funds
		if (instructedAmount.amount > savingSpace.savedAmount.amount) {
			return res.status(400).json({
				error: `Insufficient funds. Available: ${savingSpace.savedAmount.amount}, Requested: ${instructedAmount.amount}`,
			});
		}

		// Calculate new amounts
		const metrics = calculateMetrics(
			savingSpace.savedAmount.amount,
			instructedAmount.amount,
			savingSpace.targetAmount.amount,
		);

		// Update saving space in database
		const updated = updateSavingSpaceAmounts(
			savingSpaceId,
			metrics.newSavedAmount,
			metrics.newRemainingAmount,
			metrics.savedPercentage,
			metrics.remainingPercentage,
		);

		if (!updated) {
			return res.status(500).json({ error: "Failed to update saving space" });
		}

		// Update sub-account balance (add withdrawal amount back to account)
		const balanceUpdated = updateSubAccountBalance(
			savingSpace.subAccountId,
			instructedAmount.amount,
			"deposit",
		);

		if (!balanceUpdated) {
			return res
				.status(500)
				.json({ error: "Failed to update account balance" });
		}

		// Generate payment response
		const paymentDate = new Date().toISOString();
		const internalReferenceNumber = generateReferenceNumber();

		const paymentResponse: PaymentResponse = {
			instructedAmount: {
				currency: instructedAmount.currency,
				amount: instructedAmount.amount,
			},
			chargesAmount: {
				currency: instructedAmount.currency,
				amount: 0,
			},
			paymentDate,
			totalAmount: {
				currency: instructedAmount.currency,
				amount: instructedAmount.amount,
			},
			internalReferenceNumber,
			paymentStatus: "L1-COMPLETED",
			paymentStatusDescription: "L1-COMPLETED",
			externalReferenceNumber: "",
		};

		return res.status(200).json({
			data: {
				results: [paymentResponse],
			},
			links: [
				{
					rel: "self",
					href: `/api/neobanking/payment-experience/v1/saving-spaces/${savingSpaceId}/withdrawal/initiation`,
					method: "POST",
				},
			],
			metadata: {
				pagination: {
					hasNext: false,
					totalPages: 1,
					totalRecords: 1,
				},
				queryParameters: {},
			},
		});
	} catch (error) {
		console.error("Error processing withdrawal:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
