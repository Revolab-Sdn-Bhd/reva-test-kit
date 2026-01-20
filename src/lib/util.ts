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
