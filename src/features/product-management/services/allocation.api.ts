import { normalizeInventoryUnit } from "@/constants/unit.constants";
import { api } from "@/lib/axios.interceptors";
import type {
  AllocateProductPayload,
  AllocationItem,
  AllocationListMeta,
  AllocationListRequest,
  AllocationMutationResponse,
} from "../types/allocation.types";
import { getLanguageLabel } from "./product.api";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: AllocationListMeta };
  meta?: AllocationListMeta;
  timestamp?: string;
};

type RawAllocation = {
  id?: string;
  partner_uuid?: string;
  partner_name?: string;
  product_uuid?: string;
  product_name?: Record<string, string> | string;
  uniqueID?: string;
  unique_id?: string;
  product_unique_id?: string;
  product_code?: string;
  category_uuid?: string;
  category_name?: Record<string, string> | string;
  allocated_quantity?: number;
  available_quantity?: number;
  total_allocated_price?: number;
  allocated_price?: string | number;
  unit?: number;
  admin_available_quantity?: number;
  admin_unit?: number;
  price_per_unit?: string | number;
  price?: string | number;
  sold_quantity?: number;
  createdAt?: string;
  created_at?: string;
  images?: Array<{
    id?: string;
    image_path?: string;
  }>;
  product_images?: string[];
  inventories?: Array<{
    id?: string;
    name?: string;
    description?: string | null;
    unit?: number | null;
    quantity?: string | number | null;
    hsn_code?: string | null;
    price?: string | number | null;
    category_uuid?: string | null;
    category_name?: string | null;
  }>;
};

const mapAllocationSortByForApi = (sortBy?: AllocationListRequest["sortBy"]) => {
  switch (sortBy) {
    case "product_name":
      return "productName";
    case "price":
      return "price";
    case "total_allocated_price":
      return "total";
    case "available_quantity":
      return "quantity";
    case "allocated_quantity":
      return "quantity";
    case "createdAt":
      return "createdAt";
    case "created_at":
      return "created_at";
    default:
      return undefined;
  }
};

const fallbackMeta = (page: number, limit: number, total: number): AllocationListMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const normalizeAllocation = (raw: RawAllocation, partnerName?: string): AllocationItem => {
  const allocatedQuantity = Number(raw.allocated_quantity ?? 0);
  const totalAllocatedPrice = Number(raw.total_allocated_price ?? 0);
  const unitPrice =
    raw.allocated_price !== null &&
    raw.allocated_price !== undefined &&
    raw.allocated_price !== ""
      ? Number(raw.allocated_price)
      : raw.price_per_unit !== null &&
          raw.price_per_unit !== undefined &&
          raw.price_per_unit !== ""
        ? Number(raw.price_per_unit)
      : raw.price !== null &&
          raw.price !== undefined &&
          raw.price !== ""
        ? Number(raw.price)
      : 0;

  return {
    id: raw.id || "",
    partner_uuid: raw.partner_uuid || "",
    partner_name: raw.partner_name || partnerName || "—",
    product_uuid: raw.product_uuid || "",
    product_name:
      typeof raw.product_name === "string"
        ? raw.product_name
        : getLanguageLabel(raw.product_name, "-"),
    uniqueID: raw.uniqueID || raw.unique_id || raw.product_unique_id || raw.product_code || "",
    category_uuid: raw.category_uuid || "",
    category_name:
      typeof raw.category_name === "string"
        ? raw.category_name
        : getLanguageLabel(raw.category_name, "-"),
    allocated_quantity: allocatedQuantity,
    available_quantity: Number(raw.available_quantity ?? 0),
    total_allocated_price: totalAllocatedPrice,
    unit: Number(raw.unit ?? 0),
    admin_available_quantity: Number(raw.admin_available_quantity ?? 0),
    admin_unit: normalizeInventoryUnit(raw.admin_unit ?? raw.unit ?? 0),
    price_per_unit: unitPrice,
    sold_quantity: Number(raw.sold_quantity ?? 0),
    createdAt: raw.createdAt || raw.created_at,
    images: Array.isArray(raw.images)
      ? raw.images.map((item, index) => ({
          id: item.id || `image-${index}`,
          image_path: item.image_path || "",
        }))
      : Array.isArray(raw.product_images)
        ? raw.product_images.map((imagePath, index) => ({
            id: `image-${index}`,
            image_path: imagePath || "",
          }))
        : [],
    inventories: Array.isArray(raw.inventories)
      ? raw.inventories.map((item) => ({
          id: item.id || "",
          name: item.name || "-",
          description: item.description ?? null,
          unit: item.unit ?? null,
          quantity:
            item.quantity === null || item.quantity === undefined || item.quantity === ""
              ? null
              : Number(item.quantity),
          hsn_code: item.hsn_code ?? null,
          price:
            item.price === null || item.price === undefined || item.price === ""
              ? null
              : Number(item.price),
          category_name: item.category_name ?? null,
        }))
      : [],
  };
};

const unwrapMutationData = <T extends object>(response: WrappedResponse<T>): T => {
  const direct = response as unknown as T & { id?: string };
  if (typeof direct === "object" && direct !== null && "id" in direct) {
    return direct;
  }
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    return (response.data.data || {}) as T;
  }
  return (response.data || {}) as T;
};

export const getPartnerAllocations = async (
  payload: AllocationListRequest,
): Promise<{ data: AllocationItem[]; meta: AllocationListMeta; message: string }> => {
  const page = payload.page ?? 1;
  const limit = payload.limit ?? 10;
  const sortBy = mapAllocationSortByForApi(payload.sortBy);

  const response = await api.post<WrappedResponse<RawAllocation[]> | RawAllocation[]>("/products/partner-allocations", {
    partner_uuid: payload.partner_uuid || null,
    category_uuid: payload.category_uuid || null,
    search: payload.search?.trim() || "",
    sortBy: sortBy || null,
    sortOrder: payload.sortOrder || null,
    page,
    limit,
  });

  const raw = response.data;
  let items: RawAllocation[] = [];
  let meta: AllocationListMeta | undefined;

  if (Array.isArray(raw)) {
    items = raw;
  } else if (Array.isArray(raw.data)) {
    items = raw.data;
    meta = raw.meta;
  } else if (Array.isArray(raw.data?.data)) {
    items = raw.data.data;
    meta = raw.data.meta || raw.meta;
  }

  return {
    data: items.map((item) => normalizeAllocation(item)),
    meta:
      meta ||
      (!Array.isArray(raw) ? raw.meta : undefined) ||
      fallbackMeta(page, limit, items.length),
    message: !Array.isArray(raw) ? raw.message || "Success" : "Success",
  };
};

export const allocateProducts = async (
  payloads: AllocateProductPayload[],
): Promise<{ message: string; data: AllocationMutationResponse[] }> => {
  const responses = await Promise.all(
    payloads.map((payload) =>
      api.post<WrappedResponse<AllocationMutationResponse>>("/products/allocate-products", payload),
    ),
  );

  const data = responses.map((response) => {
    return unwrapMutationData<AllocationMutationResponse>(response.data);
  });

  return { message: "Products allocated successfully.", data };
};

export const updatePartnerAllocation = async (
  id: string,
  allocated_quantity: number,
  unit?: number,
): Promise<{ message: string; data: AllocationMutationResponse }> => {
  const response = await api.patch<WrappedResponse<AllocationMutationResponse>>(
    `/products/partner-allocations/${id}`,
    { allocated_quantity, unit },
  );
  const raw = response.data;
  const data = unwrapMutationData<AllocationMutationResponse>(raw);
  return { message: raw.message || "Partner allocation updated successfully.", data };
};

export const updatePartnerStock = async (
  id: string,
  stock: number,
): Promise<{ message: string; data: AllocationMutationResponse }> => {
  const response = await api.patch<WrappedResponse<AllocationMutationResponse>>(
    `/products/partner-allocations/${id}`,
    { allocated_quantity: stock },
  );
  const raw = response.data;
  const data = unwrapMutationData<AllocationMutationResponse>(raw);
  return { message: raw.message || "Stock updated successfully.", data };
};

export const deletePartnerAllocation = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<WrappedResponse<unknown>>(`/products/partner-allocations/${id}`);
  return { message: response.data.message || "Partner allocation deleted successfully." };
};
