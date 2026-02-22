"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
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
        <link rel="canonical" href="https://alvaradoassociatepartners.com" />

        {/* Open Graph defaults */}
        <meta property="og:site_name" content="Alvarado Associates" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:image" content="https://alvaradoassociatepartners.com/images/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Card defaults */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AlvaradoAssoc" />
        <meta name="twitter:image" content="https://alvaradoassociatepartners.com/images/og-image.jpg" />

        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Alvarado Associates",
              url: "https://alvaradoassociatepartners.com",
              logo: "https://alvaradoassociatepartners.com/favi.svg",
              description:
                "Alvarado Associates is a real estate investment platform offering fractional property ownership, mortgage-backed investments, and Airbnb arbitrage opportunities.",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://alvaradoassociatepartners.com/contact",
              },
              sameAs: [],
            }),
          }}
        />

        {/* JSON-LD WebSite Schema (enables Google Sitelinks search box) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Alvarado Associates",
              url: "https://alvaradoassociatepartners.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://alvaradoassociatepartners.com/listings?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>


      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`}>
        <Providers>
          <div className="isolate">
            {!isPDFViewer && !isDashboard && !isAuthPage && <Header />}
            {children}
            {!isPDFViewer && !isDashboard && !isAuthPage && <Footer />}
          </div>
          {!isPDFViewer && !isDashboard && !isAuthPage && <ScrollToTop />}
          <NewsletterPopup
            isOpen={showNewsletterPopup}
            onClose={handleClosePopup}
          />
        </Providers>
        <Script
          id="tawk-to"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/69973ff873d8cb1c357e6198/1jhrd3pkj';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

import { Providers } from "./providers";

