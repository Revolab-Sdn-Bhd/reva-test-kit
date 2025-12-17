import React, { createContext, useCallback, useState } from "react";
import { toast } from "sonner";
import { generateIntrospectToken } from "@/lib/api/post-login";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { generateRandomAlphanumeric, getChatUrl } from "@/lib/util";
import { useEnvConfig } from "./useEnvConfig";

export type ConnectionMode = "cloud" | "manual" | "env";

type TokenGeneratorData = {
	shouldConnect: boolean;
	wsUrl: string;
	token: string;
	tokenExpiresAt: number | null;
	disconnect: () => Promise<void>;
	connect: (language: "en" | "ar") => Promise<void>;
};

const LivekitConnectionContext = createContext<TokenGeneratorData | undefined>(
	undefined,
);

export const LivekitConnectionProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [connectionDetails, setConnectionDetails] = useState<{
		wsUrl: string;
		token: string;
		shouldConnect: boolean;
		tokenExpiresAt: number | null;
	}>({ wsUrl: "", token: "", shouldConnect: false, tokenExpiresAt: null });

	const { envConfig } = useEnvConfig();
	const environment = useAuthStore((state) => state.environment);

	const connect = useCallback(
		async (language: "en" | "ar") => {
			let url = "";
			if (!envConfig?.LIVEKIT_URL) {
				throw new Error("LIVEKIT_URL is not set");
			}

			url =
				environment === "staging"
					? String(envConfig.LIVEKIT_URL ?? "")
					: String(envConfig.LIVEKIT_URL_DEV ?? "");

			// If token is still valid, reuse it to reconnect back to same LiveKit session
			if (
				connectionDetails.token &&
				connectionDetails.tokenExpiresAt &&
				connectionDetails.tokenExpiresAt > Date.now()
			) {
				setConnectionDetails((prev) => ({ ...prev, shouldConnect: true }));
				return;
			}

			const aiHandlerUrl =
				environment === "staging"
					? String(envConfig.AI_HANDLER_URL ?? "")
					: String(envConfig.AI_HANDLER_URL_DEV ?? "");
			const rotatingId = generateRandomAlphanumeric(16);
			const chatUrl = getChatUrl(envConfig);
			const reflectIntrospectToken = await generateIntrospectToken(
				chatUrl,
				generateRandomAlphanumeric(16),
			);

			try {
				const tokenResponse = await fetch(
					`${aiHandlerUrl}/api/v1/livekit/tokens`,
					{
						method: "POST",
						headers: {
							"X-Livekit-Api-Key":
								environment === "staging"
									? String(envConfig.LIVEKIT_API_KEY ?? "")
									: String(envConfig.LIVEKIT_API_KEY_DEV ?? ""),
							"X-Rotating-ID": rotatingId,
							"X-Reflect-Token": reflectIntrospectToken,
						},
						body: JSON.stringify({
							identity: generateRandomAlphanumeric(16),
							name: "test_name",
							language: language,
						}),
					},
				);
				const { token, nonce } = await tokenResponse.json();

				const decryptRes = await fetch("/api/decrypt", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						rotatingId: rotatingId,
						salt:
							environment === "staging"
								? envConfig.LIVEKIT_TOKEN_ENCRYPTION_KEY
								: envConfig.LIVEKIT_TOKEN_ENCRYPTION_KEY_DEV,
						nonceB64: nonce,
						encryptedTokenB64: token,
					}),
				});

				const data = await decryptRes.json();

				// Set token expiry to 15 minutes from now
				const tokenExpiresAt = Date.now() + 15 * 60 * 1000;

				setConnectionDetails({
					wsUrl: url,
					token: data.decrypted,
					shouldConnect: true,
					tokenExpiresAt,
				});
			} catch (err) {
				console.error("Error fetching access token:", err);
				toast.error("Failed to fetch access token");
			}
		},
		[envConfig, connectionDetails.token, connectionDetails.tokenExpiresAt],
	);

	const disconnect = useCallback(async () => {
		setConnectionDetails({
			wsUrl: "",
			token: "",
			shouldConnect: false,
			tokenExpiresAt: null,
		});
	}, []);

	return (
		<LivekitConnectionContext.Provider
			value={{
				wsUrl: connectionDetails.wsUrl,
				token: connectionDetails.token,
				shouldConnect: connectionDetails.shouldConnect,
				tokenExpiresAt: connectionDetails.tokenExpiresAt,
				connect,
				disconnect,
			}}
		>
			{children}
		</LivekitConnectionContext.Provider>
	);
};

export const useLivekitConnection = () => {
	const context = React.useContext(LivekitConnectionContext);
	if (context === undefined) {
		throw new Error("useConnection must be used within a ConnectionProvider");
	}
	return context;
};
