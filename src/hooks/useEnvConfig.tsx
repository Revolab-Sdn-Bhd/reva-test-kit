import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { EnvConfig } from "@/lib/types";

interface EnvConfigContextType {
  envConfig: EnvConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EnvConfigContext = createContext<EnvConfigContextType | undefined>(
  undefined
);

interface EnvConfigProviderProps {
  readonly children: ReactNode;
}

export function EnvConfigProvider({ children }: EnvConfigProviderProps) {
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/config");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch environment config: ${response.statusText}`
        );
      }

      const configData = await response.json();
      setEnvConfig(configData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching environment config:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvConfig();
  }, [fetchEnvConfig]);

  const refetch = useCallback(async () => {
    await fetchEnvConfig();
  }, [fetchEnvConfig]);

  const value: EnvConfigContextType = useMemo(
    () => ({
      envConfig,
      loading,
      error,
      refetch,
    }),
    [envConfig, loading, error, refetch]
  );

  return (
    <EnvConfigContext.Provider value={value}>
      {children}
    </EnvConfigContext.Provider>
  );
}

export function useEnvConfig(): EnvConfigContextType {
  const context = useContext(EnvConfigContext);

  if (context === undefined) {
    throw new Error("useEnvConfig must be used within an EnvConfigProvider");
  }

  return context;
}
