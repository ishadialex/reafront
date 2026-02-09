"use client";

import { useState, useEffect, useMemo } from "react";
import { Investment } from "@/types/investment";
import Link from "next/link";
import { api } from "@/lib/api";

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInvestments().then((result) => {
      if (result.success && result.data) {
        setInvestments(result.data as Investment[]);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturns = investments.reduce((sum, inv) => sum + inv.expectedReturn, 0);
    const monthlyIncome = investments.reduce((sum, inv) => sum + inv.monthlyReturn, 0);
    const activeCount = investments.filter((inv) => inv.status === "active").length;

    return {
      totalInvested,
      totalExpectedReturns,
      activeCount,
      monthlyIncome,
    };
  }, [investments]);

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getStatusText = (status: string) => {
    const text = {
      active: "Active",
      completed: "Completed",
      pending: "Pending",
    };
    return text[status as keyof typeof text] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-body-color dark:text-body-color-dark">Loading investments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          My Investments
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Track and manage your property investments
        </p>
      </div>

      {investments.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Total Invested
              </p>
              <p className="text-3xl font-bold text-black dark:text-white">
                ${stats.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Expected Returns
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalExpectedReturns.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Active Investments
              </p>
              <p className="text-3xl font-bold text-black dark:text-white">
                {stats.activeCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
              <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">
                Monthly Income
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${stats.monthlyIncome.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden rounded-xl border border-gray-200 bg-white shadow dark:border-gray-800 dark:bg-gray-dark md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Property</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Type</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Monthly Return</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-black dark:text-white">Expected Total</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-black dark:text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-black dark:text-white">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment, index) => (
                    <tr
                      key={investment.id}
                      className={`border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${
                        index === investments.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {investment.propertyImage ? (
                            <img
                              src={investment.propertyImage}
                              alt={investment.propertyTitle}
                              className="mr-3 h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <Link
                              href={`/dashboard/property-market/properties/${investment.propertyId}`}
                              className="font-semibold text-black hover:text-primary dark:text-white dark:hover:text-primary"
                            >
                              {investment.propertyTitle || "Property Investment"}
                            </Link>
                            <p className="text-xs text-body-color dark:text-body-color-dark">
                              ID: {investment.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${investment.investmentType === "individual" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                          {investment.investmentType === "individual" ? "Individual" : "Pooled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-black dark:text-white">
                        ${investment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        ${investment.monthlyReturn.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600 dark:text-green-400">
                        ${investment.expectedReturn.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(investment.status)}`}>
                          {getStatusText(investment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-body-color dark:text-body-color-dark">
                        {new Date(investment.investmentDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark"
              >
                <div className="mb-3 flex items-start">
                  {investment.propertyImage ? (
                    <img
                      src={investment.propertyImage}
                      alt={investment.propertyTitle}
                      className="mr-3 h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="mr-3 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/property-market/properties/${investment.propertyId}`}
                      className="font-semibold text-black hover:text-primary dark:text-white"
                    >
                      {investment.propertyTitle || "Property Investment"}
                    </Link>
                    <p className="mt-1 text-xs text-body-color dark:text-body-color-dark">
                      {investment.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Type</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${investment.investmentType === "individual" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"}`}>
                      {investment.investmentType === "individual" ? "Individual" : "Pooled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Amount</span>
                    <span className="font-semibold text-black dark:text-white">${investment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Monthly Return</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${investment.monthlyReturn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Expected Total</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">${investment.expectedReturn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Status</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadge(investment.status)}`}>
                      {getStatusText(investment.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-body-color dark:text-body-color-dark">Date</span>
                    <span className="text-sm text-body-color dark:text-body-color-dark">
                      {new Date(investment.investmentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow dark:border-gray-800 dark:bg-gray-dark">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="mb-2 text-lg font-semibold text-black dark:text-white">
            No Investments Yet
          </p>
          <p className="mb-6 text-sm text-body-color dark:text-body-color-dark">
            Start your investment journey by browsing our curated property listings
          </p>
          <Link
            href="/dashboard/property-market/properties"
            className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
}
