import type { OrderStatus, PaymentMode, PaymentStatus } from "../types/order.types";

/** Title-case pipeline values from admin list API (e.g. `online` → "Online", `unpaid` → "Unpaid"). */
export function formatApiPipelineLabel(raw: string | null | undefined): string {
  const s = raw?.trim();
  if (!s) return "";
  return s
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    AWAITING_VERIFICATION: "Awaiting Verification",
    PENDING_ORDER: "Pending Order",
    ORDER_RECEIVED: "Order Received",
    ORDER_DISPATCH: "Order Dispatch",
    DELAYED: "Delayed",
    ORDER_DELIVERED: "Order Delivered",
    CANCELLED: "Cancelled",
    CANCELLED_BY_ADMIN: "Cancelled (By Admin)",
  };
  return map[status] ?? status;
}

export function getPaymentModeLabel(mode: PaymentMode): string {
  if (mode === "ONLINE_PAYMENT") return "Online Payment";
  return "Cash in Hand";
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: "Pending",
    RECEIVED_BY_FODDERMAN: "Received by Fodderman",
    PAID: "Paid",
    REFUNDED: "Refunded",
  };
  return map[status] ?? status;
}
