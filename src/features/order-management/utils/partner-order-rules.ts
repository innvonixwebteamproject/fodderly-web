import type { OrderStatus } from "../types/order.types";

/** Pre-verification statuses — hidden from partner list (defence in depth; API should omit). */
export const PARTNER_LIST_EXCLUDED_STATUSES: readonly OrderStatus[] = [
  "AWAITING_VERIFICATION",
  "PENDING_ORDER",
];

export function isPartnerListVisibleStatus(status: OrderStatus): boolean {
  // Show all statuses except the pre-verification ones
  // This ensures pending, approved, rejected, cancelled, dispatched, delivered are all visible
  return !PARTNER_LIST_EXCLUDED_STATUSES.includes(status);
}

export function partnerOrderNeedsDispatchHighlight(status: OrderStatus, rawStatus?: string | null): boolean {
  const rawLower = rawStatus?.trim().toLowerCase();
  // Don't show "Ready to dispatch" for pending orders
  if (rawLower === "pending") {
    return false;
  }
  return status === "ORDER_RECEIVED" || rawLower === "approved";
}

export function partnerCanDispatch(status: OrderStatus, rawStatus?: string | null): boolean {
  const rawLower = rawStatus?.trim().toLowerCase();
  if (rawLower === "cancelled" || status === "CANCELLED" || status === "CANCELLED_BY_ADMIN") {
    return false;
  }
  // Don't allow dispatch for pending orders
  if (rawLower === "pending") {
    return false;
  }
  return status === "ORDER_RECEIVED" || rawLower === "approved";
}

export function partnerCanReviseEta(status: OrderStatus): boolean {
  return status === "ORDER_DISPATCH" || status === "DELAYED";
}

export function partnerCanScheduleDelivery(order: {
  orderStatus: OrderStatus;
  orderStatusApiRaw?: string | null;
}): boolean {
  const { orderStatus: status, orderStatusApiRaw: raw } = order;
  const rawLower = raw?.trim().toLowerCase();
  return status === "ORDER_DISPATCH" || rawLower === "dispatched" || rawLower === "dispatch";
}

/** Partner must not use admin quick-update for these transitions. */
export function partnerMustNotManuallySetDelivered(status: OrderStatus): boolean {
  return status === "ORDER_DELIVERED";
}
