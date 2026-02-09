"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { TeamMember } from "@/types/team";

interface TeamProps {
  members: TeamMember[];
}

const Team = ({ members }: TeamProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const autoScrollInterval = 2000; // 2 seconds
  const totalMembers = members.length;

  if (totalMembers === 0) return null;

  // Update items per slide based on screen size
  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth < 768) {
        setItemsPerSlide(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setItemsPerSlide(2); // Tablet: 2 cards
      } else {
        setItemsPerSlide(3); // Desktop: 3 cards
      }
    };

    // Set initial value
    updateItemsPerSlide();

    // Add resize listener
    window.addEventListener('resize', updateItemsPerSlide);

    // Cleanup
    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, []);

  // Scroll one card at a time to the right
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalMembers);
  };

  // Scroll one card at a time to the left
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalMembers) % totalMembers);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Get 3 consecutive members starting from currentSlide (with wrapping)
  const getVisibleMembers = () => {
    const visibleList = [];
    for (let i = 0; i < itemsPerSlide; i++) {
      const index = (currentSlide + i) % totalMembers;
      visibleList.push(members[index]);
    }
    return visibleList;
  };

  const visibleMembers = getVisibleMembers();
  const totalSlides = totalMembers; // Now each slide represents one position

  // Auto-scroll functionality
  useEffect(() => {
    if (!isPaused && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, autoScrollInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, currentSlide]);

  // Pause auto-scroll on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <section className="relative bg-gray-2 py-10 dark:bg-bg-color-dark md:py-12 lg:py-16">
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate3d(50px, 0, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        .carousel-container {
          contain: layout style paint;
          transform: translateZ(0);
        }
      `}</style>
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[600px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            Our Team of
            <br />
            Experts
          </h2>
        </div>

        {/* Team Carousel */}
        <div
          className="carousel-container relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:bg-gray-100 dark:bg-gray-dark dark:hover:bg-gray-800 lg:-translate-x-4"
                aria-label="Previous slide"
              >
                <svg
                  className="h-6 w-6 text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:bg-gray-100 dark:bg-gray-dark dark:hover:bg-gray-800 lg:translate-x-4"
                aria-label="Next slide"
              >
                <svg
                  className="h-6 w-6 text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Team Cards - Responsive: 1 card on mobile, 2 on tablet, 3 on desktop */}
          <div className="flex justify-center gap-4 md:gap-6" style={{ minHeight: '540px' }}>
            {visibleMembers.map((member, index) => (
              <div
                key={`${member.name}-${index}`}
                className="group w-full max-w-[330px] h-[489px] rounded-lg bg-black p-6 shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:border-2 hover:border-primary dark:bg-gray-900 animate-slideIn cursor-pointer md:p-8"
                style={{ willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
              >
                {/* Profile Image */}
                <div className="mb-8 flex justify-center">
                  <div className="relative h-48 w-48 overflow-hidden rounded-full bg-white transition-transform duration-300 group-hover:scale-110" style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="192px"
                      priority={index === 0}
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="mb-3 text-center text-2xl font-bold text-white transition-colors duration-300 group-hover:text-primary">
                  {member.name}
                </h3>

                {/* Role */}
                <p className="mb-6 text-center text-sm italic text-gray-300 transition-colors duration-300 group-hover:text-gray-100">
                  {member.role}
                </p>

                {/* Instagram Link */}
                {member.instagram && (
                  <div className="flex justify-center">
                    <a
                      href={member.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-all duration-300 hover:bg-gray-100"
                      aria-label={`${member.name} Instagram`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Dots - Shows current position in carousel */}
          {totalSlides > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "w-6 bg-black dark:bg-white"
                      : "bg-gray-400 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-400"
                  }`}
                  aria-label={`Go to position ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Team;
