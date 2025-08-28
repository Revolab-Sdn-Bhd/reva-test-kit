import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { MdMic, MdLogout, MdCall, MdMenu, MdClose } from "react-icons/md";
import { useAuthStore } from "@/lib/use-auth-store";
import Image from "next/image";

interface LayoutProps {
  readonly children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <div className="fixed inset-0 flex bg-gray-50">
      {/* Top bar with menu toggle and logo */}
      <div className="absolute z-20 flex items-center gap-3 top-4 left-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-700 transition-colors rounded-lg hover:bg-gray-200"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ?
            <MdClose size={24} />
          : <MdMenu size={24} />}
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Reva Test Kit" width={28} height={28} />
          <span className="text-lg font-semibold text-gray-900">
            Reva Test Kit
          </span>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-opacity-50 z-5 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: isSidebarOpen ? 0 : -260 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 z-10 w-64 h-full p-4 text-gray-800 bg-white border-r border-gray-200 shadow-lg"
      >
    
        <nav className="flex flex-col gap-2 mt-14">
          <button
            className="flex items-center gap-2 px-3 py-2 text-left text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={() => router.push("/dashboard/livecall")}
          >
            <MdCall size={20} /> Live Call
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-left text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={() => router.push("/dashboard/audio")}
          >
            <MdMic size={20} /> Audio Transcription
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-left text-red-600 rounded-lg hover:bg-red-50"
            onClick={() => clearAuth()}
          >
            <MdLogout size={20} /> Sign Out
          </button>
        </nav>
      </motion.aside>

      {/* Main content */}
      <motion.section
        animate={{ marginLeft: isSidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-end flex-1 w-full h-full px-4 pb-20"
      >
        {children}
      </motion.section>
    </div>
  );
}
