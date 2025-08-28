import { useRouter } from "next/router";
import { useAuthStore } from "@/lib/use-auth-store";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const auth = useAuthStore((state) => state.auth);

  useEffect(() => {
    if (auth) {
      router.replace("/dashboard/livecall");
    } else {
      router.replace("/signin");
    }
  }, [auth, router]);

  return null;
}
