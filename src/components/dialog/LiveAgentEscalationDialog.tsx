import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from 'next/navigation';

type LiveAgentEscalationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  mode?: "fullscreen" | "inline";

  sessionId: string | null;
}

export default function LiveAgentEscalationDialog({
  isOpen,
  onClose,
  sessionId,
  mode = "fullscreen",
}: Readonly<LiveAgentEscalationDialogProps>) {
  const router = useRouter();

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
      {isOpen && (
        <>
          <motion.div
            className={containerClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={contentClass}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full max-w-md p-6 mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
              <h2 className="mb-4 text-xl font-semibold text-center text-white">
                Escalate to live agent
              </h2>
              <p className="mb-6 text-sm text-center text-gray-400">
                Click the button below to continue the conversation with a live agent.
              </p>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/dashboard/post-login/?sessionId=${sessionId}`);
                    onClose();
                  }}
                  className="p-3 duration-300 bg-green-500 rounded-full cursor-pointer hover:shadow-lg hover:bg-green-800"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}