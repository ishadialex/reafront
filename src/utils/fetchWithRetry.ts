/**
 * Fetch utilities with timeout and retry support for handling MongoDB connection errors
 * and other transient backend failures.
 */

// Timeout configuration (in milliseconds)
const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2; // Number of retry attempts

/**
 * Extended fetch options that support both standard RequestInit and Next.js-specific options
 */
type FetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

/**
 * Fetch with timeout support
 * @param url - URL to fetch
 * @param options - Fetch options (can include Next.js specific options like 'next')
 * @param timeout - Timeout in milliseconds (default: 10000ms)
 * @returns Promise<Response>
 * @throws Error if request times out or fails
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
  timeout: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic for transient failures (5xx errors, timeouts, network errors)
 * Uses exponential backoff strategy: 1s, 2s between retries (with MAX_RETRIES = 2)
 * 
 * @param url - URL to fetch
 * @param options - Fetch options (can include Next.js specific options like 'next')
 * @param retries - Number of retry attempts (default: 2)
 * @returns Promise<Response>
 * @throws Error if all retries fail
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // If we get a 5xx error and have retries left, try again
      if (
        response.status >= 500 &&
        response.status < 600 &&
        attempt < retries
      ) {
        console.warn(
          `Server error (${response.status}) on attempt ${attempt + 1}, retrying...`
        );
        // Exponential backoff: wait 1s, then 2s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }

      return response;
    } catch (error: any) {
      lastError = error;

      // If it's a timeout or network error and we have retries left, try again
      if (attempt < retries) {
        console.warn(
          `Request failed on attempt ${attempt + 1}:`,
          error.message
        );
        // Exponential backoff: wait 1s, then 2s
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
    }
  }

  throw lastError || new Error("Request failed after all retries");
}
