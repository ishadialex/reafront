"use client";

import { useEffect, useRef, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { api } from "@/lib/api";

type Step = "review" | "fill" | "preview" | "success";
type ActiveTool = "sig" | "name" | "date" | null;
type OpenPanel = "sig" | "name" | "date" | null;

interface SigningDoc {
  id: string;
  title: string;
  description: string;
  userMessage: string;
  documentUrl: string;
}

interface Props {
  doc: SigningDoc;
  onBack: () => void;
  onSigned: () => void;
}

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps = [
    { id: "review", label: "Review" },
    { id: "fill",   label: "Fill & Place" },
    { id: "preview", label: "Preview" },
  ];
  const idx = steps.findIndex((s) => s.id === current);

  return (
    <div className="mb-8 flex items-start">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i < idx
                  ? "bg-green-500 text-white"
                  : i === idx
                  ? "bg-primary text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 dark:bg-gray-700"
              }`}
            >
              {i < idx ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <p className={`mt-1.5 text-xs font-medium ${
              i === idx ? "text-primary" : i < idx ? "text-green-500" : "text-body-color"
            }`}>
              {s.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`mb-5 h-0.5 w-12 sm:w-24 ${i < idx ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SigningView({ doc, onBack, onSigned }: Props) {
  const [step, setStep] = useState<Step>("review");
  const [reviewed, setReviewed] = useState(false);

  // Signature drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<any>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Placed field positions (top-left corner as fraction of page, 0–1)
  const [sigPos, setSigPos]   = useState({ xPct: 0.62, yPct: 0.80 });
  const [namePos, setNamePos] = useState({ xPct: 0.10, yPct: 0.88 });
  const [datePos, setDatePos] = useState({ xPct: 0.10, yPct: 0.93 });

  // Signature display size (canvas pixels)
  const [sigW, setSigW] = useState(180);
  const [sigH, setSigH] = useState(60);

  // Resize state
  const isResizing       = useRef(false);
  const resizeHandle     = useRef<"n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw" | null>(null);
  const resizeStartBox   = useRef({ left: 0, top: 0, w: 0, h: 0 });
  const resizeStartMouse = useRef({ x: 0, y: 0 });

  // Name / date values
  const [nameText, setNameText] = useState("");
  const [dateText, setDateText] = useState(() => new Date().toISOString().split("T")[0]);

  // Interactive fill step: which tool is armed for next click, and which panel is open
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [openPanel, setOpenPanel]   = useState<OpenPanel>(null);

  // Drag state
  const isDragging      = useRef(false);
  const dragOffset      = useRef({ x: 0, y: 0 });
  const draggingTarget  = useRef<"sig" | "name" | "date" | null>(null);
  const didDrag         = useRef(false); // distinguish click vs drag

  // PDF canvas refs / state
  const posContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef   = useRef<HTMLCanvasElement>(null);
  const [pageDims, setPageDims] = useState<{ w: number; h: number } | null>(null);
  const [pageRenderError, setPageRenderError] = useState(false);

  // Preview
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // Blob URL cleanup
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // ── Signature pad: init when panel opens ──────────────────────────────────

  useEffect(() => {
    if (step !== "fill" || openPanel !== "sig") return;
    if (!canvasRef.current) return;

    let pad: any;
    import("signature_pad").then((mod) => {
      pad = new mod.default(canvasRef.current!, {
        backgroundColor: "rgb(255,255,255)",
        penColor: "rgb(0,0,0)",
        minWidth: 1,
        maxWidth: 3,
      });
      padRef.current = pad;
      if (signatureDataUrl) pad.fromDataURL(signatureDataUrl);
    });
    return () => { pad?.off(); };
  }, [step, openPanel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signature canvas resize
  useEffect(() => {
    if (step !== "fill" || openPanel !== "sig") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const saved = padRef.current?.toData?.();
      canvas.width  = canvas.offsetWidth  * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      padRef.current?.clear();
      if (saved) padRef.current?.fromData(saved);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [step, openPanel]);

  // ── Render last PDF page to canvas when entering fill step ────────────────

  useEffect(() => {
    if (step !== "fill") return;
    setPageRenderError(false);
    setPageDims(null);

    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        const pdfDoc = await (pdfjsLib as any).getDocument(doc.documentUrl).promise;
        const page   = await pdfDoc.getPage(pdfDoc.numPages);

        const container = posContainerRef.current;
        const canvas    = pageCanvasRef.current;
        if (!container || !canvas) return;

        const cw         = container.clientWidth;
        const baseVp     = page.getViewport({ scale: 1 });
        const viewport   = page.getViewport({ scale: cw / baseVp.width });

        canvas.width  = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;

        const dims = { w: canvas.width, h: canvas.height };
        setPageDims(dims);

        const dw = Math.min(200, dims.w * 0.32);
        setSigW(Math.round(dw));
        setSigH(Math.round(dw / 3));
      } catch {
        setPageRenderError(true);
      }
    })();
  }, [step, doc.documentUrl]);

  // ── Derived text-box sizes ────────────────────────────────────────────────

  const TEXT_BOX_H = 26;
  const nameBoxW = pageDims ? Math.round(pageDims.w * 0.28) : 170;
  const dateBoxW = pageDims ? Math.round(pageDims.w * 0.20) : 120;

  // ── Drag helpers ──────────────────────────────────────────────────────────

  const getClientXY = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) return { cx: e.touches[0].clientX, cy: e.touches[0].clientY };
    return { cx: (e as React.MouseEvent).clientX, cy: (e as React.MouseEvent).clientY };
  };

  const getCanvasRect = () => pageCanvasRef.current!.getBoundingClientRect();

  const makeDragStart = (target: "sig" | "name" | "date") => (e: React.MouseEvent | React.TouchEvent) => {
    if (!pageDims || !pageCanvasRef.current) return;
    draggingTarget.current = target;
    isDragging.current = true;
    didDrag.current = false;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    const pos = target === "sig" ? sigPos : target === "name" ? namePos : datePos;
    dragOffset.current = { x: cx - rect.left - pos.xPct * rect.width, y: cy - rect.top - pos.yPct * rect.height };
    e.stopPropagation();
  };

  const onDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    // ── Resize mode ──────────────────────────────────────────────────────────
    if (isResizing.current && resizeHandle.current && pageDims && pageCanvasRef.current) {
      didDrag.current = true;
      const rect = getCanvasRect();
      const { cx, cy } = getClientXY(e);
      const dx = cx - resizeStartMouse.current.x;
      const dy = cy - resizeStartMouse.current.y;
      const { left: iL, top: iT, w: iW, h: iH } = resizeStartBox.current;
      const h = resizeHandle.current;
      const MIN_W = 40, MIN_H = 16;

      let nL = iL, nT = iT, nW = iW, nH = iH;
      if (h.includes("e")) nW = Math.max(MIN_W, iW + dx);
      if (h.includes("w")) { nW = Math.max(MIN_W, iW - dx); nL = iL + iW - nW; }
      if (h.includes("s")) nH = Math.max(MIN_H, iH + dy);
      if (h.includes("n")) { nH = Math.max(MIN_H, iH - dy); nT = iT + iH - nH; }

      nL = Math.max(0, Math.min(nL, rect.width  - nW));
      nT = Math.max(0, Math.min(nT, rect.height - nH));
      setSigPos({ xPct: nL / rect.width, yPct: nT / rect.height });
      setSigW(Math.round(nW));
      setSigH(Math.round(nH));
      return;
    }

    // ── Drag mode ────────────────────────────────────────────────────────────
    if (!isDragging.current || !pageDims || !draggingTarget.current || !pageCanvasRef.current) return;
    didDrag.current = true;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    const newLeft = cx - rect.left - dragOffset.current.x;
    const newTop  = cy - rect.top  - dragOffset.current.y;
    const target  = draggingTarget.current;
    const boxW = target === "sig" ? sigW : target === "name" ? nameBoxW : dateBoxW;
    const boxH = target === "sig" ? sigH : TEXT_BOX_H;
    const newPos = {
      xPct: Math.max(0, Math.min(newLeft, rect.width  - boxW)) / rect.width,
      yPct: Math.max(0, Math.min(newTop,  rect.height - boxH)) / rect.height,
    };
    if (target === "sig")        setSigPos(newPos);
    else if (target === "name")  setNamePos(newPos);
    else                         setDatePos(newPos);
  };

  const onDragEnd = () => {
    isDragging.current    = false;
    draggingTarget.current = null;
    isResizing.current    = false;
    resizeHandle.current  = null;
  };

  const onResizeStart = (
    handle: "n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw",
    e: React.MouseEvent | React.TouchEvent,
  ) => {
    if (!pageDims || !pageCanvasRef.current) return;
    e.stopPropagation();
    didDrag.current = true; // prevent canvas-click firing on mouse-up
    isResizing.current   = true;
    resizeHandle.current = handle;
    const rect = getCanvasRect();
    const { cx, cy } = getClientXY(e);
    resizeStartMouse.current = { x: cx, y: cy };
    resizeStartBox.current   = {
      left: sigPos.xPct * rect.width,
      top:  sigPos.yPct * rect.height,
      w: sigW,
      h: sigH,
    };
  };

  // ── Click-to-place handler on the PDF canvas area ────────────────────────

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore if this was the end of a drag
    if (didDrag.current) { didDrag.current = false; return; }
    if (!activeTool || !pageDims || !pageCanvasRef.current) return;

    const rect = getCanvasRect();
    const xPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width,  0.98));
    const yPct = Math.max(0, Math.min((e.clientY - rect.top)  / rect.height, 0.98));

    if (activeTool === "sig")        setSigPos ({ xPct, yPct });
    else if (activeTool === "name")  setNamePos({ xPct, yPct });
    else                             setDatePos ({ xPct, yPct });

    setOpenPanel(activeTool);
    setActiveTool(null);
  };

  // ── Generate preview PDF ──────────────────────────────────────────────────

  const goToPreview = async () => {
    if (!signatureDataUrl) { setError("Please place and draw your signature first."); return; }
    setError("");
    setPreviewLoading(true);
    setStep("preview");

    try {
      const pdfResponse = await fetch(doc.documentUrl);
      if (!pdfResponse.ok) throw new Error("Failed to fetch document");
      const pdfBytes = await pdfResponse.arrayBuffer();

      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const base64  = signatureDataUrl.replace("data:image/png;base64,", "");
      const binary  = atob(base64);
      const sigBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) sigBytes[i] = binary.charCodeAt(i);

      const sigImage  = await pdfDoc.embedPng(sigBytes);
      const pages     = pdfDoc.getPages();
      const lastPage  = pages[pages.length - 1];
      const { width: pdfW, height: pdfH } = lastPage.getSize();

      // Scale the signature from canvas pixels → PDF points using the same ratio
      // the canvas used to scale the PDF (canvasW / pdfW). This ensures what you
      // see on the positioning canvas is exactly what lands in the PDF.
      const canvasW  = pageDims?.w ?? pdfW;
      const scaleRatio = pdfW / canvasW;
      const sigWidth  = sigW * scaleRatio;
      const sigHeight = sigH * scaleRatio;

      lastPage.drawImage(sigImage, {
        x: Math.max(0, sigPos.xPct * pdfW),
        y: Math.max(0, pdfH * (1 - sigPos.yPct) - sigHeight),
        width: sigWidth,
        height: sigHeight,
      });

      if (nameText.trim() || dateText) {
        const { StandardFonts } = await import("pdf-lib");
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // TEXT_BOX_H=26px; baseline sits ~70% down the box → 18 * scaleRatio
        const textYOffset = 18 * scaleRatio;

        if (nameText.trim()) {
          lastPage.drawText(nameText.trim(), {
            x: Math.max(0, namePos.xPct * pdfW),
            y: Math.max(0, pdfH * (1 - namePos.yPct) - textYOffset),
            size: 10, font, color: rgb(0, 0, 0),
          });
        }

        if (dateText) {
          const formatted = new Date(dateText + "T00:00:00").toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
          });
          lastPage.drawText(formatted, {
            x: Math.max(0, datePos.xPct * pdfW),
            y: Math.max(0, pdfH * (1 - datePos.yPct) - textYOffset),
            size: 10, font, color: rgb(0, 0, 0),
          });
        }
      }

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Preview generation failed:", err);
      setError("Could not generate preview. You can still submit.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!signatureDataUrl) return;
    setSubmitting(true);
    setError("");
    try {
      await api.signDocument(doc.id, {
        signatureDataUrl,
        sigPos,
        sigScale: 1,
        nameText: nameText.trim() || null,
        namePos,
        dateText: dateText || null,
        datePos,
        canvasW:     pageDims?.w ?? 595,
        sigDisplayW: sigW,
        sigDisplayH: sigH,
      });
      setStep("success");
      setTimeout(() => onSigned(), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to submit. Please try again.");
      setStep("fill");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">Document Signed!</h2>
        <p className="text-body-color">Your signed document is ready. You can download it from your Documents page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-body-color hover:text-black dark:hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Documents
      </button>

      {/* Doc header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-black dark:text-white">{doc.title}</h2>
        {doc.description && <p className="mt-1 text-body-color">{doc.description}</p>}
        {doc.userMessage && (
          <p className="mt-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {doc.userMessage}
          </p>
        )}
      </div>

      <StepBar current={step} />

      {/* ── Step 1: Review ─────────────────────────────────────────────────── */}
      {step === "review" && (
        <div>
          <div className="mb-5 overflow-hidden rounded-2xl border border-stroke bg-white shadow dark:border-gray-700 dark:bg-gray-dark">
            <div className="flex items-center justify-between border-b border-stroke px-5 py-3 dark:border-gray-700">
              <p className="font-medium text-black dark:text-white">Document Preview</p>
              <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
            <div style={{ height: "620px" }}>
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer fileUrl={doc.documentUrl} />
              </Worker>
            </div>
          </div>

          <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-stroke p-4 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-primary" />
            <span className="text-sm text-black dark:text-white">
              I have fully read and understood this document and agree to sign it electronically.
              I understand my electronic signature is legally binding.
            </span>
          </label>

          <button onClick={() => setStep("fill")} disabled={!reviewed}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
            Fill &amp; Sign
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Step 2: Fill & Place ────────────────────────────────────────────── */}
      {step === "fill" && (
        <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-dark">
          <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">Fill &amp; Place Fields</h3>
          <p className="mb-5 text-sm text-body-color">
            Select a field type below, then tap anywhere on the document to place it.
          </p>

          {/* Tool selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(["sig", "name", "date"] as const).map((tool) => {
              const labels = { sig: "✍ Signature", name: "A  Full Name", date: "📅 Date" };
              const colors = {
                sig:  activeTool === "sig"  ? "bg-primary text-white" : "border-primary text-primary hover:bg-primary/5",
                name: activeTool === "name" ? "bg-blue-500 text-white" : "border-blue-500 text-blue-600 hover:bg-blue-50",
                date: activeTool === "date" ? "bg-green-600 text-white" : "border-green-600 text-green-700 hover:bg-green-50",
              };
              return (
                <button key={tool}
                  onClick={() => setActiveTool(activeTool === tool ? null : tool)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${colors[tool]}`}>
                  {labels[tool]}
                </button>
              );
            })}
          </div>

          {activeTool && (
            <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              {activeTool === "sig"  && "Click on the document where you want your signature"}
              {activeTool === "name" && "Click on the document where you want your name"}
              {activeTool === "date" && "Click on the document where you want the date"}
            </p>
          )}

          {/* PDF canvas + draggable overlays */}
          <div
            ref={posContainerRef}
            className="relative mb-3 overflow-hidden rounded-xl border border-stroke bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            style={{ userSelect: "none", touchAction: "none", cursor: activeTool ? "crosshair" : "default" }}
            onClick={onCanvasClick}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          >
            {/* Rendered PDF page */}
            <canvas ref={pageCanvasRef} style={{ display: pageDims ? "block" : "none" }} />

            {/* Loading */}
            {!pageDims && !pageRenderError && (
              <div className="flex h-72 items-center justify-center gap-3 text-body-color">
                <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm">Loading document…</span>
              </div>
            )}

            {/* Error */}
            {pageRenderError && (
              <div className="flex h-72 items-center justify-center text-sm text-body-color">
                Could not render preview — you can still proceed.
              </div>
            )}

            {/* Draggable + resizable signature */}
            {signatureDataUrl && pageDims && (() => {
              const HANDLES: Array<{
                id: "n"|"ne"|"e"|"se"|"s"|"sw"|"w"|"nw";
                cursor: string;
                style: React.CSSProperties;
              }> = [
                { id: "nw", cursor: "nw-resize", style: { top: -4,  left:  -4 } },
                { id: "n",  cursor: "n-resize",  style: { top: -4,  left: "50%", marginLeft: -4 } },
                { id: "ne", cursor: "ne-resize", style: { top: -4,  right: -4 } },
                { id: "e",  cursor: "e-resize",  style: { top: "50%", marginTop: -4, right: -4 } },
                { id: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
                { id: "s",  cursor: "s-resize",  style: { bottom: -4, left: "50%", marginLeft: -4 } },
                { id: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
                { id: "w",  cursor: "w-resize",  style: { top: "50%", marginTop: -4, left: -4 } },
              ];
              return (
                <div
                  style={{
                    position: "absolute",
                    left: sigPos.xPct * pageDims.w,
                    top:  sigPos.yPct * pageDims.h,
                    width:  sigW,
                    height: sigH,
                    cursor: "grab",
                    touchAction: "none",
                  }}
                  onMouseDown={makeDragStart("sig")}
                  onTouchStart={makeDragStart("sig")}
                >
                  <div className="h-full w-full rounded border-2 border-primary bg-white/85 p-1 shadow-lg">
                    <img src={signatureDataUrl} alt="signature" className="h-full w-full object-contain" draggable={false} />
                  </div>

                  {/* Edit button */}
                  <button
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow"
                    style={{ fontSize: 9 }}
                    onClick={(e) => { e.stopPropagation(); setOpenPanel("sig"); }}
                  >✎</button>

                  {/* Resize handles */}
                  {HANDLES.map((hnd) => (
                    <div
                      key={hnd.id}
                      style={{
                        position: "absolute",
                        width: 8, height: 8,
                        background: "white",
                        border: "1.5px solid #3b82f6",
                        borderRadius: 2,
                        cursor: hnd.cursor,
                        ...hnd.style,
                      }}
                      onMouseDown={(e) => onResizeStart(hnd.id, e)}
                      onTouchStart={(e) => onResizeStart(hnd.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ))}
                </div>
              );
            })()}

            {/* Draggable name */}
            {nameText && pageDims && (
              <div
                style={{
                  position: "absolute",
                  left: namePos.xPct * pageDims.w,
                  top:  namePos.yPct * pageDims.h,
                  width: nameBoxW, height: TEXT_BOX_H,
                  cursor: "grab", touchAction: "none",
                }}
                onMouseDown={makeDragStart("name")}
                onTouchStart={makeDragStart("name")}
              >
                <div className="flex h-full w-full items-center rounded border-2 border-dashed border-blue-500 bg-white/90 px-2 shadow">
                  <span className="truncate text-xs font-medium text-gray-800">{nameText}</span>
                </div>
                <button
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow"
                  style={{ fontSize: 9 }}
                  onClick={(e) => { e.stopPropagation(); setOpenPanel("name"); }}
                >✎</button>
              </div>
            )}

            {/* Draggable date */}
            {dateText && pageDims && (
              <div
                style={{
                  position: "absolute",
                  left: datePos.xPct * pageDims.w,
                  top:  datePos.yPct * pageDims.h,
                  width: dateBoxW, height: TEXT_BOX_H,
                  cursor: "grab", touchAction: "none",
                }}
                onMouseDown={makeDragStart("date")}
                onTouchStart={makeDragStart("date")}
              >
                <div className="flex h-full w-full items-center rounded border-2 border-dashed border-green-500 bg-white/90 px-2 shadow">
                  <span className="truncate text-xs text-gray-800">
                    {new Date(dateText + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <button
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white shadow"
                  style={{ fontSize: 9 }}
                  onClick={(e) => { e.stopPropagation(); setOpenPanel("date"); }}
                >✎</button>
              </div>
            )}
          </div>

          {/* Legend + sig size slider */}
          <div className="mb-1 flex items-center gap-3 text-xs text-body-color">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-primary bg-primary/20" /> Signature
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-blue-500 bg-blue-100" /> Name
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm border border-green-500 bg-green-100" /> Date
            </span>
            <span className="ml-auto text-xs text-body-color">Drag to reposition · ✎ to edit</span>
          </div>

          {/* ── Inline panels ─────────────────────────────────────────────── */}

          {/* Signature panel */}
          {openPanel === "sig" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Draw Your Signature</h4>
                <button onClick={() => setOpenPanel(null)} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
              </div>
              <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <canvas ref={canvasRef} className="block h-40 w-full cursor-crosshair bg-white" style={{ touchAction: "none" }} />
                <p className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2 text-xs text-gray-300 select-none">
                  Draw here
                </p>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => padRef.current?.clear()}
                  className="rounded-lg border border-stroke px-4 py-2 text-sm text-black hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700">
                  Clear
                </button>
                <button
                  onClick={() => {
                    if (!padRef.current || padRef.current.isEmpty()) {
                      setError("Please draw your signature first.");
                      return;
                    }
                    setError("");
                    const dataUrl = padRef.current.toDataURL("image/png");
                    // Measure the actual drawn image so sigH matches its real proportions
                    const img = new window.Image();
                    img.onload = () => {
                      setSigH(Math.max(20, Math.round(sigW * img.height / img.width)));
                    };
                    img.src = dataUrl;
                    setSignatureDataUrl(dataUrl);
                    setOpenPanel(null);
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Place Signature
                </button>
              </div>
            </div>
          )}

          {/* Name panel */}
          {openPanel === "name" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Full Name</h4>
                <button onClick={() => setOpenPanel(null)} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
              </div>
              <input
                type="text"
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                placeholder="Type your full name"
                autoFocus
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => setOpenPanel(null)}
                className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
                Place Name
              </button>
            </div>
          )}

          {/* Date panel */}
          {openPanel === "date" && (
            <div className="mb-4 rounded-xl border border-stroke bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-black dark:text-white">Date</h4>
                <button onClick={() => setOpenPanel(null)} className="text-body-color hover:text-black dark:hover:text-white">✕</button>
              </div>
              <input
                type="date"
                value={dateText}
                onChange={(e) => setDateText(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => setOpenPanel(null)}
                className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                Place Date
              </button>
            </div>
          )}

          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button onClick={() => setStep("review")}
              className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
              ← Back to Review
            </button>
            <button onClick={goToPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              Preview Signed Document
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ─────────────────────────────────────────────────── */}
      {step === "preview" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow dark:bg-gray-dark">
          <div className="flex items-center justify-between border-b border-stroke bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-body-color">Step 3 — Preview &amp; Confirm</p>
              <h3 className="mt-0.5 font-bold text-black dark:text-white">Review your signed document before submitting</h3>
            </div>
            {previewUrl && (
              <a href={previewUrl} download={`preview-${doc.title}.pdf`}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Preview
              </a>
            )}
          </div>

          <div style={{ height: "650px" }}>
            {previewLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-body-color">
                <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <p className="text-sm">Generating signed preview…</p>
              </div>
            ) : previewUrl ? (
              <Worker workerUrl="/pdf.worker.min.js">
                <Viewer fileUrl={previewUrl} />
              </Worker>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-sm text-body-color">Preview unavailable — your signature will still be applied on submission.</p>
                {signatureDataUrl && (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4">
                    <p className="mb-2 text-xs text-gray-400">Your signature:</p>
                    <img src={signatureDataUrl} alt="signature" className="h-20 w-60 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-stroke px-6 py-5 dark:border-gray-700">
            <p className="mb-4 text-xs text-body-color">
              The document above shows exactly how your signed copy will look. By clicking
              &quot;Submit &amp; Sign&quot; you confirm this signature is your legal electronic signature.
            </p>
            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setStep("fill")}
                className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800">
                ← Edit Fields
              </button>
              <button onClick={handleSubmit} disabled={submitting || previewLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit &amp; Sign Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
