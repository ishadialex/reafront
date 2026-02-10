"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Force dynamic rendering - don't statically generate this page
export const dynamic = 'force-dynamic';

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
      // Store tokens and set logged in state
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("isLoggedIn", "true");

      // Decode the access token to get user data (JWT format)
      try {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));

        // Store user email
        if (tokenPayload.email) {
          localStorage.setItem("userEmail", tokenPayload.email);
        }

        // Store user name (if available)
        if (tokenPayload.name) {
          localStorage.setItem("userName", tokenPayload.name);
        }

        // Store profile picture (if available)
        if (tokenPayload.picture || tokenPayload.profilePicture || tokenPayload.avatar) {
          const profilePic = tokenPayload.picture || tokenPayload.profilePicture || tokenPayload.avatar;
          localStorage.setItem("userProfilePicture", profilePic);
        }

        // Log the token payload to see what data is available
        console.log("User data from token:", tokenPayload);
      } catch (e) {
        console.error("Failed to decode token:", e);
      }

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
