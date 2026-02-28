"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const PdfViewerModal = dynamic(
  () => import("@/app/dashboard/documents/PdfViewerModal"),
  { ssr: false },
);

interface DocUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  documentUrl: string;
  signedDocumentUrl: string | null;
  status: string;
  signedAt: string | null;
  createdAt: string;
  user: DocUser;
}

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    signed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return map[status] ?? "bg-gray-100 text-gray-500";
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; title: string } | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null); // doc id being loaded
  const limit = 20;

  const openPdf = useCallback(async (doc: Document, signed: boolean) => {
    const key = `${doc.id}-${signed}`;
    setLoadingPdf(key);
    try {
      const blob = await api.adminDownloadDocument(doc.id, signed);
      const url = URL.createObjectURL(blob);
      setViewer({ url, title: signed ? `${doc.title} (Signed)` : doc.title });
    } catch {
      alert("Failed to load PDF. Please try again.");
    } finally {
      setLoadingPdf(null);
    }
  }, []);

  const closeViewer = useCallback(() => {
    if (viewer) URL.revokeObjectURL(viewer.url);
    setViewer(null);
  }, [viewer]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetDocuments({
        status: statusFilter || undefined,
        page,
        limit,
      });
      const data = res.data ?? res;
      setDocs(data.docs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      fetchDocs();
    } catch {
      alert("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black dark:text-white">Documents</h1>
        <button
          onClick={() => setSendOpen(true)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + Send Document
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {["", "pending", "signed", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow dark:bg-gray-dark">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-body-color">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-body-color">
            No documents found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-stroke dark:border-gray-700">
              <tr className="text-left text-xs font-semibold uppercase text-body-color dark:text-gray-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Signed</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-stroke last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-black dark:text-white">
                      {doc.user.firstName} {doc.user.lastName}
                    </p>
                    <p className="text-xs text-body-color">{doc.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-black dark:text-white">{doc.title}</p>
                    {doc.description && (
                      <p className="max-w-[200px] truncate text-xs text-body-color">
                        {doc.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-body-color">{fmt(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-body-color">{fmt(doc.signedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openPdf(doc, false)}
                        disabled={loadingPdf === `${doc.id}-false`}
                        className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {loadingPdf === `${doc.id}-false` ? "Loading…" : "Original"}
                      </button>
                      {doc.signedDocumentUrl && (
                        <button
                          onClick={() => openPdf(doc, true)}
                          disabled={loadingPdf === `${doc.id}-true`}
                          className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-300"
                        >
                          {loadingPdf === `${doc.id}-true` ? "Loading…" : "Signed PDF"}
                        </button>
                      )}
                      {doc.status === "pending" && (
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-body-color">
          <span>
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-stroke px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-stroke px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewer && <PdfViewerModal url={viewer.url} title={viewer.title} onClose={closeViewer} />}

      {/* Send Document Modal */}
      {sendOpen && (
        <SendDocumentModal
          onClose={() => setSendOpen(false)}
          onSent={() => { setSendOpen(false); fetchDocs(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h3 className="mb-2 text-lg font-bold text-black dark:text-white">Delete Document</h3>
            <p className="mb-6 text-sm text-body-color">
              Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-stroke px-4 py-2 text-sm dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Send Document Modal ──────────────────────────────────────────────────────

function SendDocumentModal({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: () => void;
}) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Load users for selection
  useEffect(() => {
    api
      .adminGetUsers({ limit: 100 })
      .then((res: any) => {
        const data = res.data ?? res;
        setUsers(data.users ?? data ?? []);
      })
      .catch(() => {});
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const handleSend = async () => {
    setError("");
    if (!selectedUser) return setError("Please select a user");
    if (!title.trim()) return setError("Title is required");
    if (!file) return setError("Please attach a PDF file");

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", selectedUser.id);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("userMessage", userMessage.trim());
      await api.adminSendDocument(formData);
      onSent();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to send document";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black dark:text-white">Send Document for Signing</h3>
          <button onClick={onClose} className="text-body-color hover:text-black dark:hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* User Select */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Select User *
            </label>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setSelectedUser(null);
                setShowUserList(true);
              }}
              onFocus={() => setShowUserList(true)}
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
            {showUserList && !selectedUser && filteredUsers.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stroke bg-white shadow-lg dark:border-gray-700 dark:bg-gray-dark">
                {filteredUsers.slice(0, 20).map((u) => (
                  <li
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u);
                      setUserSearch("");
                      setShowUserList(false);
                    }}
                    className="cursor-pointer px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="font-medium text-black dark:text-white">
                      {u.firstName} {u.lastName}
                    </span>{" "}
                    <span className="text-body-color">{u.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Investment Agreement"
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document"
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Message to user */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              Message to user (optional)
            </label>
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              rows={2}
              placeholder="Instructions or note for the user…"
              className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* File */}
          <div>
            <label className="mb-1 block text-sm font-medium text-black dark:text-white">
              PDF File *
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stroke px-4 py-3 hover:border-primary dark:border-gray-600"
            >
              <svg className="h-5 w-5 text-body-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-body-color">
                {file ? file.name : "Click to upload PDF (max 50MB)"}
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Document"}
          </button>
        </div>
      </div>
    </div>
  );
}
