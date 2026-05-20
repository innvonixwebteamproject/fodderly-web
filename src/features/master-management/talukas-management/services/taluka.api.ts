import { api } from "@/lib/axios.interceptors";
import { TalukaItem, TalukaFormValues } from "../types";
import { BASE_URL, SUBFIX, API_VERSION, STORAGE_KEYS } from "@/config/constant";

export interface TalukaApiResponse {
  success: boolean;
  data: TalukaItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type TalukaSortBy = "name" | "createdAt";
export type TalukaSortOrder = "ASC" | "DESC";
type ImportStreamData = Record<string, unknown>;

export const getTalukas = async (
  page?: number,
  limit?: number,
  search?: string,
  districtId?: string,
  stateId?: string,
  sortBy?: TalukaSortBy,
  sortOrder?: TalukaSortOrder,
): Promise<TalukaApiResponse> => {
  const response = await api.get("/talukas", {
    params: {
      ...(page !== undefined ? { page } : {}),
      ...(limit !== undefined ? { limit } : {}),
      ...(search ? { search } : {}),
      ...(districtId ? { districtId } : {}),
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

/** All talukas for filters / dropdowns (state and/or district). */
export const getAllTalukas = async (
  districtId?: string,
  stateId?: string,
  sortBy: TalukaSortBy = "name",
  sortOrder: TalukaSortOrder = "ASC",
): Promise<TalukaApiResponse> => {
  const first = await getTalukas(1, DROPDOWN_PAGE_LIMIT, undefined, districtId, stateId, sortBy, sortOrder);
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
    const next = await getTalukas(page, DROPDOWN_PAGE_LIMIT, undefined, districtId, stateId, sortBy, sortOrder);
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

export const createTaluka = async (data: TalukaFormValues) => {
  const { stateId: _stateId, ...payload } = data;
  const response = await api.post("/talukas", payload);
  return response.data;
};

export const updateTaluka = async (id: string, data: TalukaFormValues) => {
  const { stateId: _stateId, ...payload } = data;
  const response = await api.patch(`/talukas/${id}`, payload);
  return response.data;
};

export const uploadTalukaExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("allOrNothing", "true");
  const response = await api.post("/talukas/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadTalukaExcel = async () => {
  const response = await api.get("/talukas/import-template", {
    responseType: "blob",
  });
  return response.data;
};

export const streamTalukaImport = async (
  jobId: string,
  onUpdate: (data: ImportStreamData) => void,
  signal?: AbortSignal
) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const sseUrl = `${BASE_URL}${SUBFIX}${API_VERSION}/talukas/import/${jobId}/stream`;

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

export const downloadTalukaImportErrorSheet = async (jobId: string) => {
  const response = await api.get(`/talukas/import/${jobId}/error-sheet`, {
    responseType: "blob",
  });
  return response.data;
};

