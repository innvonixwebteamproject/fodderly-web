/** List/detail guard: API pipeline slug is rejected (admin `rejected` / legacy `reject`). */
export function isOrderRejectedStatus(order: { orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  return raw === "rejected" || raw === "reject";
}

export function canAdminScheduleDelivery(order: { orderStatus: string; orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  const status = order.orderStatus;
  if (raw === "rejected" || raw === "reject" || raw === "cancelled" || raw === "cancel") return false;
  if (status === "CANCELLED" || status === "CANCELLED_BY_ADMIN") return false;
  return true;
}

export function canAdminCancelOrder(order: { orderStatus: string; orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  const status = order.orderStatus;
  
  if (raw === "cancelled" || raw === "cancel") return false;
  if (status === "CANCELLED" || status === "CANCELLED_BY_ADMIN") return false;

  // Additional existing admin logic (e.g. not unpaid)
  const isUnpaid = raw === "unpaid";
  if (isUnpaid) return false;

  return status === "AWAITING_VERIFICATION" || status === "PENDING_ORDER";
}
