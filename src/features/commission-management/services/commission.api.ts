import { api } from "@/lib/axios.interceptors";
import type {
  CommissionAuditLog,
  CommissionLedgerItem,
  CommissionListMeta,
  CommissionResponse,
  CommissionUpdatePayload,
  CommissionUpdateFormValues,
  GlobalCommissionSettings,
  OrderCommissionDetail,
  PayoutHistoryItem,
  PayoutSettlementPayload,
  PayoutSettlementResponse,
  FoddermanCommission,
  FoddermanCommissionStatsResponse,
  CreatePayoutDto,
  CreatePayoutResponse,
} from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: CommissionListMeta };
  meta?: CommissionListMeta;
  timestamp?: string;
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

const createFallbackMeta = (page: number, limit: number, total: number): CommissionListMeta => ({
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
): { items: T[]; meta: CommissionListMeta } => {
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
        (response.data as { meta?: CommissionListMeta }).meta ||
        response.meta ||
        createFallbackMeta(page, limit, response.data.data.length),
    };
  }

  return {
    items: [],
    meta: response.meta || createFallbackMeta(page, limit, 0),
  };
};

// Commission Settings APIs
export const getCurrentCommission = async (
  signal?: AbortSignal,
): Promise<{ data: GlobalCommissionSettings; message: string }> => {
  const response = await api.get<{ message: string; commission: CommissionResponse }>("/commission", { signal });
  const payload = response.data;

  if (!payload.commission) {
    throw new Error(payload.message || "Failed to fetch commission data");
  }

  return {
    data: {
      currentRate: payload.commission.percent,
      updatedRate: payload.commission.percent,
    },
    message: payload.message || "Commission fetched successfully",
  };
};

export const updateCommission = async (
  values: CommissionUpdateFormValues,
): Promise<{ data: GlobalCommissionSettings; message: string }> => {
  const payload: CommissionUpdatePayload = {
    percent: values.percent,
    reason: values.reason,
  };

  const response = await api.patch<{ message: string; commission: CommissionResponse }>("/commission", payload);
  const responseData = response.data;

  if (!responseData.commission) {
    throw new Error(responseData.message || "Failed to update commission");
  }

  return {
    data: {
      currentRate: responseData.commission.percent,
      updatedRate: responseData.commission.percent,
    },
    message: responseData.message || "Commission updated successfully",
  };
};

// Commission Audit Logs APIs
export const getCommissionAuditLogs = async ({
  page = 1,
  limit = 10,
  search,
  sortBy = "createdAt",
  sortOrder = "DESC",
  signal,
}: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  signal?: AbortSignal;
}): Promise<{ data: CommissionAuditLog[]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<{ message: string; data?: CommissionAuditLog[]; meta?: CommissionListMeta }>("/commission/logs", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
    signal,
  });

  const items = response.data.data || [];
  const meta = response.data.meta || createFallbackMeta(page, limit, items.length);

  return {
    data: items,
    meta,
    message: response.data.message || "Audit logs fetched successfully",
  };
};

// Commission Ledger APIs
export const getCommissionLedger = async ({
  page = 1,
  limit = 10,
  search,
  district,
  sortBy = "createdAt",
  sortOrder = "DESC",
  signal,
}: {
  page?: number;
  limit?: number;
  search?: string;
  district?: string;
  sortBy?: string;
  sortOrder?: string;
  signal?: AbortSignal;
}): Promise<{ data: CommissionLedgerItem[]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<WrappedResponse<CommissionLedgerItem[]>>("/commission/ledger", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(district?.trim() ? { district } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
    signal,
  });

  const { items, meta } = unwrapCollection(response.data, page, limit);

  return {
    data: items,
    meta,
    message: response.data.message || "Commission ledger fetched successfully",
  };
};

// Order-wise Commission Details APIs
export const getOrderCommissionDetails = async ({
  foddermanId,
  page = 1,
  limit = 10,
  signal,
}: {
  foddermanId: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{ data: OrderCommissionDetail[]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<WrappedResponse<OrderCommissionDetail[]>>(
    `/commission/ledger/${foddermanId}/orders`,
    {
      params: {
        page,
        limit,
      },
      signal,
    },
  );

  const { items, meta } = unwrapCollection(response.data, page, limit);

  return {
    data: items,
    meta,
    message: response.data.message || "Order commission details fetched successfully",
  };
};

// Payout Settlement APIs
export const settlePayout = async (
  values: PayoutSettlementPayload,
): Promise<{ data: PayoutSettlementResponse["data"]; message: string }> => {
  const response = await api.post<WrappedResponse<PayoutSettlementResponse["data"]>>(
    "/commission/payouts/settle",
    values,
  );

  const data = unwrapPayloadData<PayoutSettlementResponse["data"]>(response.data);
  const message = isRecord(response.data) && typeof response.data.message === "string"
    ? response.data.message
    : "Payout settled successfully";

  if (!data) throw new Error(message || "Unable to settle payout");

  return { data, message };
};

// Payout History APIs
export const getPayoutHistory = async ({
  page = 1,
  limit = 10,
  search,
  startDate,
  endDate,
  sortBy = "createdAt",
  sortOrder = "DESC",
  signal,
}: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  signal?: AbortSignal;
}): Promise<{ data: PayoutHistoryItem[]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<WrappedResponse<PayoutHistoryItem[]>>("/commission/payouts/history", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
    signal,
  });

  const { items, meta } = unwrapCollection(response.data, page, limit);

  return {
    data: items,
    meta,
    message: response.data.message || "Payout history fetched successfully",
  };
};

// Export Payout History
export const exportPayoutHistory = async ({
  format = "csv",
  startDate,
  endDate,
  search,
}: {
  format?: "csv" | "excel";
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<Blob> => {
  const response = await api.get("/commission/payouts/history/export", {
    params: {
      format,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(search?.trim() ? { search: search.trim() } : {}),
    },
    responseType: "blob",
  });

  return response.data;
};

// Fodderman Commissions (Admin)
export const getFoddermanCommissions = async ({
  foddermanId,
  status,
  page = 1,
  limit = 10,
  signal,
}: {
  foddermanId?: string;
  status?: "pending" | "paid";
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{ data: FoddermanCommission[]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<{ message: string; data?: FoddermanCommission[]; meta?: CommissionListMeta }>(
    "/commission/fodderman-commissions",
    {
      params: {
        page,
        limit,
        ...(foddermanId?.trim() ? { foddermanId } : {}),
        ...(status ? { status } : {}),
      },
      signal,
    },
  );

  const items = response.data.data || [];
  const meta = response.data.meta || createFallbackMeta(page, limit, items.length);

  return {
    data: items,
    meta,
    message: response.data.message || "Fodderman commissions fetched successfully",
  };
};

// My Commissions (Fodderman)
export const getMyCommissions = async ({
  status,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  signal,
}: {
  status?: "pending" | "paid";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{ data: FoddermanCommissionStatsResponse["data"]; meta: CommissionListMeta; message: string }> => {
  const response = await api.get<FoddermanCommissionStatsResponse>("/commission/my-commissions", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    signal,
  });

  const meta = response.data.meta || createFallbackMeta(page, limit, response.data.data?.commissions?.length || 0);

  return {
    data: response.data.data,
    meta,
    message: response.data.message || "My commissions fetched successfully",
  };
};

// Export My Commissions
export const exportMyCommissions = async ({
  status,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}: {
  status?: "pending" | "paid";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<Blob> => {
  const response = await api.get("/commission/my-commissions/export", {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
    responseType: "blob",
  });

  return response.data;
};

// Create Payout
export const createPayout = async (
  values: CreatePayoutDto,
): Promise<{ data: CreatePayoutResponse["data"]; message: string }> => {
  const response = await api.post<{ message: string; data?: CreatePayoutResponse["data"] }>(
    "/commission/payouts",
    values,
  );

  if (!response.data.data) {
    throw new Error(response.data.message || "Failed to create payout");
  }

  return {
    data: response.data.data,
    message: response.data.message || "Payout created successfully",
  };
};

// Download Payout Report
export const downloadPayoutReport = async ({
  foddermanId,
  startDate,
  endDate,
  status,
}: {
  foddermanId?: string;
  startDate?: string;
  endDate?: string;
  status?: "pending" | "paid";
}): Promise<Blob> => {
  const response = await api.get("/commission/payouts/report", {
    params: {
      ...(foddermanId?.trim() ? { foddermanId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(status ? { status } : {}),
    },
    responseType: "blob",
  });

  return response.data;
};
