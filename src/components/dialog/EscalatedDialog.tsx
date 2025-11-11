import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { FaWhatsapp } from "react-icons/fa";

interface EscalatedDialogProps {
	isOpen: boolean;
	onClose: () => void;
	waLink?: string;
}

const EscalatedDialog: React.FC<EscalatedDialogProps> = ({
	isOpen,
	onClose,
	waLink,
}) => {
	if (!waLink) {
		return null;
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						className="fixed inset-0 z-40 bg-black bg-opacity-50"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>

					<motion.div
						className="fixed inset-0 z-50 flex items-center justify-center p-4"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						transition={{ duration: 0.2 }}
					>
						<div className="w-full max-w-md p-6 mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
							<h2 className="mb-4 text-xl font-semibold text-center text-white">
								Escalate to WhatsApp
							</h2>
							<p className="mb-6 text-sm text-center text-gray-400">
								Click the button below to continue the conversation on WhatsApp.
							</p>

							<div className="flex justify-center">
								<button
									type="button"
									onClick={() => {
										window.open(waLink, "_blank");
									}}
									className="p-3 duration-300 bg-green-500 rounded-full cursor-pointer hover:shadow-lg hover:bg-green-800"
								>
									<FaWhatsapp size={50} color="white" />
								</button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default EscalatedDialog;
