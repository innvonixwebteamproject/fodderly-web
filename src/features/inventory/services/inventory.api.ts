import { api } from "@/lib/axios.interceptors";

export type InventorySortOrder = "ASC" | "DESC";

export interface InventoryCategorySummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryRecord {
  id: string;
  name: string;
  description: string;
  unit: number;
  quantity: number;
  hsn_code: string;
  price: number;
  category_uuid: string;
  category?: InventoryCategorySummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

type WrappedListResponse = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: InventoryRecord[];
  meta?: InventoryListMeta;
  timestamp?: string;
};

type WrappedItemResponse = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: InventoryRecord;
  timestamp?: string;
};

const createFallbackMeta = (
  page: number,
  limit: number,
  total: number,
): InventoryListMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

export const getInventories = async (params: {
  page?: number;
  /** When omitted, `limit` is not sent — backend default page size is used. */
  limit?: number;
  search?: string;
  categoryUuid?: string;
  sortBy?: string;
  sortOrder?: InventorySortOrder;
}): Promise<{
  data: InventoryRecord[];
  meta: InventoryListMeta;
  message: string;
}> => {
  const page = params.page ?? 1;

  const response = await api.get<WrappedListResponse>("/inventory", {
    params: {
      page,
      ...(typeof params.limit === "number" ? { limit: params.limit } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.categoryUuid ? { category_uuid: params.categoryUuid } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    },
  });

  const payload = response.data;
  const items = Array.isArray(payload.data) ? payload.data : [];
  const totalFromMeta = payload.meta?.total;
  const limitFromMeta = payload.meta?.limit;
  const effectiveLimit =
    typeof limitFromMeta === "number" && limitFromMeta > 0
      ? limitFromMeta
      : typeof params.limit === "number" && params.limit > 0
        ? params.limit
        : items.length > 0
          ? items.length
          : 10;

  const meta =
    payload.meta ||
    createFallbackMeta(
      page,
      effectiveLimit,
      typeof totalFromMeta === "number" ? totalFromMeta : items.length,
    );

  return {
    data: items,
    meta,
    message: payload.message || "Success",
  };
};

export const getInventoryById = async (id: string): Promise<InventoryRecord> => {
  const response = await api.get<WrappedItemResponse>(`/inventory/${id}`);
  if (!response.data.data) {
    throw new Error(response.data.message || "Inventory item not found.");
  }
  return response.data.data;
};

export const createInventory = async (body: {
  name: string;
  description: string;
  unit: number;
  quantity: number;
  category_uuid: string;
  hsn_code: string;
  price: number;
}): Promise<{ message: string; data: InventoryRecord }> => {
  const response = await api.post<WrappedItemResponse>("/inventory", body);
  if (!response.data.data) {
    throw new Error(response.data.message || "Unable to create inventory.");
  }
  return { message: response.data.message || "Created", data: response.data.data };
};

export const updateInventory = async (
  id: string,
  body: {
    name: string;
    description: string;
    unit: number;
    quantity: number;
    category_uuid: string;
    hsn_code: string;
    price: number;
  },
): Promise<{ message: string; data: InventoryRecord }> => {
  const response = await api.patch<WrappedItemResponse>(`/inventory/${id}`, body);
  if (!response.data.data) {
    throw new Error(response.data.message || "Unable to update inventory.");
  }
  return { message: response.data.message || "Updated", data: response.data.data };
};

export const deleteInventory = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message?: string }>(`/inventory/${id}`);
  return { message: response.data.message || "Deleted" };
};
