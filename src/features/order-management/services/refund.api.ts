import { api } from "@/lib/axios.interceptors";
import { PAYMENT_MODE_VALUES } from "../constants/order.constants";
import type { MasterMeta, PaymentMode } from "../types/order.types";
import type {
  AdminCancelledOrdersSortBy,
  CancellationRefundAuditEntry,
  CancellationRefundAuditResponse,
  CancellationRefundListFilters,
  CancelledBy,
  RefundInitiatePayload,
  RefundManualCompletePayload,
  RefundQueueItem,
  RefundsListResponse,
  RefundSortBy,
  RefundStatus,
} from "../types/refund.types";
import type { OrderCancellationReason } from "../types/order.types";

type ApiSortOrder = "ASC" | "DESC";

type WrappedList<T> = {
  success?: boolean;
  data?: T;
  meta?: MasterMeta;
  message?: string;
};

const isPaymentMode = (v: unknown): v is PaymentMode =>
  typeof v === "string" && (PAYMENT_MODE_VALUES as readonly string[]).includes(v);

const pickString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "value" in v && typeof (v as { value?: string }).value === "string") {
    return (v as { value: string }).value;
  }
  return undefined;
};

const pickNumber = (v: unknown): number => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
};

const looksLikeUuid = (s: string | undefined): boolean => {
  if (!s?.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
};

/** UUID for admin detail / refund routes. Human refs like `ODR…` must not be used as path `id`. */
const pickOrderUuidFromCancelledRow = (raw: Record<string, unknown>): string => {
  const nestedOrder =
    raw.order && typeof raw.order === "object" ? (raw.order as Record<string, unknown>) : null;
  const candidates = [
    pickString(raw.order_uuid),
    pickString(raw.orderUuid),
    pickString(raw.uuid),
    nestedOrder ? pickString(nestedOrder.id) : undefined,
    pickString(raw.id),
    pickString(raw.orderId),
    pickString(raw.order_id),
  ];
  for (const c of candidates) {
    if (c && looksLikeUuid(c)) return c.trim();
  }
  // Fallback: If no candidate is a valid UUID, return the first non-empty candidate
  for (const c of candidates) {
    if (c?.trim()) return c.trim();
  }
  return "";
};

const pickHumanOrderNumberFromCancelledRow = (raw: Record<string, unknown>, orderUuid: string): string => {
  const nestedOrder =
    raw.order && typeof raw.order === "object" ? (raw.order as Record<string, unknown>) : null;
  const explicit =
    pickString(raw.order_number) ??
    pickString(raw.orderNumber) ??
    pickString(raw.user_orderId) ??
    pickString(raw.user_order_id) ??
    pickString(raw.userOrderId) ??
    (nestedOrder ? pickString(nestedOrder.orderNumber) ?? pickString(nestedOrder.order_number) : undefined);
  if (explicit) return explicit;
  const ambiguous = pickString(raw.order_id) ?? pickString(raw.orderId);
  if (ambiguous && !looksLikeUuid(ambiguous)) return ambiguous;
  return orderUuid || ambiguous || "—";
};

const REFUND_STATUSES: readonly RefundStatus[] = [
  "REFUND_INITIATED",
  "REFUND_PROCESSING",
  "REFUND_PROCESSED",
  "REFUND_FAILED",
  "REFUND_NOT_APPLICABLE",
];

const CANCELLED_BY: readonly CancelledBy[] = ["FARMER", "FODDERMAN", "ADMIN", "SYSTEM", "PARTNER"];

const isRefundStatus = (v: unknown): v is RefundStatus =>
  typeof v === "string" && REFUND_STATUSES.includes(v as RefundStatus);

const isCancelledBy = (v: unknown): v is CancelledBy =>
  typeof v === "string" && CANCELLED_BY.includes(v as CancelledBy);

const mapApiRefundSlugToRefundStatus = (raw: unknown): RefundStatus => {
  const s = (pickString(raw) ?? "").toLowerCase();
  if (s === "refunded") return "REFUND_PROCESSED";
  if (s === "refund_initiated") return "REFUND_PROCESSING";
  if (s === "refund_failed") return "REFUND_FAILED";
  if (s === "not_applicable") return "REFUND_NOT_APPLICABLE";
  if (s === "pending_refund") return "REFUND_INITIATED";
  return "REFUND_INITIATED";
};

const parseRefundStatus = (raw: unknown): RefundStatus => {
  if (isRefundStatus(raw)) return raw;
  return mapApiRefundSlugToRefundStatus(raw);
};

const mapApiCancelledByToCancelledBy = (raw: unknown): CancelledBy | null => {
  const s = (pickString(raw) ?? "").toLowerCase();
  const upper: Record<string, CancelledBy> = {
    admin: "ADMIN",
    farmer: "FARMER",
    fodderman: "FODDERMAN",
    partner: "PARTNER",
    system: "SYSTEM",
  };
  return upper[s] ?? null;
};

const parseCancelledBy = (raw: unknown): CancelledBy | null => {
  if (isCancelledBy(raw)) return raw;
  return mapApiCancelledByToCancelledBy(raw);
};

const mapAdminPaymentModeToPaymentMode = (raw: unknown): PaymentMode | null => {
  const s = (pickString(raw) ?? "").toLowerCase().replace(/\s+/g, "_");
  if (!s) return null;
  if (s === "cash" || s === "cash_in_hand" || s === "cod" || s === "cash_on_delivery") return "CASH_IN_HAND";
  if (
    s === "online" ||
    s === "online_payment" ||
    s === "razorpay" ||
    s === "upi" ||
    s === "card" ||
    s === "debit_card" ||
    s === "credit_card" ||
    s === "netbanking" ||
    s === "net_banking" ||
    s === "digital" ||
    s === "wallet" ||
    s === "prepaid"
  ) {
    return "ONLINE_PAYMENT";
  }
  return null;
};

const parsePaymentMode = (raw: unknown): PaymentMode | null | undefined => {
  if (raw == null) return undefined;
  if (isPaymentMode(raw)) return raw;
  return mapAdminPaymentModeToPaymentMode(raw) ?? undefined;
};

const mapStakeholder = (raw: unknown) => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const uuid = pickString(o.uuid) || pickString(o.id);
  if (!uuid) return null;
  return {
    uuid,
    name: pickString(o.name) || "—",
    mobile: pickString(o.mobile) || pickString(o.phone),
  };
};

const dateInputStartIso = (date: string | undefined): string | undefined => {
  const d = date?.trim();
  if (!d) return undefined;
  const x = new Date(`${d}T00:00:00`);
  return Number.isNaN(x.getTime()) ? undefined : x.toISOString();
};

const dateInputEndIso = (date: string | undefined): string | undefined => {
  const d = date?.trim();
  if (!d) return undefined;
  const x = new Date(`${d}T23:59:59.999`);
  return Number.isNaN(x.getTime()) ? undefined : x.toISOString();
};

export const mapAdminCancelledRefundRow = (raw: Record<string, unknown>): RefundQueueItem => {
  const orderUuid = pickOrderUuidFromCancelledRow(raw);
  const humanOrderId = pickHumanOrderNumberFromCancelledRow(raw, orderUuid);

  const refundStatus = parseRefundStatus(raw.refund_status ?? raw.refundStatus);
  const cancelledBy = parseCancelledBy(raw.cancelled_by ?? raw.cancelledBy);
  const paymentMode = parsePaymentMode(
    raw.payment_mode ??
      raw.paymentMode ??
      raw.payment_method ??
      raw.paymentMethod ??
      raw.pay_mode ??
      raw.payMode,
  );

  const reasonRaw =
    pickString(raw.cancellation_reason) ?? pickString(raw.cancellationReason) ?? undefined;

  return {
    orderId: orderUuid,
    orderNumber: humanOrderId,
    refundAmount: pickNumber(raw.refund_amount ?? raw.refundAmount ?? raw.amount),
    farmerName: pickString(raw.farmer_name) ?? pickString(raw.farmerName) ?? "—",
    farmerMobile:
      pickString(raw.farmer_mobile) ??
      pickString(raw.farmerMobile) ??
      pickString(raw.farmerPhone) ??
      pickString(raw.mobile) ??
      null,
    cancelledAt:
      pickString(raw.cancelled_date) ??
      pickString(raw.cancelledDate) ??
      pickString(raw.cancelledAt) ??
      pickString(raw.cancellationDate) ??
      "",
    refundDate:
      pickString(raw.refund_processed_at) ??
      pickString(raw.refundProcessedAt) ??
      pickString(raw.refundDate) ??
      pickString(raw.refundedAt) ??
      null,
    cancellationReason: (reasonRaw as OrderCancellationReason | undefined) ?? null,
    cancellationReasonLabel:
      pickString(raw.cancellation_reason_label) ?? pickString(raw.cancellationReasonLabel) ?? null,
    refundStatus,
    paymentReference:
      pickString(raw.payment_reference) ?? pickString(raw.paymentReference) ?? null,
    cancelledBy,
    cancelledByLabel: pickString(raw.cancelled_by_label) ?? pickString(raw.cancelledByLabel) ?? null,
    paymentMode,
    paymentModeApiRaw:
      pickString(raw.payment_mode) ??
      pickString(raw.paymentMode) ??
      pickString(raw.payment_method) ??
      pickString(raw.paymentMethod) ??
      null,
    farmerVillage: pickString(raw.farmer_village) ?? pickString(raw.farmerVillage) ?? null,
    fodderman: mapStakeholder(raw.fodderman ?? raw.foddermanProfile),
    partner: mapStakeholder(raw.partner ?? raw.partnerProfile),
    originalOrderTotal:
      pickNumber(
        raw.original_order_total ?? raw.originalOrderTotal ?? raw.orderTotal ?? raw.grandTotal ?? raw.totalPaid,
      ) || null,
  };
};

export const mapRefundRow = (raw: Record<string, unknown>): RefundQueueItem => {
  const orderId = pickString(raw.orderId) ?? pickString(raw.id) ?? "";
  const orderNumber = pickString(raw.orderNumber) ?? orderId;
  const status = parseRefundStatus(raw.refundStatus ?? raw.refund_status);
  const reason = pickString(raw.cancellationReason) ?? pickString(raw.cancellation_reason);
  const paymentModeRaw = raw.paymentMode ?? raw.payment_mode;
  const paymentMode = parsePaymentMode(paymentModeRaw);
  const cancelledByRaw = raw.cancelledBy ?? raw.cancelled_by;
  const cancelledBy = parseCancelledBy(cancelledByRaw);

  return {
    orderId,
    orderNumber,
    refundAmount: pickNumber(raw.refundAmount ?? raw.refund_amount ?? raw.amount),
    farmerName: pickString(raw.farmerName) ?? pickString(raw.farmer_name) ?? "—",
    farmerMobile:
      pickString(raw.farmerMobile) ??
      pickString(raw.farmer_mobile) ??
      pickString(raw.farmerPhone) ??
      pickString(raw.mobile) ??
      null,
    cancelledAt:
      pickString(raw.cancelledAt) ??
      pickString(raw.cancelled_date) ??
      pickString(raw.cancellationDate) ??
      "",
    refundDate:
      pickString(raw.refundDate) ??
      pickString(raw.refund_processed_at) ??
      pickString(raw.refundedAt) ??
      null,
    cancellationReason: (reason as OrderCancellationReason | undefined) ?? null,
    cancellationReasonLabel: pickString(raw.cancellationReasonLabel) ?? pickString(raw.cancellation_reason_label) ?? null,
    refundStatus: status,
    paymentReference: pickString(raw.paymentReference) ?? null,
    cancelledBy,
    cancelledByLabel: pickString(raw.cancelledByLabel) ?? null,
    paymentMode,
    paymentModeApiRaw: pickString(raw.paymentMode) ?? pickString(raw.payment_mode) ?? null,
    farmerVillage: pickString(raw.farmerVillage) ?? pickString(raw.farmer_village) ?? null,
    fodderman: mapStakeholder(raw.fodderman ?? raw.foddermanProfile),
    partner: mapStakeholder(raw.partner ?? raw.partnerProfile),
    originalOrderTotal:
      pickNumber(raw.originalOrderTotal ?? raw.orderTotal ?? raw.grandTotal ?? raw.totalPaid) || null,
  };
};

const getFallbackMeta = (page: number, limit: number, total: number): MasterMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

/** OpenAPI `sortBy` values for `POST /orders/admin/cancelled`. */
const ADMIN_CANCELLED_API_SORT_VALUES = new Set<string>([
  "orderId",
  "farmer",
  "cancellationDate",
  "refundAmount",
  "refundStatus",
  "createdAt",
]);

/** Map table column ids / legacy values to API `sortBy` (backend rejects e.g. `cancelledAt`). */
const toAdminCancelledApiSortBy = (sortBy: string): AdminCancelledOrdersSortBy => {
  const key = sortBy.trim();
  const columnAliases: Record<string, AdminCancelledOrdersSortBy> = {
    cancelledAt: "cancellationDate",
    orderNumber: "orderId",
    farmerName: "farmer",
  };
  const mapped = columnAliases[key];
  if (mapped) return mapped;
  if (ADMIN_CANCELLED_API_SORT_VALUES.has(key)) return key as AdminCancelledOrdersSortBy;
  return "cancellationDate";
};

const buildAdminCancelledRefundRequestBody = (
  filters: CancellationRefundListFilters,
  sortBy?: AdminCancelledOrdersSortBy,
  sortOrder?: ApiSortOrder,
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (filters.search?.trim()) body.search = filters.search.trim();
  if (filters.refundStatuses?.length) body.refundStatuses = filters.refundStatuses;
  if (filters.cancelledBy?.length) body.cancelledBy = filters.cancelledBy;
  if (filters.paymentModes?.length) body.paymentModes = filters.paymentModes;
  const cFrom = dateInputStartIso(filters.cancellationFrom);
  const cTo = dateInputEndIso(filters.cancellationTo);
  const rFrom = dateInputStartIso(filters.refundFrom);
  const rTo = dateInputEndIso(filters.refundTo);
  if (cFrom) body.cancellationFrom = cFrom;
  if (cTo) body.cancellationTo = cTo;
  if (rFrom) body.refundFrom = rFrom;
  if (rTo) body.refundTo = rTo;
  if (sortBy) body.sortBy = toAdminCancelledApiSortBy(sortBy);
  if (sortOrder) body.sortOrder = sortOrder;
  return body;
};

type AdminCancelledListPayload = {
  items?: unknown[];
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

/** `POST /orders/admin/cancelled` — response body may be `{ items, pagination }` or wrapped `{ success, data: { items, pagination } }`. */
const unwrapAdminCancelledListPayload = (root: unknown): AdminCancelledListPayload => {
  if (!root || typeof root !== "object") return {};
  const r = root as Record<string, unknown>;
  const nested = r.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const d = nested as Record<string, unknown>;
    if (Array.isArray(d.items) || d.pagination != null) {
      return {
        items: Array.isArray(d.items) ? d.items : undefined,
        pagination: d.pagination as AdminCancelledListPayload["pagination"],
      };
    }
  }
  return {
    items: Array.isArray(r.items) ? r.items : undefined,
    pagination: r.pagination as AdminCancelledListPayload["pagination"],
  };
};

export const getCancelledRefundsQueue = async (
  page: number,
  limit: number,
  filters: CancellationRefundListFilters,
  sortBy?: AdminCancelledOrdersSortBy,
  sortOrder?: ApiSortOrder,
): Promise<RefundsListResponse> => {
  const requestBody = buildAdminCancelledRefundRequestBody(filters, sortBy, sortOrder);
  const response = await api.post<AdminCancelledListPayload | Record<string, unknown>>(
    "/orders/admin/cancelled",
    requestBody,
    {
      params: { page, limit },
    },
  );

  const body = unwrapAdminCancelledListPayload(response.data);
  const rawList = Array.isArray(body.items) ? body.items : [];
  const data = rawList.map((row) =>
    mapAdminCancelledRefundRow(row && typeof row === "object" ? (row as Record<string, unknown>) : {}),
  );
  const pg = body.pagination;
  const meta: MasterMeta =
    pg != null
      ? {
          page: pg.current_page,
          limit: pg.per_page,
          total: pg.total,
          totalPages: pg.last_page,
          hasNextPage: pg.last_page > 0 && pg.current_page < pg.last_page,
          hasPreviousPage: pg.current_page > 1,
        }
      : getFallbackMeta(page, limit, data.length);

  return { data, meta };
};

const mapAuditEntry = (raw: Record<string, unknown>, index: number): CancellationRefundAuditEntry => ({
  id: pickString(raw.id) ?? `audit-${index}`,
  performedAt: pickString(raw.performedAt) ?? pickString(raw.createdAt) ?? pickString(raw.timestamp) ?? "",
  action: pickString(raw.action) ?? pickString(raw.description) ?? "",
  actorRole: pickString(raw.actorRole) ?? pickString(raw.role) ?? "",
  actorName: pickString(raw.actorName) ?? pickString(raw.userName) ?? "",
  refundAmount: raw.refundAmount != null ? pickNumber(raw.refundAmount) : null,
  refundMode: pickString(raw.refundMode) ?? pickString(raw.paymentMode) ?? null,
  transactionReference: pickString(raw.transactionReference) ?? null,
  bankUtr: pickString(raw.bankUtr) ?? pickString(raw.utr) ?? null,
  deviceInfo: pickString(raw.deviceInfo) ?? pickString(raw.device) ?? null,
  ipAddress: pickString(raw.ipAddress) ?? pickString(raw.ip) ?? null,
});

export const getCancellationRefundAudit = async (orderId: string): Promise<CancellationRefundAuditResponse> => {
  const response = await api.get<WrappedList<unknown[] | { entries?: unknown[] }>>(
    `/orders/${orderId}/cancellation-refund-audit`,
  );

  const body = response.data?.data;
  let rawList: unknown[] = [];
  if (Array.isArray(body)) {
    rawList = body;
  } else if (body && typeof body === "object" && "entries" in body && Array.isArray((body as { entries: unknown[] }).entries)) {
    rawList = (body as { entries: unknown[] }).entries;
  }

  const entries = rawList.map((row, i) =>
    mapAuditEntry(row && typeof row === "object" ? (row as Record<string, unknown>) : {}, i),
  );

  return { entries };
};

export const getRefundQueue = async (
  page: number,
  limit: number,
  sortBy?: RefundSortBy,
  sortOrder?: ApiSortOrder,
): Promise<RefundsListResponse> => {
  const response = await api.get<WrappedList<unknown[]>>("/orders/refunds", {
    params: {
      page,
      limit,
      ...(sortBy ? { sortBy } : {}),
      ...(sortOrder ? { sortOrder } : {}),
    },
  });

  const body = response.data;
  const rawList = Array.isArray(body.data) ? body.data : [];
  const data = rawList.map((row) =>
    mapRefundRow(row && typeof row === "object" ? (row as Record<string, unknown>) : {}),
  );
  const meta = body.meta ?? getFallbackMeta(page, limit, data.length);

  return { data, meta };
};

/** Admin retry: `POST /orders/:id/refund` — body matches `CancelOrderDto`; 200 is typically `{ message }` only. */
export const initiateRefund = async (orderId: string, payload?: RefundInitiatePayload): Promise<void> => {
  const reason = (payload?.reason?.trim() && payload.reason.trim()) || "OTHER";
  await api.post<{ message?: string }>(`/orders/${orderId}/refund`, { reason });
};

export const completeManualRefund = async (
  orderId: string,
  payload: RefundManualCompletePayload,
): Promise<RefundQueueItem> => {
  const body: Record<string, string | undefined> = {};
  const ref = payload.transactionReference?.trim();
  const utr = payload.bankUtr?.trim();
  if (ref) body.transactionReference = ref;
  if (utr) body.bankUtr = utr;

  const response = await api.post<WrappedList<Record<string, unknown>>>(
    `/orders/${orderId}/refunds/manual-complete`,
    body,
  );
  const raw = response.data?.data;
  if (!raw || typeof raw !== "object") {
    throw new Error(response.data?.message || "Manual refund update failed");
  }
  return mapRefundRow(raw);
};
