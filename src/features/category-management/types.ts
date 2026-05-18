import { z } from "zod";

export const CATEGORY_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
] as const;

export type CategoryLanguageCode = (typeof CATEGORY_LANGUAGES)[number]["code"];
export type CategoryStatus = "active" | "inactive";
export type CategoryStatusFilter = "all" | CategoryStatus;
export type TranslationMap = Partial<Record<CategoryLanguageCode, string>>;

export interface CategoryListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductCategoryItem {
  id: string;
  name: TranslationMap;
  description: TranslationMap;
  status: CategoryStatus;
  isActive: boolean;
  image?: string;
  image_path?: string;
  image_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryCategoryItem {
  id: string;
  name: string;
  status: CategoryStatus;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PRODUCT_CATEGORY_NAME_MIN_LENGTH = 2;
const PRODUCT_CATEGORY_NAME_MAX_LENGTH = 100;
const PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH = 2;
const PRODUCT_CATEGORY_DESCRIPTION_MAX_LENGTH = 5000;

const productCategoryNameField = z
  .string()
  .trim()
  .max(
    PRODUCT_CATEGORY_NAME_MAX_LENGTH,
    `Product category name must not exceed ${PRODUCT_CATEGORY_NAME_MAX_LENGTH} characters.`,
  );

const productCategoryDescriptionField = z
  .string()
  .trim()
  .max(
    PRODUCT_CATEGORY_DESCRIPTION_MAX_LENGTH,
    `Product description must not exceed ${PRODUCT_CATEGORY_DESCRIPTION_MAX_LENGTH} characters.`,
  );

export const productCategoryFormSchema = z.object({
  name: z.object({
    en: productCategoryNameField,
    hi: productCategoryNameField,
    gu: productCategoryNameField,
    mr: productCategoryNameField,
    te: productCategoryNameField,
    pa: productCategoryNameField,
    ml: productCategoryNameField,
  }),
  description: z.object({
    en: productCategoryDescriptionField,
    hi: productCategoryDescriptionField,
    gu: productCategoryDescriptionField,
    mr: productCategoryDescriptionField,
    te: productCategoryDescriptionField,
    pa: productCategoryDescriptionField,
    ml: productCategoryDescriptionField,
  }),
  status: z.enum(["active", "inactive"]),
  image: z.custom<File | null>((val) => val === null || val instanceof File, "Image must be a file").optional().nullable(),
  existingImageRemoved: z.boolean().optional(),
  hasExistingImage: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (!value.image && (!value.hasExistingImage || value.existingImageRemoved)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["image"],
      message: "Please upload an image.",
    });
  }
  const englishName = value.name.en.trim();
  const englishDescription = value.description.en.trim();

  if (!englishName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name", "en"],
      message: "Product category name is required.",
    });
  } else if (englishName.length < PRODUCT_CATEGORY_NAME_MIN_LENGTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name", "en"],
      message: `Product category name must be at least ${PRODUCT_CATEGORY_NAME_MIN_LENGTH} characters.`,
    });
  }

  CATEGORY_LANGUAGES.filter((language) => language.code !== "en").forEach((language) => {
    const translatedName = value.name[language.code]?.trim() || "";
    const translatedDescription = value.description[language.code]?.trim() || "";

    if (!translatedName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name", language.code],
        message: "Product category name is required in all languages.",
      });
    } else if (translatedName.length < PRODUCT_CATEGORY_NAME_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name", language.code],
        message: `Product category name must be at least ${PRODUCT_CATEGORY_NAME_MIN_LENGTH} characters.`,
      });
    }

    if (englishDescription) {
      if (!translatedDescription) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description", language.code],
          message: "Product description is required in all languages.",
        });
      } else if (translatedDescription.length < PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description", language.code],
          message: `Product description must be at least ${PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH} characters.`,
        });
      }
    } else if (
      translatedDescription &&
      translatedDescription.length < PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description", language.code],
        message: `Product description must be at least ${PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH} characters.`,
      });
    }
  });

  if (
    englishDescription &&
    englishDescription.length < PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["description", "en"],
      message: `Product description must be at least ${PRODUCT_CATEGORY_DESCRIPTION_MIN_LENGTH} characters.`,
    });
  }
});

export type ProductCategoryFormValues = z.infer<typeof productCategoryFormSchema>;

export const inventoryCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category Name must be at least 2 characters.")
    .max(100, "Category Name must not exceed 100 characters."),
});

export type InventoryCategoryFormValues = z.infer<typeof inventoryCategoryFormSchema>;

export const createEmptyTranslations = (): Record<CategoryLanguageCode, string> => ({
  en: "",
  hi: "",
  gu: "",
  mr: "",
  te: "",
  pa: "",
  ml: "",
});

export const getDefaultProductCategoryFormValues = (): ProductCategoryFormValues => ({
  name: createEmptyTranslations(),
  description: createEmptyTranslations(),
  status: "active",
  image: null,
  existingImageRemoved: false,
  hasExistingImage: false,
});

export const getDefaultInventoryCategoryFormValues =
  (): InventoryCategoryFormValues => ({
    name: "",
  });
