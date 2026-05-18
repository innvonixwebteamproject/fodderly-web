import type { OrderStatus } from "../types/order.types";
import type { PaymentMode } from "../types/order.types";
import type { RefundQueueItem } from "../types/refund.types";

/** Online refunds are always 100% of the original paid amount — no deductions (UI + pre-flight checks). */
export const ONLINE_FULL_REFUND_RATIO = 1 as const;

export const FARMER_CANCELLATION_ALLOWED_STATUSES: readonly OrderStatus[] = [
  "AWAITING_VERIFICATION",
  "PENDING_ORDER",
];

export const FODDERMAN_CANCELLATION_ALLOWED_STATUSES: readonly OrderStatus[] = ["AWAITING_VERIFICATION"];

/** Admin force-cancel is blocked once order is delivered. */
export const ADMIN_CANCELLATION_BLOCKED_STATUSES: readonly OrderStatus[] = ["ORDER_DELIVERED"];

export function isOnlinePayment(mode: PaymentMode | null | undefined): boolean {
  return mode === "ONLINE_PAYMENT";
}

export function isCashPayment(mode: PaymentMode | null | undefined): boolean {
  return mode === "CASH_IN_HAND";
}

/**
 * Validates that refund amount matches 100% of original order total (within minor float tolerance).
 * Backend remains authoritative; this guards the admin UI before calling Razorpay.
 */
export function isFullOnlineRefundAmount(row: Pick<RefundQueueItem, "refundAmount" | "originalOrderTotal">): boolean {
  const total = row.originalOrderTotal;
  if (total == null || Number.isNaN(total) || total <= 0) {
    return true;
  }
  return Math.abs(row.refundAmount - total * ONLINE_FULL_REFUND_RATIO) < 0.02;
}

export function canShowProcessRefundAction(row: RefundQueueItem): boolean {
  /** Only cash is excluded from gateway refund; unknown/missing mode still shows — backend validates. */
  if (isCashPayment(row.paymentMode)) return false;
  if (row.refundStatus === "REFUND_PROCESSED") return false;
  if (row.refundStatus === "REFUND_NOT_APPLICABLE") return false;
  if (row.refundStatus === "REFUND_PROCESSING") return false;
  return true;
}

export function canShowManualRefundAction(row: RefundQueueItem): boolean {
  if (isCashPayment(row.paymentMode)) return false;
  return row.refundStatus === "REFUND_PROCESSING";
}
