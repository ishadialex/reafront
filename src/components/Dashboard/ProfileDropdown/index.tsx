"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

const getImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}${path}`;
};

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await api.getProfile();
        if (result.success && result.data) {
          const fullName = `${result.data.firstName} ${result.data.lastName}`;
          setUserName(fullName);
          setUserEmail(result.data.email);
          setProfilePhoto(result.data.profilePhoto);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Fallback to localStorage if API fails
        const storedEmail = localStorage.getItem("userEmail");
        if (storedEmail) setUserEmail(storedEmail);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();

    // Listen for profile photo updates
    const handlePhotoUpdate = (event: any) => {
      setProfilePhoto(event.detail.profilePhoto);
    };

    // Listen for full profile updates
    const handleProfileUpdate = (event: any) => {
      const profile = event.detail.profile;
      setUserName(`${profile.firstName} ${profile.lastName}`);
      setUserEmail(profile.email);
      setProfilePhoto(profile.profilePhoto);
    };

    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    // Clear all auth data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    api.clearToken();
    router.push("/signin");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-white">
          {loadingProfile ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-primary/50" />
          ) : getImageUrl(profilePhoto) ? (
            <Image
              src={getImageUrl(profilePhoto)!}
              alt={userName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name - Hidden on mobile */}
        {loadingProfile ? (
          <div className="hidden h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700 lg:block" />
        ) : (
          <span className="hidden text-sm font-medium text-black dark:text-white lg:block">
            {userName.split(" ")[0]}
          </span>
        )}

        {/* Dropdown Icon */}
        <svg
          className={`hidden h-4 w-4 text-black transition-transform dark:text-white lg:block ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-dark">
          {/* User Info Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-5 dark:from-primary/10 dark:to-primary/20">
            <h3 className="mb-1 text-base font-semibold text-black dark:text-white">
              {userName}
            </h3>
            <p className="text-sm text-body-color dark:text-body-color-dark">
              {userEmail}
            </p>
          </div>

          {/* Menu Items */}
          <div className="p-3">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/profile");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/settings");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Account settings
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/support");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-black transition-all hover:bg-gray-100 hover:pl-5 dark:text-white dark:hover:bg-gray-800"
            >
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Support
            </button>
          </div>

          {/* Sign Out */}
          <div className="bg-gray-50 p-3 dark:bg-black/20">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:pl-5 dark:hover:bg-red-900/20"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
