import type { EnvConfig } from "./types";

export function generateRandomAlphanumeric(length: number): string {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

export const getChatUrl = (envConfig: EnvConfig | null) => {
	const isDevelopment = process.env.NODE_ENV === "development";
	const protocol = isDevelopment ? "http://" : "https://";
	const host = isDevelopment ? "localhost:3000" : envConfig?.CHAT_SERVICE_URL;
	const chatUrl = `${protocol}${host}`;

	return chatUrl;
};

/**
 * Normalizes JOD mobile numbers to a consistent format for database lookup
 * Converts: "00962791234567", "+962791234567", "962791234567", "+962 79 123 4567"
 * To: "+962791234567" (remove spaces, standardize prefix)
 */
export function normalizeMobileNumber(mobile: string): string {
	// Remove all spaces and non-digit characters except +
	let normalized = mobile.replace(/[\s-]/g, "");

	// Convert "00962" prefix to "+962"
	if (normalized.startsWith("00")) {
		normalized = `+${normalized.substring(2)}`;
	}

	// Add "+" prefix if missing and starts with country code
	if (!normalized.startsWith("+") && normalized.startsWith("962")) {
		normalized = `+${normalized}`;
	}

	return normalized;
}

/**
 * Normalizes Jordanian mobile numbers to a standard format: +962791234567
 *
 * Converts all formats to: +962XXXXXXXXX (no spaces)
 *
 * Examples:
 * - "0791234567" → "+962791234567"
 * - "00962791234567" → "+962791234567"
 * - "+962 79 123 4567" → "+962791234567"
 * - "962791234567" → "+962791234567"
 */
export function normalizeJordanMobile(mobileNumber: string): string {
	// Remove all spaces, dashes, and parentheses
	let normalized = mobileNumber.replace(/[\s\-()]/g, "");

	// Convert "00962" to "+962"
	if (normalized.startsWith("00962")) {
		normalized = `+${normalized.substring(2)}`;
	}
	// Convert "0962" to "+962" (in case someone types 0962 instead of 00962)
	else if (normalized.startsWith("0962")) {
		normalized = `+${normalized.substring(1)}`;
	}
	// Convert "07X" (local format) to "+9627X"
	else if (normalized.startsWith("07")) {
		normalized = `+962${normalized.substring(1)}`;
	}
	// Convert "962" (without prefix) to "+962"
	else if (normalized.startsWith("962")) {
		normalized = `+${normalized}`;
	}
	// If it already starts with +962, keep as is
	else if (normalized.startsWith("+962")) {
		// Already in correct format
	}

	return normalized;
}

export function validateJodNumber(mobileNumber: string): boolean {
	/**
	 * Validate Jordanian mobile numbers.
	 *
	 * Acceptable formats:
	 * - Local: 07XXXXXXXX
	 * - International: +9627XXXXXXX
	 * - Spaces allowed between digits for display (will be ignored)
	 */

	// Remove spaces and dashes
	const cleaned = mobileNumber.replace(/[\s-]/g, "");

	// Regex: local or international format
	// Matches: +9627[7895]XXXXXXX or 07[7895]XXXXXXX
	const pattern = /^(?:\+9627[7895]\d{7}|07[7895]\d{7})$/;

	return pattern.test(cleaned);
}
