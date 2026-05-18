import { format } from "date-fns";
import type { AdminOrderListItem } from "../types/order.types";
import { getOrderStatusLabel, getPaymentModeLabel, getPaymentStatusLabel } from "./order-labels";

export function formatOrderRowForExport(row: AdminOrderListItem) {
  const placed = new Date(row.placedAt);
  const dateTime = Number.isNaN(placed.getTime()) ? row.placedAt : format(placed, "yyyy-MM-dd HH:mm");

  return {
    orderId: row.orderNumber,
    dateTime,
    farmerName: row.farmer.name,
    farmerVillage: row.farmer.villageName ?? "",
    farmerMobile: row.farmer.mobile ?? "",
    fodderman: row.fodderman?.name ?? "",
    partner: row.partner?.name ?? "",
    totalAmount: row.totalAmount,
    paymentMode: getPaymentModeLabel(row.paymentMode),
    paymentStatus: getPaymentStatusLabel(row.paymentStatus),
    orderStatus: getOrderStatusLabel(row.orderStatus),
  };
}
