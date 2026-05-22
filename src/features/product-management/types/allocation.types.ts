import { z } from "zod";

export interface AllocationInventory {
  id: string;
  name: string;
  description?: string | null;
  unit?: number | null;
  quantity?: number | null;
  hsn_code?: string | null;
  price?: number | null;
  category_name?: string | null;
}

export interface AllocationProductImage {
  id: string;
  image_path: string;
}

export interface AllocationItem {
  id: string;
  partner_uuid: string;
  partner_name: string;
  product_uuid: string;
  product_name: string;
  uniqueID?: string;
  category_uuid?: string;
  category_name?: string;
  allocated_quantity: number;
  total_allocated_price: number;
  unit: number;
  available_quantity: number;
  admin_available_quantity: number;
  admin_unit?: number;
  price_per_unit: number;
  sold_quantity: number;
  createdAt?: string;
  inventories: AllocationInventory[];
  images?: AllocationProductImage[];
}

export interface AllocationListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AllocationListRequest {
  partner_uuid?: string;
  category_uuid?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: AllocationSortBy;
  sortOrder?: AllocationSortOrder;
}

export type AllocationSortBy =
  | "product_name"
  | "price"
  | "total_allocated_price"
  | "available_quantity"
  | "allocated_quantity"
  | "createdAt"
  | "created_at";
export type AllocationSortOrder = "ASC" | "DESC";

export interface AllocateProductPayload {
  partner_uuid: string;
  product_uuid: string;
  allocated_quantity: number;
  total_allocated_price: number;
  unit: number;
}

export interface AllocationMutationResponse {
  id: string;
  partner_uuid: string;
  product_uuid: string;
  allocated_quantity: number;
  total_allocated_price: number;
  unit: number;
  createdAt?: string;
}

export interface PartnerTracking {
  allocation_id: string;
  partnerName: string;
  productName: string;
  allocatedQuantity: number;
  availableQuantity: number;
  totalQuantityAvailable: number;
}

export const allocationFormSchema = z.object({
  partner_uuid: z
    .string()
    .trim()
    .min(1, "No partner selected. Please select a partner for allocation."),
  product_uuid: z
    .string()
    .trim()
    .min(1, "No product selected. Please select a product to allocate."),
  allocated_quantity: z
    .any()
    .refine((value) => value !== "" && value !== null && value !== undefined, "Allocated quantity is required.")
    .transform((value) => Number(value))
    .refine((value) => value > 0, "Allocated quantity must be greater than zero."),
  unit: z
    .any()
    .refine((value) => value !== "" && value !== null && value !== undefined, "Please select a unit.")
    .transform((value) => Number(value))
    .refine((value) => value === 0 || value === 1, "Please select a unit."),
});

export type AllocationFormInputValues = z.input<typeof allocationFormSchema>;
export type AllocationFormValues = z.infer<typeof allocationFormSchema>;
