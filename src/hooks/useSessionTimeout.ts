import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function useSessionTimeout(isAuthPage: boolean = false) {
  const router = useRouter();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutMinutes = useRef<number>(30); // Default 30 minutes
  const isActive = useRef<boolean>(true);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const warningLockedRef = useRef<boolean>(false); // Lock to prevent resets during warning
  const THROTTLE_INTERVAL = 30000; // Only reset timer once every 30 seconds

  // Track authentication state to re-run effect when user logs in/out
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Monitor authentication changes
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      // Tokens are in httpOnly cookies, just check the login flag
      const authenticated = isLoggedIn === 'true';
      setIsAuthenticated(authenticated);
    };

    // Check immediately
    checkAuth();

    // Set up interval to check periodically (every 2 seconds)
    const authCheckInterval = setInterval(checkAuth, 2000);

    return () => clearInterval(authCheckInterval);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data and redirect (tokens are cleared by server via httpOnly cookies)
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userProfilePicture');
      localStorage.removeItem('user');
      router.push('/signin?reason=session_timeout');
    }
  }, [router]);

  const startCountdown = useCallback(() => {
    setRemainingSeconds(60);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetTimerFunc = useCallback(() => {
    console.log('🔄 resetTimerFunc called');
    // Clear existing timeouts
    if (timeoutIdRef.current) {
      console.log('🧹 Clearing existing logout timeout');
      clearTimeout(timeoutIdRef.current);
    }
    if (warningTimeoutIdRef.current) {
      console.log('🧹 Clearing existing warning timeout');
      clearTimeout(warningTimeoutIdRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Hide warning if shown and unlock
    setShowWarning(false);
    warningLockedRef.current = false;
    console.log('🔓 Warning unlocked, showWarning set to false');

    // Don't set timeout if session timeout is disabled (0)
    if (sessionTimeoutMinutes.current === 0) {
      console.log('⏱️ Session timeout is disabled (0 minutes)');
      return;
    }

    const timeoutMinutes = sessionTimeoutMinutes.current;
    console.log(`⏱️ Setting up timeout for ${timeoutMinutes} minutes`);

    // Show warning 1 minute before logout
    const warningTimeMs = Math.max(0, (timeoutMinutes - 1) * 60 * 1000);
    if (warningTimeMs > 0) {
      console.log(`⚠️ Warning will show in ${(timeoutMinutes - 1)} minutes (${warningTimeMs}ms)`);
      console.log(`⚠️ Warning timeout ID will be set, firing at: ${new Date(Date.now() + warningTimeMs).toLocaleTimeString()}`);
      warningTimeoutIdRef.current = setTimeout(() => {
        console.log('🔔 WARNING TIMEOUT FIRED!');
        console.log('🔍 State check - isActive:', isActive.current, '| warningLocked:', warningLockedRef.current);
        if (isActive.current) {
          console.log('⚠️ Session timeout warning - 1 minute remaining - SHOWING WARNING NOW');
          warningLockedRef.current = true; // Lock to prevent resets
          setShowWarning(true);
          startCountdown();
        } else {
          console.error('❌ WARNING BLOCKED: isActive.current is false!');
        }
      }, warningTimeMs);
      console.log('✅ Warning timeout set with ID:', warningTimeoutIdRef.current);
    } else {
      console.log('⚠️ Timeout too short for warning - showing warning immediately');
      warningLockedRef.current = true; // Lock to prevent resets
      setShowWarning(true);
      startCountdown();
    }

    // Set logout timeout
    const timeoutMs = timeoutMinutes * 60 * 1000;
    console.log(`🚪 Auto-logout will occur in ${timeoutMinutes} minutes (${timeoutMs}ms)`);
    timeoutIdRef.current = setTimeout(() => {
      if (isActive.current) {
        console.log('⏰ Session timeout - logging out...');
        logout();
      }
    }, timeoutMs);
  }, [logout, startCountdown]);

  const continueSession = useCallback(() => {
    console.log('✅ User clicked Continue Session - resetting timer');
    warningLockedRef.current = false; // Unlock
    setShowWarning(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    lastActivityTimeRef.current = Date.now(); // Reset throttle
    resetTimerFunc();
  }, [resetTimerFunc]);

  const handleActivity = useCallback(() => {
    // Don't reset timer if warning is locked (prevents race conditions)
    if (warningLockedRef.current) {
      return; // Silently ignore - no console spam
    }

    // Throttle activity tracking - only reset timer once every 30 seconds
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTimeRef.current;

    if (timeSinceLastActivity >= THROTTLE_INTERVAL) {
      console.log('👆 User activity detected - resetting timer (throttled)');
      lastActivityTimeRef.current = now;
      resetTimerFunc();
    }
  }, [resetTimerFunc]);

  useEffect(() => {
    console.log('🚀 useSessionTimeout hook mounted/re-rendered');
    console.log('🔐 Authentication status:', isAuthenticated);
    console.log('📄 Is auth page:', isAuthPage);

    // Skip session timeout completely on auth pages (signin, signup, etc.)
    if (isAuthPage) {
      console.log('⏭️ On auth page, skipping session timeout setup completely');
      // Clear any existing timers
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    if (!isAuthenticated) {
      console.log('⏭️ User not authenticated, skipping session timeout setup');
      // Clear any existing timers when user logs out
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setShowWarning(false);
      return;
    }

    // Set component as active when effect runs
    isActive.current = true;
    console.log('✅ isActive.current set to true');

    // Fetch user's session timeout preference
    const fetchSessionTimeout = async () => {
      console.log('📡 Fetching session timeout settings...');
      try {
        const result = await api.getSettings();
        console.log('📦 Settings received:', result);

        if (result.success && result.data) {
          sessionTimeoutMinutes.current = result.data.sessionTimeout || 30;
          console.log('🔧 Session timeout loaded:', sessionTimeoutMinutes.current, 'minutes');
          console.log('🔍 Current state - isActive:', isActive.current, '| showWarning:', showWarning);

          // Start the timer with the user's preference
          if (sessionTimeoutMinutes.current > 0) {
            console.log('⏱️ Starting session timeout timer...');
            resetTimerFunc();
          } else {
            console.log('⏱️ Session timeout disabled (set to 0)');
          }
        } else {
          console.warn('⚠️ Settings fetch unsuccessful:', result);
        }
      } catch (error) {
        console.error('❌ Failed to fetch session timeout:', error);
        // Don't set up timer on error to prevent issues on signin page
        console.log('⚠️ Skipping timer setup due to error');
      }
    };

    fetchSessionTimeout();

    // Listen for settings updates (from Settings page)
    const handleSettingsUpdate = (event: CustomEvent) => {
      console.log('🔄 Settings updated event received:', event.detail);
      if (event.detail?.sessionTimeout !== undefined) {
        const newTimeout = event.detail.sessionTimeout;
        console.log(`⚡ Updating session timeout to ${newTimeout} minutes`);
        sessionTimeoutMinutes.current = newTimeout;

        // Clear existing timers and restart with new value
        if (newTimeout === 0) {
          // Disable timeout
          if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
          if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setShowWarning(false);
          console.log('⏱️ Session timeout disabled');
        } else {
          // Restart timer with new value
          resetTimerFunc();
          console.log('✅ Session timeout updated to', newTimeout, 'minutes');
        }
      }
    };

    window.addEventListener('sessionTimeoutUpdated', handleSettingsUpdate as EventListener);
    fetchSessionTimeout();

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for user activity
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      console.log('🧹 useSessionTimeout cleanup running');
      console.log('🔍 Timers being cleared - warning:', warningTimeoutIdRef.current, '| logout:', timeoutIdRef.current);
      isActive.current = false;
      console.log('❌ isActive.current set to false');
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
        console.log('⚠️ Warning timeout cleared during cleanup');
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('sessionTimeoutUpdated', handleSettingsUpdate as EventListener);
      console.log('🧹 Cleanup complete');
    };
  }, [handleActivity, resetTimerFunc, isAuthenticated, isAuthPage]);

  // Return a function to update timeout when settings change
  const updateSessionTimeout = useCallback((minutes: number) => {
    sessionTimeoutMinutes.current = minutes;

    if (minutes === 0) {
      // Disable timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
      }
      setShowWarning(false);
    } else {
      // Reset timer with new value
      resetTimerFunc();
    }
  }, [resetTimerFunc]);

  return {
    updateSessionTimeout,
    showWarning,
    remainingSeconds,
    continueSession,
  };
}
