/**
 * Validation constants — regex patterns and reusable validation messages
 * Import these in Zod schemas to avoid duplication across forms
 */

export const REGEX = {
  PHONE: /^[0-9]{10}$/,
  ALPHABETICAL: /^[a-zA-Z\s]+$/,
  NUMERIC: /^[0-9]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN: /.{8,}/,
  NO_LEADING_TRAILING_SPACES: /^(?!\s).*(?<!\s)$/,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_PHONE: "Please enter a valid 10-digit phone number",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_NAME: "Name must contain only letters and spaces",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  PASSWORDS_MUST_MATCH: "Passwords do not match",
  MAX_IMAGES: "Upload only 10 images",
  IMAGE_SIZE: "Upload 5MB JPG/PNG per single image",
  IMAGE_TYPE: "Only JPG/PNG allowed",
} as const;
