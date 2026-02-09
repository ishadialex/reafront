"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to overview page
    router.push("/dashboard/overview");
  }, [router]);

  return (
    <div className="flex h-96 items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-2xl font-bold text-black dark:text-white">
          Loading Dashboard...
        </div>
      </div>
    </div>
  );
}
