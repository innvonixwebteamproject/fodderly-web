import { normalizeInventoryUnit } from "@/constants/unit.constants";
import { api } from "@/lib/axios.interceptors";
import {
  ProductFormValues,
  ProductPartnerAllocationItem,
  ProductPartnerAllocationSortBy,
  ProductListMeta,
  ProductRecord,
  ProductSortBy,
  ProductSortOrder,
  PRODUCT_LANGUAGES,
  TranslationMap,
} from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: ProductListMeta };
  meta?: ProductListMeta;
  timestamp?: string;
};

type WrappedListData<T> = {
  data?: T;
  meta?: ProductListMeta;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapPayloadData = <T>(payload: unknown): T | undefined => {
  if (!isRecord(payload)) return undefined;
  if ("id" in payload) return payload as T;

  const firstLevelData = payload.data;
  if (isRecord(firstLevelData) && "id" in firstLevelData) {
    return firstLevelData as T;
  }

  if (isRecord(firstLevelData) && isRecord(firstLevelData.data) && "id" in firstLevelData.data) {
    return firstLevelData.data as T;
  }

  return undefined;
};

const createFallbackMeta = (page: number, limit: number, total: number): ProductListMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const sanitizeTranslations = (value: Partial<TranslationMap>) =>
  Object.entries(value).reduce<Partial<TranslationMap>>((acc, [key, text]) => {
    const trimmed = (text || "").trim();
    if (trimmed) {
      acc[key as keyof TranslationMap] = trimmed;
    }
    return acc;
  }, {});

const normalizeProductImages = (
  images: unknown,
  productImages: unknown,
): ProductRecord["images"] => {
  const normalizeObjectImages = (items: unknown[]): ProductRecord["images"] =>
    items
      .map((item, index) => {
        if (!isRecord(item)) return null;
        const id = typeof item.id === "string" && item.id ? item.id : `image-${index}`;
        const image_path = typeof item.image_path === "string" ? item.image_path : "";
        if (!image_path) return null;
        return { id, image_path };
      })
      .filter((item): item is ProductRecord["images"][number] => Boolean(item));

  if (Array.isArray(productImages)) {
    const productImageObjects = normalizeObjectImages(productImages);
    if (productImageObjects.length > 0) {
      return productImageObjects;
    }

    return productImages
      .map((imagePath, index) => {
        if (typeof imagePath !== "string" || !imagePath) return null;
        return { id: `image-${index}`, image_path: imagePath };
      })
      .filter((item): item is ProductRecord["images"][number] => Boolean(item));
  }

  if (Array.isArray(images)) {
    const normalizedImages = normalizeObjectImages(images);
    if (normalizedImages.length > 0) {
      return normalizedImages;
    }
  }

  return [];
};

const normalizeProduct = (raw: Partial<ProductRecord>): ProductRecord => ({
  id: raw.id || "",
  name: raw.name || {},
  uniqueID: raw.uniqueID || "",
  category_uuid: raw.category_uuid || "",
  category_name: raw.category_name || {},
  brand_uuid: raw.brand_uuid,
  brand_name: raw.brand_name,
  inventory_uuids: raw.inventory_uuids || raw.inventories?.map((item) => item.id) || [],
  inventories: raw.inventories || [],
  price: Number(raw.price || 0),
  stock:
    raw.stock === undefined || raw.stock === null
      ? Number(raw.admin_available_quantity ?? 0)
      : Number(raw.stock),
  admin_available_quantity:
    raw.admin_available_quantity === undefined || raw.admin_available_quantity === null
      ? undefined
      : Number(raw.admin_available_quantity),
  admin_unit:
    raw.admin_unit === undefined || raw.admin_unit === null
      ? raw.quantity_indicator === undefined || raw.quantity_indicator === null
        ? undefined
        : normalizeInventoryUnit(raw.quantity_indicator)
      : normalizeInventoryUnit(raw.admin_unit),
  allocated_quantity:
    raw.allocated_quantity === undefined || raw.allocated_quantity === null
      ? undefined
      : Number(raw.allocated_quantity),
  allocated_unit:
    raw.allocated_unit === undefined || raw.allocated_unit === null
      ? undefined
      : Number(raw.allocated_unit),
  quantity_indicator: raw.quantity_indicator,
  quantity_controls: raw.quantity_controls || null,
  description: raw.description || {},
  usage_instructions: raw.usage_instructions || {},
  safety_information: raw.safety_information || {},
  quality_grade: raw.quality_grade || "",
  nutritional_value: raw.nutritional_value || {},
  is_active: Boolean(raw.is_active),
  images: normalizeProductImages(
    raw.images,
    (raw as Partial<{ product_images: Array<{ id?: string; image_path?: string }> | string[] }>).product_images,
  ),
  createdAt: raw.createdAt,
  updatedAt: raw.updatedAt,
});

type RawProductPartnerAllocation = {
  id?: string;
  partner_uuid?: string;
  partner_name?: string;
  partnerName?: string;
  company_name?: string;
  companyName?: string;
  product_uuid?: string;
  product_name?: Record<string, string> | string;
  allocated_quantity?: number;
  total_allocated_price?: number;
  allocated_price?: number;
  price?: number;
  unit?: number;
  allocated_unit?: number;
  admin_available_quantity?: number;
  admin_unit?: number;
  category_name?: Record<string, string> | string;
  createdAt?: string;
  created_at?: string;
};

const mapProductPartnerAllocationSortBy = (sortBy?: ProductPartnerAllocationSortBy) => {
  if (!sortBy) return "createdAt";
  return sortBy;
};

const normalizeProductPartnerAllocation = (
  raw: RawProductPartnerAllocation,
): ProductPartnerAllocationItem => ({
  id: raw.id || "",
  partner_uuid: raw.partner_uuid,
  partner_name: raw.partner_name || raw.partnerName || "-",
  company_name: raw.company_name || raw.companyName || "-",
  product_uuid: raw.product_uuid || "",
  product_name:
    typeof raw.product_name === "string"
      ? raw.product_name
      : getLanguageLabel(raw.product_name, "-"),
  allocated_quantity: Number(raw.allocated_quantity ?? 0),
  total_allocated_price: Number(raw.total_allocated_price ?? 0),
  allocated_price: Number(raw.allocated_price ?? raw.price ?? 0),
  unit: Number(raw.unit ?? 0),
  allocated_unit:
    raw.allocated_unit === undefined || raw.allocated_unit === null
      ? undefined
      : Number(raw.allocated_unit),
  admin_available_quantity:
    raw.admin_available_quantity === undefined || raw.admin_available_quantity === null
      ? undefined
      : Number(raw.admin_available_quantity),
  admin_unit:
    raw.admin_unit === undefined || raw.admin_unit === null
      ? undefined
      : normalizeInventoryUnit(raw.admin_unit),
  category_name:
    typeof raw.category_name === "string"
      ? raw.category_name
      : getLanguageLabel(raw.category_name, "-"),
  createdAt: raw.createdAt || raw.created_at,
});

export const getProducts = async (params: {
  page?: number;
  limit?: number;
  sortBy?: ProductSortBy;
  sortOrder?: ProductSortOrder;
  search?: string;
  category_uuid?: string;
  is_active?: boolean;
  signal?: AbortSignal;
}): Promise<{ data: ProductRecord[]; meta: ProductListMeta; message: string }> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const response = await api.get<WrappedResponse<ProductRecord[]>>("/products", {
    params: {
      page,
      limit,
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(params.category_uuid ? { category_uuid: params.category_uuid } : {}),
      ...(typeof params.is_active === "boolean" ? { is_active: params.is_active } : {}),
    },
    signal: params.signal,
  });

  const payload: WrappedResponse<ProductRecord[]> | ProductRecord[] = response.data;
  let items: ProductRecord[] = [];
  let meta: ProductListMeta | undefined;

  if (Array.isArray(payload)) {
    items = payload;
  } else if (Array.isArray(payload.data)) {
    items = payload.data;
    meta = payload.meta;
  } else if (isRecord(payload.data)) {
    const nestedData = payload.data as WrappedListData<ProductRecord[]>;
    if (Array.isArray(nestedData.data)) {
      items = nestedData.data;
      meta = nestedData.meta || payload.meta;
    }
  }

  const payloadMeta = !Array.isArray(payload) ? payload.meta : undefined;
  const finalMeta = meta || payloadMeta || createFallbackMeta(page, limit, items.length);

  return {
    data: items.map(normalizeProduct),
    meta: finalMeta,
    message: !Array.isArray(payload) ? payload.message || "Success" : "Success",
  };
};

export const getProductById = async (id: string): Promise<ProductRecord> => {
  const response = await api.get<WrappedResponse<ProductRecord>>(`/products/${id}`);
  const payload: unknown = response.data;
  const item = unwrapPayloadData<ProductRecord>(payload);

  if (!item) {
    const fallbackMessage = isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "Product not found.";
    throw new Error(fallbackMessage);
  }

  return normalizeProduct(item);
};

export const getPartnerAllocationProductDetails = async (
  partner_uuid: string,
  product_uuid: string,
): Promise<ProductRecord> => {
  const response = await api.get<
    WrappedResponse<{
      allocation?: Record<string, unknown>;
      product?: Partial<ProductRecord>;
    }>
  >("/products/partner-allocation-details", {
    params: { partner_uuid, product_uuid },
  });

  const payload: unknown = response.data;
  const product = isRecord(payload) &&
    isRecord(payload.data) &&
    "product" in payload.data &&
    isRecord(payload.data.product)
    ? (payload.data.product as Partial<ProductRecord>)
    : undefined;
  const allocation = isRecord(payload) &&
    isRecord(payload.data) &&
    "allocation" in payload.data &&
    isRecord(payload.data.allocation)
    ? payload.data.allocation
    : undefined;

  if (!product) {
    const fallbackMessage = isRecord(payload) && typeof payload.message === "string"
      ? payload.message
      : "Product details not found.";
    throw new Error(fallbackMessage);
  }

  const productWithAllocation: Partial<ProductRecord> = {
    ...product,
    allocated_quantity:
      allocation && "allocated_quantity" in allocation
        ? Number(allocation.allocated_quantity)
        : undefined,
    allocated_unit:
      allocation && "unit" in allocation
        ? Number(allocation.unit)
        : undefined,
  };

  return normalizeProduct(productWithAllocation);
};

export const getPartnersAllocatedToProduct = async ({
  product_uuid,
  page = 1,
  limit = 10,
  search,
  sortBy = "createdAt",
  sortOrder = "DESC",
  signal,
}: {
  product_uuid: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: ProductPartnerAllocationSortBy;
  sortOrder?: ProductSortOrder;
  signal?: AbortSignal;
}): Promise<{ data: ProductPartnerAllocationItem[]; meta: ProductListMeta; message: string }> => {
  const response = await api.get<WrappedResponse<RawProductPartnerAllocation[]>>(
    `/products/partners/${product_uuid}`,
    {
      params: {
        product_uuid,
        page,
        limit,
        ...(search?.trim() ? { search: search.trim() } : {}),
        sortBy: mapProductPartnerAllocationSortBy(sortBy),
        sortOrder,
      },
      signal,
    },
  );

  const payload: WrappedResponse<RawProductPartnerAllocation[]> | RawProductPartnerAllocation[] =
    response.data;
  let items: RawProductPartnerAllocation[] = [];
  let meta: ProductListMeta | undefined;

  if (Array.isArray(payload)) {
    items = payload;
  } else if (Array.isArray(payload.data)) {
    items = payload.data;
    meta = payload.meta;
  } else if (isRecord(payload.data)) {
    const nestedData = payload.data as WrappedListData<RawProductPartnerAllocation[]>;
    if (Array.isArray(nestedData.data)) {
      items = nestedData.data;
      meta = nestedData.meta || payload.meta;
    }
  }

  const payloadMeta = !Array.isArray(payload) ? payload.meta : undefined;
  const finalMeta = meta || payloadMeta || createFallbackMeta(page, limit, items.length);

  return {
    data: items.map(normalizeProductPartnerAllocation),
    meta: finalMeta,
    message: !Array.isArray(payload) ? payload.message || "Success" : "Success",
  };
};

const appendFiles = (formData: FormData, files: File[]) => {
  files.forEach((file) => formData.append("image", file));
};

const mapFormValuesToFormData = (values: ProductFormValues): FormData => {
  const formData = new FormData();
  formData.append("name", JSON.stringify(sanitizeTranslations(values.name)));
  formData.append("category_uuid", values.category_uuid);
  values.inventory_uuids.forEach((uuid) => formData.append("inventory_uuids", uuid));
  formData.append("price", Number(values.price).toFixed(4));
  formData.append("stock", Number(values.stock).toFixed(4));

  const description = sanitizeTranslations(values.description);
  if (Object.keys(description).length > 0) {
    formData.append("description", JSON.stringify(description));
  }
  const usage = sanitizeTranslations(values.usage_instructions);
  if (Object.keys(usage).length > 0) {
    formData.append("usage_instructions", JSON.stringify(usage));
  }
  const safety = sanitizeTranslations(values.safety_information);
  if (Object.keys(safety).length > 0) {
    formData.append("safety_information", JSON.stringify(safety));
  }
  const nutritional = sanitizeTranslations(values.nutritional_value);
  if (Object.keys(nutritional).length > 0) {
    formData.append("nutritional_value", JSON.stringify(nutritional));
  }
  if (values.quality_grade.trim()) {
    formData.append("quality_grade", values.quality_grade.trim());
  }
  if (values.brand_uuid) {
    formData.append("brand_uuid", values.brand_uuid);
  }
  formData.append("is_active", String(values.is_active));

  appendFiles(formData, values.newImages);
  return formData;
};

export const createProduct = async (
  values: ProductFormValues,
): Promise<{ message: string; data: ProductRecord }> => {
  const response = await api.post<WrappedResponse<ProductRecord>>(
    "/products",
    mapFormValuesToFormData(values),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const payload: unknown = response.data;
  const data = unwrapPayloadData<ProductRecord>(payload);
  const message = isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : "Product created successfully.";

  if (!data) throw new Error(message || "Unable to create product.");
  return { message, data: normalizeProduct(data) };
};

export const updateProduct = async (
  id: string,
  values: ProductFormValues,
): Promise<{ message: string; data: ProductRecord }> => {
  const response = await api.patch<WrappedResponse<ProductRecord>>(
    `/products/${id}`,
    mapFormValuesToFormData(values),
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  const payload: unknown = response.data;
  const data = unwrapPayloadData<ProductRecord>(payload);
  const message = isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : "Product updated successfully.";

  if (!data) throw new Error(message || "Unable to update product.");
  return { message, data: normalizeProduct(data) };
};

export const updateProductStatus = async (
  id: string,
  isActive: boolean,
): Promise<{ message: string; data: ProductRecord }> => {
  const formData = new FormData();
  formData.append("is_active", String(isActive));

  const response = await api.patch<WrappedResponse<ProductRecord>>(
    `/products/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  const payload: unknown = response.data;
  const data = unwrapPayloadData<ProductRecord>(payload);
  const message = isRecord(payload) && typeof payload.message === "string"
    ? payload.message
    : "Product status updated successfully.";

  if (!data) throw new Error(message || "Unable to update product status.");
  return { message, data: normalizeProduct(data) };
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<WrappedResponse<{ id?: string }>>(`/products/${id}`);
  return { message: response.data.message || "Product deleted successfully." };
};

export const deleteProductImage = async (imageId: string): Promise<{ message: string }> => {
  const response = await api.delete<WrappedResponse<{ id?: string }>>(`/products/image/${imageId}`);
  return { message: response.data.message || "Product image deleted successfully." };
};

export const getLanguageLabel = (value?: Partial<TranslationMap>, fallback = "-"): string => {
  if (!value) return fallback;
  for (const key of PRODUCT_LANGUAGES) {
    const text = value[key]?.trim();
    if (text) return text;
  }
  return fallback;
};
