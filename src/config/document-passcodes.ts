// Document Access Passcodes Configuration
// These are SHA-256 hashed passcodes for security

/**
 * IMPORTANT: How to update passcodes:
 *
 * Method 1 - Using the Admin Tool (Recommended):
 * 1. Navigate to: /admin/generate-hash in your browser
 * 2. Enter your plain text passcode
 * 3. Click "Generate Hash"
 * 4. Copy the generated hash
 * 5. Add the hash to the DOCUMENT_PASSCODES array below
 *
 * Method 2 - Using the Browser Console:
 * 1. Open browser console on your site
 * 2. Run: await generatePasscodeHash("YOUR_PASSCODE")
 * 3. Copy the returned hash
 * 4. Add it to the array below
 *
 * SECURITY NOTE:
 * - These are SHA-256 hashes, not plain text
 * - Passcodes are automatically converted to uppercase before hashing
 * - Each hash corresponds to one valid passcode
 */

// SHA-256 Hashed passcodes
//
// ⚠️ IMPORTANT: THESE ARE PLACEHOLDER HASHES - YOU MUST REPLACE THEM!
//
// To set up your passcodes:
// 1. Go to: /admin/generate-hash in your browser
// 2. Enter each of your passcodes one by one
// 3. Copy the generated hashes
// 4. Replace the placeholder hashes below with your real hashes
//
// Your original passcodes were: ACCESS2025, ALVARADO123, PROPERTY456, INVEST789,
// RENTAL2025, ARBITRAGE99, GOLDEN777, UNITS2025, DOCS4321, SECURE888
//
export const DOCUMENT_PASSCODES = [
  // REPLACE THESE PLACEHOLDER HASHES WITH REAL ONES FROM /admin/generate-hash
  "6a0fb0537b1a1e736a4d5fa5045d272b8a5c4c045d243ba31f0a59cf76f12c0f",
  "PLACEHOLDER_HASH_2", // Replace with hash for: ALVARADO123
  "PLACEHOLDER_HASH_3", // Replace with hash for: PROPERTY456
  "PLACEHOLDER_HASH_4", // Replace with hash for: INVEST789
  "PLACEHOLDER_HASH_5", // Replace with hash for: RENTAL2025
  "PLACEHOLDER_HASH_6", // Replace with hash for: ARBITRAGE99
  "PLACEHOLDER_HASH_7", // Replace with hash for: GOLDEN777
  "PLACEHOLDER_HASH_8", // Replace with hash for: UNITS2025
  "PLACEHOLDER_HASH_9", // Replace with hash for: DOCS4321
  "PLACEHOLDER_HASH_10", // Replace with hash for: SECURE888
];

/**
 * To add a new passcode:
 * 1. Generate hash at /admin/generate-hash
 * 2. Add the hash string to the array above
 * 3. Add a comment indicating the original passcode (optional, for your reference)
 *
 * Example:
 * "abc123def456...", // MYNEWCODE2025
 */

// Support contact info for users who need access codes
export const SUPPORT_INFO = {
  email: "info@alvaradoassociatepartners.com",
  phone: "(424) 519-5003",
  message: "Please contact our support team to obtain an access code for our documents.",
};
