import Link from "next/link";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import {
	MdArrowBack,
	MdLogin,
	MdLogout,
	MdMenu,
	MdVideocam,
} from "react-icons/md";
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
		icon: MdLogin,
	},
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const auth = useAuthStore((state) => state.auth);
	const clearAuth = useAuthStore((state) => state.clearAuth);
	const [isCollapsed, setIsCollapsed] = useState(false);
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
		<div className="flex h-screen bg-gray-900">
			{/* Sidebar */}
			<aside
				className={`border-r transition-all duration-300 ${
					isCollapsed ? "w-16" : "w-64"
				} bg-gray-800 border-gray-700`}
			>
				<div className="flex flex-col h-full">
					{/* Logo/Brand & Toggle */}
					<div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
						{!isCollapsed && (
							<h1 className="text-xl font-bold text-gray-100 text-nowrap">
								Reva Test Kit
							</h1>
						)}
						<button
							onClick={() => setIsCollapsed(!isCollapsed)}
							className="p-2 text-gray-300 transition-colors rounded-lg hover:bg-gray-700"
							aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						>
							{isCollapsed ? (
								<MdMenu className="w-5 h-5" />
							) : (
								<MdArrowBack className="w-5 h-5" />
							)}
						</button>
					</div>

					{/* Navigation */}
					<nav className="flex-1 p-4 space-y-2">
						{navItems.map((item) => {
							const Icon = item.icon;
							const isActive = router.pathname === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-3 rounded-lg transition-colors ${
										isActive
											? "bg-blue-900 text-blue-400 font-medium"
											: "text-gray-200 hover:bg-gray-700"
									} ${isCollapsed ? "px-2 py-3" : "px-4 py-3"}`}
									title={isCollapsed ? item.label : undefined}
								>
									<Icon className="flex-shrink-0 w-5 h-5" />
									{!isCollapsed && <span>{item.label}</span>}
								</Link>
							);
						})}
					</nav>

					{/* Logout Button */}
					<div className="p-4 border-t border-gray-700">
						<button
							onClick={handleLogout}
							className={`flex items-center gap-3 w-full rounded-lg transition-colors text-gray-200 hover:bg-gray-700 ${
								isCollapsed ? "px-2 py-3" : "px-4 py-3"
							}`}
							title={isCollapsed ? "Logout" : undefined}
						>
							<MdLogout className="flex-shrink-0 w-5 h-5" />
							{!isCollapsed && <span>Logout</span>}
						</button>
					</div>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 overflow-auto">{children}</main>
		</div>
	);
};

export default DashboardLayout;
