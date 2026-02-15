"use client";

import { useEffect, Suspense, useState, FormEvent } from "react";
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
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [oauthToken, setOauthToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

        console.log("OAuth token exchange response:", response.data);

        // Check if 2FA is required
        const responseData = response.data;
        const requires2FACheck =
          responseData?.requires2FA ||
          responseData?.requiresTwoFactor ||
          responseData?.require2FA ||
          responseData?.code === "REQUIRE_2FA" ||
          responseData?.code === "TWO_FACTOR_REQUIRED" ||
          responseData?.data?.requires2FA ||
          responseData?.data?.requiresTwoFactor ||
          responseData?.message?.toLowerCase().includes("2fa") ||
          responseData?.message?.toLowerCase().includes("two-factor");

        if (requires2FACheck) {
          console.log("2FA is required for OAuth login, showing 2FA input");
          setOauthToken(token);
          setRequires2FA(true);
          setIsProcessing(false);
          return;
        }

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
      } catch (err: any) {
        console.error("OAuth callback error:", err);

        // Check if 2FA is required in error response
        const responseData = err.response?.data;
        const requires2FACheck =
          responseData?.requires2FA ||
          responseData?.requiresTwoFactor ||
          responseData?.require2FA ||
          responseData?.code === "REQUIRE_2FA" ||
          responseData?.code === "TWO_FACTOR_REQUIRED" ||
          (err.response?.status === 403 && responseData?.message?.toLowerCase().includes("2fa"));

        if (requires2FACheck) {
          console.log("2FA is required (from error response), showing 2FA input");
          setOauthToken(token);
          setRequires2FA(true);
          setIsProcessing(false);
          return;
        }

        // Clear any partial state and redirect to signin
        localStorage.removeItem("isLoggedIn");
        router.replace("/signin?error=oauth_failed");
      }
    };

    processCallback();
  }, [searchParams, router, isProcessing]);

  const handle2FAVerification = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/exchange-oauth-token`,
        { token: oauthToken, twoFactorCode },
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
        setError("2FA verification failed. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Invalid 2FA code. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Show 2FA form if required
  if (requires2FA) {
    return (
      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-2 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-body-color mb-6 text-center text-base font-medium">
                  Complete your Google sign-in with 2FA
                </p>

                <form onSubmit={handle2FAVerification}>
                  {error && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <p>{error}</p>
                    </div>
                  )}
                  <div className="mb-6 rounded-lg bg-blue-100 p-4 dark:bg-blue-900/30">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Two-factor authentication is required. Please enter your 6-digit code from your authenticator app.
                    </p>
                  </div>
                  <div className="mb-5">
                    <label
                      htmlFor="twoFactorCode"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Authentication Code
                    </label>
                    <input
                      type="text"
                      id="twoFactorCode"
                      name="twoFactorCode"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      required
                      maxLength={6}
                      autoFocus
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base text-center tracking-widest outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isLoading || twoFactorCode.length !== 6}
                      className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-xs px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? "Verifying..." : "Verify & Sign In"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.replace("/signin")}
                    className="text-primary text-sm hover:underline"
                  >
                    ← Back to sign in
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show loading screen while processing OAuth callback
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
