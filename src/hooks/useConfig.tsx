import { AttributeItem } from "@/lib/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AppConfig = {
  title: string;
  description: string;
  github_link?: string;
  video_fit?: "cover" | "contain";
  settings: UserSettings;
  show_qr?: boolean;
};

export type UserSettings = {
  editable: boolean;
  theme_color: string;
  chat: boolean;
  inputs: {
    camera: boolean;
    screen: boolean;
    mic: boolean;
  };
  outputs: {
    audio: boolean;
    video: boolean;
  };
  ws_url: string;
  token: string;
  room_name: string;
  participant_id: string;
  participant_name: string;
  agent_name?: string;
  metadata?: string;
  attributes?: AttributeItem[];
};

const defaultConfig: AppConfig = {
  title: "Reva Live Call",
  description: "Reva Live Call",
  video_fit: "contain",
  settings: {
    editable: true,
    theme_color: "cyan",
    chat: true,
    inputs: {
      camera: true,
      screen: true,
      mic: true,
    },
    outputs: {
      audio: true,
      video: true,
    },
    ws_url: "",
    token: "",
    room_name: "",
    participant_id: "",
    participant_name: "",
    metadata: "",
    attributes: [],
  },
  show_qr: false,
};

interface ConfigStore {
  userSettings: UserSettings;
  setUserSettings: (
    settings: UserSettings | ((prev: UserSettings) => UserSettings)
  ) => void;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
}

const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      userSettings: defaultConfig.settings,
      setUserSettings: (settings) =>
        set((state) => ({
          userSettings:
            typeof settings === "function" ?
              settings(state.userSettings)
            : settings,
        })),
      updateSetting: (key, value) =>
        set((state) => ({
          userSettings: {
            ...state.userSettings,
            [key]: value,
          },
        })),
    }),
    {
      name: "reva-config-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useConfigStore;
