import { api } from "@/lib/axios.interceptors";
import type {
  CategoryListMeta,
  CategoryStatus,
  InventoryCategoryFormValues,
  InventoryCategoryItem,
  ProductCategoryFormValues,
  ProductCategoryItem,
  TranslationMap,
} from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: CategoryListMeta };
  meta?: CategoryListMeta;
  timestamp?: string;
};

type MutationResult<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

type CollectionResult<T> = MutationResult<T[]> & {
  meta: CategoryListMeta;
};

type ProductCategoryPayload = {
  id?: string;
  name?: TranslationMap | string | null;
  description?: TranslationMap | string | null;
  status?: CategoryStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type InventoryCategoryPayload = {
  id?: string;
  name?: string | null;
  status?: CategoryStatus;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCategorySortBy = "name" | "description" | "status" | "createdAt";
export type InventoryCategorySortBy = "name" | "status" | "createdAt";
export type CategorySortOrder = "ASC" | "DESC";

const DEFAULT_LIMIT = 10;

const createFallbackMeta = (
  page: number,
  limit: number,
  total: number,
): CategoryListMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const unwrapCollection = <T>(
  response: WrappedResponse<T[]>,
  page: number,
  limit: number,
): { items: T[]; meta: CategoryListMeta } => {
  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      meta: response.meta || createFallbackMeta(page, limit, response.data.length),
    };
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    Array.isArray(response.data.data)
  ) {
    return {
      items: response.data.data,
      meta:
        response.data.meta ||
        response.meta ||
        createFallbackMeta(page, limit, response.data.data.length),
    };
  }

  return {
    items: [],
    meta: response.meta || createFallbackMeta(page, limit, 0),
  };
};

const unwrapItem = <T>(response: WrappedResponse<T>): T => {
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    return response.data.data as T;
  }

  return (response.data || {}) as T;
};

const toTranslationMap = (value?: TranslationMap | string | null): TranslationMap => {
  if (typeof value === "string") {
    return { en: value };
  }

  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce<TranslationMap>((acc, [key, item]) => {
    if (typeof item === "string" && item.trim()) {
      acc[key as keyof TranslationMap] = item;
    }
    return acc;
  }, {});
};

const resolveStatus = (
  status?: CategoryStatus,
  isActive?: boolean,
): CategoryStatus => {
  if (status === "active" || status === "inactive") {
    return status;
  }

  return isActive ? "active" : "inactive";
};

const mapProductCategory = (
  payload: ProductCategoryPayload,
): ProductCategoryItem => {
  const status = resolveStatus(payload.status, payload.isActive);

  return {
    id: payload.id || "",
    name: toTranslationMap(payload.name),
    description: toTranslationMap(payload.description),
    status,
    isActive: status === "active",
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
};

const mapInventoryCategory = (
  payload: InventoryCategoryPayload,
): InventoryCategoryItem => {
  const status = resolveStatus(payload.status, payload.isActive);

  return {
    id: payload.id || "",
    name: payload.name || "",
    status,
    isActive: status === "active",
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
};

const sanitizeTranslations = (translations: TranslationMap): TranslationMap =>
  Object.entries(translations).reduce<TranslationMap>((acc, [key, value]) => {
    const normalizedValue = value?.trim();
    if (normalizedValue) {
      acc[key as keyof TranslationMap] = normalizedValue;
    }
    return acc;
  }, {});

export const getProductCategories = async ({
  page = 1,
  limit = DEFAULT_LIMIT,
  search,
  status,
  sortBy,
  sortOrder,
  signal,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
  sortBy?: ProductCategorySortBy;
  sortOrder?: CategorySortOrder;
  signal?: AbortSignal;
}): Promise<CollectionResult<ProductCategoryItem>> => {
  const response = await api.get<WrappedResponse<ProductCategoryPayload[]>>("/category", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(status ? { status } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
    signal,
  });

  const { items, meta } = unwrapCollection(response.data, page, limit);

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Success",
    data: items.map(mapProductCategory),
    meta,
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const createProductCategory = async (
  payload: ProductCategoryFormValues,
): Promise<MutationResult<ProductCategoryItem>> => {
  const response = await api.post<WrappedResponse<ProductCategoryPayload>>("/category", {
    name: sanitizeTranslations(payload.name),
    description: sanitizeTranslations(payload.description),
  });

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 201,
    message: response.data.message ?? "Product category created successfully.",
    data: mapProductCategory(unwrapItem(response.data)),
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const updateProductCategory = async (
  id: string,
  payload: Partial<ProductCategoryFormValues> & { status?: CategoryStatus },
): Promise<MutationResult<ProductCategoryItem>> => {
  const response = await api.patch<WrappedResponse<ProductCategoryPayload>>(
    `/category/${id}`,
    {
      ...(payload.name ? { name: sanitizeTranslations(payload.name) } : {}),
      ...(payload.description
        ? { description: sanitizeTranslations(payload.description) }
        : {}),
      ...(payload.status ? { status: payload.status } : {}),
    },
  );

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Product category updated successfully.",
    data: mapProductCategory(unwrapItem(response.data)),
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const deleteProductCategory = async (
  id: string,
): Promise<MutationResult<{ id: string }>> => {
  const response = await api.delete<WrappedResponse<{ id?: string }>>(`/category/${id}`);

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Product category deleted successfully.",
    data: { id: unwrapItem(response.data).id || id },
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const getInventoryCategories = async ({
  page = 1,
  limit = DEFAULT_LIMIT,
  search,
  status,
  sortBy,
  sortOrder,
  signal,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
  sortBy?: InventoryCategorySortBy;
  sortOrder?: CategorySortOrder;
  signal?: AbortSignal;
}): Promise<CollectionResult<InventoryCategoryItem>> => {
  const response = await api.get<WrappedResponse<InventoryCategoryPayload[]>>(
    "/inventory-categories",
    {
      params: {
        page,
        limit,
        ...(search?.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
      },
      signal,
    },
  );

  const { items, meta } = unwrapCollection(response.data, page, limit);

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Success",
    data: items.map(mapInventoryCategory),
    meta,
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const createInventoryCategory = async (
  payload: InventoryCategoryFormValues,
): Promise<MutationResult<InventoryCategoryItem>> => {
  const response = await api.post<WrappedResponse<InventoryCategoryPayload>>(
    "/inventory-categories",
    {
      name: payload.name.trim(),
    },
  );

  const item = mapInventoryCategory(unwrapItem(response.data));
  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 201,
    message: response.data.message ?? "Inventory category created successfully.",
    data: item,
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const updateInventoryCategory = async (
  id: string,
  payload: Partial<InventoryCategoryFormValues>,
): Promise<MutationResult<InventoryCategoryItem>> => {
  const response = await api.patch<WrappedResponse<InventoryCategoryPayload>>(
    `/inventory-categories/${id}`,
    {
      ...(payload.name ? { name: payload.name.trim() } : {}),
    },
  );

  const item = mapInventoryCategory(unwrapItem(response.data));
  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Inventory category updated successfully.",
    data: item,
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const toggleInventoryCategoryStatus = async (
  id: string,
): Promise<MutationResult<InventoryCategoryItem>> => {
  const response = await api.patch<WrappedResponse<InventoryCategoryPayload>>(
    `/inventory-categories/${id}/status`,
  );

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Inventory category status updated successfully.",
    data: mapInventoryCategory(unwrapItem(response.data)),
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};

export const deleteInventoryCategory = async (
  id: string,
): Promise<MutationResult<{ id: string }>> => {
  const response = await api.delete<WrappedResponse<{ id?: string }>>(
    `/inventory-categories/${id}`,
  );

  return {
    success: response.data.success ?? true,
    statusCode: response.data.statusCode ?? 200,
    message: response.data.message ?? "Inventory category deleted successfully.",
    data: { id: unwrapItem(response.data).id || id },
    timestamp: response.data.timestamp ?? new Date().toISOString(),
  };
};
