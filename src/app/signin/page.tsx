"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import axios from "axios";
import { api } from "@/lib/api";

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [sessionTimeoutWarning, setSessionTimeoutWarning] = useState(false);
  const [showExistingSessionModal, setShowExistingSessionModal] = useState(false);
  const [existingSessionData, setExistingSessionData] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Check for session timeout, revocation, or account deletion
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_timeout' || reason === 'session_revoked' || reason === 'account_deleted') {
      setSessionTimeoutWarning(true);
      setTimeout(() => setSessionTimeoutWarning(false), 10000);
    }
  }, [searchParams]);

  const storeSessionAndRedirect = (data: { user: any; accessToken: string; refreshToken: string }) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("user", JSON.stringify(data.user));
    api.setToken(data.accessToken);
    router.push("/dashboard");
  };

  const handleForceLogin = async () => {
    setIsLoading(true);
    setShowExistingSessionModal(false);
    try {
      const response = await axios.post(`${API_URL}/api/auth/force-login`, { email, password });
      if (response.data.success) {
        storeSessionAndRedirect(response.data.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setRequiresVerification(false);

    setIsLoading(true);

    try {
      // Call backend login API using axios
      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password }
      );

      if (response.data.success) {
        storeSessionAndRedirect(response.data.data);
      } else {
        setError("Login failed. Please try again.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login error:", err);

      // Active session on another device - show warning modal
      if (err.response?.status === 409 && err.response?.data?.requiresForceLogin) {
        setExistingSessionData(err.response.data);
        setShowExistingSessionModal(true);
        setIsLoading(false);
        return;
      }

      // Check if email verification is required
      if (err.response?.data?.requiresVerification) {
        setRequiresVerification(true);
        setUnverifiedEmail(err.response.data.email || email);
        setError(err.response.data.message);
      } else {
        const errorMessage =
          err.response?.data?.message || "Invalid email or password. Please try again.";
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };
  const formatLastActive = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <>
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}

      {/* Existing Session Warning Modal */}
      {showExistingSessionModal && existingSessionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark w-full max-w-md rounded-xl shadow-2xl p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-black dark:text-white">Already Logged In</h3>
                <p className="text-sm text-body-color">Active session detected on another device</p>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-body-color">Current Active Session</p>
              <div className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <svg className="h-4 w-4 text-body-color shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{existingSessionData.existingSession.device} · {existingSessionData.existingSession.browser}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark dark:text-white">
                <svg className="h-4 w-4 text-body-color shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{existingSessionData.existingSession.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-body-color">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Last active: {formatLastActive(existingSessionData.existingSession.lastActive)}</span>
              </div>
            </div>

            <p className="mb-6 text-sm text-body-color">
              Continuing will log out the other device immediately. Only one active session is allowed at a time.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowExistingSessionModal(false); setIsLoading(false); }}
                className="flex-1 rounded-xs border border-stroke bg-transparent px-6 py-3 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleForceLogin}
                className="flex-1 rounded-xs bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                Continue on This Device
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="shadow-three dark:bg-dark mx-auto max-w-[500px] rounded-sm bg-white px-6 py-10 sm:p-[60px]">
                <h3 className="mb-3 text-center text-2xl font-bold text-black sm:text-3xl dark:text-white">
                  Sign in to your account
                </h3>
                <p className="text-body-color mb-11 text-center text-base font-medium">
                  Login to your account for a faster checkout.
                </p>

                {/* Session Timeout / Revoked Warning */}
                {sessionTimeoutWarning && (
                  <div className="mb-6 rounded-lg bg-yellow-100 p-4 dark:bg-yellow-900/30">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {searchParams.get('reason') === 'session_revoked'
                          ? 'You were logged out because someone signed in from another device.'
                          : searchParams.get('reason') === 'account_deleted'
                          ? 'Your account has been deactivated. Contact support to restore access.'
                          : 'Your session expired due to inactivity. Please sign in again.'}
                      </p>
                    </div>
                  </div>
                )}

                <button className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary mb-6 flex w-full items-center justify-center rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:hover:shadow-none">
                  <span className="mr-3">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_95:967)">
                        <path
                          d="M20.0001 10.2216C20.0122 9.53416 19.9397 8.84776 19.7844 8.17725H10.2042V11.8883H15.8277C15.7211 12.539 15.4814 13.1618 15.1229 13.7194C14.7644 14.2769 14.2946 14.7577 13.7416 15.1327L13.722 15.257L16.7512 17.5567L16.961 17.5772C18.8883 15.8328 19.9997 13.266 19.9997 10.2216"
                          fill="#4285F4"
                        />
                        <path
                          d="M10.2042 20.0001C12.9592 20.0001 15.2721 19.1111 16.9616 17.5778L13.7416 15.1332C12.88 15.7223 11.7235 16.1334 10.2042 16.1334C8.91385 16.126 7.65863 15.7206 6.61663 14.9747C5.57464 14.2287 4.79879 13.1802 4.39915 11.9778L4.27957 11.9878L1.12973 14.3766L1.08856 14.4888C1.93689 16.1457 3.23879 17.5387 4.84869 18.512C6.45859 19.4852 8.31301 20.0005 10.2046 20.0001"
                          fill="#34A853"
                        />
                        <path
                          d="M4.39911 11.9777C4.17592 11.3411 4.06075 10.673 4.05819 9.99996C4.0623 9.32799 4.17322 8.66075 4.38696 8.02225L4.38127 7.88968L1.19282 5.4624L1.08852 5.51101C0.372885 6.90343 0.00012207 8.4408 0.00012207 9.99987C0.00012207 11.5589 0.372885 13.0963 1.08852 14.4887L4.39911 11.9777Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M10.2042 3.86663C11.6663 3.84438 13.0804 4.37803 14.1498 5.35558L17.0296 2.59996C15.1826 0.901848 12.7366 -0.0298855 10.2042 -3.6784e-05C8.3126 -0.000477834 6.45819 0.514732 4.8483 1.48798C3.2384 2.46124 1.93649 3.85416 1.08813 5.51101L4.38775 8.02225C4.79132 6.82005 5.56974 5.77231 6.61327 5.02675C7.6568 4.28118 8.91279 3.87541 10.2042 3.86663Z"
                          fill="#EB4335"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_95:967">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </span>
                  Sign in with Google
                </button>

                {/* <button className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color hover:border-primary hover:bg-primary/5 hover:text-primary dark:hover:border-primary dark:hover:bg-primary/5 dark:hover:text-primary mb-6 flex w-full items-center justify-center rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:hover:shadow-none">
                  <span className="mr-3">
                    <svg
                      fill="currentColor"
                      width="22"
                      height="22"
                      viewBox="0 0 64 64"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M32 1.7998C15 1.7998 1 15.5998 1 32.7998C1 46.3998 9.9 57.9998 22.3 62.1998C23.9 62.4998 24.4 61.4998 24.4 60.7998C24.4 60.0998 24.4 58.0998 24.3 55.3998C15.7 57.3998 13.9 51.1998 13.9 51.1998C12.5 47.6998 10.4 46.6998 10.4 46.6998C7.6 44.6998 10.5 44.6998 10.5 44.6998C13.6 44.7998 15.3 47.8998 15.3 47.8998C18 52.6998 22.6 51.2998 24.3 50.3998C24.6 48.3998 25.4 46.9998 26.3 46.1998C19.5 45.4998 12.2 42.7998 12.2 30.9998C12.2 27.5998 13.5 24.8998 15.4 22.7998C15.1 22.0998 14 18.8998 15.7 14.5998C15.7 14.5998 18.4 13.7998 24.3 17.7998C26.8 17.0998 29.4 16.6998 32.1 16.6998C34.8 16.6998 37.5 16.9998 39.9 17.7998C45.8 13.8998 48.4 14.5998 48.4 14.5998C50.1 18.7998 49.1 22.0998 48.7 22.7998C50.7 24.8998 51.9 27.6998 51.9 30.9998C51.9 42.7998 44.6 45.4998 37.8 46.1998C38.9 47.1998 39.9 49.1998 39.9 51.9998C39.9 56.1998 39.8 59.4998 39.8 60.4998C39.8 61.2998 40.4 62.1998 41.9 61.8998C54.1 57.7998 63 46.2998 63 32.5998C62.9 15.5998 49 1.7998 32 1.7998Z" />
                    </svg>
                  </span>
                  Sign in with Github
                </button> */}
                <div className="mb-8 flex items-center justify-center">
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[70px] sm:block"></span>
                  <p className="text-body-color w-full px-5 text-center text-base font-medium">
                    Or, sign in with your email
                  </p>
                  <span className="bg-body-color/50 hidden h-[1px] w-full max-w-[70px] sm:block"></span>
                </div>
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className={`mb-6 rounded-lg p-4 text-sm ${requiresVerification ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      <p className="mb-3">{error}</p>
                      {requiresVerification && (
                        <button
                          type="button"
                          onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(unverifiedEmail)}`)}
                          className="mt-2 w-full rounded-sm bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 transition-all duration-300"
                        >
                          Verify Email Now
                        </button>
                      )}
                    </div>
                  )}
                  <div className="mb-8">
                    <label
                      htmlFor="email"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your Email"
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>
                  <div className="mb-8">
                    <label
                      htmlFor="password"
                      className="text-dark mb-3 block text-sm dark:text-white"
                    >
                      Your Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your Password"
                      required
                      className="border-stroke dark:text-body-color-dark dark:shadow-two text-body-color focus:border-primary dark:focus:border-primary w-full rounded-xs border bg-[#f8f8f8] px-6 py-3 text-base outline-hidden transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:focus:shadow-none"
                    />
                  </div>

                  <div className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center">
                    <div className="mb-4 sm:mb-0">
                      <label
                        htmlFor="checkboxLabel"
                        className="text-body-color flex cursor-pointer items-center text-sm font-medium select-none"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="checkboxLabel"
                            className="sr-only"
                          />
                          <div className="box border-body-color/20 mr-4 flex h-5 w-5 items-center justify-center rounded-sm border dark:border-white/10">
                            <span className="opacity-0">
                              <svg
                                width="11"
                                height="8"
                                viewBox="0 0 11 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                                  fill="#3056D3"
                                  stroke="#3056D3"
                                  strokeWidth="0.4"
                                />
                              </svg>
                            </span>
                          </div>
                        </div>
                        Keep me signed in
                      </label>
                    </div>
                    <div>
                      <Link
                        href="/forgot-password"
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                  </div>
                  <div className="mb-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="shadow-submit dark:shadow-submit-dark bg-primary hover:bg-primary/90 flex w-full items-center justify-center rounded-xs px-9 py-4 text-base font-medium text-white duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </div>

                  {/* Demo credentials info */}
                  <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-900/20">
                    <p className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
                      Demo Credentials:
                    </p>
                    <p className="text-blue-800 dark:text-blue-400">
                      Email: demo@alvarado.com
                    </p>
                    <p className="text-blue-800 dark:text-blue-400">
                      Password: Demo1234!
                    </p>
                  </div>
                </form>
                <p className="text-body-color text-center text-base font-medium">
                  Don’t you have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 z-[-1]">
          <svg
            width="1440"
            height="969"
            viewBox="0 0 1440 969"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <mask
              id="mask0_95:1005"
              style={{ maskType: "alpha" }}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="1440"
              height="969"
            >
              <rect width="1440" height="969" fill="#090E34" />
            </mask>
            <g mask="url(#mask0_95:1005)">
              <path
                opacity="0.1"
                d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
                fill="url(#paint0_linear_95:1005)"
              />
              <path
                opacity="0.1"
                d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
                fill="url(#paint1_linear_95:1005)"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_95:1005"
                x1="1178.4"
                y1="151.853"
                x2="780.959"
                y2="453.581"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_95:1005"
                x1="160.5"
                y1="220"
                x2="1099.45"
                y2="1192.04"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>
    </>
  );
}

const SigninPage = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SigninContent />
    </Suspense>
  );
};

export default SigninPage;
