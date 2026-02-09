"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const SecuritySettingsPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "rejected" | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.getProfile();
        if (response.success && response.data) {
          setTwoFactorEnabled(response.data.twoFactorEnabled || false);
          setKycStatus(response.data.kycStatus || null);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const securityFeatures = [
    {
      title: "Two-Factor Authentication (2FA)",
      description: "Add an extra layer of security to your account by enabling two-factor authentication.",
      icon: (
        <svg
          className="h-8 w-8"
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
      ),
      status: twoFactorEnabled ? "enabled" : "disabled",
      statusText: twoFactorEnabled ? "Enabled" : "Disabled",
      statusColor: twoFactorEnabled
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      link: twoFactorEnabled ? "/dashboard/security/manage-2fa" : "/dashboard/security/setup-2fa",
      buttonText: twoFactorEnabled ? "Manage 2FA" : "Setup 2FA",
    },
    {
      title: "KYC Verification",
      description: "Complete your Know Your Customer (KYC) verification to unlock all features and increase your account limits.",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      status: kycStatus,
      statusText:
        kycStatus === "verified"
          ? "Verified"
          : kycStatus === "rejected"
          ? "Rejected"
          : kycStatus === "pending"
          ? "Pending Review"
          : "Not Started",
      statusColor:
        kycStatus === "verified"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : kycStatus === "rejected"
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          : kycStatus === "pending"
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      link: "/dashboard/security/kyc",
      buttonText:
        kycStatus === "verified"
          ? "View KYC Details"
          : kycStatus === "pending"
          ? "Check Status"
          : "Start KYC Verification",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Security Settings
        </h1>
        <p className="mt-2 text-body-color dark:text-body-color-dark">
          Manage your account security and verification settings
        </p>
      </div>

      {/* Security Overview Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        {securityFeatures.map((feature, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark"
          >
            <div className="p-6">
              {/* Icon and Status */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
                  {feature.icon}
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${feature.statusColor}`}
                >
                  {feature.statusText}
                </span>
              </div>

              {/* Title and Description */}
              <h3 className="mb-2 text-xl font-semibold text-black dark:text-white">
                {feature.title}
              </h3>
              <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
                {feature.description}
              </p>

              {/* Action Button */}
              <Link
                href={feature.link}
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                {feature.buttonText}
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Security Tips */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-dark">
        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Security Tips
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Enable 2FA:</strong> Two-factor authentication significantly increases your account security by requiring a second verification step.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Complete KYC:</strong> Verify your identity to access all platform features and increase your transaction limits.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Use Strong Passwords:</strong> Create a unique, strong password and change it regularly to protect your account.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              <strong className="text-black dark:text-white">Stay Alert:</strong> Never share your password or 2FA codes with anyone. Alvarado Associates will never ask for this information.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
