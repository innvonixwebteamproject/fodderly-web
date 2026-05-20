import { api } from "@/lib/axios.interceptors";
import { StateItem, StateFormValues } from "../types";
import { BASE_URL, SUBFIX, API_VERSION, STORAGE_KEYS } from "@/config/constant";

export interface MasterMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StateApiResponse {
  success: boolean;
  data: StateItem[];
  meta: MasterMeta;
}

export type StateSortBy = "name" | "createdAt";
export type StateSortOrder = "ASC" | "DESC";
type ImportStreamData = Record<string, unknown>;

export const getStates = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  sortBy?: StateSortBy,
  sortOrder?: StateSortOrder,
): Promise<StateApiResponse> => {
  const response = await api.get("/states", {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
  });

  const responseData = response.data;

  // Extract items from responseData.data or responseData.data.data
  let rawItems: unknown[] = [];
  if (Array.isArray(responseData.data)) {
    rawItems = responseData.data;
  } else if (responseData.data?.data && Array.isArray(responseData.data.data)) {
    rawItems = responseData.data.data;
  }

  // Map translations to name for consistent UI usage
  const items: StateItem[] = rawItems.map((item) => {
    const record = (item || {}) as Record<string, unknown>;
    const translations = (record.translations || {}) as Record<string, unknown>;
    return {
      ...(record as unknown as StateItem),
      // Use translations.en as fallback for name if name is missing
      name:
        (record.name as StateItem["name"]) ||
        (record.translations as StateItem["name"]) ||
        (translations.en as string) ||
        "-",
    };
  });

  // Handle variations in meta structure
  const meta: MasterMeta = responseData.meta || responseData.data?.meta || {
    page,
    limit,
    total: items.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Final fallback for hasNextPage
  return {
    success: responseData.success ?? true,
    data: items,
    meta: meta,
  };
};

export const createState = async (data: StateFormValues) => {
  const response = await api.post("/states", data);
  return response.data;
};

export const updateState = async (id: string, data: StateFormValues) => {
  const response = await api.patch(`/states/${id}`, data);
  return response.data;
};

export const uploadStateExcel = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("allOrNothing", "true");
  const response = await api.post("/states/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const downloadStateExcel = async () => {
  const response = await api.get("/states/import-template", {
    responseType: "blob",
  });
  return response.data;
};


export const streamStateImport = async (
  jobId: string,
  onUpdate: (data: ImportStreamData) => void,
  signal?: AbortSignal
) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const sseUrl = `${BASE_URL}${SUBFIX}${API_VERSION}/states/import/${jobId}/stream`;

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

export const downloadStateImportErrorSheet = async (jobId: string) => {
  const response = await api.get(`/states/import/${jobId}/error-sheet`, {
    responseType: "blob",
  });
  return response.data;
};

