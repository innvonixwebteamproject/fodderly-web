import type {
  AdminOrderListApiPaymentMode,
  AdminOrderListApiPaymentStatus,
  AdminOrderListApiStatus,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
} from "../types/order.types";

export const ORDER_STATUS_VALUES = [
  "AWAITING_VERIFICATION",
  "PENDING_ORDER",
  "ORDER_RECEIVED",
  "ORDER_DISPATCH",
  "DELAYED",
  "ORDER_DELIVERED",
  "CANCELLED",
  "CANCELLED_BY_ADMIN",
] as const satisfies readonly OrderStatus[];

export const PAYMENT_MODE_VALUES = ["ONLINE_PAYMENT", "CASH_IN_HAND"] as const satisfies readonly PaymentMode[];

export const PAYMENT_STATUS_VALUES = [
  "PENDING",
  "RECEIVED_BY_FODDERMAN",
  "PAID",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

export const ORDER_CANCELLATION_REASON_VALUES = [
  "PARTNER_INVENTORY_STOCKOUT",
  "FARMER_REQUEST",
  "FRAUD_SUSPECTED",
  "LOGISTICS_FAILURE",
  "DUPLICATE_ORDER",
  "OTHER",
] as const;

export const ORDER_STATUS_FILTER_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All status" },
  { value: "AWAITING_VERIFICATION", label: "Awaiting Verification" },
  { value: "PENDING_ORDER", label: "Pending Order" },
  { value: "ORDER_RECEIVED", label: "Order Received" },
  { value: "ORDER_DISPATCH", label: "Order Dispatch" },
  { value: "DELAYED", label: "Delayed" },
  { value: "ORDER_DELIVERED", label: "Order Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "CANCELLED_BY_ADMIN", label: "Cancelled (By Admin)" },
];

/** Partner order list / filters (same values; excludes admin-only labels where needed). */
export const PARTNER_ORDER_STATUS_FILTER_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All status" },
  { value: "AWAITING_VERIFICATION", label: "Awaiting Verification" },
  { value: "PENDING_ORDER", label: "Pending Order" },
  { value: "ORDER_RECEIVED", label: "Order Received" },
  { value: "ORDER_DISPATCH", label: "Order Dispatch" },
  { value: "DELAYED", label: "Delayed" },
  { value: "ORDER_DELIVERED", label: "Order Delivered" },
];

export const PAYMENT_MODE_FILTER_OPTIONS: { value: PaymentMode | ""; label: string }[] = [
  { value: "", label: "All payment modes" },
  { value: "ONLINE_PAYMENT", label: "Online Payment" },
  { value: "CASH_IN_HAND", label: "Cash in Hand" },
];

export const PAYMENT_STATUS_FILTER_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "All payment status" },
  { value: "PENDING", label: "Pending" },
  { value: "RECEIVED_BY_FODDERMAN", label: "Received by Fodderman" },
  { value: "PAID", label: "Paid" },
  { value: "REFUNDED", label: "Refunded" },
];

/** OpenAPI `statuses` enum for `POST /orders/admin/list` — use for filter values & request body. */
export const ADMIN_ORDER_LIST_STATUS_VALUES = [
  "unpaid",
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "dispatched",
  "delivered",
] as const satisfies readonly AdminOrderListApiStatus[];

/** OpenAPI `paymentModes` enum for admin order list. */
export const ADMIN_ORDER_LIST_PAYMENT_MODE_VALUES = ["online", "cash"] as const satisfies readonly AdminOrderListApiPaymentMode[];

/** OpenAPI `paymentStatusLabels` enum for admin order list. */
export const ADMIN_ORDER_LIST_PAYMENT_STATUS_VALUES = [
  "paid",
  "unpaid",
] as const satisfies readonly AdminOrderListApiPaymentStatus[];

/** Admin order list — order status filter (API slug = `value`). Placeholder: “All order status”. */
export const ADMIN_ORDER_LIST_STATUS_FILTER_OPTIONS: { value: AdminOrderListApiStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

/** Partner `POST /orders/partner/list` — `status` body uses values matching the response slugs. */
export const PARTNER_DAILY_ORDER_STATUS_FILTER_OPTIONS: { value: AdminOrderListApiStatus | ""; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "cancelled", label: "Cancelled" },
  { value: "dispatched", label: "Dispatched" },
  { value: "delivered", label: "Delivered" },
];

export const PARTNER_DAILY_ORDER_SORT_OPTIONS = [
  { value: "total", label: "Total" },
  { value: "orderDate", label: "Order Date" },
  { value: "farmerName", label: "Farmer Name" },
];

/** Admin order list — payment mode filter. */
export const ADMIN_ORDER_LIST_PAYMENT_MODE_FILTER_OPTIONS: { value: AdminOrderListApiPaymentMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "cash", label: "Cash" },
];

/** Admin order list — latest payment status filter. Placeholder: “All payment status”. */
export const ADMIN_ORDER_LIST_PAYMENT_STATUS_FILTER_OPTIONS: {
  value: AdminOrderListApiPaymentStatus;
  label: string;
}[] = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
];

export const CANCELLATION_REASON_OPTIONS: {
  value: (typeof ORDER_CANCELLATION_REASON_VALUES)[number];
  label: string;
}[] = [
  { value: "PARTNER_INVENTORY_STOCKOUT", label: "Partner Inventory Stockout" },
  { value: "FARMER_REQUEST", label: "Farmer Request" },
  { value: "FRAUD_SUSPECTED", label: "Fraud Suspected" },
  { value: "LOGISTICS_FAILURE", label: "Logistics Failure" },
  { value: "DUPLICATE_ORDER", label: "Duplicate Order" },
  { value: "OTHER", label: "Other" },
];
