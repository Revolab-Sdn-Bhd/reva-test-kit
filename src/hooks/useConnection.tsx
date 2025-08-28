import React, { createContext, useCallback, useState } from "react";
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
  undefined
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
      let token = "";
      let url = "";
      if (!envConfig?.LIVEKIT_URL) {
        throw new Error("LIVEKIT_URL is not set");
      }

      url = envConfig.LIVEKIT_URL;

      console.log(envConfig);

      const aiHandlerUrl = envConfig.AI_HANDLER_URL;

      try {
        const { token } = await fetch(`${aiHandlerUrl}/api/v1/livekit/tokens`, {
          method: "POST",
          headers: {
            "X-Livekit-Api-Key": envConfig.LIVEKIT_API_KEY ?? "",
            "X-Reflect-Token": "",
          },
          body: JSON.stringify({
            identity: "xxx",
            name: "xxx",
            language: language,
          }),
        }).then((res) => res.json());

        setConnectionDetails({ wsUrl: url, token, shouldConnect: true });
      } catch (err) {
        console.error("Error fetching access token:", err);
      }
    },
    [envConfig]
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
