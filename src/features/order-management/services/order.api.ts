import { api } from "@/lib/axios.interceptors";
import type {
  AdminCancelOrderPayload,
  AdminOrderDetail,
  AdminOrderListApiSortBy,
  AdminOrderListApiStatus,
  AdminOrderListItem,
  AuditEventType,
  DeliveryEtaHistoryEntry,
  ForceDeliverPayload,
  MasterMeta,
  OrderCancellationReason,
  OrderListFilters,
  OrderSortBy,
  OrderStatus,
  OrdersListResponse,
  PaymentMode,
  PaymentStatus,
  UpdateExpectedDeliveryPayload,
  OrderExportJobResponse,
  OrderExportJobStatus,
  PartnerDailyOrderListFilters,
} from "../types/order.types";
import { serializeUpdateExpectedDeliveryBody } from "../types/order.types";
import { ORDER_STATUS_VALUES, PAYMENT_MODE_VALUES, PAYMENT_STATUS_VALUES } from "../constants/order.constants";

type ApiSortOrder = "ASC" | "DESC";

type WrappedList<T> = {
  success?: boolean;
  data?: T;
  meta?: MasterMeta;
  message?: string;
};

type WrappedOne<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const getFallbackMeta = (page: number, limit: number, total: number): MasterMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

/** Normalize list responses: raw array, `{ data, meta }`, or `{ items, pagination }`. */
const parseOrdersListEnvelope = (
  body: unknown,
  page: number,
  limit: number,
): { rawRows: unknown[]; meta: MasterMeta } => {
  if (Array.isArray(body)) {
    const list = body;
    const hasNext = list.length >= limit;
    const loaded = (page - 1) * limit + list.length;
    return {
      rawRows: list,
      meta: {
        page,
        limit,
        total: hasNext ? loaded + 1 : loaded,
        totalPages: hasNext ? page + 1 : page,
        hasNextPage: hasNext,
        hasPreviousPage: page > 1,
      },
    };
  }
  if (!body || typeof body !== "object") {
    return { rawRows: [], meta: getFallbackMeta(page, limit, 0) };
  }
  const b = body as Record<string, unknown>;
  if (Array.isArray(b.data)) {
    const list = b.data;
    return {
      rawRows: list,
      meta: (b.meta as MasterMeta | undefined) ?? getFallbackMeta(page, limit, list.length),
    };
  }
  if (Array.isArray(b.items)) {
    const list = b.items;
    const pg = b.pagination as
      | { current_page: number; per_page: number; total: number; last_page: number }
      | undefined;
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
        : getFallbackMeta(page, limit, list.length);
    return { rawRows: list, meta };
  }
  return { rawRows: [], meta: getFallbackMeta(page, limit, 0) };
};

const buildPartnerListRequestBody = (status?: AdminOrderListApiStatus | ""): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (status) {
    /** Partner `POST /orders/partner/list` still expects legacy pipeline slugs on `status`. */
    const partnerStatusQuery: Record<AdminOrderListApiStatus, string> = {
      unpaid: "unpaid",
      pending: "pending",
      approved: "approved",
      rejected: "rejected",
      cancelled: "cancelled",
      dispatched: "dispatched",
      delivered: "delivered",
    };
    body.status = partnerStatusQuery[status];
  }
  return body;
};

export const getPartnerOrders = async (
  page: number,
  limit: number,
  filters: PartnerDailyOrderListFilters = {},
  sortBy?: string,
  sortOrder?: "ASC" | "DESC",
): Promise<OrdersListResponse> => {
  const status = filters?.status ? buildPartnerListRequestBody(filters.status).status : undefined;
  const q = filters?.search || undefined;

  const body: Record<string, unknown> = {};
  if (status) body.status = status;
  if (q) body.search = q;
  if (sortBy) body.sortBy = sortBy;
  if (sortOrder) body.sortOrder = sortOrder;
  if (filters?.dateFilter) body.dateFilter = filters.dateFilter;
  if (filters?.fromDate) body.fromDate = filters.fromDate;
  if (filters?.toDate) body.toDate = filters.toDate;

  const response = await api.post<unknown>("/orders/partner/list", body, {
    params: { page, limit },
  });
  const { rawRows, meta } = parseOrdersListEnvelope(response.data, page, limit);
  const data = rawRows.map((row) =>
    mapPartnerListApiRowToItem(row && typeof row === "object" ? (row as Record<string, unknown>) : {}),
  );
  return { data, meta };
};

export const getPartnerOrderById = async (id: string): Promise<AdminOrderDetail> => {
  const response = await api.get<WrappedOne<Record<string, unknown>>>(
    `/orders/partner/${encodeURIComponent(id)}/detail`,
  );
  const raw = response.data?.data;
  if (!raw || typeof raw !== "object") {
    throw new Error(response.data?.message || "Order not found");
  }
  return mapAdminDetailApiToAdminOrderDetail(raw as Record<string, unknown>);
};

const isOrderStatus = (v: unknown): v is OrderStatus =>
  typeof v === "string" && (ORDER_STATUS_VALUES as readonly string[]).includes(v);

const isPaymentMode = (v: unknown): v is PaymentMode =>
  typeof v === "string" && (PAYMENT_MODE_VALUES as readonly string[]).includes(v);

const isPaymentStatus = (v: unknown): v is PaymentStatus =>
  typeof v === "string" && (PAYMENT_STATUS_VALUES as readonly string[]).includes(v);

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

/** `delayStatus` from order detail API — undefined when field omitted. */
const parseApiDelayStatus = (raw: Record<string, unknown>): boolean | undefined => {
  if (raw.delayStatus === undefined || raw.delayStatus === null) {
    return undefined;
  }
  return Boolean(raw.delayStatus);
};

const resolveOrderDelayFlags = (
  raw: Record<string, unknown>,
  fallbackDelayed?: boolean | null,
): { delayStatus: boolean | null; isDelayed: boolean } => {
  const delayStatus = parseApiDelayStatus(raw);
  if (delayStatus !== undefined) {
    return { delayStatus, isDelayed: delayStatus };
  }
  const isDelayed = Boolean(raw.isDelayed ?? raw.delayed ?? raw.delayFlag ?? fallbackDelayed);
  return { delayStatus: null, isDelayed };
};

const mapStakeholder = (
  raw: unknown,
): { id: string; name: string; mobile?: string | null; villageName?: string | null; stateName?: string | null } | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickString(o.id) ?? pickString(o.userId) ?? pickString(o.uuid) ?? "";
  const name =
    pickString(o.name) ??
    pickString(o.fullName) ??
    [pickString(o.firstName), pickString(o.lastName)].filter(Boolean).join(" ").trim();
  if (!id || !name) return null;
  const villageNested = o.village;
  const villageRec =
    villageNested && typeof villageNested === "object"
      ? (villageNested as Record<string, unknown>)
      : null;
  const stateNested = o.state;
  const stateRec =
    stateNested && typeof stateNested === "object" ? (stateNested as Record<string, unknown>) : null;
  return {
    id,
    name,
    mobile: pickString(o.mobile) ?? pickString(o.mobileNumber) ?? null,
    villageName: pickString(o.villageName) ?? pickString(villageRec?.name) ?? null,
    stateName: pickString(o.stateName) ?? pickString(stateRec?.name) ?? null,
  };
};

export const mapListOrder = (raw: Record<string, unknown>): AdminOrderListItem => {
  const id = pickString(raw.id) ?? "";
  const orderNumber = pickString(raw.orderNumber) ?? pickString(raw.orderId) ?? id;
  const placedAt = pickString(raw.placedAt) ?? pickString(raw.createdAt) ?? new Date(0).toISOString();
  const farmerRaw = raw.farmer ?? raw.farmerProfile;
  const farmerObj =
    farmerRaw && typeof farmerRaw === "object" ? (farmerRaw as Record<string, unknown>) : {};
  const villageNested = farmerObj.village;
  const villageRec =
    villageNested && typeof villageNested === "object"
      ? (villageNested as Record<string, unknown>)
      : null;
  const farmer = {
    id: pickString(farmerObj.id) ?? "",
    name:
      pickString(farmerObj.name) ??
      pickString(farmerObj.fullName) ??
      (([pickString(farmerObj.firstName), pickString(farmerObj.lastName)].filter(Boolean).join(" ").trim()) ||
        "Unknown"),
    mobile: pickString(farmerObj.mobile) ?? pickString(farmerObj.mobileNumber) ?? null,
    villageName: pickString(farmerObj.villageName) ?? pickString(villageRec?.name) ?? null,
  };

  const orderStatus = isOrderStatus(raw.orderStatus) ? raw.orderStatus : "PENDING_ORDER";
  const paymentMode = isPaymentMode(raw.paymentMode) ? raw.paymentMode : "CASH_IN_HAND";
  const paymentStatus = isPaymentStatus(raw.paymentStatus) ? raw.paymentStatus : "PENDING";

  const summaryItems = mapLineItems(raw.lineItems ?? raw.items ?? raw.orderLines);
  const nameSet = new Set(summaryItems.map((i) => i.productName).filter(Boolean));
  const catSet = new Set(
    summaryItems.map((i) => i.categoryName).filter((c): c is string => Boolean(c && String(c).trim())),
  );
  const productNamesSummary =
    nameSet.size > 0
      ? [...nameSet].join(", ")
      : pickString(raw.productNamesSummary) ?? pickString(raw.productsSummary) ?? null;
  const productCategoriesSummary =
    catSet.size > 0
      ? [...catSet].join(", ")
      : pickString(raw.productCategoriesSummary) ?? pickString(raw.categoriesSummary) ?? null;

  return {
    id,
    orderNumber,
    placedAt,
    farmer,
    fodderman: mapStakeholder(raw.fodderman ?? raw.foddermanProfile),
    partner: mapStakeholder(raw.partner ?? raw.partnerProfile),
    totalAmount: pickNumber(raw.totalAmount ?? raw.grandTotal ?? raw.amount),
    paymentMode,
    paymentStatus,
    orderStatus,
    expectedDeliveryDate:
      pickString(raw.expectedDeliveryDate) ??
      pickString(raw.scheduledDeliveryDate) ??
      pickString(raw.expectedDeliveryAt) ??
      null,
    dispatchedAt: pickString(raw.dispatchedAt) ?? pickString(raw.dispatchAt) ?? pickString(raw.dispatchedAtUtc) ?? null,
    deliveredAt: pickString(raw.deliveredAt) ?? pickString(raw.deliveredAtUtc) ?? null,
    isDelayed: Boolean(raw.isDelayed ?? raw.delayed ?? raw.delayFlag),
    productNamesSummary,
    productCategoriesSummary,
  };
};

const API_LIST_ORDER_STATUS_TO_UI: Record<string, OrderStatus> = {
  unpaid: "PENDING_ORDER",
  pending: "PENDING_ORDER",
  approve: "AWAITING_VERIFICATION",
  approved: "AWAITING_VERIFICATION",
  reject: "CANCELLED",
  rejected: "CANCELLED",
  cancel: "CANCELLED",
  cancelled: "CANCELLED",
  dispatch: "ORDER_DISPATCH",
  dispatched: "ORDER_DISPATCH",
  delivered: "ORDER_DELIVERED",
  delayed: "DELAYED",
};

const normalizeApiListOrderStatus = (raw: unknown): OrderStatus => {
  const v = pickString(raw)?.toLowerCase() ?? "";
  return API_LIST_ORDER_STATUS_TO_UI[v] ?? "PENDING_ORDER";
};

const normalizeApiListPaymentMode = (raw: unknown): PaymentMode => {
  const v = pickString(raw)?.toLowerCase() ?? "";
  if (v === "online" || v === "online_payment") return "ONLINE_PAYMENT";
  return "CASH_IN_HAND";
};

const normalizeApiListPaymentStatus = (raw: unknown): PaymentStatus => {
  const v = pickString(raw)?.toLowerCase() ?? "";
  switch (v) {
    case "payment_captured":
    case "done":
    case "paid":
      return "PAID";
    case "refunded":
    case "refund_initiated":
      return "REFUNDED";
    case "received_by_fodderman":
      return "RECEIVED_BY_FODDERMAN";
    default:
      return "PENDING";
  }
};

const normalizePartnerListPaymentMethod = (raw: unknown): PaymentMode => {
  const v = pickString(raw)?.toLowerCase() ?? "";
  if (v === "online" || v === "online_payment") return "ONLINE_PAYMENT";
  return "CASH_IN_HAND";
};

const partnerListProductNamesSummary = (raw: unknown): string | null => {
  if (!Array.isArray(raw)) return null;
  const names = raw
    .map((item) => {
      const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return pickString(o.productName)?.trim();
    })
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return null;
  return [...new Set(names)].join(", ");
};

/** Partner `POST /orders/partner/list` pipeline slugs → `OrderStatus` (rows must pass `isPartnerListVisibleStatus` on daily list). */
const PARTNER_LIST_PIPELINE_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  unpaid: "PENDING_ORDER",
  pending: "ORDER_RECEIVED",  // Changed from PENDING_ORDER to ORDER_RECEIVED to show in partner list
  /** Fodderman-approved; partner list API only returns these — map to a visible lifecycle state. */
  approve: "ORDER_RECEIVED",
  approved: "ORDER_RECEIVED",
  reject: "CANCELLED",
  rejected: "CANCELLED",
  cancel: "CANCELLED",
  cancelled: "CANCELLED",
  dispatch: "ORDER_DISPATCH",
  dispatched: "ORDER_DISPATCH",
  delivered: "ORDER_DELIVERED",
  delayed: "DELAYED",
};

const normalizePartnerListOrderStatus = (raw: unknown): OrderStatus => {
  const v = pickString(raw)?.toLowerCase() ?? "";
  return PARTNER_LIST_PIPELINE_TO_ORDER_STATUS[v] ?? "ORDER_RECEIVED";
};

/** Parse `dd/MM/yyyy` from partner list; otherwise return raw string for downstream formatters. */
const parsePartnerExpectedDelivery = (raw: string | undefined): string | null => {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return s;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
};

/** `POST /orders/partner/list` row: `orderId`, `userOrderId`, `timestamp`, `payable`, `paymentMethod`, `farmer`, `deliveryAddress`, `orderItems`. */
const mapPartnerListApiRowToItem = (raw: Record<string, unknown>): AdminOrderListItem => {
  const id = pickString(raw.orderId) ?? pickString(raw.id) ?? "";
  const orderNumber =
    pickString(raw.userOrderId) ?? pickString(raw.orderNumber) ?? pickString(raw.orderId) ?? id;
  const placedAt =
    pickString(raw.timestamp) ??
    pickString(raw.createdAt) ??
    pickString(raw.placedAt) ??
    new Date(0).toISOString();

  const farmerObj =
    raw.farmer && typeof raw.farmer === "object" ? (raw.farmer as Record<string, unknown>) : {};
  const addr =
    raw.deliveryAddress && typeof raw.deliveryAddress === "object"
      ? (raw.deliveryAddress as Record<string, unknown>)
      : {};

  const farmerNameFallback =
    [pickString(farmerObj.firstName), pickString(farmerObj.lastName)].filter(Boolean).join(" ").trim();
  const farmer = {
    id: pickString(farmerObj.uuid) ?? pickString(farmerObj.id) ?? "",
    name:
      pickString(farmerObj.name) ??
      pickString(raw.farmerName) ??
      (farmerNameFallback || "Unknown"),
    mobile: pickString(farmerObj.mobile) ?? pickString(farmerObj.mobileNumber) ?? null,
    villageName: pickString(addr.village) ?? pickString(farmerObj.villageName) ?? null,
  };

  const orderItems = raw.orderItems ?? raw.lineItems ?? raw.items;

  return {
    id,
    orderNumber,
    placedAt,
    farmer,
    fodderman: mapStakeholder(raw.fodderman),
    partner: mapStakeholder(raw.partner),
    totalAmount: pickNumber(raw.payable ?? raw.totalAmount ?? raw.total ?? raw.grandTotal),
    paymentMode: normalizePartnerListPaymentMethod(raw.paymentMethod ?? raw.paymentMode),
    paymentModeApiRaw: pickString(raw.paymentMethod) ?? pickString(raw.paymentMode) ?? null,
    paymentStatus: normalizeApiListPaymentStatus(raw.paymentStatus),
    orderStatus: normalizePartnerListOrderStatus(raw.orderStatus),
    orderStatusApiRaw: pickString(raw.orderStatus),
    expectedDeliveryDate: (() => {
      const expStr =
        pickString(raw.expectedDelivery) ??
        pickString(raw.expectedDeliveryDate) ??
        pickString(raw.scheduledDeliveryDate);
      return expStr ? parsePartnerExpectedDelivery(expStr) : null;
    })(),
    dispatchedAt: pickString(raw.dispatchedAt) ?? null,
    deliveredAt: pickString(raw.deliveredAt) ?? null,
    isDelayed: Boolean(raw.delayStatus ?? raw.isDelayed ?? raw.delayed ?? raw.delayFlag),
    productNamesSummary: partnerListProductNamesSummary(orderItems),
    productCategoriesSummary: null,
  };
};

export const mapAdminListApiRowToItem = (raw: Record<string, unknown>): AdminOrderListItem => {
  const id = pickString(raw.orderUuid) ?? pickString(raw.id) ?? pickString(raw.orderId) ?? "";
  const orderNumber =
    pickString(raw.userOrderId) ?? pickString(raw.orderId) ?? pickString(raw.orderNumber) ?? id;
  const placedAt = pickString(raw.createdAt) ?? new Date(0).toISOString();

  const farmerRaw = raw.farmer ?? raw.farmerProfile;
  const farmerObj =
    farmerRaw && typeof farmerRaw === "object" ? (farmerRaw as Record<string, unknown>) : {};
  const villageNested = raw.village ?? farmerObj.village;
  const villageRec =
    villageNested && typeof villageNested === "object"
      ? (villageNested as Record<string, unknown>)
      : null;

  const farmer = {
    id: pickString(farmerObj.uuid) ?? pickString(farmerObj.id) ?? "",
    name:
      pickString(farmerObj.name) ??
      pickString(farmerObj.fullName) ??
      ([pickString(farmerObj.firstName), pickString(farmerObj.lastName)].filter(Boolean).join(" ").trim() ||
        "Unknown"),
    mobile: pickString(farmerObj.mobile) ?? pickString(farmerObj.mobileNumber) ?? null,
    villageName: pickString(villageRec?.name) ?? pickString(farmerObj.villageName) ?? null,
  };

  const orderStatusApiRaw =
    pickString(raw.orderStatus) ?? pickString(raw.order_status) ?? pickString(raw.status) ?? null;

  const paymentModeRaw = raw.paymentMode ?? raw.payment_mode ?? raw.paymentMethod;
  const paymentModeApiRaw = pickString(paymentModeRaw) ?? null;

  const paymentStatusLabelApi =
    pickString(raw.paymentStatusLabel) ?? pickString(raw.payment_status_label) ?? null;
  const paymentStatusRaw =
    raw.paymentStatus ?? raw.payment_status ?? raw.paymentStatusLabel ?? raw.payment_status_label;

  return {
    id,
    orderNumber,
    placedAt,
    orderDate: pickString(raw.orderDate) ?? null,
    orderTime: pickString(raw.orderTime) ?? null,
    date: pickString(raw.date) ?? null,
    time: pickString(raw.time) ?? null,
    farmer,
    fodderman: mapStakeholder(raw.fodderman ?? raw.foddermanProfile),
    partner: mapStakeholder(raw.partner ?? raw.partnerProfile),
    totalAmount: pickNumber(raw.payable ?? raw.total ?? raw.totalAmount ?? raw.grandTotal ?? raw.amount),
    paymentMode: normalizeApiListPaymentMode(paymentModeRaw),
    paymentStatus: normalizeApiListPaymentStatus(paymentStatusRaw),
    orderStatus: normalizeApiListOrderStatus(raw.orderStatus),
    orderStatusApiRaw,
    paymentModeApiRaw,
    paymentStatusLabelApi,
    expectedDeliveryDate: null,
    dispatchedAt: null,
    deliveredAt: null,
    isDelayed: null,
    productNamesSummary: null,
    productCategoriesSummary: null,
  };
};

const mapLineItems = (raw: unknown): AdminOrderDetail["lineItems"] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      productId: pickString(o.productId) ?? null,
      productName: pickString(o.productName) ?? pickString(o.name) ?? "Product",
      sku: pickString(o.sku) ?? null,
      quantity: pickNumber(o.quantity),
      unitPrice: pickNumber(o.unitPrice ?? o.price),
      lineTotal: pickNumber(o.lineTotal ?? o.total),
      taxAmount: o.taxAmount != null ? pickNumber(o.taxAmount) : null,
      categoryName:
        pickString(o.categoryName) ??
        (() => {
          const c = o.category;
          if (c && typeof c === "object") {
            return pickString((c as Record<string, unknown>).name);
          }
          return null;
        })(),
    };
  });
};

const mapPricing = (raw: unknown, fallbackTotal: number): AdminOrderDetail["pricing"] => {
  if (!raw || typeof raw !== "object") {
    return {
      subtotal: fallbackTotal,
      taxTotal: 0,
      deliveryCharge: 0,
      discountTotal: null,
      grandTotal: fallbackTotal,
    };
  }
  const o = raw as Record<string, unknown>;
  const grandTotal = pickNumber(o.grandTotal ?? o.total ?? o.payable ?? fallbackTotal);
  return {
    subtotal: pickNumber(o.subtotal ?? o.totalItemsPrice ?? o.payable ?? fallbackTotal),
    taxTotal: pickNumber(o.taxTotal ?? o.taxes ?? o.taxAmount),
    deliveryCharge: pickNumber(o.deliveryCharge ?? o.deliveryCharges ?? o.shippingCharge),
    discountTotal: o.discountTotal != null ? pickNumber(o.discountTotal) : null,
    grandTotal,
  };
};

const mapAddress = (raw: unknown): AdminOrderDetail["deliveryAddress"] => {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const villageNested = o.village;
  const villageRec =
    villageNested && typeof villageNested === "object"
      ? (villageNested as Record<string, unknown>)
      : null;
  const talukaNested = o.taluka;
  const talukaRec =
    talukaNested && typeof talukaNested === "object" ? (talukaNested as Record<string, unknown>) : null;
  const districtNested = o.district;
  const districtRec =
    districtNested && typeof districtNested === "object"
      ? (districtNested as Record<string, unknown>)
      : null;
  const stateNested = o.state;
  const stateRec =
    stateNested && typeof stateNested === "object" ? (stateNested as Record<string, unknown>) : null;
  return {
    line1: pickString(o.addressText) ?? pickString(o.line1) ?? pickString(o.addressLine1) ?? null,
    line2: pickString(o.line2) ?? pickString(o.addressLine2) ?? null,
    villageName: pickString(o.village) ?? pickString(o.villageName) ?? pickString(villageRec?.name) ?? null,
    talukaName: pickString(o.taluka) ?? pickString(o.talukaName) ?? pickString(talukaRec?.name) ?? null,
    districtName: pickString(o.district) ?? pickString(o.districtName) ?? pickString(districtRec?.name) ?? null,
    stateName: pickString(o.state) ?? pickString(o.stateName) ?? pickString(stateRec?.name) ?? null,
    pincode: pickString(o.pincode) ?? pickString(o.postalCode) ?? null,
  };
};

const mapOtp = (raw: unknown): AdminOrderDetail["deliveryOtp"] => {
  if (!raw || typeof raw !== "object") {
    return { code: null, verified: false, verifiedAt: null };
  }
  const o = raw as Record<string, unknown>;
  return {
    code: pickString(o.code) ?? pickString(o.otp) ?? null,
    verified: Boolean(o.verified ?? o.isVerified),
    verifiedAt: pickString(o.verifiedAt) ?? null,
  };
};

const mapDeliveryEtaHistory = (raw: unknown): DeliveryEtaHistoryEntry[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    const o = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    return {
      id: pickString(o.id) ?? `eta-${index}`,
      expectedDeliveryDate:
        pickString(o.expectedDeliveryDate) ?? pickString(o.scheduledDeliveryDate) ?? pickString(o.eta) ?? "",
      effectiveFrom: pickString(o.effectiveFrom) ?? pickString(o.validFrom) ?? pickString(o.recordedAt) ?? "",
      recordedAt: pickString(o.recordedAt) ?? pickString(o.createdAt) ?? new Date().toISOString(),
      recordedByName: pickString(o.recordedByName) ?? pickString(o.actorName) ?? null,
      markedDelayed: o.markedDelayed != null ? Boolean(o.markedDelayed) : null,
    };
  });
};

const AUDIT_EVENT_TYPES = new Set<AuditEventType>([
  "ORDER_PLACED",
  "PAYMENT_CONFIRMED",
  "DELIVERY_DATE_UPDATED",
  "STATUS_CHANGED",
  "OTP_OVERRIDE",
  "REFUND_INITIATED",
  "REFUND_PROCESSED",
  "ORDER_CANCELLED",
  "NOTE",
]);

/** Prefer `en`, then first non-empty locale string from API `description` objects. */
const pickLocalizedDescription = (raw: unknown): string => {
  if (typeof raw === "string") return raw.trim();
  if (!raw || typeof raw !== "object") return "";
  const o = raw as Record<string, unknown>;
  const en = pickString(o.en)?.trim();
  if (en) return en;
  for (const v of Object.values(o)) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

const mapPipelineAuditStatusToEventType = (status: string): AuditEventType => {
  const s = status.toLowerCase();
  if (s === "reject" || s === "cancel" || s === "rejected" || s === "cancelled") return "ORDER_CANCELLED";
  if (s === "pending") return "ORDER_PLACED";
  if (!s) return "NOTE";
  return "STATUS_CHANGED";
};

/** Maps API `orderAudits` in response order (no sorting). */
const mapAudit = (raw: unknown): AdminOrderDetail["auditTrail"] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    const o = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const actorRaw = o.actor ?? o.user ?? o.performedBy;
    const actorObj =
      actorRaw && typeof actorRaw === "object" ? (actorRaw as Record<string, unknown>) : null;
    const auditStatus = pickString(o.status) ?? pickString(o.orderStatus) ?? null;
    const descRaw = o.description ?? o.message ?? o.note;
    const description = pickLocalizedDescription(descRaw) || pickString(descRaw) || "";

    const explicitEvent = pickString(o.eventType) ?? pickString(o.event_type);
    const eventType: AuditEventType =
      explicitEvent && AUDIT_EVENT_TYPES.has(explicitEvent as AuditEventType)
        ? (explicitEvent as AuditEventType)
        : mapPipelineAuditStatusToEventType(auditStatus ?? "");

    return {
      id: pickString(o.id) ?? pickString(o.uuid) ?? `audit-${index}`,
      createdAt:
        pickString(o.createdAt) ??
        pickString(o.created_at) ??
        pickString(o.timestamp) ??
        new Date().toISOString(),
      eventType,
      description,
      actorRole:
        pickString(o.actorRole) ??
        pickString(o.actor_role) ??
        pickString(o.role) ??
        pickString(actorObj?.role) ??
        "",
      actorName:
        pickString(o.actorName) ??
        pickString(o.actor_name) ??
        pickString(o.userName) ??
        pickString(o.user_name) ??
        pickString(actorObj?.name) ??
        pickString(actorObj?.fullName) ??
        "",
      auditStatus,
      deviceInfo: pickString(o.deviceInfo) ?? pickString(o.device_info) ?? pickString(o.device) ?? null,
      ipAddress: pickString(o.ipAddress) ?? pickString(o.ip_address) ?? pickString(o.ip) ?? null,
      metadata: o.metadata && typeof o.metadata === "object" ? (o.metadata as Record<string, unknown>) : null,
    };
  });
};

export const mapDetailOrder = (raw: Record<string, unknown>): AdminOrderDetail => {
  const base = mapListOrder(raw);
  const lineItems = mapLineItems(raw.lineItems ?? raw.items);
  const pricing = mapPricing(raw.pricing ?? raw.priceBreakdown ?? raw, base.totalAmount);
  const farmerProfile =
    mapStakeholder(raw.farmerProfile ?? raw.farmer) ??
    ({
      id: base.farmer.id,
      name: base.farmer.name,
      mobile: base.farmer.mobile,
      villageName: base.farmer.villageName,
    } as const);

  const reason = pickString(raw.cancellationReason) as OrderCancellationReason | undefined;
  const { delayStatus, isDelayed } = resolveOrderDelayFlags(raw, base.isDelayed);

  return {
    ...base,
    lineItems,
    pricing,
    deliveryAddress: mapAddress(raw.deliveryAddress ?? raw.address),
    farmerProfile,
    foddermanProfile: mapStakeholder(raw.foddermanProfile ?? raw.fodderman) ?? base.fodderman,
    partnerProfile: mapStakeholder(raw.partnerProfile ?? raw.partner) ?? base.partner,
    deliveryOtp: mapOtp(raw.deliveryOtp ?? raw.otp),
    auditTrail: mapAudit(raw.orderAudits ?? raw.auditTrail ?? raw.auditLogs),
    cancellationReason: reason ?? null,
    cancellationNotes: pickString(raw.cancellationNotes) ?? null,
    cancelledAt: pickString(raw.cancelledAt) ?? null,
    cancelledDate: pickString(raw.cancelledDate) ?? null,
    rejectedDate: pickString(raw.rejectedDate) ?? null,
    deliveredDate: pickString(raw.deliveredDate) ?? null,
    deliveryEtaHistory: mapDeliveryEtaHistory(raw.deliveryEtaHistory ?? raw.deliveryEtaRevisions ?? raw.etaHistory),
    delayStatus,
    isDelayed,
  };
};

/** Map `GET /orders/admin/:id/detail` body into `AdminOrderDetail` (summary + items + audits). */
export const mapAdminDetailApiToAdminOrderDetail = (raw: Record<string, unknown>): AdminOrderDetail => {
  const base = mapAdminListApiRowToItem(raw);
  const lineItems = mapLineItems(raw.orderItems ?? raw.lineItems ?? raw.items ?? raw.orderLines);
  const pricing = mapPricing(raw.pricing ?? raw.priceBreakdown ?? raw, base.totalAmount);
  const farmerProfile =
    mapStakeholder(raw.farmerProfile ?? raw.farmer) ??
    ({
      id: base.farmer.id,
      name: base.farmer.name,
      mobile: base.farmer.mobile,
      villageName: base.farmer.villageName,
    } as const);

  const reason = pickString(raw.cancellationReason) as OrderCancellationReason | undefined;
  const { delayStatus, isDelayed } = resolveOrderDelayFlags(raw, base.isDelayed);

  return {
    ...base,
    orderDate: pickString(raw.orderDate) ?? base.orderDate ?? null,
    orderTime: pickString(raw.orderTime) ?? base.orderTime ?? null,
    date: pickString(raw.date) ?? base.date ?? null,
    time: pickString(raw.time) ?? base.time ?? null,
    expectedDeliveryDate: (() => {
      const expStr =
        pickString(raw.expectedDelivery) ??
        pickString(raw.expectedDeliveryDate) ??
        pickString(raw.scheduledDeliveryDate) ??
        pickString(raw.expectedDeliveryAt) ??
        base.expectedDeliveryDate;
      return expStr ? parsePartnerExpectedDelivery(expStr) : null;
    })(),
    dispatchedAt:
      pickString(raw.dispatchedAt) ??
      pickString(raw.dispatchAt) ??
      pickString(raw.dispatchedAtUtc) ??
      base.dispatchedAt ??
      null,
    deliveredAt: pickString(raw.deliveredAt) ?? pickString(raw.deliveredAtUtc) ?? base.deliveredAt ?? null,
    delayStatus,
    isDelayed,
    productNamesSummary:
      base.productNamesSummary ?? pickString(raw.productNamesSummary) ?? pickString(raw.productsSummary) ?? null,
    productCategoriesSummary:
      base.productCategoriesSummary ??
      pickString(raw.productCategoriesSummary) ??
      pickString(raw.categoriesSummary) ??
      null,
    lineItems,
    pricing,
    deliveryAddress: mapAddress(raw.deliveryAddress ?? raw.address),
    farmerProfile,
    foddermanProfile: mapStakeholder(raw.foddermanProfile ?? raw.fodderman) ?? base.fodderman,
    partnerProfile: mapStakeholder(raw.partnerProfile ?? raw.partner) ?? base.partner,
    deliveryOtp: mapOtp(raw.deliveryOtp ?? raw.otp),
    auditTrail: mapAudit(raw.orderAudits ?? raw.auditTrail ?? raw.auditLogs),
    cancellationReason: reason ?? null,
    cancellationNotes: pickString(raw.cancellationNotes) ?? null,
    cancelledAt: pickString(raw.cancelledAt) ?? null,
    cancelledDate: pickString(raw.cancelledDate) ?? null,
    rejectedDate: pickString(raw.rejectedDate) ?? null,
    deliveredDate: pickString(raw.deliveredDate) ?? null,
    deliveryEtaHistory: mapDeliveryEtaHistory(raw.deliveryEtaHistory ?? raw.deliveryEtaRevisions ?? raw.etaHistory),
  };
};

const buildListParams = (
  page: number,
  limit: number,
  filters: OrderListFilters,
  sortBy?: OrderSortBy,
  sortOrder?: ApiSortOrder,
) => ({
  page,
  limit,
  ...(filters.search ? { search: filters.search } : {}),
  ...(filters.stateId ? { stateId: filters.stateId } : {}),
  ...(filters.districtId ? { districtId: filters.districtId } : {}),
  ...(filters.talukaId ? { talukaId: filters.talukaId } : {}),
  ...(filters.villageId ? { villageId: filters.villageId } : {}),
  ...(filters.partnerId ? { partnerId: filters.partnerId } : {}),
  ...(filters.foddermanId ? { foddermanId: filters.foddermanId } : {}),
  ...(filters.orderStatus ? { orderStatus: filters.orderStatus } : {}),
  ...(filters.paymentMode ? { paymentMode: filters.paymentMode } : {}),
  ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
  ...(filters.orderDateFrom ? { orderDateFrom: filters.orderDateFrom } : {}),
  ...(filters.orderDateTo ? { orderDateTo: filters.orderDateTo } : {}),
  ...(filters.dispatchDateFrom ? { dispatchDateFrom: filters.dispatchDateFrom } : {}),
  ...(filters.dispatchDateTo ? { dispatchDateTo: filters.dispatchDateTo } : {}),
  ...(filters.deliveryDateFrom ? { deliveryDateFrom: filters.deliveryDateFrom } : {}),
  ...(filters.deliveryDateTo ? { deliveryDateTo: filters.deliveryDateTo } : {}),
  ...(filters.historyStatusGroup === "DELIVERED"
    ? { orderStatus: "ORDER_DELIVERED" as const }
    : filters.historyStatusGroup
      ? { historyStatusGroup: filters.historyStatusGroup }
      : {}),
  ...(filters.productId ? { productId: filters.productId } : {}),
  ...(filters.categoryIds?.length ? { categoryIds: filters.categoryIds.join(",") } : {}),
  ...(sortBy ? { sortBy } : {}),
  ...(sortOrder ? { sortOrder } : {}),
});

export const getOrders = async (
  page: number,
  limit: number,
  filters: OrderListFilters,
  sortBy?: OrderSortBy,
  sortOrder?: ApiSortOrder,
): Promise<OrdersListResponse> => {
  const response = await api.get<WrappedList<unknown[]>>("/orders", {
    params: buildListParams(page, limit, filters, sortBy, sortOrder),
  });

  const body = response.data;
  const rawList = Array.isArray(body.data) ? body.data : [];
  const data = rawList.map((row) =>
    mapListOrder(row && typeof row === "object" ? (row as Record<string, unknown>) : {}),
  );
  const meta = body.meta ?? getFallbackMeta(page, limit, data.length);

  return { data, meta };
};

const buildAdminListRequestBody = (
  filters: OrderListFilters,
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: ApiSortOrder,
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  if (filters.search) body.search = filters.search;
  if (sortBy) body.sortBy = sortBy;
  if (sortOrder) body.sortOrder = sortOrder;
  if (filters.stateId) body.stateIds = [filters.stateId];
  if (filters.districtId) body.districtIds = [filters.districtId];
  if (filters.talukaId) body.talukaIds = [filters.talukaId];
  if (filters.villageId) body.villageIds = [filters.villageId];
  if (filters.partnerId) body.partnerIds = [filters.partnerId];
  if (filters.farmerId) body.farmerUuid = filters.farmerId;
  if (filters.foddermanId) body.foddermanIds = [filters.foddermanId];
  if (filters.adminListStatus) body.statuses = [filters.adminListStatus];
  if (filters.adminListPaymentMode) body.paymentModes = [filters.adminListPaymentMode];
  if (filters.adminListPaymentStatus) body.paymentStatusLabels = [filters.adminListPaymentStatus];
  if (filters.orderDateFrom) body.fromDate = filters.orderDateFrom;
  if (filters.orderDateTo) body.toDate = filters.orderDateTo;
  return body;
};

export const getAdminOrders = async (
  page: number,
  limit: number,
  filters: OrderListFilters,
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: ApiSortOrder,
): Promise<OrdersListResponse> => {
  const body = buildAdminListRequestBody(filters, sortBy, sortOrder);
  const response = await api.post<WrappedList<unknown[]>>("/orders/admin/list", body, {
    params: { page, limit },
  });

  const envelope = response.data;
  const rawList = Array.isArray(envelope.data) ? envelope.data : [];
  const data = rawList.map((row) =>
    mapAdminListApiRowToItem(row && typeof row === "object" ? (row as Record<string, unknown>) : {}),
  );
  const meta = envelope.meta ?? getFallbackMeta(page, limit, data.length);

  return { data, meta };
};

export const getOrderById = async (id: string): Promise<AdminOrderDetail> => {
  const response = await api.get<WrappedOne<Record<string, unknown>>>(`/orders/${id}`);
  const raw = response.data?.data;
  if (!raw || typeof raw !== "object") {
    throw new Error(response.data?.message || "Order not found");
  }
  return mapDetailOrder(raw);
};

export const getAdminOrderById = async (id: string): Promise<AdminOrderDetail> => {
  const response = await api.get<
    WrappedOne<Record<string, unknown>> & { order?: Record<string, unknown> }
  >(`/orders/admin/${id}/detail`);
  const body = response.data;
  const raw =
    body?.data ??
    (body?.order && typeof body.order === "object" ? body.order : undefined);
  if (!raw || typeof raw !== "object") {
    throw new Error(
      typeof body?.message === "string" && body.message ? body.message : "Order not found",
    );
  }
  return mapAdminDetailApiToAdminOrderDetail(raw);
};

/** `PATCH /orders/admin/:id/expected-delivery` — resolves to `/api/v1/orders/admin/{id}/expected-delivery` with default client. */
export const updateAdminExpectedDelivery = async (
  id: string,
  payload: UpdateExpectedDeliveryPayload,
): Promise<AdminOrderDetail> => {
  await api.patch<{ message?: string; order?: Record<string, unknown> }>(
    `/orders/admin/${encodeURIComponent(id)}/expected-delivery`,
    serializeUpdateExpectedDeliveryBody(payload),
  );
  return getAdminOrderById(id);
};

/** `PATCH /orders/partner/:id` (on dispatch) or `PATCH /orders/partner/:id/expected-delivery` (on update expected delivery date). */
export const updatePartnerExpectedDelivery = async (
  id: string,
  payload: UpdateExpectedDeliveryPayload,
): Promise<AdminOrderDetail> => {
  const isDispatch = Boolean(payload.dispatched);
  if (isDispatch) {
    await api.patch<{ message?: string; order?: Record<string, unknown> }>(
      `/orders/partner/${encodeURIComponent(id)}`,
      {
        expected_delivery_date: payload.expectedDelivery.trim(),
        dispatched: true,
      },
    );
  } else {
    await api.patch<{ message?: string; order?: Record<string, unknown> }>(
      `/orders/partner/${encodeURIComponent(id)}/expected-delivery`,
      {
        expected_delivery: payload.expectedDelivery.trim(),
      },
    );
  }
  return getPartnerOrderById(id);
};

/** `PATCH /orders/:id/dispatch` — Dispatch order (partner only) */
export const dispatchOrderByPartner = async (id: string): Promise<AdminOrderDetail> => {
  await api.patch<{ message?: string }>(`/orders/${encodeURIComponent(id)}/dispatch`);
  return getPartnerOrderById(id);
};

/** `PATCH /orders/:id/admin-cancel` — body is `CancelOrderDto` (`{ reason }` only). */
export const cancelOrderByAdmin = async (id: string, payload: AdminCancelOrderPayload): Promise<AdminOrderDetail> => {
  await api.patch<{ message?: string }>(`/orders/${id}/admin-cancel`, {
    reason: payload.reason,
  });
  return getAdminOrderById(id);
};

export const forceMarkOrderDelivered = async (id: string, payload: ForceDeliverPayload): Promise<AdminOrderDetail> => {
  const response = await api.post<WrappedOne<Record<string, unknown>>>(`/orders/${id}/force-deliver`, payload);
  const raw = response.data?.data;
  if (!raw || typeof raw !== "object") {
    throw new Error(response.data?.message || "Operation failed");
  }
  return mapDetailOrder(raw);
};

/** Fetch every page for the current filter set (bounded by maxPages). Admin list uses `/orders/admin/list`. */
export const fetchAllOrdersMatchingFilters = async (
  filters: OrderListFilters,
  sortBy: AdminOrderListApiSortBy | undefined,
  sortOrder: ApiSortOrder | undefined,
  pageSize: number,
  maxPages: number,
): Promise<AdminOrderListItem[]> => {
  const first = await getAdminOrders(1, pageSize, filters, sortBy, sortOrder);
  const all: AdminOrderListItem[] = [...first.data];
  let page = 2;
  let totalPages = first.meta.totalPages || 1;

  while (page <= totalPages && page <= maxPages) {
    const next = await getAdminOrders(page, pageSize, filters, sortBy, sortOrder);
    all.push(...next.data);
    totalPages = next.meta.totalPages;
    page += 1;
  }

  return all;
};

export const exportAdminOrderList = async (
  filters: OrderListFilters,
  format: "csv" | "xlsx",
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: ApiSortOrder,
): Promise<Blob> => {
  const body = buildAdminListRequestBody(filters, sortBy, sortOrder);
  const response = await api.post("/orders/admin/list/export", body, {
    params: { format },
    responseType: "blob",
    headers: {
      Accept:
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "text/csv",
    },
  });

  // If the server returns JSON despite responseType: 'blob' (e.g. on error or if wrapped),
  // we need to check if it's actually an error message.
  if (response.data.type === "application/json") {
    const text = await response.data.text();
    try {
      const json = JSON.parse(text);
      if (json.success === false || (json.message && !json.data)) {
        throw new Error(json.message || "Export failed");
      }
      // If it's the wrapped StreamableFile object (detected by 'stream' field in 'data')
      if (json.success === true && json.data?.stream) {
        throw new Error("Backend error: Received JSON metadata instead of binary stream. Please ensure the backend sends a direct file stream.");
      }
    } catch (e) {
      if (e instanceof Error) throw e;
    }
  }

  return response.data;
};

export const enqueueAdminOrderExport = async (
  filters: OrderListFilters,
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: ApiSortOrder,
): Promise<OrderExportJobResponse> => {
  const body = buildAdminListRequestBody(filters, sortBy, sortOrder);
  const response = await api.post<WrappedOne<OrderExportJobResponse>>("/orders/admin/list/export/job", body);
  if (!response.data?.data) {
    throw new Error(response.data?.message || "Failed to enqueue export job");
  }
  return response.data.data;
};

export const getAdminOrderExportJobStatus = async (jobId: string): Promise<OrderExportJobStatus> => {
  const response = await api.get<WrappedOne<OrderExportJobStatus>>(`/orders/admin/list/export/job/${jobId}`);
  if (!response.data?.data) {
    throw new Error(response.data?.message || "Failed to get job status");
  }
  return response.data.data;
};

export const downloadAdminOrderExport = async (jobId: string): Promise<Blob> => {
  const response = await api.get(`/orders/admin/list/export/job/${jobId}/download`, {
    responseType: "blob",
    headers: {
      Accept: "text/csv",
    },
  });

  if (response.data.type === "application/json") {
    const text = await response.data.text();
    try {
      const json = JSON.parse(text);
      if (json.success === false || (json.message && !json.data)) {
        throw new Error(json.message || "Download failed");
      }
      if (json.success === true && json.data?.stream) {
        throw new Error("Backend error: Received JSON metadata instead of binary stream.");
      }
    } catch (e) {
      if (e instanceof Error) throw e;
    }
  }

  return response.data;
};
