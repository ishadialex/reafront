"use client";

import { useState, useEffect } from "react";

interface NewsletterPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsletterPopup = ({ isOpen, onClose }: NewsletterPopupProps) => {
  // Close modal on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-dark sm:p-8 md:p-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300 sm:top-4 sm:right-4"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5 sm:h-6 sm:w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Title */}
          <h2 className="mb-4 text-xl font-bold leading-tight text-black dark:text-white sm:text-2xl md:text-3xl">
            Earn passive returns with Airbnb Arbitrage
          </h2>

          {/* Description */}
          <p className="mb-6 text-sm leading-relaxed text-body-color dark:text-body-color-dark sm:text-base">
            Be the first to access new short-term rental opportunities, deal
            breakdowns, cash-flow updates and proven strategies to earn from
            Airbnb without owning property.
          </p>

          {/* Register Button */}
          <button
            onClick={() => {
              // Navigate to signup page or open registration form
              window.location.href = "/signup";
            }}
            className="inline-block w-full rounded-lg bg-black px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:w-auto sm:px-10 sm:py-3.5 sm:text-base"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPopup;
