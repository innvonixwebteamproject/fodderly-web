import { api } from "@/lib/axios.interceptors";
import { VillageItem, VillageFormValues } from "../types";
import { BASE_URL, SUBFIX, API_VERSION, STORAGE_KEYS } from "@/config/constant";

export interface VillageApiResponse {
  success: boolean;
  data: VillageItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type VillageSortBy = "name" | "createdAt";
export type VillageSortOrder = "ASC" | "DESC";
type ImportStreamData = Record<string, unknown>;

export const getVillages = async (
  page?: number,
  limit?: number,
  search?: string,
  talukaId?: string,
  districtId?: string,
  stateId?: string,
  sortBy?: VillageSortBy,
  sortOrder?: VillageSortOrder,
): Promise<VillageApiResponse> => {
  const response = await api.get("/villages", {
    params: {
      ...(page !== undefined ? { page } : {}),
      ...(limit !== undefined ? { limit } : {}),
      ...(search ? { search } : {}),
      ...(talukaId ? { talukaId } : {}),
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

export const createVillage = async (data: VillageFormValues) => {
  const { stateId: _stateId, districtId: _districtId, ...payload } = data;
  const response = await api.post("/villages", payload);
  return response.data;
};

export const updateVillage = async (id: string, data: VillageFormValues) => {
  const { stateId: _stateId, districtId: _districtId, ...payload } = data;
  const response = await api.patch(`/villages/${id}`, payload);
  return response.data;
};

export const uploadVillageExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("allOrNothing", "true");
  const response = await api.post("/villages/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadVillageExcel = async () => {
  const response = await api.get("/villages/import-template", {
    responseType: "blob",
  });
  return response.data;
};

export const streamVillageImport = async (
  jobId: string,
  onUpdate: (data: ImportStreamData) => void,
  signal?: AbortSignal
) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const sseUrl = `${BASE_URL}${SUBFIX}${API_VERSION}/villages/import/${jobId}/stream`;

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

export const downloadVillageImportErrorSheet = async (jobId: string) => {
  const response = await api.get(`/villages/import/${jobId}/error-sheet`, {
    params: { t: Date.now() },
    responseType: "blob",
  });
  return response.data;
};

