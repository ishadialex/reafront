"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

function GlobalSessionTimeout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    setIsAuthenticated(accessToken !== null && isLoggedIn === "true");
  }, []);

  // Always call the hook (Rules of Hooks - must be called unconditionally)
  // But only show warning when user is authenticated
  const { showWarning, remainingSeconds, continueSession } = useSessionTimeout();

  return (
    <>
      {/* Global Session Timeout Warning Modal - Only show if authenticated */}
      {isAuthenticated && showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  You will be logged out due to inactivity
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/20">
              <p className="mb-2 text-sm text-yellow-800 dark:text-yellow-300">
                Your session will expire in:
              </p>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {remainingSeconds}s
              </div>
            </div>

            <button
              onClick={continueSession}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Continue Session
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
      <GlobalSessionTimeout>
        {children}
      </GlobalSessionTimeout>
    </ThemeProvider>
  );
}
