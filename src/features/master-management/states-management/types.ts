import { z } from "zod";

export type MasterLanguageCode = "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";

// Use a more strict type for form values where we guarantee a string (even if empty)
export type TranslationFormMap = Record<MasterLanguageCode, string>;

// Use a partial type for API responses where some translations might be missing
export type TranslationMap = Partial<Record<MasterLanguageCode, string>>;

export interface StateItem {
  id: string;
  name: string | TranslationMap;
  translations?: TranslationMap;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const nameField = z
  .string()
  .trim()
  .min(1, "State name is required.")
  .min(2, "State name must be at least 2 characters.")
  .max(100, "State name must not exceed 100 characters.")
  .regex(/^[A-Za-z\s-]+$/, "Only alphabets, spaces, hyphens allowed.");

const translationField = (language: string) =>
  z
    .string()
    .trim()
    .min(1, `State name is required (${language}).`)
    .min(2, `State name must be at least 2 characters (${language}).`)
    .max(100, `State name must not exceed 100 characters (${language}).`);

export const stateFormSchema = z.object({
  translations: z.object({
    en: nameField,
    hi: translationField("Hindi"),
    gu: translationField("Gujarati"),
    mr: translationField("Marathi"),
    te: translationField("Telugu"),
    pa: translationField("Punjabi"),
    ml: translationField("Malayalam"),
  }),
});

export type StateFormValues = z.infer<typeof stateFormSchema>;
