import { z } from "zod";

export type MasterLanguageCode = "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";
export type TranslationFormMap = Record<MasterLanguageCode, string>;
export type TranslationMap = Partial<Record<MasterLanguageCode, string>>;

export interface TalukaItem {
  id: string;
  stateId: string;
  districtId: string;
  name?: string | TranslationMap;
  stateName?: string | TranslationMap;
  districtName?: string | TranslationMap;
  translations?: TranslationMap;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const nameField = z
  .string()
  .trim()
  .min(1, "Taluka name is required.")
  .min(2, "Taluka name must be at least 2 characters.")
  .max(100, "Taluka name must not exceed 100 characters.")
  .regex(/^[A-Za-z\s-]+$/, "Only alphabets, spaces, hyphens allowed.");

const translationField = (language: string) =>
  z
    .string()
    .trim()
    .min(1, `Taluka name is required (${language}).`)
    .min(2, `Taluka name must be at least 2 characters (${language}).`)
    .max(100, `Taluka name must not exceed 100 characters (${language}).`);

export const talukaFormSchema = z.object({
  stateId: z.string().min(1, "State selection is required."),
  districtId: z.string().min(1, "District selection is required."),
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

export type TalukaFormValues = z.infer<typeof talukaFormSchema>;
