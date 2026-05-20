/** List/detail guard: API pipeline slug is rejected (admin `rejected` / legacy `reject`). */
export function isOrderRejectedStatus(order: { orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  return raw === "rejected" || raw === "reject";
}

export function canAdminScheduleDelivery(order: { orderStatus: string; orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  const status = order.orderStatus;
  return status === "ORDER_DISPATCH" || raw === "dispatched" || raw === "dispatch";
}

export function canAdminCancelOrder(order: { orderStatus: string; orderStatusApiRaw?: string | null }): boolean {
  const raw = order.orderStatusApiRaw?.trim().toLowerCase();
  const status = order.orderStatus;
  
  if (raw === "cancelled" || raw === "cancel") return false;
  if (status === "CANCELLED" || status === "CANCELLED_BY_ADMIN") return false;



  if (raw === "rejected" || raw === "reject") return false;
  if (status === "REJECTED" || status === "REJECT") return false;

  if (raw === "delivered") return false;
  if (status === "ORDER_DELIVERED" || status === "DELIVERED") return false;

  return true;
}
