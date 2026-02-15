"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/Dashboard/Sidebar";
import ThemeToggler from "@/components/Header/ThemeToggler";
import NotificationPanel from "@/components/Dashboard/NotificationPanel";
import ProfileDropdown from "@/components/Dashboard/ProfileDropdown";
import { api } from "@/lib/api";
import Image from "next/image";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication immediately (synchronously) to avoid flash
  // Tokens are in httpOnly cookies, just check the login flag
  const isLoggedIn = typeof window !== 'undefined' ? localStorage.getItem("isLoggedIn") : null;
  const [isAuthenticated] = useState(
    isLoggedIn === "true"
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoggedIn !== "true") {
      router.push("/signin");
    }
  }, [router, isLoggedIn]);

  // Poll to detect if session was revoked from another device
  useEffect(() => {
    let checkInterval = 5000; // Default to 5 seconds as specified by backend

    const checkSession = async () => {
      try {
        const response = await api.validateSession();

        // Update interval if backend provides one
        if (response.data?.checkInterval) {
          checkInterval = response.data.checkInterval;
        }
      } catch (err: any) {
        // If we get a 401, session has been revoked - logout immediately
        if (err.response?.status === 401) {
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("user");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userName");
          localStorage.removeItem("userProfilePicture");
          window.dispatchEvent(new Event("authStateChanged"));
          router.push("/signin?reason=session_revoked");
        }
        // For network errors or server errors, continue polling silently
      }
    };

    // Start polling every 5 seconds (or checkInterval from backend)
    const startPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(checkSession, checkInterval);
    };

    // Check immediately on mount
    checkSession();
    // Start polling
    startPolling();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router]);

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-1 dark:bg-black">
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
        <div className="fixed left-64 right-0 top-0 z-30 hidden h-16 items-center justify-end gap-3 border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-black lg:flex">
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
