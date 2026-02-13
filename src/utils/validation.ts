/**
 * Validation utilities for form inputs
 */

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - at least 10 digits
export const PHONE_MIN_DIGITS = 10;

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateEmail = (email: string): string => {
  if (email === "") {
    return "";
  }

  // Check for common errors
  if (!email.includes("@")) {
    return "Email must contain @ symbol";
  }
  
  if (email.startsWith("@") || email.endsWith("@")) {
    return "Invalid email format";
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return "Please enter a valid email address";
  }
  
  // Check domain has a period
  const parts = email.split("@");
  if (parts[1] && !parts[1].includes(".")) {
    return "Email domain must contain a period";
  }

  return "";
};

/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validatePhone = (phone: string): string => {
  // Count only digits (excluding country code and formatting)
  const digitCount = phone.replace(/[^\d]/g, "").length;

  // Don't show error if field is empty or only has country code (1-2 digits)
  if (phone === "" || digitCount === 0 || digitCount === 1) {
    return "";
  }

  // Check if phone contains any letters or invalid characters
  const hasLetters = /[a-zA-Z]/.test(phone);
  const hasInvalidChars = /[^+\d\s\-()]/.test(phone);

  if (hasLetters || hasInvalidChars) {
    return "Phone number can only contain numbers";
  }
  
  if (digitCount < PHONE_MIN_DIGITS) {
    return "Phone number must be at least 10 digits";
  }

  return "";
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validatePasswordStrength = (password: string): string => {
  if (password === "") {
    return "";
  }

  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("at least 8 characters");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("one lowercase letter");
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("one number");
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("one special character");
  }

  if (errors.length > 0) {
    return `Password must contain ${errors.join(", ")}`;
  }

  return "";
};

/**
 * Validates password match
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Error message if they don't match, empty string if they match
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string => {
  if (confirmPassword === "") {
    return "";
  }
  
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }

  return "";
};
