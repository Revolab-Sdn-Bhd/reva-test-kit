import {
	ActionIcon,
	AppShell,
	Burger,
	Group,
	NavLink,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import { LuMessageCircleMore } from "react-icons/lu";
import { MdLogout, MdVideocam } from "react-icons/md";
import { useAuthStore } from "@/lib/store/use-auth-store";

interface NavItem {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{
		label: "LiveKit",
		href: "/dashboard/livekit",
		icon: MdVideocam,
	},
	{
		label: "Post Login",
		href: "/dashboard/post-login",
		icon: LuMessageCircleMore,
	},
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const auth = useAuthStore((state) => state.auth);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const [collapsed, { toggle }] = useDisclosure(true);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		// Wait for store to hydrate from localStorage
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		// Only check auth after hydration is complete
		if (isHydrated && !auth) {
			router.replace("/");
		}
	}, [isHydrated, auth, router]);

	const handleLogout = () => {
		clearAuth();
		router.replace("/");
	};

	// Show nothing while hydrating
	if (!isHydrated) {
		return null;
	}

	if (!auth) {
		return null;
	}

	return (
		<AppShell
			navbar={{
				width: collapsed ? 70 : 250,
				breakpoint: 0,
			}}
			padding={0}
		>
			<AppShell.Navbar p="md">
				<AppShell.Section>
					<Group justify={collapsed ? "center" : "space-between"} mb="md">
						{!collapsed && (
							<Text fw={700} size="lg">
								Reva Test Kit
							</Text>
						)}
						<ActionIcon onClick={toggle} variant="subtle" size="lg">
							<Burger opened={!collapsed} size="sm" />
						</ActionIcon>
					</Group>
				</AppShell.Section>

				<AppShell.Section grow mt="md">
					<Stack gap="xs">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = router.pathname === item.href;
							const navLink = (
								<NavLink
									key={item.href}
									href={item.href}
									component={Link}
									label={!collapsed ? item.label : undefined}
									leftSection={<Icon className="size-5" />}
									active={isActive}
									variant="filled"
									className="rounded-md"
								/>
							);

							return collapsed ? (
								<Tooltip
									key={item.href}
									label={item.label}
									position="right"
									withArrow
								>
									{navLink}
								</Tooltip>
							) : (
								navLink
							);
						})}
					</Stack>
				</AppShell.Section>

				<AppShell.Section>
					<Tooltip
						label="Logout"
						position="right"
						withArrow
						disabled={!collapsed}
					>
						<NavLink
							label={!collapsed ? "Logout" : undefined}
							leftSection={<MdLogout className="w-5 h-5" />}
							onClick={handleLogout}
							variant="filled"
							className="rounded-md"
						/>
					</Tooltip>
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main
				style={{
					height: "100vh",
					overflow: "auto",
					backgroundColor: "var(--mantine-color-dark-7)",
				}}
			>
				{children}
			</AppShell.Main>
		</AppShell>
	);
};

export default DashboardLayout;
