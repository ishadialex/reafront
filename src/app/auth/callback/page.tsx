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
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Completing authentication...
        </p>
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
