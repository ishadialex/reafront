const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Verifies if the provided passcode matches any of the valid passcodes
 * Uses backend API for verification
 * @param passcode - The passcode to verify
 * @returns Promise<boolean> - True if passcode is valid, false otherwise
 */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  if (!passcode) return false;

  try {
    const response = await fetch(`${API_URL}/api/pdf/verify-passcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passcode: passcode.trim() }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Error verifying passcode:", error);
    return false;
  }
}

/**
 * Stores the verified passcode in session storage
 * This allows access until browser session ends
 */
export function storeVerifiedAccess(passcode: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("document_access_verified", "true");
    sessionStorage.setItem("document_access_passcode", passcode);
    sessionStorage.setItem("document_access_time", Date.now().toString());
  }
}

/**
 * Checks if the user has been verified in the current session
 */
export function hasVerifiedAccess(): boolean {
  if (typeof window === "undefined") return false;

  const verified = sessionStorage.getItem("document_access_verified");
  const passcode = sessionStorage.getItem("document_access_passcode");

  return verified === "true" && !!passcode;
}

/**
 * Gets the stored verified passcode
 */
export function getVerifiedPasscode(): string | null {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem("document_access_passcode");
}

/**
 * Clears the verified access (logout)
 */
export function clearVerifiedAccess(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("document_access_verified");
    sessionStorage.removeItem("document_access_passcode");
    sessionStorage.removeItem("document_access_time");
  }
}
