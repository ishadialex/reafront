"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvestmentProperty } from "@/types/investment";
import Popup from "@/components/Popup";
import { api } from "@/lib/api";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: InvestmentProperty;
  walletBalance: number;
  initialAmount?: number;
}

const InvestmentModal = ({
  isOpen,
  onClose,
  property,
  walletBalance,
  initialAmount = 0,
}: InvestmentModalProps) => {
  const router = useRouter();
  const [investmentAmount, setInvestmentAmount] = useState(initialAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "deposit" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error" | "info">("success");

  if (!isOpen) return null;

  const amount = parseFloat(investmentAmount) || 0;
  const remainingAmount =
    property.investmentType === "pooled"
      ? property.targetAmount - property.currentFunded
      : property.maxInvestment;

  // Validation function
  const validateInvestment = (): { valid: boolean; error?: string } => {
    if (amount <= 0) {
      return { valid: false, error: "Please enter a valid amount" };
    }

    if (amount < property.minInvestment) {
      return {
        valid: false,
        error: `Minimum investment is $${property.minInvestment.toLocaleString()}`,
      };
    }

    if (amount > property.maxInvestment) {
      return {
        valid: false,
        error: `Maximum investment is $${property.maxInvestment.toLocaleString()}`,
      };
    }

    if (property.investmentType === "pooled" && amount > remainingAmount) {
      return {
        valid: false,
        error: `Only $${remainingAmount.toLocaleString()} remaining in this pool`,
      };
    }

    if (paymentMethod === "wallet" && amount > walletBalance) {
      return {
        valid: false,
        error: "Insufficient wallet balance. Please choose 'New Deposit' option.",
      };
    }

    if (property.status !== "available") {
      return {
        valid: false,
        error: "This property is not available for investment",
      };
    }

    if (!paymentMethod) {
      return {
        valid: false,
        error: "Please select a payment method",
      };
    }

    return { valid: true };
  };

  // Handle wallet payment
  const handleWalletPayment = async () => {
    const validation = validateInvestment();
    if (!validation.valid) {
      setPopupMessage(validation.error || "Validation failed");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    setIsProcessing(true);

    try {
      const result = await api.createPropertyInvestment(property.id, amount);

      if (result.success) {
        setPopupMessage(
          `Successfully invested $${amount.toLocaleString()} in ${property.title}.`
        );
        setPopupType("success");
        setShowPopup(true);

        setTimeout(() => {
          router.push("/dashboard/investments");
        }, 3000);
      } else {
        setPopupMessage(result.message || "Investment failed. Please try again.");
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Investment failed. Please try again.";
      setPopupMessage(msg);
      setPopupType("error");
      setShowPopup(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle new deposit redirect
  const handleNewDeposit = () => {
    const validation = validateInvestment();
    if (!validation.valid && validation.error !== "Insufficient wallet balance. Please choose 'New Deposit' option.") {
      setPopupMessage(validation.error || "Validation failed");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    // Redirect to add-fund with return URL
    const returnUrl = `/dashboard/property-market/properties/${property.id}`;
    router.push(`/dashboard/add-fund?returnUrl=${encodeURIComponent(returnUrl)}&amount=${amount}`);
  };

  const monthlyEarnings = amount * (property.monthlyReturn / 100);
  const annualEarnings = amount * (property.expectedROI / 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2">
        <div className="max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-dark">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-black dark:text-white">
                Invest in Property
              </h2>
              <p className="mt-1 text-sm text-body-color dark:text-body-color-dark line-clamp-1">
                {property.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Available Balance */}
          <div className="mb-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:from-primary/10 dark:to-primary/20">
            <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">
              Available Wallet Balance
            </p>
            <p className="text-2xl font-bold text-black dark:text-white">
              ${walletBalance.toLocaleString()}
            </p>
          </div>

          {/* Investment Amount */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
              Investment Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              min={property.minInvestment}
              max={property.investmentType === "pooled" ? Math.min(property.maxInvestment, remainingAmount) : property.maxInvestment}
              placeholder={`Min: $${property.minInvestment.toLocaleString()}`}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-lg font-semibold text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-2 flex justify-between text-xs text-body-color dark:text-body-color-dark">
              <span>Min: ${property.minInvestment.toLocaleString()}</span>
              <span>
                Max: ${property.investmentType === "pooled" ? Math.min(property.maxInvestment, remainingAmount).toLocaleString() : property.maxInvestment.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Return Calculations */}
          {amount > 0 && (
            <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-300">
                Expected Returns
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs text-blue-800 dark:text-blue-400">
                    Monthly Earnings
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${monthlyEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    {property.monthlyReturn}% per month
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-blue-800 dark:text-blue-400">
                    Annual Earnings
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${annualEarnings.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-400">
                    {property.expectedROI}% ROI
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-black dark:text-white">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {/* Wallet Payment */}
              <label
                className={`flex cursor-pointer items-start rounded-lg border-2 p-4 transition-all ${
                  paymentMethod === "wallet"
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  checked={paymentMethod === "wallet"}
                  onChange={(e) => setPaymentMethod(e.target.value as "wallet")}
                  className="mt-1 h-5 w-5"
                />
                <div className="ml-3">
                  <div className="font-semibold text-black dark:text-white">
                    Use Wallet Balance
                  </div>
                  <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
                    Pay directly from your wallet balance (${walletBalance.toLocaleString()} available)
                  </p>
                  {amount > walletBalance && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Insufficient balance. You need ${(amount - walletBalance).toLocaleString()} more.
                    </p>
                  )}
                </div>
              </label>

              {/* New Deposit */}
              <label
                className={`flex cursor-pointer items-start rounded-lg border-2 p-4 transition-all ${
                  paymentMethod === "deposit"
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="deposit"
                  checked={paymentMethod === "deposit"}
                  onChange={(e) => setPaymentMethod(e.target.value as "deposit")}
                  className="mt-1 h-5 w-5"
                />
                <div className="ml-3">
                  <div className="font-semibold text-black dark:text-white">
                    Make New Deposit
                  </div>
                  <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
                    Deposit funds via bank transfer, card, or cryptocurrency first
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Investment Info */}
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <h3 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-300">
              Important Information
            </h3>
            <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Investments are subject to market risks
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Returns are estimated and not guaranteed
              </li>
              <li className="flex items-start">
                <svg className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Investment duration: {property.duration} months
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-white dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={paymentMethod === "wallet" ? handleWalletPayment : handleNewDeposit}
              disabled={isProcessing || !paymentMethod || amount < property.minInvestment}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing
                ? "Processing..."
                : paymentMethod === "wallet"
                ? "Confirm Investment"
                : "Continue to Deposit"}
            </button>
          </div>
        </div>
      </div>

      {/* Popup Notification */}
      {showPopup && (
        <Popup
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

export default InvestmentModal;
