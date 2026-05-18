import { z } from "zod";
import { INVENTORY_UNITS } from "@/constants/unit.constants";

export interface InventoryCategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryRow {
  id: string;
  name: string;
  description: string;
  unit: number;
  quantity: number;
  hsn_code: string;
  price: number;
  category_uuid: string;
  categoryName?: string;
  createdAt?: string;
}

const requiredNumber = (message: string) =>
  z
    .any()
    .refine((value) => value !== "" && value !== null && value !== undefined, message)
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value), message);

export const inventoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Inventory name is required.")
    .min(3, "Inventory name must be at least 3 characters long.")
    .max(100, "Inventory name cannot exceed 100 characters."),
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .min(10, "Description must be at least 10 characters long.")
    .max(1000, "Description cannot exceed 1000 characters."),
  quantity: requiredNumber("Quantity is required.")
    .refine((value) => Number.isInteger(value) && value > 0, "Quantity must be greater than zero.")
    .refine((value) => value <= 1_000_000, "Quantity cannot exceed 1000000."),
  category_uuid: z.string().trim().min(1, "Please select a category."),
  hsn_code: z
    .string()
    .trim()
    .min(1, "HSN code is required.")
    .regex(/^\d{4}$|^\d{6}$|^\d{8}$/, "Please enter a valid HSN code."),
  price: requiredNumber("Price is required.")
    .refine((value) => value > 0, "Price must be greater than zero.")
    .refine((value) => Number.isInteger(value), "Price must be greater than zero.")
    .refine((value) => value <= 10_000_000, "Price cannot exceed 10000000."),
  unit: requiredNumber("Please select a unit.").refine(
    (value) => value === INVENTORY_UNITS.KG || value === INVENTORY_UNITS.TON,
    "Please select a unit.",
  ),
});

export type InventoryFormInputValues = z.input<typeof inventoryFormSchema>;
export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
