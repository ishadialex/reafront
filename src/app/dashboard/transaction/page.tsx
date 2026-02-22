"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { SearchParamsWrapper } from "./SearchParamsWrapper";

const PAGE_SIZE = 15;

interface TxRow {
  id: string;
  type: string;
  method?: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  reference: string;
  source: "transaction" | "fund_operation";
}

const FilterSkeleton = () => (
  <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark md:p-6">
    <div className="flex flex-col gap-4">
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-9 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />)}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2 h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TableRowSkeleton = () => (
  <tr className="border-b border-gray-200 dark:border-gray-800">
    <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="flex items-center gap-2"><div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" /><div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div></td>
    <td className="px-6 py-4"><div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></td>
    <td className="px-6 py-4"><div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" /></td>
  </tr>
);

const MobileCardSkeleton = () => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div><div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
      </div>
      <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="p-4">
      <div className="mb-3 h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex items-center justify-between">
        <div><div className="mb-1 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
        <div className="text-right"><div className="mb-1 h-3 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /><div className="h-6 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" /></div>
      </div>
    </div>
  </div>
);

function normalizeRows(txList: any[], fundOps: any[]): TxRow[] {
  const rows: TxRow[] = [];
  for (const tx of txList) {
    rows.push({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      status: tx.status || "completed",
      date: tx.createdAt,
      description: tx.description || tx.type.replace(/_/g, " "),
      reference: tx.reference || tx.id,
      source: "transaction",
    });
  }
  for (const op of fundOps) {
    const label = op.type === "deposit" ? "Deposit" : "Withdrawal";
    const methodLabel = op.method ? ` (${op.method.charAt(0).toUpperCase() + op.method.slice(1)})` : "";
    rows.push({
      id: `fo-${op.id}`,
      type: op.type,
      method: op.method,
      amount: op.amount,
      status: op.status,
      date: op.createdAt,
      description: `${label}${methodLabel}`,
      reference: op.reference,
      source: "fund_operation",
    });
  }
  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const VALID_TYPES = ["all", "deposit", "withdrawal", "investment", "transfer", "referral", "profit"];
const VALID_STATUSES = ["all", "completed", "pending", "failed", "processing"];

function TransactionContent() {
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const updateFilters = useCallback((type: string, status: string, q: string) => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      const [txRes, foRes] = await Promise.all([api.getTransactions(), api.getFundOperations()]);
      const txList = txRes.success && txRes.data ? txRes.data : [];
      const foList = foRes.success && foRes.data ? foRes.data : [];
      setRows(normalizeRows(txList, foList));
      setFetchError(null);
    } catch {
      setFetchError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setLoading(true);
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = rows;
    if (selectedFilter !== "all") {
      list = selectedFilter === "transfer"
        ? list.filter((r) => r.type.startsWith("transfer"))
        : list.filter((r) => r.type === selectedFilter);
    }
    if (selectedStatus !== "all") list = list.filter((r) => r.status === selectedStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.reference.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.amount.toString().includes(q));
    }
    return list;
  }, [rows, selectedFilter, selectedStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const goToPage = (p: number) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
  useEffect(() => { setCurrentPage(1); }, [selectedFilter, selectedStatus, searchQuery]);

  const isCredit = (type: string, amount: number) =>
    type === "admin_bonus"
      ? amount > 0
      : ["deposit", "referral", "profit", "transfer_received"].includes(type);

  const getTypeIcon = (type: string) => {
    if (type === "deposit") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
    if (type === "withdrawal") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />;
    if (type === "investment") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
    if (type.startsWith("transfer")) return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />;
    if (type === "referral") return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />;
    return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
  };

  const getTypeColor = (type: string) => {
    if (type === "deposit") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (type === "withdrawal") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (type === "investment") return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (type.startsWith("transfer")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (type === "referral") return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const dotMap: Record<string, string> = { completed: "bg-green-600", pending: "bg-yellow-600", processing: "bg-blue-600", failed: "bg-red-600" };
    const cls = map[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotMap[status] || "bg-gray-600"}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const formatType = (type: string) => type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (fetchError && !loading && rows.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mb-4 text-lg font-medium text-black dark:text-white">{fetchError}</p>
          <button onClick={handleRefresh} className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Search params synchronization */}
      <Suspense fallback={null}>
        <SearchParamsWrapper
          onParamsChange={(type, status, query) => {
            setSelectedFilter(type);
            setSelectedStatus(status);
            setSearchQuery(query);
          }}
        />
      </Suspense>

      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white md:text-3xl">Transactions</h1>
          <p className="mt-2 text-sm text-body-color dark:text-body-color-dark md:text-base">View and manage your transaction history</p>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing || loading}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          aria-label="Refresh">
          <svg className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading ? <FilterSkeleton /> : (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark md:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input type="text" placeholder="Search by reference, description, or amount..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); updateFilters(selectedFilter, selectedStatus, e.target.value); }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 pl-11 text-sm text-black outline-none transition focus:border-primary dark:border-gray-800 dark:text-white" />
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-body-color dark:text-body-color-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Transaction Type</label>
                <div className="flex flex-wrap gap-2">
                  {VALID_TYPES.map((f) => (
                    <button key={f} onClick={() => { setSelectedFilter(f); updateFilters(f, selectedStatus, searchQuery); }}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition ${selectedFilter === f ? "bg-primary text-white" : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Status</label>
                <div className="flex flex-wrap gap-2">
                  {VALID_STATUSES.map((s) => (
                    <button key={s} onClick={() => { setSelectedStatus(s); updateFilters(selectedFilter, s, searchQuery); }}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition ${selectedStatus === s ? "bg-primary text-white" : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/20">
                    {["Reference", "Type", "Description", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-black dark:text-white ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{[1, 2, 3, 4, 5, 6].map((i) => <TableRowSkeleton key={i} />)}</tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4 lg:hidden">{[1, 2, 3, 4].map((i) => <MobileCardSkeleton key={i} />)}</div>
        </>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-dark">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-semibold text-black dark:text-white">No transactions found</p>
          <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/20">
                    {["Reference", "Type", "Description", "Date", "Amount", "Status"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-black dark:text-white ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginated.map((row) => (
                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4"><span className="font-mono text-sm text-black dark:text-white">{row.reference}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getTypeColor(row.type)}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{getTypeIcon(row.type)}</svg>
                          </div>
                          <span className="text-sm font-medium text-black dark:text-white">{formatType(row.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-body-color dark:text-body-color-dark">{row.description}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-body-color dark:text-body-color-dark">{formatDate(row.date)}</span></td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-semibold ${isCredit(row.type, row.amount) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {isCredit(row.type, row.amount) ? "+" : "-"}${Math.abs(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4 lg:hidden">
            {paginated.map((row) => (
              <div key={row.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getTypeColor(row.type)}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{getTypeIcon(row.type)}</svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black dark:text-white">{formatType(row.type)}</p>
                      <p className="text-xs text-body-color dark:text-body-color-dark">{formatDate(row.date)}</p>
                    </div>
                  </div>
                  {getStatusBadge(row.status)}
                </div>
                <div className="p-4">
                  <p className="mb-3 text-sm text-body-color dark:text-body-color-dark">{row.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-body-color dark:text-body-color-dark">Reference</p>
                      <p className="font-mono text-xs font-medium text-black dark:text-white">{row.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-body-color dark:text-body-color-dark">Amount</p>
                      <p className={`text-lg font-bold ${isCredit(row.type, row.amount) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {isCredit(row.type, row.amount) ? "+" : "-"}${Math.abs(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-body-color dark:text-body-color-dark">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`e-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-body-color">…</span>
                    ) : (
                      <button key={item} onClick={() => goToPage(item as number)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${safePage === item ? "bg-primary text-white" : "border border-gray-200 bg-white text-black hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-black transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-xs text-body-color dark:text-body-color-dark">Total Transactions</p>
            <p className="mt-1 text-2xl font-bold text-black dark:text-white">{filtered.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-xs text-body-color dark:text-body-color-dark">Total Credits</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              ${filtered.filter((r) => isCredit(r.type, r.amount) && ["completed", "approved"].includes(r.status)).reduce((s, r) => s + Math.abs(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark">
            <p className="text-xs text-body-color dark:text-body-color-dark">Total Debits</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              ${filtered.filter((r) => !isCredit(r.type, r.amount) && ["completed", "approved"].includes(r.status)).reduce((s, r) => s + Math.abs(r.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-body-color dark:text-body-color-dark">Loading transactions...</p>
        </div>
      </div>
    }>
      <TransactionContent />
    </Suspense>
  );
}
