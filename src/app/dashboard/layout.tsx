"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/Dashboard/Sidebar";
import ThemeToggler from "@/components/Header/ThemeToggler";
import NotificationPanel from "@/components/Dashboard/NotificationPanel";
import ProfileDropdown from "@/components/Dashboard/ProfileDropdown";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import axios from "axios";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication immediately (synchronously) to avoid flash
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
  const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem("isLoggedIn") : null;
  const [isAuthenticated, setIsAuthenticated] = useState(
    accessToken !== null && isLoggedIn === "true"
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!accessToken || isLoggedIn !== "true") {
      router.push("/signin");
    }
  }, [router, accessToken, isLoggedIn]);

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
        <div className="sticky top-0 z-30 bg-white shadow-[0_8px_16px_-8px_rgba(0,0,0,0.1)] dark:bg-gray-dark dark:shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] lg:hidden">
          {/* Top bar with hamburger, logo, and menu */}
          <div className="relative flex h-16 items-center justify-between px-4">
            {/* Left side - Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open sidebar"
            >
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
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

            {/* Center - Logo/Brand */}
            <div className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2">
              <Link href="/" className="block">
                {/* Light mode logo */}
                <Image
                  src="/images/logo/A-logobbb.jpg"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="block dark:hidden"
                />
                {/* Dark mode logo */}
                <Image
                  src="/images/logo/A-Logo.png"
                  alt="Logo"
                  width={120}
                  height={40}
                  className="hidden dark:block"
                />
              </Link>
            </div>

            {/* Right side - Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="More options"
            >
              <svg
                className="h-6 w-6 text-gray-600 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>

          {/* Dropdown Menu - Expands below when three-dot is clicked */}
          {mobileMenuOpen && (
            <>
              {/* Overlay to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Dropdown content */}
              <div className="relative z-50 h-16 border-t border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-dark">
                <div className="flex h-full items-center justify-between gap-4">
                  {/* Left side - Theme Toggler and Notification */}
                  <div className="flex items-center gap-2">
                    <ThemeToggler />
                    <NotificationPanel />
                  </div>

                  {/* Right side - Profile Dropdown */}
                  <div className="flex items-center gap-2">
                    <ProfileDropdown />
                  </div>
                </div>
              </div>
            </>
          )}
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
