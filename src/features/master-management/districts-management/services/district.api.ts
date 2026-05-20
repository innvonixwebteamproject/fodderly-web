import { api } from "@/lib/axios.interceptors";
import { DistrictItem, DistrictFormValues } from "../types";
import { BASE_URL, SUBFIX, API_VERSION, STORAGE_KEYS } from "@/config/constant";

export interface DistrictApiResponse {
  success: boolean;
  data: DistrictItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type DistrictSortBy = "name" | "createdAt";
export type DistrictSortOrder = "ASC" | "DESC";
type ImportStreamData = Record<string, unknown>;

export const getDistricts = async (
  page?: number,
  limit?: number,
  search?: string,
  stateId?: string,
  sortBy?: DistrictSortBy,
  sortOrder?: DistrictSortOrder,
): Promise<DistrictApiResponse> => {
  const response = await api.get("/districts", {
    params: {
      ...(page !== undefined ? { page } : {}),
      ...(limit !== undefined ? { limit } : {}),
      ...(search ? { search } : {}),
      ...(stateId ? { stateId } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
  });

  const responseData = response.data;
  return {
    success: responseData.success ?? true,
    data: responseData.data?.data || responseData.data || [],
    meta: responseData.data?.meta || responseData.meta,
  };
};

const DROPDOWN_PAGE_LIMIT = 100;
const DROPDOWN_MAX_PAGES = 50;

/** All districts for a state (for filters / cascading dropdowns). */
export const getAllDistricts = async (
  stateId: string,
  sortBy: DistrictSortBy = "name",
  sortOrder: DistrictSortOrder = "ASC",
): Promise<DistrictApiResponse> => {
  const first = await getDistricts(1, DROPDOWN_PAGE_LIMIT, undefined, stateId, sortBy, sortOrder);
  const all = [...first.data];
  let meta = first.meta;
  if (!meta?.hasNextPage) {
    return first;
  }

  let page = 1;
  let guard = 0;
  while (meta?.hasNextPage && guard < DROPDOWN_MAX_PAGES) {
    guard += 1;
    page += 1;
    const next = await getDistricts(page, DROPDOWN_PAGE_LIMIT, undefined, stateId, sortBy, sortOrder);
    all.push(...next.data);
    meta = next.meta;
  }

  return {
    ...first,
    data: all,
    meta: {
      ...meta,
      page: 1,
      limit: DROPDOWN_PAGE_LIMIT,
      total: all.length,
      totalPages: Math.ceil(all.length / DROPDOWN_PAGE_LIMIT) || 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

export const createDistrict = async (data: DistrictFormValues) => {
  const response = await api.post("/districts", data);
  return response.data;
};

export const updateDistrict = async (id: string, data: DistrictFormValues) => {
  const response = await api.patch(`/districts/${id}`, data);
  return response.data;
};

export const uploadDistrictExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("allOrNothing", "true");
  const response = await api.post("/districts/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadDistrictExcel = async () => {
  const response = await api.get("/districts/import-template", {
    responseType: "blob",
  });
  return response.data;
};

export const streamDistrictImport = async (
  jobId: string,
  onUpdate: (data: ImportStreamData) => void,
  signal?: AbortSignal
) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const sseUrl = `${BASE_URL}${SUBFIX}${API_VERSION}/districts/import/${jobId}/stream`;

  const response = await fetch(sseUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`SSE failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("id:")) continue;

      if (trimmedLine.includes("data:")) {
        try {
          const jsonStr = trimmedLine.substring(trimmedLine.indexOf("data:") + 5).trim();
          const payload = JSON.parse(jsonStr);
          const data = payload.data || payload;
          onUpdate(data);
        } catch (e) {
          console.error("Error parsing stream data chunk", e, trimmedLine);
        }
      }
    }
  }
};

export const downloadDistrictImportErrorSheet = async (jobId: string) => {
  const response = await api.get(`/districts/import/${jobId}/error-sheet`, {
    responseType: "blob",
  });
  return response.data;
};

