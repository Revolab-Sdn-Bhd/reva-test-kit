import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { generateIntrospectToken } from "@/lib/api/post-login";
import { generateRandomAlphanumeric, getChatUrl } from "@/lib/util";
import { useEnvConfig } from "./useEnvConfig";

export type ConnectionMode = "cloud" | "manual" | "env";

type Environment = "dev" | "staging";

type LivekitConnectionState = {
	wsUrl: string;
	token: string;
	shouldConnect: boolean;
	tokenExpiresAt: number | null;
	environment: Environment;
	setConnectionDetails: (details: {
		wsUrl: string;
		token: string;
		shouldConnect: boolean;
		tokenExpiresAt: number | null;
	}) => void;
	setShouldConnect: (shouldConnect: boolean) => void;
	setEnvironment: (environment: Environment) => void;
	reset: () => void;
};

const initialConnectionState: Pick<
	LivekitConnectionState,
	"wsUrl" | "token" | "shouldConnect" | "tokenExpiresAt" | "environment"
> = {
	wsUrl: "",
	token: "",
	shouldConnect: false,
	tokenExpiresAt: null,
	environment: "staging",
};

const safeStorage = createJSONStorage(() => {
	if (typeof window === "undefined") {
		return {
			getItem: () => null,
			setItem: () => undefined,
			removeItem: () => undefined,
		} as const;
	}

	return localStorage;
});

const useLivekitConnectionStore = create<LivekitConnectionState>()(
	persist(
		(set) => ({
			...initialConnectionState,
			setConnectionDetails: (details) =>
				set((state) => ({
					...state,
					...details,
				})),
			setShouldConnect: (shouldConnect) =>
				set((state) => ({
					...state,
					shouldConnect,
				})),
			setEnvironment: (environment) =>
				set((state) => ({
					...state,
					environment,
				})),
			reset: () =>
				set((state) => ({
					...initialConnectionState,
					environment: state.environment,
				})),
		}),
		{
			name: "livekit-connection-store",
			storage: safeStorage,
			partialize: (state) => ({
				wsUrl: state.wsUrl,
				token: state.token,
				shouldConnect: state.shouldConnect,
				tokenExpiresAt: state.tokenExpiresAt,
				environment: state.environment,
			}),
		},
	),
);

export const useLivekitConnection = () => {
	const { envConfig } = useEnvConfig();

	const {
		wsUrl,
		token,
		shouldConnect,
		tokenExpiresAt,
		environment,
		setConnectionDetails,
		setShouldConnect,
		setEnvironment,
		reset,
	} = useLivekitConnectionStore();

	useEffect(() => {
		if (tokenExpiresAt && tokenExpiresAt <= Date.now()) {
			reset();
		}
	}, [reset, tokenExpiresAt]);

	const connect = useCallback(
		async (language: "en" | "ar") => {
			if (!envConfig?.LIVEKIT_URL) {
				throw new Error("LIVEKIT_URL is not set");
			}

			const url =
				environment === "staging"
					? String(envConfig.LIVEKIT_URL ?? "")
					: String(envConfig.LIVEKIT_URL_DEV ?? "");

			// If token is still valid, reuse it to reconnect back to same LiveKit session
			if (token && tokenExpiresAt && tokenExpiresAt > Date.now()) {
				setShouldConnect(true);
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
				const { token: encryptedToken, nonce } = await tokenResponse.json();

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
						encryptedTokenB64: encryptedToken,
					}),
				});

				const data = await decryptRes.json();

				// Set token expiry to 15 minutes from now
				const newTokenExpiresAt = Date.now() + 15 * 60 * 1000;

				setConnectionDetails({
					wsUrl: url,
					token: data.decrypted,
					shouldConnect: true,
					tokenExpiresAt: newTokenExpiresAt,
				});
			} catch (err) {
				console.error("Error fetching access token:", err);
				toast.error("Failed to fetch access token");
			}
		},
		[
			envConfig,
			environment,
			setConnectionDetails,
			setShouldConnect,
			token,
			tokenExpiresAt,
		],
	);

	const disconnect = useCallback(async () => {
		reset();
	}, [reset]);

	const changeEnvironment = useCallback(
		(nextEnvironment: Environment) => {
			setEnvironment(nextEnvironment);
		},
		[setEnvironment],
	);

	return {
		wsUrl,
		token,
		shouldConnect,
		tokenExpiresAt,
		environment,
		connect,
		disconnect,
		changeEnvironment,
	};
};
