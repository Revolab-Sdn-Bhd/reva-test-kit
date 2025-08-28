import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronIcon } from "./icons";
import useConfigStore from "@/hooks/useConfig";

type SettingType = "inputs" | "outputs" | "chat" | "theme_color";

type SettingValue = {
  title: string;
  type: SettingType | "separator";
  key: string;
};

const settingsDropdown: SettingValue[] = [
  {
    title: "Show chat",
    type: "chat",
    key: "N/A",
  },
  {
    title: "---",
    type: "separator",
    key: "separator_1",
  },
  {
    title: "Show video",
    type: "outputs",
    key: "video",
  },
  {
    title: "Show audio",
    type: "outputs",
    key: "audio",
  },

  {
    title: "---",
    type: "separator",
    key: "separator_2",
  },
  {
    title: "Enable camera",
    type: "inputs",
    key: "camera",
  },
  {
    title: "Enable mic",
    type: "inputs",
    key: "mic",
  },
  {
    title: "Allow screenshare",
    type: "inputs",
    key: "screen",
  },
];

export const SettingsDropdown = () => {
  const settings = useConfigStore((state) => state.userSettings);
  const setUserSettings = useConfigStore((state) => state.setUserSettings);

  const isEnabled = (setting: SettingValue) => {
    if (setting.type === "separator" || setting.type === "theme_color")
      return false;
    if (setting.type === "chat") {
      return settings[setting.type];
    }

    if (setting.type === "inputs") {
      const key = setting.key as "camera" | "mic" | "screen";
      return settings.inputs[key];
    } else if (setting.type === "outputs") {
      const key = setting.key as "video" | "audio";
      return settings.outputs[key];
    }

    return false;
  };

  const toggleSetting = (setting: SettingValue) => {
    if (setting.type === "separator" || setting.type === "theme_color") return;
    const newValue = !isEnabled(setting);
    const newSettings = { ...settings };

    if (setting.type === "chat") {
      newSettings.chat = newValue;
    } else if (setting.type === "inputs") {
      newSettings.inputs[setting.key as "camera" | "mic" | "screen"] = newValue;
    } else if (setting.type === "outputs") {
      newSettings.outputs[setting.key as "video" | "audio"] = newValue;
    }
    setUserSettings(newSettings);
  };

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="flex inline-flex items-center h-full gap-1 p-1 py-1 pl-2 pr-2 my-auto text-sm text-gray-100 bg-gray-900 border-gray-800 rounded-md group max-h-12 hover:bg-gray-800">
        Settings
        <ChevronIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 flex flex-col gap-0 py-2 overflow-hidden text-sm text-gray-100 bg-gray-900 border border-gray-800 rounded w-60"
          sideOffset={5}
          collisionPadding={16}
        >
          {settingsDropdown.map((setting) => {
            if (setting.type === "separator") {
              return (
                <div
                  key={setting.key}
                  className="my-2 border-t border-gray-800"
                />
              );
            }

            return (
              <DropdownMenu.Label
                key={setting.key}
                onClick={() => toggleSetting(setting)}
                className="flex flex-row items-end max-w-full gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-gray-800"
              >
                <div className="flex items-center w-4 h-4">
                  {isEnabled(setting) && <CheckIcon />}
                </div>
                <span>{setting.title}</span>
              </DropdownMenu.Label>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
