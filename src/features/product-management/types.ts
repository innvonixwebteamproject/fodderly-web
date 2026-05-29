import { z } from "zod";

export const PRODUCT_LANGUAGES = ["en", "hi", "gu", "mr", "te", "pa", "ml"] as const;
export type ProductLanguageCode = (typeof PRODUCT_LANGUAGES)[number];

export const PRODUCT_LANGUAGES_CONFIG = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
] as const;
export type TranslationMap = Record<ProductLanguageCode, string>;
export type ProductUnit = "kg" | "ton";
export type ProductSortOrder = "ASC" | "DESC";
export type ProductSortBy = "createdAt" | "name" | "description" | "price" | "stock" | "status";
export type ProductPartnerAllocationSortBy =
  | "partnerName"
  | "price"
  | "total"
  | "quantity"
  | "createdAt";

export interface ProductImage {
  id: string;
  image_path: string;
}

export interface ProductInventoryRef {
  id: string;
  name: string;
  description?: string | null;
  unit?: number | null;
  quantity?: number | null;
  hsn_code?: string | null;
  price?: number | null;
  category_name?: string | null;
}

export interface ProductRecord {
  id: string;
  name: Partial<TranslationMap>;
  uniqueID: string;
  category_uuid: string;
  category_name?: Partial<TranslationMap>;
  brand_uuid?: string;
  brand_name?: string;
  inventory_uuids?: string[];
  inventories?: ProductInventoryRef[];
  price: number;
  stock: number;
  admin_available_quantity?: number;
  admin_unit?: number;
  allocated_quantity?: number;
  allocated_unit?: number;
  quantity_indicator?: string;
  quantity_controls?: Record<string, unknown> | null;
  display_unit?: ProductUnit;
  display_quantity?: number;
  display_price?: number;
  description?: Partial<TranslationMap>;
  usage_instructions?: Partial<TranslationMap>;
  safety_information?: Partial<TranslationMap>;
  quality_grade?: string;
  nutritional_value?: Partial<TranslationMap>;
  is_active: boolean;
  images: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductPartnerAllocationItem {
  id: string;
  partner_uuid?: string;
  partner_name: string;
  company_name?: string;
  product_uuid: string;
  product_name: string;
  allocated_quantity: number;
  total_allocated_price: number;
  allocated_price: number;
  unit: number;
  allocated_unit?: number;
  admin_available_quantity?: number;
  admin_unit?: number;
  category_name?: string;
  createdAt?: string;
}

export interface ProductOption {
  id: string;
  label: string;
}

const requiredNumber = (message: string) =>
  z
    .any()
    .refine((value) => value !== "" && value !== null && value !== undefined, message)
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value), message);

const requiredProductNameField = z
  .string()
  .trim()
  .min(1, "Product Name is required")
  .min(2, "Product Name must be at least 2 characters long")
  .max(100, "Product Name cannot exceed 100 characters");

const optionalDescriptionField = z
  .string()
  .trim()
  .max(1000, "Description Name cannot exceed 1000 characters")
  .refine((value) => value.length === 0 || value.length >= 2, "Description Name must be at least 2 characters long");

const optionalNutritionalField = z
  .string()
  .trim()
  .max(5000, "Nutritional Value cannot exceed 5000 characters")
  .refine((value) => value.length === 0 || value.length >= 2, "Nutritional Value must be at least 2 characters long");

const optionalUsageField = z
  .string()
  .trim()
  .max(5000, "Usage Instructions cannot exceed 5000 characters")
  .refine((value) => value.length === 0 || value.length >= 2, "Usage Instructions must be at least 2 characters long");

const optionalSafetyField = z
  .string()
  .trim()
  .max(5000, "Safety Information cannot exceed 5000 characters")
  .refine((value) => value.length === 0 || value.length >= 2, "Safety Information must be at least 2 characters long");

const translationFieldSchema = z.object({
  en: requiredProductNameField,
  hi: requiredProductNameField,
  gu: requiredProductNameField,
  mr: requiredProductNameField,
  te: requiredProductNameField,
  pa: requiredProductNameField,
  ml: requiredProductNameField,
});

export const productFormSchema = z
  .object({
    name: translationFieldSchema,
    category_uuid: z.string().trim().min(1, "Category is required."),
    inventory_uuids: z.array(z.string()).min(1, "Please select at least one inventory."),
    price: requiredNumber("Price is required.")
      .refine((value) => value > 0, "Price must be greater than zero."),
    stock: requiredNumber("Quantity is required.")
      .refine((value) => value > 0, "Quantity must be greater than zero."),
    unit: z.enum(["kg", "ton"], { message: "Please select quantity unit." }),
    display_unit: z.enum(["kg", "ton"]).optional(),
    display_quantity: z.number().optional(),
    display_price: z.number().optional(),
    description: z.object({
      en: optionalDescriptionField,
      hi: optionalDescriptionField,
      gu: optionalDescriptionField,
      mr: optionalDescriptionField,
      te: optionalDescriptionField,
      pa: optionalDescriptionField,
      ml: optionalDescriptionField,
    }),
    usage_instructions: z.object({
      en: optionalUsageField,
      hi: optionalUsageField,
      gu: optionalUsageField,
      mr: optionalUsageField,
      te: optionalUsageField,
      pa: optionalUsageField,
      ml: optionalUsageField,
    }),
    safety_information: z.object({
      en: optionalSafetyField,
      hi: optionalSafetyField,
      gu: optionalSafetyField,
      mr: optionalSafetyField,
      te: optionalSafetyField,
      pa: optionalSafetyField,
      ml: optionalSafetyField,
    }),
    quality_grade: z.string().trim().max(100, "Quality Grade cannot exceed 100 characters").optional().default(""),
    nutritional_value: z.object({
      en: optionalNutritionalField,
      hi: optionalNutritionalField,
      gu: optionalNutritionalField,
      mr: optionalNutritionalField,
      te: optionalNutritionalField,
      pa: optionalNutritionalField,
      ml: optionalNutritionalField,
    }),
    brand_uuid: z.string().optional().default(""),
    is_active: z.boolean().default(true),
    existingImageIds: z.array(z.string()).default([]),
    newImages: z.array(z.custom<File>()).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.newImages.length === 0 && value.existingImageIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newImages"],
        message: "Please upload at least one image.",
      });
    }

    const hasInvalidImageType = value.newImages.some(
      (file) => !["image/jpeg", "image/png"].includes(file.type),
    );
    if (hasInvalidImageType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newImages"],
        message: "Only JPG/PNG allowed.",
      });
    }

    if (value.newImages.length + value.existingImageIds.length > 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newImages"],
        message: "Upload only 10 images",
      });
    }

    const hasInvalidImageSize = value.newImages.some((file) => file.size > 5 * 1024 * 1024);
    if (hasInvalidImageSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newImages"],
        message: "Upload 5MB JPG/PNG per single image",
      });
    }
  });

export type ProductFormInputValues = z.input<typeof productFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
