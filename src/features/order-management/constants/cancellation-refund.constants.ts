import type {
  AdminCancelledByApi,
  AdminCancelledPaymentModeApi,
  AdminCancelledRefundStatusApi,
  CancelledBy,
  RefundStatus,
} from "../types/refund.types";
import type { PaymentMode } from "../types/order.types";

/** Legacy / non-admin queues — uppercase `CancelledBy`. */
export const CANCELLED_BY_FILTER_OPTIONS: { value: CancelledBy | ""; label: string }[] = [
  { value: "", label: "All (cancelled by)" },
  { value: "FARMER", label: "Farmer" },
  { value: "FODDERMAN", label: "Fodderman" },
  { value: "ADMIN", label: "Admin" },
  { value: "PARTNER", label: "Partner" },
  { value: "SYSTEM", label: "System" },
];

/** Legacy refund queue — uppercase `RefundStatus`. */
export const REFUND_STATUS_FILTER_OPTIONS: { value: RefundStatus | ""; label: string }[] = [
  { value: "REFUND_INITIATED", label: "Pending refund" },
  { value: "REFUND_PROCESSING", label: "Processing" },
  { value: "REFUND_PROCESSED", label: "Refunded" },
];

export const CANCELLATION_REFUND_PAYMENT_MODE_OPTIONS: { value: PaymentMode | ""; label: string }[] = [
  { value: "", label: "All payment modes" },
  { value: "ONLINE_PAYMENT", label: "Online payment" },
  { value: "CASH_IN_HAND", label: "Cash in hand" },
];

/** Admin `POST /orders/admin/cancelled` — `refundStatuses` body. */
export const ADMIN_CANCELLED_REFUND_STATUS_FILTER_OPTIONS: {
  value: AdminCancelledRefundStatusApi | "";
  label: string;
}[] = [
  { value: "pending_refund", label: "Pending refund" },
  { value: "refund_initiated", label: "Refund initiated" },
  { value: "refunded", label: "Refunded" },
  { value: "refund_failed", label: "Refund failed" },
  { value: "not_applicable", label: "Not applicable" },
];

/** Admin `POST /orders/admin/cancelled` — `cancelledBy` body. */
export const ADMIN_CANCELLED_BY_FILTER_OPTIONS: { value: AdminCancelledByApi | ""; label: string }[] = [
  { value: "farmer", label: "Farmer" },
  { value: "fodderman", label: "Fodderman" },
  { value: "admin", label: "Admin" },
  { value: "partner", label: "Partner" },
];

/** Admin `POST /orders/admin/cancelled` — `paymentModes` body. */
export const ADMIN_CANCELLED_PAYMENT_MODE_FILTER_OPTIONS: {
  value: AdminCancelledPaymentModeApi | "";
  label: string;
}[] = [
  { value: "online", label: "Online" },
  { value: "cash", label: "Cash" },
];
