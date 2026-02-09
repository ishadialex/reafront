"use client";

import { useState, useEffect, useMemo } from "react";
import { InvestmentProperty } from "@/types/investment";
import PropertyCard from "@/components/PropertyCard";
import { api } from "@/lib/api";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<InvestmentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ totalInvested: 0, activeInvestments: 0 });
  const [filters, setFilters] = useState({
    category: "all",
    type: "all",
    status: "all",
    search: "",
  });

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const result = await api.getProperties({
          category: filters.category !== "all" ? filters.category : undefined,
          investmentType: filters.type !== "all" ? filters.type : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          search: filters.search || undefined,
        });
        if (result.success && result.data) {
          setProperties(result.data as InvestmentProperty[]);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, [filters]);

  useEffect(() => {
    api.getInvestments().then((result) => {
      if (result.success && result.data) {
        const invested = result.data.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const active = result.data.filter((inv: any) => inv.status === "active").length;
        setUserStats({ totalInvested: invested, activeInvestments: active });
      }
    }).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const available = properties.filter((p) => p.status === "available");
    const avgROI =
      available.length > 0
        ? available.reduce((sum, p) => sum + p.expectedROI, 0) / available.length
        : 0;
    return {
      totalProperties: properties.length,
      avgROI: avgROI.toFixed(1),
      totalInvested: userStats.totalInvested,
      activeInvestments: userStats.activeInvestments,
    };
  }, [properties, userStats]);

  return (
    <div className="min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">
          Investment Properties
        </h1>
        <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">
          Browse our curated selection of high-yield investment opportunities
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Total Properties</p>
          <p className="text-3xl font-bold text-black dark:text-white">{stats.totalProperties}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Average ROI</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.avgROI}%</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Total Invested</p>
          <p className="text-3xl font-bold text-black dark:text-white">${stats.totalInvested.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <p className="mb-2 text-sm text-body-color dark:text-body-color-dark">Active Investments</p>
          <p className="text-3xl font-bold text-black dark:text-white">{stats.activeInvestments}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-800 dark:bg-gray-dark">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Category</label>
            <div className="relative">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="mortgage">Mortgage</option>
                <option value="airbnb">Airbnb</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Investment Type</label>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="pooled">Pooled</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Status</label>
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="fully-funded">Fully Funded</option>
                <option value="coming-soon">Coming Soon</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-black dark:text-white">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search properties..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-black outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-body-color dark:text-body-color-dark">Loading properties...</p>
          </div>
        </div>
      ) : properties.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow dark:border-gray-800 dark:bg-gray-dark">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg font-semibold text-black dark:text-white">No properties found</p>
          <p className="mt-2 text-sm text-body-color dark:text-body-color-dark">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </div>
  );
}
