import type { PartnerOrderHistoryStatusGroup } from "../types/order.types";

export const PARTNER_ORDER_HISTORY_STATUS_GROUPS: {
  value: PartnerOrderHistoryStatusGroup | "";
  label: string;
}[] = [
  { value: "", label: "All statuses" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING", label: "Pending" },
];

export const PARTNER_ORDER_HISTORY_DATE_PRESETS: {
  value: "" | "7d" | "30d" | "custom";
  label: string;
}[] = [
  { value: "", label: "Any date" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

export const PARTNER_ORDER_HISTORY_SORT_OPTIONS: { value: "placedAt" | "productCategory"; label: string }[] = [
  { value: "placedAt", label: "Order date" },
  { value: "productCategory", label: "Product category" },
];

export const PARTNER_ORDER_HISTORY_SORT_DIR: { value: "asc" | "desc"; label: string }[] = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];
