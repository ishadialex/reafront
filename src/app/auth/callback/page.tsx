"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCallbackSkeleton from "@/components/AuthCallbackSkeleton";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Force dynamic rendering - don't statically generate this page
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent double execution
      if (isProcessing) return;
      setIsProcessing(true);

      const error = searchParams.get("error");
      const token = searchParams.get("token");

      if (error) {
        // Handle OAuth errors
        let errorMessage = "Authentication failed";
        switch (error) {
          case "missing_code":
            errorMessage = "Authorization code missing";
            break;
          case "invalid_token":
            errorMessage = "Invalid authentication token";
            break;
          case "email_already_exists":
            errorMessage = "This email is already linked to another account";
            break;
          case "oauth_failed":
            errorMessage = "OAuth authentication failed";
            break;
        }

        alert(errorMessage);
        router.replace("/signin");
        return;
      }

      if (!token) {
        console.error("No OAuth token provided");
        router.replace("/signin?error=oauth_failed");
        return;
      }

      try {
        // Exchange temporary OAuth token for httpOnly cookies
        // This request goes through the rewrite proxy, making cookies first-party
        const response = await axios.post(`${API_URL}/api/auth/exchange-oauth-token`,
          { token },
          { withCredentials: true }
        );

        if (response.data.success) {
          const user = response.data.data.user;

          // Store user data in localStorage
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("user", JSON.stringify(user));

          if (user.email) {
            localStorage.setItem("userEmail", user.email);
          }

          if (user.firstName || user.lastName) {
            const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            localStorage.setItem("userName", userName);
          }

          if (user.profilePhoto) {
            localStorage.setItem("userProfilePicture", user.profilePhoto);
          }

          // Redirect to dashboard
          router.replace("/dashboard");
        } else {
          throw new Error("Token exchange failed");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        // Clear any partial state and redirect to signin
        localStorage.removeItem("isLoggedIn");
        router.replace("/signin?error=oauth_failed");
      }
    };

    processCallback();
  }, [searchParams, router, isProcessing]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
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
            Completing Authentication
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

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackSkeleton />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
