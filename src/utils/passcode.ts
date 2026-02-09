import { DOCUMENT_PASSCODES } from "@/config/document-passcodes";

/**
 * Hashes a string using SHA-256
 * @param text - The text to hash
 * @returns Promise<string> - The hex string hash
 */
async function hashSHA256(text: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Hash the data
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex;
}

/**
 * Verifies if the provided passcode matches any of the valid passcodes
 * @param passcode - The passcode to verify
 * @returns Promise<boolean> - True if passcode is valid, false otherwise
 */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  if (!passcode) return false;

  try {
    // Convert to uppercase for case-insensitive comparison
    const normalizedPasscode = passcode.trim().toUpperCase();

    // Hash the input passcode
    const hashedInput = await hashSHA256(normalizedPasscode);

    // Check if the hashed passcode matches any of the valid hashed passcodes
    return DOCUMENT_PASSCODES.some((validHashedCode) => validHashedCode === hashedInput);
  } catch (error) {
    console.error("Error verifying passcode:", error);
    return false;
  }
}

/**
 * Helper function to generate SHA-256 hash for a passcode
 * Use this to generate hashes for your passcodes
 * @param passcode - The plain text passcode
 * @returns Promise<string> - The hashed passcode
 */
export async function generatePasscodeHash(passcode: string): Promise<string> {
  const normalized = passcode.trim().toUpperCase();
  return await hashSHA256(normalized);
}

/**
 * Stores the verified passcode in session storage
 * This allows access for 1 minute
 */
export function storeVerifiedAccess(): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("document_access_verified", "true");
    sessionStorage.setItem("document_access_time", Date.now().toString());
  }
}

/**
 * Checks if the user has been verified in the current session
 * Verification expires after 1 minute
 */
export function hasVerifiedAccess(): boolean {
  if (typeof window === "undefined") return false;

  const verified = sessionStorage.getItem("document_access_verified");
  const verifiedTime = sessionStorage.getItem("document_access_time");

  if (!verified || !verifiedTime) return false;

  // Check if verification is still valid (1 minute)
  const timeElapsed = Date.now() - parseInt(verifiedTime);
  const oneMinute = 60 * 1000;

  if (timeElapsed > oneMinute) {
    // Clear expired verification
    sessionStorage.removeItem("document_access_verified");
    sessionStorage.removeItem("document_access_time");
    return false;
  }

  return true;
}

/**
 * Clears the verified access (logout)
 */
export function clearVerifiedAccess(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("document_access_verified");
    sessionStorage.removeItem("document_access_time");
  }
}
