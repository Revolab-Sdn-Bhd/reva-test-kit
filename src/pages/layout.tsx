import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/router";
import { MdDashboard, MdMic, MdLogout } from "react-icons/md";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex bg-black text-white">
      {/* Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 z-20 bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700"
      >
        <Image src="/logo.svg" alt="Toggle Sidebar" width={30} height={30} />
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: isSidebarOpen ? 0 : -260 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 h-full w-64 bg-gray-900 text-white p-4 border-r border-gray-800 z-10"
      >
        <nav className="flex flex-col gap-2 mt-14">
          <button
            className="hover:bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 text-left"
            onClick={() => router.push("/")}
          >
            Dashboard <MdDashboard size={20} />
          </button>
          <button
            className="hover:bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 text-left"
            onClick={() => router.push("/audio")}
          >
            Audio Page <MdMic size={20} />
          </button>
          <button className="hover:bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2 text-left">
            Sign Out <MdLogout size={20} />
          </button>
        </nav>
      </motion.aside>

      {/* Main content */}
      <motion.section
        animate={{ marginLeft: isSidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col flex-1 items-center justify-end w-full h-full px-4 pb-20"
      >
        {children}
      </motion.section>
    </div>
  );
}
