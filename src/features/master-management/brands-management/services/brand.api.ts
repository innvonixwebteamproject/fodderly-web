import { api } from "@/lib/axios.interceptors";
import { STORAGE_PATH } from "@/config/constant";
import { ENV } from "@/config/env";
import type { BrandItem, BrandListResponse } from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T | { data?: T };
};

type RawBrand = {
  id?: string;
  brand_name?: string;
  name?: string;
  logo_url?: string | null;
  logo?: string | null;
  image?: string | null;
  brand_logo?: string | null;
  logo_path?: string | null;
  image_path?: string | null;
  logo_file?: string | null;
  logo_obj?: { url?: string; path?: string; image_path?: string } | null;
  logo_data?: { url?: string; path?: string; image_path?: string } | null;
  description?: string | null;
  is_active?: boolean | null;
  status?: boolean | null;
};

const resolveLogoUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (STORAGE_PATH) {
    const storageBase = STORAGE_PATH.replace(/\/$/, "");
    const cleanPath = value.replace(/^\//, "");
    return `${storageBase}/${cleanPath}`;
  }

  try {
    const base = new URL(ENV.API_BASE_URL);
    const origin = `${base.protocol}//${base.host}`;
    return `${origin}/${value.replace(/^\//, "")}`;
  } catch {
    return value;
  }
};

const normalizeBrand = (item: RawBrand): BrandItem => ({
  id: item.id || "",
  brand_name: item.brand_name || item.name || "-",
  logo_url: resolveLogoUrl(
    item.logo_url ||
      item.brand_logo ||
      item.logo_path ||
      item.image_path ||
      item.logo_file ||
      item.logo_obj?.url ||
      item.logo_obj?.path ||
      item.logo_obj?.image_path ||
      item.logo_data?.url ||
      item.logo_data?.path ||
      item.logo_data?.image_path ||
      item.logo ||
      item.image ||
      null,
  ),
  description: item.description ?? null,
  is_active:
    typeof item.is_active === "boolean"
      ? item.is_active
      : typeof item.status === "boolean"
        ? item.status
        : null,
});

export const getBrands = async (): Promise<BrandListResponse> => {
  const response = await api.get<WrappedResponse<RawBrand[]> | RawBrand[]>("/brand");
  const payload = response.data;

  let items: RawBrand[] = [];
  let message = "Success";
  let success = true;

  const normalizeObjectCollection = (value: unknown): RawBrand[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.values(value as Record<string, unknown>).filter(
      (item): item is RawBrand => Boolean(item && typeof item === "object"),
    );
  };

  if (Array.isArray(payload)) {
    items = payload;
  } else if (Array.isArray(payload.data)) {
    items = payload.data;
    message = payload.message || message;
    success = payload.success ?? success;
  } else if (payload.data && typeof payload.data === "object" && "data" in payload.data) {
    items = Array.isArray(payload.data.data) ? payload.data.data : [];
    message = payload.message || message;
    success = payload.success ?? success;
  } else if (payload.data && typeof payload.data === "object") {
    // API may return numeric-key object: { "0": {...}, "1": {...} }
    items = normalizeObjectCollection(payload.data);
    message = payload.message || message;
    success = payload.success ?? success;
  }

  return {
    success,
    message,
    data: items.map(normalizeBrand),
  };
};
