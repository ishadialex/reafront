"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Toast from "@/components/Toast";

type WithdrawalMethod = "bank" | "crypto" | null;

interface BankForm {
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber: string;
  swiftCode: string;
  amount: string;
}

interface CryptoForm {
  cryptoType: string;
  walletAddress: string;
  network: string;
  amount: string;
}

const cryptoOptions = [
  { value: "BTC", label: "Bitcoin (BTC)", networks: ["Bitcoin", "Lightning Network"] },
  { value: "ETH", label: "Ethereum (ETH)", networks: ["Ethereum", "Arbitrum", "Polygon"] },
  { value: "USDT", label: "Tether (USDT)", networks: ["Ethereum (ERC20)", "Tron (TRC20)", "BSC (BEP20)"] },
  { value: "USDC", label: "USD Coin (USDC)", networks: ["Ethereum (ERC20)", "Polygon", "Solana"] },
];

const WithdrawFundPage = () => {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [completedMethod, setCompletedMethod] = useState<WithdrawalMethod>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [bankForm, setBankForm] = useState<BankForm>({
    accountName: "", accountNumber: "", bankName: "",
    routingNumber: "", swiftCode: "", amount: "",
  });

  const [cryptoForm, setCryptoForm] = useState<CryptoForm>({
    cryptoType: "BTC", walletAddress: "", network: "Bitcoin", amount: "",
  });

  const selectedCrypto = cryptoOptions.find((opt) => opt.value === cryptoForm.cryptoType);

  useEffect(() => {
    api.getBalanceSummary().then((res) => {
      if (res.success && res.data) setBalance(res.data.balance ?? 0);
    }).catch(() => {}).finally(() => setLoadingBalance(false));
  }, []);

  const handleBankSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(bankForm.amount);
    if (numAmount > balance) {
      setToast({ message: "Insufficient balance for this withdrawal.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.createWithdrawal({
        method: "bank",
        amount: numAmount,
        details: {
          accountName: bankForm.accountName,
          accountNumber: bankForm.accountNumber,
          bankName: bankForm.bankName,
          routingNumber: bankForm.routingNumber,
          swiftCode: bankForm.swiftCode,
        },
      });
      if (response.success && response.data) {
        setSuccessRef(response.data.reference);
        setCompletedMethod("bank");
      } else {
        setToast({ message: response.message || "Failed to submit withdrawal. Please try again.", type: "error" });
      }
    } catch {
      setToast({ message: "An error occurred. Please check your connection and try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [bankForm, balance]);

  const handleCryptoSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(cryptoForm.amount);
    if (numAmount > balance) {
      setToast({ message: "Insufficient balance for this withdrawal.", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.createWithdrawal({
        method: "crypto",
        amount: numAmount,
        details: {
          cryptoType: cryptoForm.cryptoType,
          walletAddress: cryptoForm.walletAddress,
          network: cryptoForm.network,
        },
      });
      if (response.success && response.data) {
        setSuccessRef(response.data.reference);
        setCompletedMethod("crypto");
      } else {
        setToast({ message: response.message || "Failed to submit withdrawal. Please try again.", type: "error" });
      }
    } catch {
      setToast({ message: "An error occurred. Please check your connection and try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [cryptoForm, balance]);

  const resetForm = () => {
    setSelectedMethod(null);
    setSuccessRef(null);
    setCompletedMethod(null);
    setBankForm({ accountName: "", accountNumber: "", bankName: "", routingNumber: "", swiftCode: "", amount: "" });
    setCryptoForm({ cryptoType: "BTC", walletAddress: "", network: "Bitcoin", amount: "" });
  };

  // --- Success Screen ---
  if (successRef) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-8">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
              {completedMethod === "bank" ? "Bank Withdrawal Submitted!" : "Crypto Withdrawal Submitted!"}
            </h2>
            <p className="mb-4 text-body-color dark:text-body-color-dark">
              {completedMethod === "bank"
                ? "Your bank transfer withdrawal request has been received and is being processed."
                : "Your cryptocurrency withdrawal request has been received and is being processed."}
            </p>
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-black/20">
              <p className="text-xs text-body-color dark:text-body-color-dark">Reference Number</p>
              <p className="font-mono text-sm font-semibold text-black dark:text-white">{successRef}</p>
            </div>
            <div className="mb-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Processing Time:</strong>{" "}
                {completedMethod === "bank"
                  ? "Bank transfers typically take 3–5 business days."
                  : "Cryptocurrency withdrawals are usually processed within 24 hours."}
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push("/dashboard/transaction")}
                className="flex-1 rounded-lg border border-gray-200 px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800">
                View Transactions
              </button>
              <button type="button" onClick={resetForm}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90">
                New Withdrawal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Method Selection ---
  if (!selectedMethod) {
    return (
      <div className="min-h-screen">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">Withdraw Funds</h1>
          <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
            Choose your preferred withdrawal method
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-800 dark:from-primary/10 dark:to-primary/20 md:mb-8 md:p-6">
          <p className="mb-1 text-sm text-body-color dark:text-body-color-dark">Available Balance</p>
          {loadingBalance ? (
            <div className="mt-1 h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-3xl font-bold text-black dark:text-white md:text-4xl">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
          <button type="button" onClick={() => setSelectedMethod("bank")}
            className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/20 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
              <svg className="h-7 w-7 text-blue-500 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Bank Transfer</h3>
            <p className="text-sm text-body-color dark:text-body-color-dark">Withdraw directly to your bank account. Processing time: 3–5 business days.</p>
          </button>

          <button type="button" onClick={() => setSelectedMethod("crypto")}
            className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-lg transition-all hover:border-primary hover:shadow-xl dark:border-gray-800 dark:bg-gray-dark">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/20 transition-colors group-hover:from-primary/10 group-hover:to-primary/20">
              <svg className="h-7 w-7 text-orange-500 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-bold text-black dark:text-white">Cryptocurrency</h3>
            <p className="text-sm text-body-color dark:text-body-color-dark">Withdraw to your crypto wallet. Processing time: usually within 24 hours.</p>
          </button>
        </div>
      </div>
    );
  }

  // --- Bank Form ---
  if (selectedMethod === "bank") {
    return (
      <div className="min-h-screen">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="mb-6 flex items-center gap-4 md:mb-8">
          <button type="button" onClick={() => setSelectedMethod(null)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800">
            <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">Bank Transfer Withdrawal</h1>
            <p className="mt-1 text-sm text-body-color dark:text-body-color-dark md:text-base">Enter your bank account details</p>
          </div>
        </div>

        <form onSubmit={handleBankSubmit} className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
            <div className="space-y-4">
              {[
                { label: "Account Holder Name", key: "accountName", placeholder: "John Doe", required: true },
                { label: "Bank Name", key: "bankName", placeholder: "Chase Bank", required: true },
                { label: "Account Number", key: "accountNumber", placeholder: "1234567890", required: true },
                { label: "Routing Number", key: "routingNumber", placeholder: "021000021", required: true },
                { label: "SWIFT/BIC Code (Optional)", key: "swiftCode", placeholder: "CHASUS33", required: false },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key}>
                  <label className="mb-2 block text-sm font-semibold text-black dark:text-white">{label}</label>
                  <input type="text" required={required} value={bankForm[key as keyof BankForm]}
                    onChange={(e) => setBankForm({ ...bankForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white" />
                </div>
              ))}
              <div>
                <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Withdrawal Amount ($)</label>
                <input type="number" required min="1" max={balance} step="0.01" value={bankForm.amount}
                  onChange={(e) => setBankForm({ ...bankForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white" />
                <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                  Available: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : "Submit Withdrawal Request"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Crypto Form ---
  return (
    <div className="min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="mb-6 flex items-center gap-4 md:mb-8">
        <button type="button" onClick={() => setSelectedMethod(null)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-800">
          <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">Cryptocurrency Withdrawal</h1>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark md:text-base">Withdraw to your crypto wallet</p>
        </div>
      </div>

      <form onSubmit={handleCryptoSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Cryptocurrency</label>
              <div className="relative">
                <select value={cryptoForm.cryptoType}
                  onChange={(e) => {
                    const opt = cryptoOptions.find((o) => o.value === e.target.value);
                    setCryptoForm({ ...cryptoForm, cryptoType: e.target.value, network: opt?.networks[0] || "" });
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white">
                  {cryptoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-black dark:bg-gray-800 dark:text-white">{opt.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Network</label>
              <div className="relative">
                <select value={cryptoForm.network}
                  onChange={(e) => setCryptoForm({ ...cryptoForm, network: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-10 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white">
                  {selectedCrypto?.networks.map((n) => (
                    <option key={n} value={n} className="bg-white text-black dark:bg-gray-800 dark:text-white">{n}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Wallet Address</label>
              <input type="text" required value={cryptoForm.walletAddress}
                onChange={(e) => setCryptoForm({ ...cryptoForm, walletAddress: e.target.value })}
                placeholder="Enter your wallet address"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 font-mono text-sm text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white" />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Double-check your wallet address — transactions cannot be reversed.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Withdrawal Amount ($)</label>
              <input type="number" required min="1" max={balance} step="0.01" value={cryptoForm.amount}
                onChange={(e) => setCryptoForm({ ...cryptoForm, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white" />
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Available: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Important: Verify all details</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">Cryptocurrency transactions are irreversible. Ensure the wallet address and network are correct.</p>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : "Submit Withdrawal Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawFundPage;
