import type { MasterMeta } from "./order.types";
import type { OrderCancellationReason, PaymentMode } from "./order.types";

export type RefundStatus =
  | "REFUND_INITIATED"
  | "REFUND_PROCESSING"
  | "REFUND_PROCESSED"
  | "REFUND_FAILED"
  | "REFUND_NOT_APPLICABLE";

/** Who initiated cancellation (admin module). */
export type CancelledBy = "FARMER" | "FODDERMAN" | "ADMIN" | "SYSTEM" | "PARTNER";

/** API `refundStatuses` filter values for `POST /orders/admin/cancelled`. */
export type AdminCancelledRefundStatusApi =
  | "pending_refund"
  | "refund_initiated"
  | "refunded"
  | "refund_failed"
  | "not_applicable";

/** API `cancelledBy` filter values for `POST /orders/admin/cancelled`. */
export type AdminCancelledByApi = "admin" | "farmer" | "partner" | "fodderman";

/** API `paymentModes` filter values for `POST /orders/admin/cancelled`. */
export type AdminCancelledPaymentModeApi = "online" | "cash" | "online_payment" | "cash_in_hand";

/** API `sortBy` for `POST /orders/admin/cancelled`. */
export type AdminCancelledOrdersSortBy =
  | "orderId"
  | "farmer"
  | "cancellationDate"
  | "refundAmount"
  | "refundStatus"
  | "createdAt";

export interface RefundQueueItem {
  /** Order UUID — use in admin routes (`/orders/admin/:id/...`), not the human order number. */
  orderId: string;
  orderNumber: string;
  refundAmount: number;
  farmerName: string;
  /** Farmer mobile for admin cancelled/refunds table. */
  farmerMobile?: string | null;
  cancelledAt: string;
  /** When refund was completed (if applicable). */
  refundDate?: string | null;
  cancellationReason?: OrderCancellationReason | null;
  cancellationReasonLabel?: string | null;
  refundStatus: RefundStatus;
  paymentReference?: string | null;
  cancelledBy?: CancelledBy | null;
  cancelledByLabel?: string | null;
  paymentMode?: PaymentMode | null;
  paymentModeApiRaw?: string | null;
  farmerVillage?: string | null;
  fodderman?: { uuid: string; name: string; mobile?: string } | null;
  partner?: { uuid: string; name: string; mobile?: string } | null;
  /** Original order total paid — online refunds must equal this at 100%. */
  originalOrderTotal?: number | null;
}

export interface RefundsListResponse {
  data: RefundQueueItem[];
  meta: MasterMeta;
}

export type RefundSortBy = "cancelledAt" | "refundAmount" | "refundStatus" | "farmerName";

/** Filters for admin cancelled/refunds list (`POST /orders/admin/cancelled`). */
export interface CancellationRefundListFilters {
  search?: string;
  refundStatuses?: string[];
  cancelledBy?: string[];
  paymentModes?: string[];
  /** ISO date/time — cancellation window start. */
  cancellationFrom?: string;
  /** ISO date/time — cancellation window end. */
  cancellationTo?: string;
  /** ISO date/time — latest refund activity window start. */
  refundFrom?: string;
  /** ISO date/time — latest refund activity window end. */
  refundTo?: string;
}

export interface RefundInitiatePayload {
  /** `CancelOrderDto.reason` on `POST /orders/:id/refund` (admin gateway retry). */
  reason?: string | null;
}

export interface RefundManualCompletePayload {
  transactionReference?: string | null;
  bankUtr?: string | null;
}

export interface CancellationRefundAuditEntry {
  id: string;
  performedAt: string;
  action: string;
  actorRole: string;
  actorName: string;
  refundAmount?: number | null;
  refundMode?: string | null;
  transactionReference?: string | null;
  bankUtr?: string | null;
  deviceInfo?: string | null;
  ipAddress?: string | null;
}

export interface CancellationRefundAuditResponse {
  entries: CancellationRefundAuditEntry[];
}
