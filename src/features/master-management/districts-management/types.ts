import { z } from "zod";

export type MasterLanguageCode = "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";
export type TranslationFormMap = Record<MasterLanguageCode, string>;
export type TranslationMap = Partial<Record<MasterLanguageCode, string>>;

export interface DistrictItem {
  id: string;
  stateId: string;
  name?: string | TranslationMap;
  stateName?: string | TranslationMap;
  translations?: TranslationMap;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const nameField = z
  .string()
  .trim()
  .min(1, "District name is required.")
  .min(2, "District name must be at least 2 characters.")
  .max(100, "District name must not exceed 100 characters.")
  .regex(/^[A-Za-z\s-]+$/, "Only alphabets, spaces, hyphens allowed.");

const translationField = (language: string) =>
  z
    .string()
    .trim()
    .min(1, `District name is required (${language}).`)
    .min(2, `District name must be at least 2 characters (${language}).`)
    .max(100, `District name must not exceed 100 characters (${language}).`);

export const districtFormSchema = z.object({
  stateId: z.string().min(1, "State selection is required."),
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

export type DistrictFormValues = z.infer<typeof districtFormSchema>;
