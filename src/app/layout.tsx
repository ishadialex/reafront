"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  shouldShowNewsletterPopup,
  markNewsletterPopupShown,
} from "@/utils/newsletter-popup";
import "../styles/index.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPDFViewer = pathname?.startsWith("/pdf-viewer");
  const isDashboard = pathname?.startsWith("/dashboard");
  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  const hasShownPopupRef = useRef(false);

  // Only show popup on homepage, once per session, after delay
  useEffect(() => {
    // Only trigger on homepage
    if (pathname !== "/") return;

    // Prevent showing multiple times in same session
    if (hasShownPopupRef.current) return;

    // Check localStorage condition
    if (!shouldShowNewsletterPopup()) return;

    // Delay to ensure smooth page load
    const timer = setTimeout(() => {
      setShowNewsletterPopup(true);
      hasShownPopupRef.current = true;
      markNewsletterPopupShown(); // Save timestamp immediately on display
    }, 2000);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle closing the popup
  const handleClosePopup = () => {
    setShowNewsletterPopup(false);
    markNewsletterPopupShown();
  };

  return (
    <html suppressHydrationWarning lang="en">
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
  <link rel="icon" href="/favi.svg" type="image/svg+xml" />
</head>


      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <div className="isolate">
            {!isPDFViewer && !isDashboard && <Header />}
            {children}
            {!isPDFViewer && !isDashboard && !isAuthPage && <Footer />}
          </div>
          {!isPDFViewer && !isDashboard && !isAuthPage && <ScrollToTop />}
          <NewsletterPopup
            isOpen={showNewsletterPopup}
            onClose={handleClosePopup}
          />
        </Providers>
      </body>
    </html>
  );
}

import { Providers } from "./providers";

