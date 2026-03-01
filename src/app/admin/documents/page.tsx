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

// ─── Shared types + constants ─────────────────────────────────────────────────

interface DocField {
  id: string;
  type: "signature" | "name" | "date" | "text" | "stamp";
  assignedTo: "user" | "admin" | "witness";
  required: boolean;
  xPct: number; yPct: number;
  wPct: number; hPct: number;
  pageNum: number; // 1-based page index
}

const FIELD_COLORS: Record<DocField["assignedTo"], { border: string; bg: string; label: string }> = {
  user:    { border: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "User" },
  admin:   { border: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  label: "Admin" },
  witness: { border: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Witness" },
};

const FIELD_ICONS: Record<DocField["type"], string> = {
  signature: "✍", name: "A", date: "📅", text: "T", stamp: "🔏",
};

const FIELD_TYPE_LABELS: Record<DocField["type"], string> = {
  signature: "✍ Sig", name: "A  Name", date: "📅 Date", text: "T  Text", stamp: "🔏 Stamp",
};

const RH = [
  { id: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
  { id: "n",  cursor: "n-resize",  style: { top: -4, left: "50%", marginLeft: -4 } },
  { id: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
  { id: "e",  cursor: "e-resize",  style: { top: "50%", marginTop: -4, right: -4 } },
  { id: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
  { id: "s",  cursor: "s-resize",  style: { bottom: -4, left: "50%", marginLeft: -4 } },
  { id: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
  { id: "w",  cursor: "w-resize",  style: { top: "50%", marginTop: -4, left: -4 } },
] as const;

// ─── Send Document Modal ──────────────────────────────────────────────────────

function SendDocumentModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  // Step 1 state
  const [users, setUsers]               = useState<UserOption[]>([]);
  const [userSearch, setUserSearch]     = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [userMessage, setUserMessage]   = useState("");
  const [file, setFile]                 = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [modalStep, setModalStep]         = useState<"form" | "fields">("form");
  const [fields, setFields]               = useState<DocField[]>([]);
  const [pdfObjectUrl, setPdfObjectUrl]   = useState<string | null>(null);
  const [pageDims, setPageDims]           = useState<{ w: number; h: number } | null>(null);
  const [pageRenderError, setPageRenderError] = useState(false);
  const [activeType, setActiveType]       = useState<DocField["type"] | null>(null);
  const [activeAssignee, setActiveAssignee] = useState<DocField["assignedTo"]>("user");
  const [isRequired, setIsRequired]       = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPageCount, setTotalPageCount] = useState(1);
  const [pdfLoaded, setPdfLoaded]         = useState(false);

  const posContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef   = useRef<HTMLCanvasElement>(null);
  const pdfDocRef       = useRef<any>(null);

  // Drag / resize refs
  const isDragging       = useRef(false);
  const dragFieldId      = useRef<string | null>(null);
  const dragOffset       = useRef({ x: 0, y: 0 });
  const didDrag          = useRef(false);
  const isResizing       = useRef(false);
  const resizeHandleRef  = useRef<string | null>(null);
  const resizingFieldId  = useRef<string | null>(null);
  const resizeStartBox   = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  // Shared
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");

  // Load users
  useEffect(() => {
    api.adminGetUsers({ limit: 100 }).then((res: any) => {
      const d = res.data ?? res;
      setUsers(d.users ?? d ?? []);
    }).catch(() => {});
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => () => { if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl); }, [pdfObjectUrl]);

  // Load PDF document once when step 2 opens (or when file changes)
  useEffect(() => {
    if (modalStep !== "fields" || !pdfObjectUrl) return;
    pdfDocRef.current = null;
    setPdfLoaded(false);
    setPageRenderError(false);
    setPageDims(null);
    setCurrentPage(1);
    setTotalPageCount(1);
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const pdf = await (pdfjsLib as any).getDocument(pdfObjectUrl).promise;
        pdfDocRef.current = pdf;
        setTotalPageCount(pdf.numPages);
        setPdfLoaded(true); // triggers the render effect below
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [modalStep, pdfObjectUrl]);

  // Re-render whenever the current page changes (or when PDF first loads)
  useEffect(() => {
    if (!pdfLoaded || !pdfDocRef.current || modalStep !== "fields") return;
    setPageRenderError(false);
    setPageDims(null);
    (async () => {
      try {
        const page      = await pdfDocRef.current.getPage(currentPage);
        const container = posContainerRef.current;
        const canvas    = pageCanvasRef.current;
        if (!container || !canvas) return;
        const cw       = container.clientWidth;
        const baseVp   = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: cw / baseVp.width });
        canvas.width   = Math.round(viewport.width);
        canvas.height  = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        setPageDims({ w: canvas.width, h: canvas.height });
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [pdfLoaded, currentPage, modalStep]);

  const filteredUsers = users.filter(
    (u) => !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase()),
  );

  // Step 1 → Step 2
  const goToFields = () => {
    setError("");
    if (!selectedUser) return setError("Please select a user");
    if (!title.trim())  return setError("Title is required");
    if (!file)          return setError("Please attach a PDF file");
    setPdfObjectUrl(URL.createObjectURL(file));
    setModalStep("fields");
  };

  // Final submit
  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("userId", selectedUser!.id);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("userMessage", userMessage.trim());
      fd.append("fields", JSON.stringify(fields));
      await api.adminSendDocument(fd);
      onSent();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to send document");
      setSending(false);
    }
  };

  // Canvas helpers
  const getRect = () => pageCanvasRef.current!.getBoundingClientRect();
  const getXY   = (e: React.MouseEvent | React.TouchEvent) =>
    "touches" in e
      ? { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
      : { cx: (e as React.MouseEvent).clientX, cy: (e as React.MouseEvent).clientY };

  // Click to place
  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDrag.current) { didDrag.current = false; return; }
    if (!activeType || !pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const xPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width,  0.80));
    const yPct = Math.max(0, Math.min((e.clientY - rect.top)  / rect.height, 0.94));
    const isBig   = activeType === "signature" || activeType === "stamp";
    const assignTo: DocField["assignedTo"] = activeType === "stamp" ? "admin" : activeAssignee;
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      type: activeType, assignedTo: assignTo, required: isRequired,
      xPct, yPct, wPct: isBig ? 0.28 : 0.20, hPct: isBig ? 0.08 : 0.05,
      pageNum: currentPage,
    }]);
  };

  // Field drag start
  const onFieldMouseDown = (fieldId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    isDragging.current  = true;
    dragFieldId.current = fieldId;
    didDrag.current     = false;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    const f = fields.find(f => f.id === fieldId)!;
    dragOffset.current = { x: cx - rect.left - f.xPct * rect.width, y: cy - rect.top - f.yPct * rect.height };
  };

  // Resize start
  const onResizeStart = (fieldId: string, handle: string, e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    didDrag.current       = true;
    isResizing.current    = true;
    resizingFieldId.current = fieldId;
    resizeHandleRef.current = handle;
    const rect = getRect();
    const { cx, cy } = getXY(e);
    resizeStartMouse.current = { x: cx, y: cy };
    const f = fields.find(f => f.id === fieldId)!;
    resizeStartBox.current = { left: f.xPct * rect.width, top: f.yPct * rect.height, w: f.wPct * rect.width, h: f.hPct * rect.height };
  };

  // Mouse/touch move
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    const rect = getRect();
    const { cx, cy } = getXY(e);

    if (isResizing.current && resizingFieldId.current && resizeHandleRef.current) {
      didDrag.current = true;
      const dx = cx - resizeStartMouse.current.x, dy = cy - resizeStartMouse.current.y;
      const { left: iL, top: iT, w: iW, h: iH } = resizeStartBox.current;
      const hk = resizeHandleRef.current;
      const MIN_W = 40, MIN_H = 14;
      let nL = iL, nT = iT, nW = iW, nH = iH;
      if (hk.includes("e")) nW = Math.max(MIN_W, iW + dx);
      if (hk.includes("w")) { nW = Math.max(MIN_W, iW - dx); nL = iL + iW - nW; }
      if (hk.includes("s")) nH = Math.max(MIN_H, iH + dy);
      if (hk.includes("n")) { nH = Math.max(MIN_H, iH - dy); nT = iT + iH - nH; }
      nL = Math.max(0, Math.min(nL, rect.width - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));
      setFields(prev => prev.map(f =>
        f.id === resizingFieldId.current
          ? { ...f, xPct: nL / rect.width, yPct: nT / rect.height, wPct: nW / rect.width, hPct: nH / rect.height }
          : f
      ));
      return;
    }

    if (isDragging.current && dragFieldId.current) {
      didDrag.current = true;
      const f = fields.find(f => f.id === dragFieldId.current)!;
      const fw = f.wPct * rect.width, fh = f.hPct * rect.height;
      const newL = cx - rect.left - dragOffset.current.x;
      const newT = cy - rect.top  - dragOffset.current.y;
      setFields(prev => prev.map(fi =>
        fi.id === dragFieldId.current
          ? { ...fi, xPct: Math.max(0, Math.min(newL, rect.width - fw)) / rect.width, yPct: Math.max(0, Math.min(newT, rect.height - fh)) / rect.height }
          : fi
      ));
    }
  };

  const onEnd = () => {
    isDragging.current      = false;
    dragFieldId.current     = null;
    isResizing.current      = false;
    resizingFieldId.current = null;
    resizeHandleRef.current = null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark ${modalStep === "fields" ? "max-w-5xl" : "max-w-lg"}`}>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-body-color">
              {modalStep === "form" ? "Step 1 of 2" : "Step 2 of 2"}
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-black dark:text-white">
              {modalStep === "form" ? "Document Details" : "Place Field Zones"}
            </h3>
          </div>
          <button onClick={onClose} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
        </div>

        {/* ── Step 1: Form ─────────────────────────────────────────────────── */}
        {modalStep === "form" && (
          <>
            <div className="space-y-4">
              {/* User */}
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Select User *</label>
                <input type="text" placeholder="Search by name or email…"
                  value={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})` : userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); setShowUserList(true); }}
                  onFocus={() => setShowUserList(true)}
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white"
                />
                {showUserList && !selectedUser && filteredUsers.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-stroke bg-white shadow-lg dark:border-gray-700 dark:bg-gray-dark">
                    {filteredUsers.slice(0, 20).map((u) => (
                      <li key={u.id} onClick={() => { setSelectedUser(u); setUserSearch(""); setShowUserList(false); }}
                        className="cursor-pointer px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="font-medium text-black dark:text-white">{u.firstName} {u.lastName}</span>{" "}
                        <span className="text-body-color">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Document Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Investment Agreement"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Description (optional)</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* Message */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Message to user (optional)</label>
                <textarea value={userMessage} onChange={(e) => setUserMessage(e.target.value)} rows={2} placeholder="Instructions or note…"
                  className="w-full rounded-xl border border-stroke bg-transparent px-4 py-2.5 text-sm text-black outline-none focus:border-primary dark:border-gray-600 dark:text-white" />
              </div>
              {/* File */}
              <div>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">PDF File *</label>
                <div onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stroke px-4 py-3 hover:border-primary dark:border-gray-600">
                  <svg className="h-5 w-5 text-body-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-body-color">{file ? file.name : "Click to upload PDF (max 50MB)"}</span>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700">Cancel</button>
              <button onClick={goToFields} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                Next: Place Fields
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Field placement ───────────────────────────────────────── */}
        {modalStep === "fields" && (
          <>
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {(Object.keys(FIELD_TYPE_LABELS) as DocField["type"][]).map((t) => (
                <button key={t}
                  onClick={() => setActiveType(activeType === t ? null : t)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition ${
                    activeType === t ? "border-primary bg-primary text-white" : "border-stroke text-body-color hover:border-primary hover:text-primary dark:border-gray-600"
                  }`}>
                  {FIELD_TYPE_LABELS[t]}
                </button>
              ))}
              <div className="h-5 w-px bg-stroke dark:bg-gray-700" />
              <select value={activeAssignee} onChange={(e) => setActiveAssignee(e.target.value as DocField["assignedTo"])}
                className="rounded-lg border border-stroke bg-transparent px-2 py-1.5 text-xs text-black dark:border-gray-600 dark:text-white">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="witness">Witness</option>
              </select>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-body-color">
                <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="accent-primary" />
                Required
              </label>
              <span className="ml-auto text-xs text-body-color">
                {totalPageCount > 1
                  ? `${fields.filter(f => f.pageNum === currentPage).length}/${fields.length} field${fields.length !== 1 ? "s" : ""}`
                  : `${fields.length} field${fields.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {activeType && (
              <p className="mb-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Click on the document to place a <strong>{activeType}</strong> field assigned to <strong>{activeType === "stamp" ? "admin" : activeAssignee}</strong>
              </p>
            )}

            {/* Page navigation */}
            {totalPageCount > 1 && (
              <div className="mb-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                >
                  ← Prev
                </button>
                <span className="text-sm font-semibold text-black dark:text-white">
                  Page {currentPage} of {totalPageCount}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPageCount, p + 1))}
                  disabled={currentPage === totalPageCount}
                  className="rounded-lg border border-stroke px-3 py-1 text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                >
                  Next →
                </button>
              </div>
            )}

            {/* PDF canvas */}
            <div ref={posContainerRef}
              className="relative overflow-hidden rounded-xl border border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              style={{ userSelect: "none", touchAction: "none", cursor: activeType ? "crosshair" : "default", maxHeight: "55vh", overflowY: "auto" }}
              onClick={onCanvasClick}
              onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
              onTouchMove={onMove} onTouchEnd={onEnd}
            >
              <canvas ref={pageCanvasRef} style={{ display: pageDims ? "block" : "none" }} />
              {!pageDims && !pageRenderError && (
                <div className="flex h-64 items-center justify-center gap-3 text-body-color">
                  <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm">Loading PDF…</span>
                </div>
              )}
              {pageRenderError && (
                <div className="flex h-64 items-center justify-center text-sm text-body-color">Could not render PDF preview.</div>
              )}

              {/* Field overlays — only show fields belonging to the current page */}
              {pageDims && fields.filter(f => f.pageNum === currentPage).map((field) => {
                const clr = FIELD_COLORS[field.assignedTo];
                const fw  = field.wPct * pageDims.w;
                const fh  = field.hPct * pageDims.h;
                return (
                  <div key={field.id}
                    style={{ position: "absolute", left: field.xPct * pageDims.w, top: field.yPct * pageDims.h, width: fw, height: fh,
                      border: `2px dashed ${clr.border}`, background: clr.bg, borderRadius: 4, cursor: "grab", touchAction: "none" }}
                    onMouseDown={(e) => onFieldMouseDown(field.id, e)}
                    onTouchStart={(e) => onFieldMouseDown(field.id, e)}
                  >
                    <div className="flex h-full items-center justify-center overflow-hidden px-1">
                      <span style={{ fontSize: Math.max(8, fh * 0.35), color: clr.border, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>
                        {FIELD_ICONS[field.type]} {field.type}{field.required ? " *" : ""}
                      </span>
                    </div>
                    {/* Delete — kept inside the zone so overflow-hidden on the container doesn't clip it */}
                    <button
                      style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%",
                        background: "#ef4444", color: "white", fontSize: 9, display: "flex", alignItems: "center",
                        justifyContent: "center", cursor: "pointer", zIndex: 10 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setFields(p => p.filter(f => f.id !== field.id)); }}
                    >✕</button>
                    {/* Resize handles */}
                    {RH.map((h) => (
                      <div key={h.id}
                        style={{ position: "absolute", width: 8, height: 8, background: "white", border: `1.5px solid ${clr.border}`, borderRadius: 2, cursor: h.cursor, ...h.style }}
                        onMouseDown={(e) => onResizeStart(field.id, h.id, e)}
                        onTouchStart={(e) => onResizeStart(field.id, h.id, e)}
                        onClick={(e) => e.stopPropagation()} />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-body-color">
              {(Object.entries(FIELD_COLORS) as [DocField["assignedTo"], typeof FIELD_COLORS[keyof typeof FIELD_COLORS]][]).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ border: `1.5px solid ${v.border}`, background: v.bg }} />
                  {v.label}
                </span>
              ))}
              <span className="ml-auto">Click to place · drag to move · drag edges to resize · ✕ to remove</span>
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setModalStep("form")} className="rounded-xl border border-stroke px-5 py-2 text-sm dark:border-gray-700">
                ← Back
              </button>
              <button onClick={handleSend} disabled={sending}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {sending ? "Sending…" : "Send Document"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
