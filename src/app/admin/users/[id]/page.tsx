"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  profilePhoto?: string;
  bio?: string;
  occupation?: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  kycStatus: string;
  balance: number;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  lastLoginDevice: string | null;
  lastLoginBrowser: string | null;
  lastLoginOs: string | null;
  lastLoginLocation: string | null;
  lastLoginIp: string | null;
  recentSessions: Array<{
    loginAt: string;
    lastActive: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    location: string | null;
    ipAddress: string | null;
  }>;
  _count: { transactions: number; investments: number; referrals: number; sessions: number };
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${color}`}>{label}</span>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Balance modal state
  const [balanceModal, setBalanceModal] = useState<"add" | "deduct" | null>(null);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [balanceError, setBalanceError] = useState("");

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminGetUser(id);
      setUser(res.data ?? null);
    } catch {
      setError("Failed to load user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleToggleStatus = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await api.adminUpdateUserStatus(id, !user.isActive);
      await fetchUser();
    } catch {
      alert("Failed to update user status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBalanceSubmit = async () => {
    const amount = parseFloat(balanceAmount);
    if (!amount || amount <= 0) {
      setBalanceError("Enter a valid positive amount.");
      return;
    }
    setBalanceError("");
    setActionLoading(true);
    try {
      const finalAmount = balanceModal === "deduct" ? -amount : amount;
      await api.adminUpdateUserBalance(id, finalAmount, balanceNote || undefined);
      setBalanceModal(null);
      setBalanceAmount("");
      setBalanceNote("");
      await fetchUser();
    } catch (err: any) {
      setBalanceError(err?.response?.data?.message ?? "Failed to update balance.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-gray-dark">
        <p className="text-red-500">{error ?? "User not found."}</p>
        <Link href="/admin/users" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  const roleBg: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    user: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  const kycBg: Record<string, string> = {
    verified: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    none: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin/users" className="flex items-center gap-1 text-sm text-body-color transition hover:text-primary dark:text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </Link>

      {/* Profile card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">{user.firstName} {user.lastName}</h2>
              <p className="text-sm text-body-color dark:text-gray-400">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge label={user.role} color={roleBg[user.role] ?? roleBg.user} />
                <Badge label={`KYC: ${user.kycStatus}`} color={kycBg[user.kycStatus] ?? kycBg.none} />
                <Badge
                  label={user.isActive ? "Active" : "Inactive"}
                  color={user.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${user.isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => { setBalanceModal("add"); setBalanceAmount(""); setBalanceNote(""); setBalanceError(""); }}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Add Balance
            </button>
            <button
              onClick={() => { setBalanceModal("deduct"); setBalanceAmount(""); setBalanceNote(""); setBalanceError(""); }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Deduct Balance
            </button>
          </div>
        </div>

        {/* Balance */}
        <div className="mt-6 rounded-xl border border-stroke bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-xs text-body-color dark:text-gray-400">Current Balance</p>
          <p className="text-3xl font-bold text-black dark:text-white">
            ${Number(user.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Activity counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Transactions", value: user._count.transactions },
          { label: "Investments", value: user._count.investments },
          { label: "Referrals", value: user._count.referrals },
          { label: "Sessions", value: user._count.sessions },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-dark">
            <p className="text-xs text-body-color dark:text-gray-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-black dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Personal info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">Personal Information</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Phone", value: user.phone },
            { label: "Date of Birth", value: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null },
            { label: "Nationality", value: user.nationality },
            { label: "Occupation", value: user.occupation },
            { label: "Referral Code", value: user.referralCode },
            { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            { label: "2FA Enabled", value: user.twoFactorEnabled ? "Yes" : "No" },
            { label: "Member Since", value: new Date(user.createdAt).toLocaleDateString() },
            { label: "Last Updated", value: new Date(user.updatedAt).toLocaleDateString() },
          ].map((f) =>
            f.value ? (
              <div key={f.label}>
                <p className="text-xs text-body-color dark:text-gray-400">{f.label}</p>
                <p className="text-sm font-medium text-black dark:text-white">{f.value}</p>
              </div>
            ) : null
          )}
        </div>

        {(user.address || user.city || user.country) && (
          <div className="mt-4 border-t border-stroke pt-4 dark:border-gray-700">
            <p className="mb-1 text-xs text-body-color dark:text-gray-400">Address</p>
            <p className="text-sm text-black dark:text-white">
              {[user.address, user.city, user.state, user.postalCode, user.country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}

        {user.bio && (
          <div className="mt-4 border-t border-stroke pt-4 dark:border-gray-700">
            <p className="mb-1 text-xs text-body-color dark:text-gray-400">Bio</p>
            <p className="text-sm text-black dark:text-white">{user.bio}</p>
          </div>
        )}
      </div>

      {/* Recent login sessions */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-dark">
        <h3 className="mb-4 text-base font-semibold text-black dark:text-white">
          Recent Logins
          {user.recentSessions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-body-color dark:text-gray-400">
              (last {user.recentSessions.length})
            </span>
          )}
        </h3>
        {user.recentSessions.length > 0 ? (
          <div className="space-y-4">
            {user.recentSessions.map((s, i) => (
              <div
                key={i}
                className={`rounded-xl border border-stroke p-4 dark:border-gray-700 ${i === 0 ? "bg-primary/5 dark:bg-primary/10" : "bg-gray-50 dark:bg-gray-800/40"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-black dark:text-white">
                    {i === 0 ? "Most Recent" : `Login #${i + 1}`}
                  </span>
                  <span className="text-xs text-body-color dark:text-gray-400">
                    {new Date(s.loginAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Last Active", value: s.lastActive ? new Date(s.lastActive).toLocaleString() : null },
                    { label: "Device", value: s.device },
                    { label: "Browser", value: s.browser },
                    { label: "OS", value: s.os },
                    { label: "Location", value: s.location },
                    { label: "IP Address", value: s.ipAddress },
                  ].map((f) =>
                    f.value ? (
                      <div key={f.label}>
                        <p className="text-xs text-body-color dark:text-gray-400">{f.label}</p>
                        <p className="text-sm font-medium text-black dark:text-white">{f.value}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-body-color dark:text-gray-400">This user has never logged in.</p>
        )}
      </div>

      {/* Balance modal */}
      {balanceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
              {balanceModal === "add" ? "Add Balance" : "Deduct Balance"}
            </h3>
            <p className="mb-4 text-sm text-body-color dark:text-gray-400">
              User: <span className="font-medium text-black dark:text-white">{user.firstName} {user.lastName}</span>
            </p>
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Amount (USD)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder="0.00"
              className="mb-3 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <label className="mb-1 block text-xs font-medium text-black dark:text-white">Note (optional)</label>
            <input
              type="text"
              value={balanceNote}
              onChange={(e) => setBalanceNote(e.target.value)}
              placeholder="Reason or description…"
              className="mb-4 w-full rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {balanceError && <p className="mb-3 text-xs text-red-500">{balanceError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setBalanceModal(null)}
                className="flex-1 rounded-lg border border-stroke py-2 text-sm font-medium text-black transition hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBalanceSubmit}
                disabled={actionLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50 ${balanceModal === "add" ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
              >
                {actionLoading ? "Processing…" : balanceModal === "add" ? "Add" : "Deduct"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
