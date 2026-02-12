"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const Hero = () => {
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const captions = [
    "Passive Income Through Strategic Real Estate Investment",
    "Turn Property into Profit",
    "Property Investment Made Simple"
  ];

  // Typing effect for current caption
  useEffect(() => {
    const fullText = captions[currentCaptionIndex];
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout | undefined;
    setTypedText("");
    setIsTypingComplete(false);
    setIsFadingOut(false);

    // Add a small delay before starting the typing animation
    // This prevents conflicts with Google Translate's initial page translation
    const startDelay = setTimeout(() => {
      typingInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          if (typingInterval !== undefined) {
            clearInterval(typingInterval);
          }
          setIsTypingComplete(true);
        }
      }, 100); // Type one character every 100ms
    }, 500); // Wait 500ms before starting animation

    return () => {
      clearTimeout(startDelay);
      if (typingInterval !== undefined) {
        clearInterval(typingInterval);
      }
    };
  }, [currentCaptionIndex]);

  // Rotation effect - fade out, then move to next caption
  useEffect(() => {
    if (!isTypingComplete) return;

    const timeout = setTimeout(() => {
      setIsFadingOut(true);

      // After fade out completes, switch to next caption
      setTimeout(() => {
        setCurrentCaptionIndex((prevIndex) => (prevIndex + 1) % captions.length);
      }, 500); // Wait for fade out animation
    }, 3000); // Wait 3 seconds after typing completes before fading out

    return () => clearTimeout(timeout);
  }, [isTypingComplete]);

  return (
    <>
      <section
        id="home"
        className="relative z-10 overflow-hidden bg-white pb-8 pt-[100px] dark:bg-gray-dark md:pb-16 md:pt-[120px] xl:pb-20 xl:pt-[140px] 2xl:pb-24 2xl:pt-[160px]"
      >
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-20 dark:opacity-10"
        >
          <source src="/herovid.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 z-0 bg-black/30 dark:bg-black/50" />

        <div className="container relative z-10">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[800px] text-center">
                <h1 className="notranslate mb-5 flex min-h-[120px] items-end justify-center text-3xl font-bold leading-tight text-black dark:text-white sm:min-h-[140px] sm:text-4xl sm:leading-tight md:min-h-[160px] md:text-5xl md:leading-tight">
                  <span className={`inline-block ${
                    isFadingOut ? 'opacity-0 transition-opacity duration-500' : ''
                  }`}>
                    {typedText}
                    <span className="animate-pulse">|</span>
                  </span>
                </h1>
                <p className="mb-12 text-base leading-relaxed! text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
                Join the ranks of savvy entrepreneurs and seize the chance to turn vacant properties into thriving income streams.
                </p>
                <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                  <Link
                    href="/signup"
                    className="rounded-full bg-primary px-10 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/about"
                    className="inline-block rounded-full bg-black px-10 py-4 text-base font-semibold text-white duration-300 ease-in-out hover:bg-black/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/5"
                  >
                    About Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
