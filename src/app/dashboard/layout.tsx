"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/Dashboard/Sidebar";
import ThemeToggler from "@/components/Header/ThemeToggler";
import NotificationPanel from "@/components/Dashboard/NotificationPanel";
import ProfileDropdown from "@/components/Dashboard/ProfileDropdown";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem("accessToken");
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (!accessToken || isLoggedIn !== "true") {
        // Not authenticated - redirect to signin
        router.push("/signin");
        return;
      }

      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [router]);

  // Poll every 10 seconds to detect if session was revoked from another device
  useEffect(() => {
    const checkSession = async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return;

      try {
        await axios.post(`${API_URL}/api/auth/validate-session`, { refreshToken });
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Session revoked — clear tokens and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("user");
          localStorage.removeItem("userEmail");
          router.push("/signin?reason=session_revoked");
        }
      }
    };

    // Check immediately on mount, then every 3 seconds
    checkSession();
    pollingRef.current = setInterval(checkSession, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router]);

  // Enable automatic session timeout based on user preference
  const { showWarning, remainingSeconds, continueSession } = useSessionTimeout();

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
        <div className="relative flex flex-col items-center justify-center px-4">
          {/* Animated gradient spinner with flowing particle spiral */}
          <div className="relative">
            {/* Outer ring with gradient */}
            <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full bg-gradient-to-tr from-primary via-blue-500 to-primary opacity-75 blur-sm sm:h-24 sm:w-24"></div>

            {/* Middle ring */}
            <div className="absolute inset-2 h-16 w-16 animate-spin rounded-full bg-gradient-to-br from-primary/50 to-transparent sm:h-20 sm:w-20" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>

            {/* Flowing particle spiral - neon colors */}
            <div className="absolute inset-0 h-20 w-20 sm:h-24 sm:w-24">
              {/* Pink particle */}
              <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite] sm:h-24 sm:w-24">
                <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-pink-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(236, 72, 153, 0.9)' }}></div>
              </div>

              {/* Blue particle */}
              <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_0.6s] sm:h-24 sm:w-24">
                <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(59, 130, 246, 0.9)' }}></div>
              </div>

              {/* Green particle */}
              <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_1.2s] sm:h-24 sm:w-24">
                <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-green-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(34, 197, 94, 0.9)' }}></div>
              </div>

              {/* Yellow particle */}
              <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_1.8s] sm:h-24 sm:w-24">
                <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-yellow-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(234, 179, 8, 0.9)' }}></div>
              </div>

              {/* Red particle */}
              <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 animate-[particle-spiral_3s_ease-in-out_infinite_2.4s] sm:h-24 sm:w-24">
                <div className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-500 blur-[1px] sm:h-3 sm:w-3" style={{ boxShadow: '0 0 15px rgba(239, 68, 68, 0.9)' }}></div>
              </div>
            </div>

            {/* Inner ring with logo */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl dark:bg-gray-900 sm:h-24 sm:w-24">
              <div className="text-2xl font-bold text-primary sm:text-3xl">A</div>
            </div>
          </div>

          <style jsx>{`
            @keyframes particle-spiral {
              0% {
                transform: rotate(0deg) scale(0.8);
                opacity: 0;
              }
              15% {
                opacity: 1;
              }
              50% {
                transform: rotate(180deg) scale(1.1);
                opacity: 1;
              }
              85% {
                opacity: 1;
              }
              100% {
                transform: rotate(360deg) scale(0.8);
                opacity: 0;
              }
            }
          `}</style>

          {/* Loading text with animation */}
          <div className="mt-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white sm:text-xl">
              Loading Dashboard
            </h3>
            <div className="flex items-center justify-center gap-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-1 dark:bg-black">
      {/* Session Timeout Warning Modal */}
      {showWarning && (
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
      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="min-h-screen lg:ml-64">
        {/* Mobile Header with Hamburger */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white px-2 shadow-[0_8px_16px_-8px_rgba(0,0,0,0.1)] dark:bg-gray-dark dark:shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] lg:hidden">
          {/* Left side - Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Open sidebar"
          >
            <svg
              className="h-7 w-7 text-black dark:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {/* Right side - Icons */}
          <div className="flex items-center gap-2">
            <ThemeToggler />
            <NotificationPanel />
            <ProfileDropdown />
          </div>
        </div>

        {/* Desktop Top Bar - Full Width */}
        <div className="fixed left-64 right-0 top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b border-gray-800 bg-black px-6 lg:flex">
          <ThemeToggler />
          <NotificationPanel />
          <ProfileDropdown />
        </div>

        {/* Page Content */}
        <div className="p-4 pb-14 pt-6 sm:p-6 sm:pb-14 lg:pb-14 lg:pt-20">{children}</div>

        {/* Footer - Fixed on both mobile and desktop */}
        <footer className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-center bg-[#f8f9fa] py-3 dark:bg-black lg:left-64">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Secured by DD</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
