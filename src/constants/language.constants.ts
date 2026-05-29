/**
 * Supported language constants
 * Used in product multilingual forms and CMS features
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "gu", label: "Gujarati" },
  { code: "mr", label: "Marathi" },
  { code: "te", label: "Telugu" },
  { code: "pa", label: "Punjabi" },
  { code: "ml", label: "Malayalam" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
