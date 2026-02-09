"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/lib/api";

// Types
interface UserData {
  name: string;
  email: string;
  accountBalance: number;
  kycStatus: "pending" | "verified" | "rejected";
  twoFactorEnabled: boolean;
}

interface BalanceSummary {
  balance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  deposits: number;
  profits: number;
  adminBonuses: number;
  referralBonuses: number;
  withdrawals: number;
  investedFunds: number;
}

interface Investment {
  id: string;
  propertyTitle: string;
  amount: number;
  expectedROI: number;
  expectedReturn: number;
  monthlyReturn: number;
  status: "active" | "completed" | "pending";
  type: "pooled" | "individual";
}

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "transfer" | "referral" | "profit" | "admin_bonus" | "transfer_sent" | "transfer_received";
  amount: number;
  status: "completed" | "pending" | "failed";
  date: string;
  description: string;
}

interface FeaturedProperty {
  id: string;
  title: string;
  location: string;
  expectedROI: number;
  minInvestment: number;
  status: string;
  image: string;
}

interface DashboardData {
  user: UserData | null;
  balanceSummary: BalanceSummary | null;
  investments: Investment[];
  transactions: Transaction[];
  featuredProperties: FeaturedProperty[];
}

const fetchBalanceSummary = async (): Promise<BalanceSummary> => {
  try {
    const result = await api.getBalanceSummary();
    if (result.success && result.data) {
      return {
        balance: result.data.balance,
        pendingDeposits: result.data.pendingDeposits ?? 0,
        pendingWithdrawals: result.data.pendingWithdrawals ?? 0,
        deposits: result.data.breakdown.deposits,
        profits: result.data.breakdown.profits,
        adminBonuses: result.data.breakdown.adminBonuses,
        referralBonuses: result.data.breakdown.referralBonuses,
        withdrawals: result.data.breakdown.withdrawals,
        investedFunds: result.data.breakdown.investedFunds,
      };
    }
  } catch {
    // ignore
  }
  return { balance: 0, pendingDeposits: 0, pendingWithdrawals: 0, deposits: 0, profits: 0, adminBonuses: 0, referralBonuses: 0, withdrawals: 0, investedFunds: 0 };
};

// Mock API functions - Replace these with actual API calls
const fetchUserData = async (): Promise<UserData> => {
  try {
    const result = await api.getProfile();
    if (result.success && result.data) {
      const user = result.data;
      return {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        accountBalance: user.balance || 0,
        kycStatus: user.kycStatus || "pending",
        twoFactorEnabled: user.twoFactorEnabled || false,
      };
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }

  // Fallback to default values if API fails
  return {
    name: "User",
    email: "",
    accountBalance: 0,
    kycStatus: "pending",
    twoFactorEnabled: false,
  };
};

const fetchInvestments = async (): Promise<Investment[]> => {
  try {
    const result = await api.getInvestments();
    if (result.success && result.data) {
      return result.data.map((inv: any) => ({
        id: inv.id,
        propertyTitle: inv.propertyTitle || "Investment",
        amount: inv.amount,
        expectedROI: inv.expectedROI || 0,
        expectedReturn: inv.expectedReturn || 0,
        monthlyReturn: inv.monthlyReturn || 0,
        status: inv.status,
        type: inv.investmentType === "individual" ? "individual" : "pooled",
      }));
    }
  } catch {
    // ignore
  }
  return [];
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const [txResult, fundOpsResult] = await Promise.all([
      api.getTransactions(10),
      api.getFundOperations(),
    ]);

    const transactions: Transaction[] = [];

    if (txResult.success && txResult.data) {
      txResult.data.forEach((tx: any) => {
        transactions.push({
          id: tx.id,
          type: tx.type,
          amount: Math.abs(tx.amount),
          status: tx.status,
          date: tx.createdAt,
          description: tx.description || tx.type.replace(/_/g, " "),
        });
      });
    }

    if (fundOpsResult.success && fundOpsResult.data) {
      fundOpsResult.data.forEach((op: any) => {
        // Skip if a matching completed transaction already exists
        const alreadyRecorded = transactions.some(
          (t) => t.description?.includes(op.reference)
        );
        if (!alreadyRecorded) {
          transactions.push({
            id: op.id,
            type: op.type,
            amount: op.amount,
            status: op.status === "approved" ? "completed" : op.status,
            date: op.createdAt,
            description: `${op.method ? op.method.charAt(0).toUpperCase() + op.method.slice(1) + " " : ""}${op.type.charAt(0).toUpperCase() + op.type.slice(1)} (${op.reference})`,
          });
        }
      });
    }

    // Sort by date descending, return top 5
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  } catch {
    // ignore
  }
  return [];
};

const fetchFeaturedProperties = async (): Promise<FeaturedProperty[]> => {
  try {
    const result = await api.getProperties({ status: "available" });
    if (result.success && result.data) {
      return (result.data as any[]).slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title,
        location: p.location,
        expectedROI: p.expectedROI,
        minInvestment: p.minInvestment,
        status: p.status || "available",
        image: p.images?.[0] || "",
      }));
    }
  } catch {
    // ignore
  }
  return [];
};

// Loading Skeleton Components
const StatCardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
    <div className="mb-3 flex items-center justify-between">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

const TransactionSkeleton = () => (
  <div className="flex animate-pulse items-center justify-between p-4">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div>
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-1 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
    <div className="text-right">
      <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-1 h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

const PropertyCardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark">
    <div className="h-40 bg-gray-200 dark:bg-gray-700" />
    <div className="p-4">
      <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-3 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>
);

export default function DashboardOverviewPage() {
  // State
  const [data, setData] = useState<DashboardData>({
    user: null,
    balanceSummary: null,
    investments: [],
    transactions: [],
    featuredProperties: [],
  });
  const [loading, setLoading] = useState({
    user: true,
    balance: true,
    investments: true,
    transactions: true,
    properties: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data — each piece updates state as soon as it arrives
  const fetchDashboardData = useCallback(() => {
    setError(null);

    fetchUserData()
      .then((userData) => setData((prev) => ({ ...prev, user: userData })))
      .catch(() => {})
      .finally(() => setLoading((prev) => ({ ...prev, user: false })));

    fetchBalanceSummary()
      .then((balanceData) => setData((prev) => ({ ...prev, balanceSummary: balanceData })))
      .catch(() => {})
      .finally(() => setLoading((prev) => ({ ...prev, balance: false })));

    fetchInvestments()
      .then((investmentsData) => setData((prev) => ({ ...prev, investments: investmentsData })))
      .catch(() => {})
      .finally(() => setLoading((prev) => ({ ...prev, investments: false })));

    fetchTransactions()
      .then((transactionsData) => setData((prev) => ({ ...prev, transactions: transactionsData })))
      .catch(() => {})
      .finally(() => setLoading((prev) => ({ ...prev, transactions: false })));

    fetchFeaturedProperties()
      .then((propertiesData) => setData((prev) => ({ ...prev, featuredProperties: propertiesData })))
      .catch(() => {})
      .finally(() => setLoading((prev) => ({ ...prev, properties: false })));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate stats from investments
  const stats = useMemo(() => {
    const totalInvested = data.balanceSummary?.investedFunds ?? data.investments.reduce((sum, inv) => sum + inv.amount, 0);
    const generatedIncome =
      (data.balanceSummary?.profits ?? 0) +
      (data.balanceSummary?.referralBonuses ?? 0) +
      (data.balanceSummary?.adminBonuses ?? 0);
    const activeInvestments = data.investments.filter((inv) => inv.status === "active");
    const activeCount = activeInvestments.length;
    const totalROI = activeInvestments.reduce((sum, inv) => sum + inv.expectedROI, 0);

    return {
      accountBalance: data.balanceSummary?.balance ?? data.user?.accountBalance ?? 0,
      totalInvested,
      totalROI,
      generatedIncome,
      activeCount,
    };
  }, [data.investments, data.user, data.balanceSummary]);

  // Transaction icon helper
  const getTransactionIcon = useCallback((type: string) => {
    switch (type) {
      case "deposit":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case "withdrawal":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case "investment":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case "referral":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case "profit":
      case "admin_bonus":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case "transfer_sent":
      case "transfer_received":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  }, []);

  // Refresh data handler
  const handleRefresh = () => {
    setLoading({
      user: true,
      balance: true,
      investments: true,
      transactions: true,
      properties: true,
    });
    fetchDashboardData();
  };

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="mb-4 text-lg font-semibold text-black dark:text-white">{error}</p>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Welcome Header */}
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          {loading.user ? (
            <div className="animate-pulse">
              <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-4 w-64 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
                Welcome back, {data.user?.name.split(" ")[0]}!
              </h1>
              <p className="mt-1 text-sm text-body-color dark:text-body-color-dark md:text-base">
                Here&apos;s an overview of your investment portfolio
              </p>
            </>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading.user || loading.balance || loading.investments || loading.transactions || loading.properties}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          title="Refresh data"
        >
          <svg
            className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${
              loading.user || loading.balance || loading.investments || loading.transactions || loading.properties ? "animate-spin" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:mb-8">
        {loading.user || loading.balance || loading.investments ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Account Balance */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow dark:border-gray-800 dark:from-primary/20 dark:to-primary/10 md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Account Balance
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white md:text-3xl">
                ${stats.accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {(data.balanceSummary?.pendingDeposits ?? 0) > 0 && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  +${(data.balanceSummary!.pendingDeposits).toLocaleString(undefined, { minimumFractionDigits: 2 })} pending
                </p>
              )}
              {(data.balanceSummary?.pendingDeposits ?? 0) === 0 && (
                <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                  Available for investment
                </p>
              )}
            </div>

            {/* Total Withdrawn */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 shadow dark:border-gray-800 dark:from-red-900/20 dark:to-red-900/10 md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Total Withdrawn
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 md:text-3xl">
                ${(data.balanceSummary?.withdrawals ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {(data.balanceSummary?.pendingWithdrawals ?? 0) > 0 ? (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  ${(data.balanceSummary!.pendingWithdrawals).toLocaleString(undefined, { minimumFractionDigits: 2 })} pending
                </p>
              ) : (
                <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                  No pending withdrawals
                </p>
              )}
            </div>

            {/* Total Invested */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Total Invested
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-black dark:text-white md:text-3xl">
                ${stats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Across {stats.activeCount} active investment{stats.activeCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Generated Income */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Generated Income
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 md:text-3xl">
                ${stats.generatedIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Profits + Referral + Bonuses
              </p>
            </div>

            {/* Portfolio ROI */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-body-color dark:text-body-color-dark">
                  Portfolio ROI
                </p>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                  <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 md:text-3xl">
                {stats.totalROI}%
              </p>
              <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                Total across {stats.activeCount} active investment{stats.activeCount !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 md:mb-8">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
          <Link
            href="/dashboard/add-fund"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:border-gray-800 dark:bg-gray-dark dark:hover:border-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-black dark:text-white">Add Funds</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Deposit money</p>
            </div>
          </Link>

          <Link
            href="/dashboard/property-market/properties"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:border-gray-800 dark:bg-gray-dark dark:hover:border-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-black dark:text-white">Invest Now</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Browse properties</p>
            </div>
          </Link>

          <Link
            href="/dashboard/withdraw-fund"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:border-gray-800 dark:bg-gray-dark dark:hover:border-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-black dark:text-white">Withdraw</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Cash out funds</p>
            </div>
          </Link>

          <Link
            href="/dashboard/my-referral"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md dark:border-gray-800 dark:bg-gray-dark dark:hover:border-primary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-black dark:text-white">Refer & Earn</p>
              <p className="text-xs text-body-color dark:text-body-color-dark">Invite friends</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800 md:p-6">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Recent Transactions
              </h2>
              <Link
                href="/dashboard/transaction"
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading.transactions ? (
                <>
                  <TransactionSkeleton />
                  <TransactionSkeleton />
                  <TransactionSkeleton />
                  <TransactionSkeleton />
                </>
              ) : data.transactions.length > 0 ? (
                data.transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-black dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-body-color dark:text-body-color-dark">
                          {new Date(transaction.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          ["deposit", "referral", "profit", "admin_bonus", "transfer_received"].includes(transaction.type)
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {["deposit", "referral", "profit", "admin_bonus", "transfer_received"].includes(transaction.type) ? "+" : "-"}$
                        {transaction.amount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : transaction.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-body-color dark:text-body-color-dark">No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Status & Active Investments */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
              Account Status
            </h2>
            {loading.user ? (
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* KYC Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      data.user?.kycStatus === "verified"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : data.user?.kycStatus === "rejected"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : data.user?.kycStatus === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30"
                            : "bg-gray-100 dark:bg-gray-700"
                    }`}>
                      {data.user?.kycStatus === "verified" ? (
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : data.user?.kycStatus === "rejected" ? (
                        <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : data.user?.kycStatus === "pending" ? (
                        <svg className="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-black dark:text-white">KYC Verification</span>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    data.user?.kycStatus === "verified"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : data.user?.kycStatus === "rejected"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : data.user?.kycStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                    {data.user?.kycStatus
                      ? data.user.kycStatus.charAt(0).toUpperCase() + data.user.kycStatus.slice(1)
                      : "Not Started"}
                  </span>
                </div>

                {/* 2FA Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      data.user?.twoFactorEnabled
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}>
                      {data.user?.twoFactorEnabled ? (
                        <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-black dark:text-white">2FA Security</span>
                  </div>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    data.user?.twoFactorEnabled
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  }`}>
                    {data.user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <Link
                  href="/dashboard/security"
                  className="mt-2 block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-center text-sm font-medium text-black transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Manage Security
                </Link>
              </div>
            )}
          </div>

          {/* Active Investments Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                My Investments
              </h2>
              <Link
                href="/dashboard/investments"
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            {loading.investments ? (
              <div className="animate-pulse space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
                  <div className="flex justify-between">
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-600" />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
                  <div className="flex justify-between">
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-600" />
                    <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-600" />
                  </div>
                </div>
              </div>
            ) : data.investments.length > 0 ? (
              <div className="space-y-3">
                {data.investments.slice(0, 3).map((investment) => (
                  <div
                    key={investment.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <p className="mb-1 text-sm font-semibold text-black dark:text-white">
                      {investment.propertyTitle}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-body-color dark:text-body-color-dark">
                        ${investment.amount.toLocaleString()} invested
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +${investment.monthlyReturn}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  No active investments yet
                </p>
                <Link
                  href="/dashboard/property-market/properties"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Start Investing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Properties */}
      <div className="mt-6 md:mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Featured Investment Opportunities
          </h2>
          <Link
            href="/dashboard/property-market/properties"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Properties
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading.properties ? (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : data.featuredProperties.length > 0 ? (
            data.featuredProperties.map((property) => (
              <Link
                key={property.id}
                href={`/dashboard/property-market/properties/${property.id}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow transition-all hover:border-primary hover:shadow-lg dark:border-gray-800 dark:bg-gray-dark dark:hover:border-primary"
              >
                <div className="relative h-40 overflow-hidden">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 dark:bg-primary/20">
                      <span className="text-4xl font-bold text-primary">
                        {property.title?.charAt(0)?.toUpperCase() || "P"}
                      </span>
                    </div>
                  )}
                  <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                    {property.expectedROI}% ROI
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-black dark:text-white">
                    {property.title}
                  </h3>
                  <p className="mb-2 text-xs text-body-color dark:text-body-color-dark">
                    {property.location}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-black dark:text-white">
                      Min: ${property.minInvestment.toLocaleString()}
                    </span>
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Available
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-8 text-center shadow dark:border-gray-800 dark:bg-gray-dark">
              <p className="text-body-color dark:text-body-color-dark">No properties available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
