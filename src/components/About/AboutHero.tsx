"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const AboutHero = () => {
  const [isVisible, setIsVisible] = useState({
    header: false,
    whyUs: false,
    image: false,
  });

  const headerRef = useRef<HTMLDivElement>(null);
  const whyUsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "-50px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === headerRef.current) {
          setIsVisible((prev) => ({ ...prev, header: entry.isIntersecting }));
        }
        if (entry.target === whyUsRef.current) {
          setIsVisible((prev) => ({ ...prev, whyUs: entry.isIntersecting }));
        }
        if (entry.target === imageRef.current) {
          setIsVisible((prev) => ({ ...prev, image: entry.isIntersecting }));
        }
      });
    }, observerOptions);

    if (headerRef.current) observer.observe(headerRef.current);
    if (whyUsRef.current) observer.observe(whyUsRef.current);
    if (imageRef.current) observer.observe(imageRef.current);

    return () => {
      if (headerRef.current) observer.unobserve(headerRef.current);
      if (whyUsRef.current) observer.unobserve(whyUsRef.current);
      if (imageRef.current) observer.unobserve(imageRef.current);
    };
  }, []);

  return (
    <section className="bg-white pt-[120px] pb-16 dark:bg-gray-dark md:pt-[140px] md:pb-20 lg:pt-[160px] lg:pb-28">
      <div className="container">
        {/* Top Section - Centered Heading and Description */}
        <div
          ref={headerRef}
          className={`mx-auto mb-16 max-w-[900px] text-center transition-all duration-1000 delay-[500ms] ${
            isVisible.header
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <h1 className="mb-6 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[45px]">
            About ALVARADO Associates
          </h1>
          <p className="text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg md:text-xl">
            With a mission to empower investors and unlock the full potential of short-term rentals, we offer a comprehensive platform designed to streamline the process of property acquisition, management, and revenue optimization.
          </p>
        </div>

        {/* Why Us Section */}
        <div
          ref={whyUsRef}
          className={`mx-auto mb-16 max-w-[1100px] text-center transition-all duration-1000 delay-[500ms] ${
            isVisible.whyUs
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <p className="mb-4 text-sm uppercase tracking-wider text-body-color dark:text-body-color-dark">
            Why Us?
          </p>
          <h2 className="mb-8 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl md:text-[42px]">
            What is Airbnb Arbitrage and why is Airbnb Arbitrage a{" "}
            <span className="text-red-600">Gold Mine</span>, you ask?
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-body-color dark:text-body-color-dark sm:text-lg">
            <p>
              The greatest advantage lies in the fact that you can profit from property without having to purchase it. No hefty deposits or mortgages are necessary to begin! We're accustomed to the concept of major corporations managing assets rather than possessing them outright, resulting in highly lucrative enterprises.
            </p>
            <p>
              Consider Uber, the leading taxi service globally, which doesn't own any vehicles. Or Facebook, the most prominent social media platform, which generates no content of its own. Similarly, Airbnb, the largest accommodation provider worldwide, doesn't own any real estate.
            </p>
            <p>
              This strategy operates on the principle of control rather than ownership.
            </p>
          </div>
        </div>

        {/* Property Image */}
        <div
          ref={imageRef}
          className={`mx-auto max-w-[1200px] transition-all duration-1000 delay-[500ms] ${
            isVisible.image
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src="/images/about/about-hero.jpg"
              alt="Modern luxury property"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
