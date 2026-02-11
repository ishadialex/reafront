"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { TeamMember } from "@/types/team";

interface TeamProps {
  members: TeamMember[];
}

const Team = ({ members }: TeamProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [desktopIndex, setDesktopIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  if (members.length === 0) return null;

  // Auto-slide for mobile carousel
  useEffect(() => {
    if (members.length > 1) {
      const interval = setInterval(() => {
        setIsFading(true);
        setTimeout(() => {
          setCurrentIndex((prev) =>
            prev === members.length - 1 ? 0 : prev + 1
          );
          setIsFading(false);
        }, 500);
      }, 5000); // 5 seconds between slides

      return () => clearInterval(interval);
    }
  }, [members.length]);

  // Auto-slide for desktop carousel
  useEffect(() => {
    if (members.length > 3) {
      const interval = setInterval(() => {
        setDesktopIndex((prev) => prev + 1);
      }, 2500); // 2.5 seconds between slides

      return () => clearInterval(interval);
    }
  }, [members.length]);

  // Handle infinite loop reset
  useEffect(() => {
    if (desktopIndex === members.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setDesktopIndex(0);
        setTimeout(() => {
          setIsTransitioning(true);
        }, 50);
      }, 2000); // Wait for transition to complete
    }
  }, [desktopIndex, members.length]);

  const nextMember = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === members.length - 1 ? 0 : prev + 1
      );
      setIsFading(false);
    }, 500);
  };

  const prevMember = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? members.length - 1 : prev - 1
      );
      setIsFading(false);
    }, 500);
  };

  // Desktop carousel navigation
  const nextDesktop = () => {
    setDesktopIndex((prev) => prev + 1);
  };

  const prevDesktop = () => {
    if (desktopIndex === 0) {
      setIsTransitioning(false);
      setDesktopIndex(members.length);
      setTimeout(() => {
        setIsTransitioning(true);
        setDesktopIndex(members.length - 1);
      }, 50);
    } else {
      setDesktopIndex((prev) => prev - 1);
    }
  };

  // Get visible members for desktop (max 3)
  const getVisibleDesktopMembers = () => {
    const visible = [];
    const maxVisible = Math.min(3, members.length);
    for (let i = 0; i < maxVisible; i++) {
      const index = (desktopIndex + i) % members.length;
      visible.push(members[index]);
    }
    return visible;
  };

  const visibleDesktopMembers = getVisibleDesktopMembers();

  const TeamMemberCard = ({ member, priority }: { member: TeamMember; priority?: boolean }) => (
    <div className="group w-full max-w-[330px] h-[489px] rounded-lg bg-black p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(74,108,247,0.6)] dark:bg-gray-900 cursor-pointer md:p-8">
      {/* Profile Image */}
      <div className="mb-8 flex justify-center">
        <div className="relative h-48 w-48 overflow-hidden rounded-full bg-white transition-transform duration-300 group-hover:scale-110">
          <Image
            src={member.image}
            alt={member.name}
            fill
            className="object-cover"
            sizes="192px"
            priority={priority}
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
  );

  return (
    <section className="relative bg-gray-2 py-8 dark:bg-bg-color-dark md:py-10 lg:py-12">
      <div className="container">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-[600px] text-center md:mb-16 lg:mb-20">
          <h2 className="mb-4 text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl sm:leading-tight md:text-[45px] md:leading-tight">
            Our Team of
            <br />
            Experts
          </h2>
        </div>

        {/* Mobile Carousel View */}
        <div className="relative px-4 md:hidden">
          <div
            className={`flex justify-center transition-opacity duration-[2000ms] ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <TeamMemberCard member={members[currentIndex]} priority />
          </div>

          {/* Navigation Arrows - Top Left & Bottom Right */}
          {members.length > 1 && (
            <>
              <button
                onClick={prevMember}
                className="absolute left-0 top-0 z-10 -translate-y-10 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Previous member"
              >
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextMember}
                className="absolute bottom-0 right-0 z-10 translate-y-2 rounded-full bg-white p-2.5 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Next member"
              >
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {members.length > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {members.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsFading(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsFading(false);
                    }, 500);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                  aria-label={`Go to member ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop Carousel View */}
        <div className="relative hidden md:block">
          <div className="mx-auto overflow-hidden py-8" style={{ maxWidth: 'calc(3 * 330px + 2 * 32px + 80px)' }}>
            <div
              className="flex gap-8 px-10"
              style={{
                transform: `translateX(-${desktopIndex * (330 + 32)}px)`,
                transition: isTransitioning ? 'transform 2000ms ease-in-out' : 'none',
              }}
            >
              {[...members, ...members.slice(0, 3)].map((member, index) => (
                <div key={index} className="flex-shrink-0" style={{ width: '330px' }}>
                  <TeamMemberCard member={member} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows for Desktop */}
          {members.length > 3 && (
            <>
              <button
                onClick={prevDesktop}
                className="absolute left-0 top-1/2 z-10 -translate-x-4 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Previous members"
              >
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextDesktop}
                className="absolute right-0 top-1/2 z-10 translate-x-4 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Next members"
              >
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Team;
