const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getTeamMembers() {
  try {
    const response = await fetch(`${API_URL}/api/public/team`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error("Failed to fetch team members");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return [];
  }
}

export async function getTestimonials() {
  try {
    const response = await fetch(`${API_URL}/api/public/testimonials`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch testimonials");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return [];
  }
}

export async function getInvestmentOptions() {
  try {
    const response = await fetch(`${API_URL}/api/public/investments`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch investment options");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch investment options:", error);
    return [];
  }
}
