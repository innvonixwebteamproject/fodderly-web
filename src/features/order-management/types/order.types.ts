export interface MasterMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Platform order lifecycle (admin filters + display). */
export type OrderStatus =
  | "AWAITING_VERIFICATION"
  | "PENDING_ORDER"
  | "ORDER_RECEIVED"
  | "ORDER_DISPATCH"
  | "DELAYED"
  | "ORDER_DELIVERED"
  | "CANCELLED"
  | "CANCELLED_BY_ADMIN";

/** Partner-visible ETA revision history (immutable log; backend-driven). */
export interface DeliveryEtaHistoryEntry {
  id: string;
  expectedDeliveryDate: string;
  effectiveFrom: string;
  recordedAt: string;
  recordedByName?: string | null;
  /** True when this revision introduced a delay vs previous ETA. */
  markedDelayed?: boolean | null;
}

export type PaymentMode = "ONLINE_PAYMENT" | "CASH_IN_HAND";

export type PaymentStatus =
  | "PENDING"
  | "RECEIVED_BY_FODDERMAN"
  | "PAID"
  | "REFUNDED";

export type OrderCancellationReason =
  | "PARTNER_INVENTORY_STOCKOUT"
  | "FARMER_REQUEST"
  | "FRAUD_SUSPECTED"
  | "LOGISTICS_FAILURE"
  | "DUPLICATE_ORDER"
  | "OTHER";

export type AuditEventType =
  | "ORDER_PLACED"
  | "PAYMENT_CONFIRMED"
  | "DELIVERY_DATE_UPDATED"
  | "STATUS_CHANGED"
  | "OTP_OVERRIDE"
  | "REFUND_INITIATED"
  | "REFUND_PROCESSED"
  | "ORDER_CANCELLED"
  | "NOTE";

export interface OrderStakeholderSummary {
  id: string;
  name: string;
  mobile?: string | null;
  villageName?: string | null;
  stateName?: string | null;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  placedAt: string;
  farmer: {
    id: string;
    name: string;
    mobile?: string | null;
    villageName?: string | null;
  };
  fodderman?: OrderStakeholderSummary | null;
  partner?: OrderStakeholderSummary | null;
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  /** Raw `orderStatus` from admin list API (e.g. `unpaid`, `approved`). */
  orderStatusApiRaw?: string | null;
  /** Raw payment mode from admin list API (e.g. `online`, `cash`). */
  paymentModeApiRaw?: string | null;
  /** Admin list API `paymentStatusLabel` (e.g. `done`, `unpaid`) — shown in All Orders instead of normalized `paymentStatus`. */
  paymentStatusLabelApi?: string | null;
  /** Current expected delivery date (partner dispatch / ETA). */
  expectedDeliveryDate?: string | null;
  /** When partner marked dispatch (if applicable). */
  dispatchedAt?: string | null;
  /** When order was delivered (OTP verified). */
  deliveredAt?: string | null;
  /** Backend may set when ETA is revised after dispatch. */
  isDelayed?: boolean | null;
  /** Detail API `delayStatus` — show delay UI only when `true`. */
  delayStatus?: boolean | null;
  /** Comma-separated unique product names when list payload includes line items. */
  productNamesSummary?: string | null;
  /** Comma-separated unique category names from line items when available. */
  productCategoriesSummary?: string | null;
}

export interface OrderLineItem {
  productId?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxAmount?: number | null;
  /** When API includes category per line (order history / summaries). */
  categoryName?: string | null;
}

export interface OrderPricingBreakdown {
  subtotal: number;
  taxTotal: number;
  deliveryCharge: number;
  discountTotal?: number | null;
  grandTotal: number;
}

export interface OrderDeliveryAddress {
  line1?: string | null;
  line2?: string | null;
  villageName?: string | null;
  talukaName?: string | null;
  districtName?: string | null;
  stateName?: string | null;
  pincode?: string | null;
}

export interface OrderDeliveryOtp {
  code?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
}

export interface OrderAuditLogEntry {
  id: string;
  createdAt: string;
  eventType: AuditEventType;
  description: string;
  actorRole: string;
  actorName: string;
  /** Pipeline slug from admin detail `orderAudits[].status` (e.g. `pending`, `reject`). */
  auditStatus?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  lineItems: OrderLineItem[];
  pricing: OrderPricingBreakdown;
  deliveryAddress: OrderDeliveryAddress;
  farmerProfile: OrderStakeholderSummary;
  foddermanProfile?: OrderStakeholderSummary | null;
  partnerProfile?: OrderStakeholderSummary | null;
  deliveryOtp: OrderDeliveryOtp;
  auditTrail: OrderAuditLogEntry[];
  cancellationReason?: OrderCancellationReason | null;
  cancellationNotes?: string | null;
  cancelledAt?: string | null;
  deliveryEtaHistory?: DeliveryEtaHistoryEntry[];
}

export type PartnerOrderHistoryStatusGroup = "DELIVERED" | "DISPATCHED" | "CANCELLED" | "PENDING";

export type PartnerOrderDatePreset = "" | "7d" | "30d" | "custom";

/** OpenAPI `statuses` item for `POST /orders/admin/list` (past-tense slugs; legacy `approve` etc. still parsed from rows). */
export type AdminOrderListApiStatus =
  | "unpaid"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "dispatched"
  | "delivered";

/** OpenAPI `paymentModes` for admin order list. */
export type AdminOrderListApiPaymentMode = "online" | "cash";

/** OpenAPI `paymentStatusLabels` for admin order list. */
export type AdminOrderListApiPaymentStatus = "paid" | "unpaid";

/** OpenAPI `sortBy` for `POST /orders/admin/list` (see `OrderListPage` column → API map). */
export type AdminOrderListApiSortBy = "createdAt" | "orderId" | "total" | "fodderman" | "partner";

/** Partner `POST /orders/partner/list` — `status` in body uses legacy slugs; `page`/`limit` as query. Omit status = all. */
export interface PartnerDailyOrderListFilters {
  /** OpenAPI `status` in POST body; omit or empty string = all. */
  status?: AdminOrderListApiStatus | "";
  search?: string;
  dateFilter?: "last_7_days" | "custom" | "";
  fromDate?: string;
  toDate?: string;
}

export interface OrderListFilters {
  search?: string;
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  partnerId?: string;
  foddermanId?: string;
  orderStatus?: OrderStatus | "";
  paymentMode?: PaymentMode | "";
  paymentStatus?: PaymentStatus | "";
  /** Admin `POST /orders/admin/list` — `statuses` (OpenAPI enum; use with `ADMIN_ORDER_LIST_*_FILTER_OPTIONS`). */
  adminListStatus?: AdminOrderListApiStatus | "";
  /** Admin list — `paymentModes`. */
  adminListPaymentMode?: AdminOrderListApiPaymentMode | "";
  /** Admin list — `paymentStatusLabels`. */
  adminListPaymentStatus?: AdminOrderListApiPaymentStatus | "";
  /** Inclusive calendar date (`yyyy-MM-dd`) — order placed on/after. */
  orderDateFrom?: string;
  /** Inclusive calendar date (`yyyy-MM-dd`) — order placed on/before. */
  orderDateTo?: string;
  dispatchDateFrom?: string;
  dispatchDateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  /** Partner order history grouped status (backend may interpret; falls back with orderStatus). */
  historyStatusGroup?: PartnerOrderHistoryStatusGroup | "";
  /** Single product filter (product id). */
  productId?: string;
  /** Product category ids for multi-filter. */
  categoryIds?: string[];
  /** Last 7 / 30 days or custom — drives orderDateFrom/To when not custom-only. */
  orderDatePreset?: PartnerOrderDatePreset;
}

export type OrderSortBy =
  | "placedAt"
  | "totalAmount"
  | "orderNumber"
  | "productCategory"
  | "total"
  | "orderDate"
  | "farmerName";

export interface OrdersListResponse {
  data: AdminOrderListItem[];
  meta: MasterMeta;
}

export interface OrderDetailResponse {
  data: AdminOrderDetail;
}

/** App shape for schedule delivery; API wire format is `{ expected_delivery: "YYYY-MM-DD" }` (see `serializeUpdateExpectedDeliveryBody`). */
export interface UpdateExpectedDeliveryPayload {
  expectedDelivery: string;
  dispatched?: boolean;
}

/** Backend `UpdateExpectedDeliveryDto` — snake_case in JSON. */
export type UpdateExpectedDeliveryRequestBody = {
  expected_delivery: string;
  dispatched?: boolean;
};

export const serializeUpdateExpectedDeliveryBody = (
  payload: UpdateExpectedDeliveryPayload,
): UpdateExpectedDeliveryRequestBody => ({
  expected_delivery: payload.expectedDelivery.trim(),
  ...(payload.dispatched ? { dispatched: true } : {}),
});

/** Request body for `PATCH .../admin-cancel` — free-text `reason` from the admin. */
export interface AdminCancelOrderPayload {
  reason: string;
}

export interface ForceDeliverPayload {
  acknowledgeBypass: true;
}

export interface OrderExportJobResponse {
  jobId: string;
}

export interface OrderExportJobStatus {
  id: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  totalRows?: number;
  downloadReady: boolean;
  error?: string;
}
