import AddSavingSpaceModal from "@/components/post-login/add-saving-space-modal";
import CreateUserAccountModal from "@/components/post-login/create-user-account-modal";

export const modals = {
	addSavingSpace: AddSavingSpaceModal,
	createUserAccount: CreateUserAccountModal,
};

declare module "@mantine/modals" {
	export interface MantineModalsOverride {
		modals: typeof modals;
	}
}
