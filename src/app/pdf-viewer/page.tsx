"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("docId");
  const docTitle = searchParams.get("title") || "document";
  const tokenParam = searchParams.get("token"); // Get JWT token from URL

  if (!docId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <p className="text-lg text-red-600 dark:text-red-400">No PDF file specified</p>
        </div>
      </div>
    );
  }

  if (!tokenParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <p className="text-lg text-red-600 dark:text-red-400">Access denied: No access token provided</p>
        </div>
      </div>
    );
  }

  // Build secure PDF serve URL using the document's MongoDB ID.
  // The title is appended as the final path segment so browsers (especially
  // Chrome on Android) display the document name instead of the raw ID.
  const getSecurePdfUrl = () => {
    if (!docId || !tokenParam) return null;
    const safeTitle = encodeURIComponent(docTitle.replace(/[/\\?%*:|"<>]/g, "-"));
    return `${API_URL}/api/pdf/serve/${docId}/${safeTitle}.pdf?token=${encodeURIComponent(tokenParam)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!tokenParam) {
      alert("Cannot download: No access token");
      return;
    }

    try {
      // Build secure URL using the document ID
      const securePdfUrl = getSecurePdfUrl()!;

      // Fetch the PDF with the token
      const response = await fetch(securePdfUrl);

      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  // Add PDF parameters for better iOS compatibility
  const pdfUrl = `${getSecurePdfUrl()}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-dark">
      {/* Action Bar */}
      <div className="sticky top-0 z-40 bg-white shadow-md dark:bg-gray-800">
        <div className="mx-auto flex max-w-full items-center justify-between px-2 py-2 sm:px-4 sm:py-3 md:py-4">
          <h1 className="text-sm font-semibold text-black dark:text-white sm:text-base md:text-lg">
            PDF Viewer
          </h1>
          <div className="flex gap-1.5 sm:gap-2 md:gap-3">
            <button
              onClick={handlePrint}
              className="rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-white transition hover:bg-primary/80 sm:px-3 sm:py-2 sm:text-sm md:px-4"
            >
              Print
            </button>
            <button
              onClick={handleDownload}
              className="rounded-md bg-green-600 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 sm:px-3 sm:py-2 sm:text-sm md:px-4"
            >
              Download
            </button>
            <button
              onClick={handleClose}
              className="rounded-md bg-black px-2 py-1.5 text-xs font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:px-3 sm:py-2 sm:text-sm md:px-4"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="mx-auto max-w-full">
        <div style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <iframe
            src={pdfUrl}
            className="h-full w-full"
            title="PDF Viewer"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PDFViewer() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg text-black dark:text-white">Loading PDF...</p>
          </div>
        </div>
      }
    >
      <PDFViewerContent />
    </Suspense>
  );
}
