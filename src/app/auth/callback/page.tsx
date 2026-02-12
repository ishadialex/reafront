"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCallbackSkeleton from "@/components/AuthCallbackSkeleton";

// Force dynamic rendering - don't statically generate this page
export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");

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

    // Tokens are now in httpOnly cookies (set by backend during redirect)
    // Just set login state and redirect to dashboard
    localStorage.setItem("isLoggedIn", "true");
    router.replace("/dashboard");
  }, [searchParams, router]);

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
