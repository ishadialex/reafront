"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TicketUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Reply {
  id: string;
  message: string;
  isStaff: boolean;
  authorName: string;
  createdAt: string;
}

interface TicketSummary {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: TicketUser;
  firstMessage: string;
  messageCount: number;
}

interface TicketDetail extends TicketSummary {
  message: string;
  replies: Reply[];
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;
type TicketStatus = (typeof STATUS_OPTIONS)[number];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    resolved: "bg-green-100 text-green-700",
    closed: "bg-gray-200 text-gray-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status] ?? status;
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
  };
  return map[priority] ?? "bg-gray-100 text-gray-500";
}

function fmt(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const currentTicketIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const LIMIT = 20;

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetSupportTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page,
        limit: LIMIT,
      });
      if (res.success && res.data) {
        setTickets(res.data.tickets);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Socket.io connection ─────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("_at") : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("support_new_reply", ({ ticketId, reply }: { ticketId: string; reply: Reply }) => {
      // Append reply to open ticket detail
      setSelected((prev) => {
        if (!prev || prev.id !== ticketId) return prev;
        // Avoid duplicates (admin's own replies are already appended optimistically)
        if (prev.replies.some((r) => r.id === reply.id)) return prev;
        return { ...prev, replies: [...prev.replies, reply] };
      });
      // Update message count in the list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, messageCount: t.messageCount + 1, updatedAt: reply.createdAt } : t
        )
      );
    });

    socket.on("ticket_status_changed", ({ ticketId, status }: { ticketId: string; status: string }) => {
      setSelected((prev) => (prev?.id === ticketId ? { ...prev, status } : prev));
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    });

    socket.on("connect_error", () => { /* silent */ });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Join/leave ticket room when selected ticket changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const prev = currentTicketIdRef.current;
    if (prev) socket.emit("leave_ticket", prev);

    if (selected?.id) {
      socket.emit("join_ticket", selected.id);
      currentTicketIdRef.current = selected.id;
    } else {
      currentTicketIdRef.current = null;
    }
  }, [selected?.id]);

  // Auto-scroll to newest message
  useEffect(() => {
    if (selected) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected?.replies.length]);

  async function openTicket(id: string) {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await api.adminGetSupportTicket(id);
      if (res.success && res.data) {
        setSelected(res.data);
        setReplyText("");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    setReplying(true);
    try {
      const res = await api.adminReplyToTicket(selected.id, replyText.trim());
      if (res.success && res.data) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                replies: [...prev.replies, res.data],
                // Automatically move to in_progress if was open
                status: prev.status === "open" ? "in_progress" : prev.status,
              }
            : prev
        );
        setReplyText("");
        // Refresh ticket list to reflect status change
        fetchTickets();
      }
    } finally {
      setReplying(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!selected) return;
    setStatusUpdating(true);
    try {
      const res = await api.adminUpdateTicketStatus(selected.id, newStatus);
      if (res.success) {
        setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev));
        setTickets((prev) =>
          prev.map((t) => (t.id === selected.id ? { ...t, status: newStatus } : t))
        );
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex h-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ── Left Panel: ticket list ──────────────────────────────────────────── */}
      <div
        className={`flex flex-col ${selected ? "hidden lg:flex lg:w-1/2 xl:w-2/5" : "w-full"} border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} total</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All priorities</option>
            {["low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          <button
            onClick={() => { setStatusFilter(""); setPriorityFilter(""); setPage(1); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-500">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-500">No tickets found</div>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selected?.id === ticket.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1 flex-1">
                    {ticket.subject}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(ticket.status)}`}>
                    {statusLabel(ticket.status)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{ticket.user?.firstName ?? "Deleted"} {ticket.user?.lastName ?? "User"}</span>
                  <span>·</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${priorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span>·</span>
                  <span>{ticket.category}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {ticket.firstMessage}
                </p>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{fmt(ticket.updatedAt)}</span>
                  <span>{ticket.messageCount} msg{ticket.messageCount !== 1 ? "s" : ""}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              ← Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="disabled:opacity-40 hover:text-gray-900 dark:hover:text-white"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: ticket detail ────────────────────────────────────────── */}
      {selected || detailLoading ? (
        <div className="flex flex-1 flex-col bg-white dark:bg-gray-800 min-h-screen lg:min-h-0">
          {/* Detail header */}
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              aria-label="Back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {selected && (
              <>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                    {selected.subject}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selected.user?.firstName ?? "Deleted"} {selected.user?.lastName ?? "User"} · {selected.user?.email ?? "—"}
                  </p>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selected.status}
                    disabled={statusUpdating}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center text-gray-500">Loading…</div>
          ) : selected ? (
            <>
              {/* Ticket meta */}
              <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-medium ${priorityBadge(selected.priority)}`}>
                  Priority: {selected.priority}
                </span>
                <span className="rounded-full px-2.5 py-1 font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Category: {selected.category}
                </span>
                <span className="text-gray-400 dark:text-gray-500 ml-auto">
                  Opened {fmt(selected.createdAt)}
                </span>
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Original message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {selected.user?.firstName?.[0] ?? "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selected.user?.firstName ?? "Deleted"} {selected.user?.lastName ?? "User"}
                      </span>
                      <span className="text-xs text-gray-400">{fmt(selected.createdAt)}</span>
                    </div>
                    <div className="rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-3 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                      {selected.message}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selected.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex gap-3 ${reply.isStaff ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        reply.isStaff
                          ? "bg-indigo-100 dark:bg-indigo-900/40"
                          : "bg-blue-100 dark:bg-blue-900/40"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold ${
                          reply.isStaff
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {reply.isStaff ? "S" : reply.authorName?.[0] ?? "U"}
                      </span>
                    </div>
                    <div className={`flex-1 ${reply.isStaff ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${reply.isStaff ? "flex-row-reverse" : ""}`}>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {reply.authorName}
                        </span>
                        <span className="text-xs text-gray-400">{fmt(reply.createdAt)}</span>
                      </div>
                      <div
                        className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          reply.isStaff
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {reply.message}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {selected.status !== "closed" && selected.status !== "resolved" ? (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply…"
                    className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={replying || !replyText.trim()}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replying ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm text-gray-500">
                  This ticket is {selected.status}. Change status to reply.
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : (
        /* Empty state when no ticket is selected (desktop) */
        <div className="hidden lg:flex flex-1 items-center justify-center text-gray-400 dark:text-gray-600 flex-col gap-3">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm">Select a ticket to view and respond</p>
        </div>
      )}
    </div>
  );
}
