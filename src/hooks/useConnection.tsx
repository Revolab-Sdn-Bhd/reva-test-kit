import React, { createContext, useCallback, useState } from "react";
import { toast } from "sonner";
import { generateIntrospectToken } from "@/lib/api/post-login";
import { generateRandomAlphanumeric, getChatUrl } from "@/lib/util";
import { useEnvConfig } from "./useEnvConfig";

export type ConnectionMode = "cloud" | "manual" | "env";

type TokenGeneratorData = {
	shouldConnect: boolean;
	wsUrl: string;
	token: string;
	disconnect: () => Promise<void>;
	connect: (language: "en" | "ar") => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(
	undefined,
);

export const ConnectionProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [connectionDetails, setConnectionDetails] = useState<{
		wsUrl: string;
		token: string;
		shouldConnect: boolean;
	}>({ wsUrl: "", token: "", shouldConnect: false });

	const { envConfig } = useEnvConfig();

	const connect = useCallback(
		async (language: "en" | "ar") => {
			let url = "";
			if (!envConfig?.LIVEKIT_URL) {
				throw new Error("LIVEKIT_URL is not set");
			}

			url = envConfig.LIVEKIT_URL;

			const aiHandlerUrl = envConfig.AI_HANDLER_URL;

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
							"X-Livekit-Api-Key": envConfig.LIVEKIT_API_KEY ?? "",
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
						salt: envConfig.LIVEKIT_TOKEN_ENCRYPTION_KEY ?? "",
						nonceB64: nonce,
						encryptedTokenB64: token,
					}),
				});

				const data = await decryptRes.json();

				setConnectionDetails({
					wsUrl: url,
					token: data.decrypted,
					shouldConnect: true,
				});
			} catch (err) {
				console.error("Error fetching access token:", err);
				toast.error("Failed to fetch access token");
			}
		},
		[envConfig],
	);

	const disconnect = useCallback(async () => {
		setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
	}, []);

	return (
		<ConnectionContext.Provider
			value={{
				wsUrl: connectionDetails.wsUrl,
				token: connectionDetails.token,
				shouldConnect: connectionDetails.shouldConnect,
				connect,
				disconnect,
			}}
		>
			{children}
		</ConnectionContext.Provider>
	);
};

export const useConnection = () => {
	const context = React.useContext(ConnectionContext);
	if (context === undefined) {
		throw new Error("useConnection must be used within a ConnectionProvider");
	}
	return context;
};
