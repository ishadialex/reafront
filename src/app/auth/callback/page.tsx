"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
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
      router.push("/signin");
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      // Redirect to dashboard
      router.push("/dashboard");
    } else {
      // Missing tokens, redirect to signin
      router.push("/signin");
    }
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
