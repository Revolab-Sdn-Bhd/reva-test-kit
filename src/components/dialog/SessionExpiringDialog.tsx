import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

type Props = {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	message?: string;
	mode?: "fullscreen" | "inline";
};

const SessionExpiringDialog: React.FC<Props> = ({
	isOpen,
	onClose,
	title = "Session Expired",
	message = "Your session is expired. Please chat again to continue.",
	mode = "fullscreen",
}) => {
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const containerClass =
		mode === "inline"
			? "absolute inset-0 z-40 bg-black bg-opacity-50"
			: "fixed inset-0 z-40 bg-black bg-opacity-50";

	const contentClass =
		mode === "inline"
			? "absolute inset-0 z-50 flex items-center justify-center p-4"
			: "fixed inset-0 z-50 flex items-center justify-center p-4";

	return (
		<AnimatePresence>
			<motion.div
				role="dialog"
				aria-modal="true"
				aria-labelledby="session-expiring-title"
				className={containerClass}
			>
				<motion.div className={contentClass}>
					<div className="w-full max-w-md p-6 mx-4 text-white bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
						<h2 id="session-expiring-title" style={{ margin: 0, fontSize: 18 }}>
							{title}
						</h2>
						<p style={{ marginTop: 8 }}>{message}</p>

						<div
							style={{
								display: "flex",
								justifyContent: "flex-end",
								marginTop: 16,
							}}
						>
							<button
								onClick={onClose}
								aria-label="Close"
								className="px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
							>
								Close
							</button>
						</div>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};

export default SessionExpiringDialog;
