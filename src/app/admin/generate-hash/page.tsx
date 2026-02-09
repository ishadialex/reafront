"use client";

import { useState } from "react";
import { generatePasscodeHash } from "@/utils/passcode";

/**
 * Admin tool to generate SHA-256 hashes for passcodes
 * Access this page at: /admin/generate-hash
 *
 * Use this tool to:
 * 1. Generate hashes for new passcodes
 * 2. Copy the hashes to src/config/document-passcodes.ts
 */
export default function GenerateHashPage() {
  const [passcode, setPasscode] = useState("");
  const [hash, setHash] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!passcode.trim()) return;

    setIsGenerating(true);
    try {
      const generatedHash = await generatePasscodeHash(passcode);
      setHash(generatedHash);
    } catch (error) {
      console.error("Error generating hash:", error);
      alert("Error generating hash");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    alert("Hash copied to clipboard!");
  };

  return (
    <section className="relative z-10 min-h-screen bg-gray-light py-16 dark:bg-bg-color-dark md:py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-[600px] rounded-lg bg-white p-8 shadow-lg dark:bg-gray-dark">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
              Passcode Hash Generator
            </h1>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              Generate SHA-256 hashes for document access passcodes
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-8 rounded-lg bg-gray-2 p-4 dark:bg-black">
            <h3 className="mb-2 text-sm font-semibold text-black dark:text-white">
              Instructions:
            </h3>
            <ol className="list-decimal space-y-1 pl-5 text-xs text-body-color dark:text-body-color-dark">
              <li>Enter your plain text passcode below</li>
              <li>Click "Generate Hash"</li>
              <li>Copy the generated hash</li>
              <li>Add the hash to DOCUMENT_PASSCODES array in src/config/document-passcodes.ts</li>
            </ol>
          </div>

          {/* Input Form */}
          <div className="mb-6">
            <label
              htmlFor="passcode"
              className="mb-3 block text-sm font-medium text-black dark:text-white"
            >
              Enter Passcode
            </label>
            <input
              type="text"
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="e.g., MYPASSCODE123"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
            <p className="mt-2 text-xs text-body-color dark:text-body-color-dark">
              Note: Passcodes are automatically converted to uppercase
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !passcode.trim()}
            className="mb-6 w-full rounded-lg bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "Generating..." : "Generate Hash"}
          </button>

          {/* Hash Output */}
          {hash && (
            <div className="rounded-lg bg-gray-2 p-4 dark:bg-black">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Generated Hash:
                </h3>
                <button
                  onClick={copyToClipboard}
                  className="rounded bg-primary px-3 py-1 text-xs text-white transition hover:bg-primary/90"
                >
                  Copy
                </button>
              </div>
              <div className="overflow-x-auto rounded bg-white p-3 dark:bg-gray-dark">
                <code className="break-all text-xs text-black dark:text-white">
                  "{hash}"
                </code>
              </div>
              <p className="mt-3 text-xs text-body-color dark:text-body-color-dark">
                Add this hash to the DOCUMENT_PASSCODES array in your config file.
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs text-red-600 dark:text-red-400">
              <strong>Security Note:</strong> This is an admin tool. Do not share this URL
              with users. Consider removing or protecting this page in production.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
