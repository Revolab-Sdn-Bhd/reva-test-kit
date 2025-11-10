import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
	auth: string | null;
	setAuth: (user: string) => void;
	clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			auth: null,
			setAuth: (auth) => set({ auth: auth }),
			clearAuth: () => set({ auth: null }),
		}),
		{
			name: "reva-test-kit-auth",
			storage: createJSONStorage(() => localStorage),
		},
	),
);
