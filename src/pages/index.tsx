import Image from "next/image";
import { useRouter } from "next/router";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button/Button";
import { useAuthStore } from "@/lib/store/use-auth-store";

const SUPERADMIN_INFO = {
	username: "Reva_Test_Kit",
	password: "Reva@TestKit",
};

export default function Home() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const router = useRouter();

	const auth = useAuthStore((state) => state.auth);
	const setAuth = useAuthStore((state) => state.setAuth);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!username || !password) {
			setError("Please enter both username and password");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const isValidUser =
				username === SUPERADMIN_INFO.username &&
				password === SUPERADMIN_INFO.password;

			if (!isValidUser) {
				toast.error("Invalid username or password");
				return;
			}

			setAuth(username);
			toast.success("Sign-in successful");

			router.replace("/dashboard/livekit");
		} catch (err) {
			console.error("Sign-in error:", err);
			setError("Sign-in failed. Please check your credentials.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (auth) {
			router.replace("/dashboard/livekit");
		}
	}, [auth]);

	return (
		<div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
			<div className="w-full max-w-md space-y-8">
				<div className="flex flex-col items-center">
					<Image src="/logo.png" alt="logo" width={50} height={50} />
					<h2 className="mt-6 text-3xl font-bold text-center text-gray-900">
						Sign in to your account
					</h2>
					<p className="mt-2 text-sm text-center text-gray-600">
						Welcome to Reva Test Kit
					</p>
				</div>

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="username"
								className="block mb-2 text-sm font-medium text-gray-700"
							>
								Username
							</label>
							<input
								id="username"
								name="username"
								type="text"
								autoComplete="username"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
								placeholder="Enter your username"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block mb-2 text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 transition-colors bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
								placeholder="Enter your password"
							/>
						</div>
					</div>

					{error && (
						<div className="p-3 border border-red-300 rounded-md bg-red-50">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg
										className="w-5 h-5 text-red-500"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<title>Error icon</title>
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-700">{error}</p>
								</div>
							</div>
						</div>
					)}

					<div>
						<Button
							type="submit"
							accentColor="cyan"
							disabled={isLoading}
							className="w-full px-4 py-2 text-sm font-medium"
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<svg
										className="w-5 h-5 mr-3 -ml-1 text-gray-900 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<title>Loading spinner</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Signing in...
								</div>
							) : (
								"Sign in"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
