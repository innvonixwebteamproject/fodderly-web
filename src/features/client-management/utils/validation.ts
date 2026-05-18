/**
 * Client management validation utilities
 */

/**
 * Validates Indian phone number format
 * @param phone Phone number string
 * @returns true if valid, false otherwise
 */
export const isValidIndianPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Indian phone numbers should be 10 digits
  // or 12 digits with country code (91)
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
};

/**
 * Formats phone number to readable format
 * @param phone Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const without91 = digits.slice(2);
    return `+91 ${without91.slice(0, 5)} ${without91.slice(5)}`;
  }
  
  return phone;
};

/**
 * Validates email format
 * @param email Email address
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if string is not empty
 * @param value String value
 * @returns true if not empty, false otherwise
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};
