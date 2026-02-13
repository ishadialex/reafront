"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { validatePasswordStrength, validatePasswordMatch } from "@/utils/validation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrengthError, setPasswordStrengthError] = useState("");
  const [passwordMatchError, setPasswordMatchError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  // Real-time password strength validation
  useEffect(() => {
    setPasswordStrengthError(validatePasswordStrength(newPassword));
  }, [newPassword]);

  // Real-time password match validation
  useEffect(() => {
    setPasswordMatchError(validatePasswordMatch(newPassword, confirmPassword));
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check password strength
    if (passwordStrengthError) {
      setError(passwordStrengthError);
      return;
    }

    // Check password match
    if (passwordMatchError) {
      setError(passwordMatchError);
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);

    try {
      const response = await api.resetPassword(token, newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/signin");
        }, 3000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-dark">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-black dark:text-white">
              Password Reset Successful
            </h1>
            <p className="mb-6 text-center text-body-color dark:text-body-color-dark">
              Your password has been successfully reset. Redirecting to sign in...
            </p>

            <Link
              href="/signin"
              className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-body-color dark:text-body-color-dark">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-black dark:text-white">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className={`w-full rounded-lg border bg-white px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                  passwordStrengthError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-primary dark:border-gray-700"
                }`}
                placeholder="Enter new password"
              />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Min 8 characters, uppercase, lowercase, number, special character
              </p>
              {passwordStrengthError && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {passwordStrengthError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-black dark:text-white">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`w-full rounded-lg border bg-white px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 ${
                  passwordMatchError
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-primary dark:border-gray-700"
                }`}
                placeholder="Confirm new password"
              />
              {passwordMatchError && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {passwordMatchError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm font-medium text-body-color hover:text-primary dark:text-body-color-dark"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
