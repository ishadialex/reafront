// For server-side fetches, use direct backend URL (not the rewrite proxy)
const API_URL = process.env.BACKEND_URL || "http://localhost:4001";

// Timeout configuration (in milliseconds)
const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2; // Number of retry attempts

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(url: string, options: any = {}, timeout: number = FETCH_TIMEOUT): Promise<Response> {
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
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Fetch with retry logic for transient failures
 */
async function fetchWithRetry(
  url: string,
  options: any = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // If we get a 5xx error and have retries left, try again
      if (response.status >= 500 && response.status < 600 && attempt < retries) {
        console.warn(`Server error (${response.status}) on attempt ${attempt + 1}, retrying...`);
        // Exponential backoff: wait 1s, then 2s, then 4s, etc.
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      
      // If it's a timeout or network error and we have retries left, try again
      if (attempt < retries) {
        console.warn(`Request failed on attempt ${attempt + 1}:`, error.message);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

// Fallback mock data for team members
const mockTeamMembers = [
  {
    id: 1,
    name: "John Alvarado",
    role: "CEO & Founder",
    image: "/images/team/member-1.jpg",
    instagram: "https://instagram.com",
  },
  {
    id: 2,
    name: "Sarah Martinez",
    role: "Chief Investment Officer",
    image: "/images/team/member-2.jpg",
    instagram: "https://instagram.com",
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Head of Property Management",
    image: "/images/team/member-3.jpg",
    instagram: "https://instagram.com",
  },
  {
    id: 4,
    name: "Emma Williams",
    role: "Financial Analyst",
    image: "/images/team/member-4.jpg",
    instagram: "https://instagram.com",
  },
];

// Fallback mock data for testimonials
const mockTestimonials = [
  {
    id: 1,
    name: "David Thompson",
    designation: "Real Estate Investor",
    content: "Alvarado Associates has transformed the way I invest in real estate. The platform is intuitive, and the returns have exceeded my expectations. Highly recommended!",
    image: "/images/testimonials/auth-01.png",
    star: 5,
  },
  {
    id: 2,
    name: "Lisa Anderson",
    designation: "Business Owner",
    content: "I've been investing with Alvarado Associates for over a year now. The transparency and professional management give me complete peace of mind.",
    image: "/images/testimonials/auth-02.png",
    star: 5,
  },
  {
    id: 3,
    name: "James Rodriguez",
    designation: "Portfolio Manager",
    content: "The fractional ownership model is brilliant. I can now diversify my real estate portfolio without tying up massive amounts of capital. Excellent platform!",
    image: "/images/testimonials/auth-03.png",
    star: 5,
  },
];

export async function getTeamMembers() {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/public/team`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      console.error(`Failed to fetch team members: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch team members: ${response.status}`);
    }

    const data = await response.json();
    const teamData = data.data || [];
    // Return API data if available, otherwise return mock data
    return teamData.length > 0 ? teamData : mockTeamMembers;
  } catch (error: any) {
    console.error("Failed to fetch team members, using fallback data:", error.message || error);
    return mockTeamMembers;
  }
}

export async function getTestimonials() {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/public/reviews`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }

    const data = await response.json();
    const reviews: any[] = data?.data?.reviews ?? data?.data ?? data?.reviews ?? [];

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return mockTestimonials;
    }

    // Map review shape → Testimonial shape
    return reviews.map((r: any) => {
      const firstName = r.user?.firstName ?? "";
      const lastName = r.user?.lastName ?? "";
      const name =
        r.user?.name ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        "Anonymous";
      return {
        id: String(r.id ?? r._id ?? Math.random()),
        name,
        designation: r.user?.role ?? "Verified Investor",
        content: r.body ?? r.comment ?? "",
        image: r.user?.profilePicture || "/images/testimonials/auth-01.png",
        star: r.rating ?? 5,
      };
    });
  } catch (error: any) {
    console.error("Failed to fetch reviews, using fallback data:", error.message || error);
    return mockTestimonials;
  }
}

export async function getInvestmentOptions() {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/public/investments`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Failed to fetch investment options: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch investment options: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error("Failed to fetch investment options, using fallback (empty array):", error.message || error);
    return [];
  }
}
