"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pdfFile = searchParams.get("file");
  const [isIOS, setIsIOS] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Detect iOS devices (iPhone, iPad, iPod)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem("pdf_authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  if (!pdfFile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-dark">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-dark">
          <p className="text-lg text-red-600 dark:text-red-400">No PDF file specified</p>
        </div>
      </div>
    );
  }

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const response = await axios.post(`${API_URL}/api/pdf/verify-passcode`, {
        passcode,
      });

      if (response.data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("pdf_authenticated", "true");
      } else {
        setError("Invalid passcode. Please try again.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid passcode. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfFile;
    link.download = pdfFile.split("/").pop() || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    sessionStorage.removeItem("pdf_authenticated");
    router.push("/");
  };

  // Add PDF parameters for better iOS compatibility
  const pdfUrl = `${pdfFile}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;

  // Show passcode modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-100 px-4 dark:from-black dark:via-gray-900 dark:to-black">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-dark">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-black dark:text-white">
              Protected Document
            </h2>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Enter the passcode to access this PDF document
            </p>
          </div>

          {/* Passcode Form */}
          <form onSubmit={handlePasscodeSubmit}>
            {error && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="passcode"
                className="mb-2 block text-sm font-medium text-black dark:text-white"
              >
                Passcode
              </label>
              <input
                type="password"
                id="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                required
                autoFocus
                className="w-full rounded-lg border border-stroke bg-gray-50 px-4 py-3 text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-stroke bg-transparent px-6 py-3 font-medium text-black transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !passcode}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Access PDF"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
      <div className="mx-auto max-w-full p-1 sm:p-2 md:p-4">
        <div className="rounded-sm bg-white shadow-lg sm:rounded-md md:rounded-lg">
          {isIOS ? (
            // iOS-specific rendering using object tag with embed fallback
            <div className="relative" style={{ height: 'calc(100vh - 80px)', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <object
                data={pdfUrl}
                type="application/pdf"
                className="h-full w-full"
                style={{ minHeight: '100vh' }}
              >
                <embed
                  src={pdfUrl}
                  type="application/pdf"
                  className="h-full w-full"
                  style={{ minHeight: '100vh' }}
                />
                {/* Fallback for browsers that don't support embed */}
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="mb-4 text-lg text-body-color dark:text-body-color-dark">
                    Unable to display PDF in browser.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="rounded-md bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-primary/80"
                  >
                    Download PDF
                  </button>
                </div>
              </object>
            </div>
          ) : (
            // Android and other devices - use iframe
            <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
              <iframe
                src={pdfUrl}
                className="h-full w-full"
                title="PDF Viewer"
                style={{ border: 'none' }}
              />
            </div>
          )}
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
