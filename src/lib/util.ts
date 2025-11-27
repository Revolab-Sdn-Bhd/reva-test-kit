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
