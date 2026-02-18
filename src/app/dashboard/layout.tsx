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

function SecuritySetupPrompt({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-dark">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-purple-500" />

        <div className="p-8">
          {/* Icon */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-center text-2xl font-bold text-black dark:text-white">
            Secure Your Account
          </h2>
          <p className="mb-6 text-center text-sm leading-relaxed text-body-color dark:text-body-color-dark">
            To protect your investments and comply with <strong>anti-money laundering (AML)</strong> regulations,
            please complete the following steps:
          </p>

          {/* Steps */}
          <div className="mb-7 space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                <svg className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Adds an extra layer of security to your login.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4 dark:bg-purple-900/20">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                <svg className="h-4 w-4 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">KYC Verification</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Required by AML laws to verify your identity before investing.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <Link
            href="/dashboard/security"
            onClick={onDismiss}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white transition hover:bg-primary/90"
          >
            Set Up Now
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            onClick={onDismiss}
            className="w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-body-color transition hover:bg-gray-50 dark:border-gray-700 dark:text-body-color-dark dark:hover:bg-gray-800"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'notification' | 'profile' | null>(null);
  const [showSecurityPrompt, setShowSecurityPrompt] = useState(false);
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

  // Show security prompt only if 2FA is disabled OR KYC is not yet submitted/verified
  useEffect(() => {
    if (isLoggedIn !== "true") return;

    api.getProfile()
      .then((res) => {
        const { twoFactorEnabled, kycStatus } = res.data || {};
        const kycComplete = kycStatus === "verified" || kycStatus === "approved" || kycStatus === "pending_review" || kycStatus === "pending";
        if (!twoFactorEnabled || !kycComplete) {
          setShowSecurityPrompt(true);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, [isLoggedIn]);

  const dismissSecurityPrompt = () => {
    setShowSecurityPrompt(false);
  };

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
          api.clearTokens();
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
      {/* Security Setup Prompt - shown once on first login */}
      {showSecurityPrompt && <SecuritySetupPrompt onDismiss={dismissSecurityPrompt} />}

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
                  src="/images/logo/A-LogoB.png"
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
                    <NotificationPanel
                      isOpen={activeDropdown === 'notification'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'notification' ? null : 'notification')}
                    />
                  </div>

                  {/* Right side - Profile Dropdown */}
                  <div className="flex items-center gap-2">
                    <ProfileDropdown
                      isOpen={activeDropdown === 'profile'}
                      onToggle={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')}
                    />
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
