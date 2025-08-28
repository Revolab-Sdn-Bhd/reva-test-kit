import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/button/Button";

interface LanguageSelectionDialogProps {
  isOpen: boolean;
  onLanguageSelect: (language: "en" | "ar") => void;
  onClose: () => void;
  accentColor?: string;
}

export const LanguageSelectionDialog: React.FC<
  LanguageSelectionDialogProps
> = ({ isOpen, onLanguageSelect, onClose, accentColor = "cyan" }) => {
  const handleLanguageSelect = (language: "en" | "ar") => {
    onLanguageSelect(language);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full max-w-md p-6 mx-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl">
              <h2 className="mb-4 text-xl font-semibold text-center text-white">
                Select Language
              </h2>
              <p className="mb-6 text-sm text-center text-gray-400">
                Choose your preferred language for the conversation
              </p>

              <div className="flex flex-row gap-3">
                <Button
                  accentColor={accentColor}
                  onClick={() => handleLanguageSelect("en")}
                  className="w-full py-3 text-base font-medium"
                >
                  🇺🇸 English
                </Button>

                <Button
                  accentColor={accentColor}
                  onClick={() => handleLanguageSelect("ar")}
                  className="w-full py-3 text-base font-medium"
                >
                  🇸🇦 العربية
                </Button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 mt-4 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
