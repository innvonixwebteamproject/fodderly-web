/**
 * Shared dropdown options, filter presets, and select configurations
 * Import these wherever filter dropdowns or select inputs are used
 */

/** Default "All" option for status/category filter dropdowns */
export const ALL_FILTER_OPTION = { label: "All", value: "all" } as const;

/** Date range filter preset options */
export const DATE_PRESETS = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Custom Range", value: "custom" },
] as const;

export type DatePresetValue = (typeof DATE_PRESETS)[number]["value"];

/** Payment method values used in order filters and forms */
export const PAYMENT_METHODS = {
  CASH: "cash",
  CASH_IN_HAND: "CASH_IN_HAND",
  ONLINE: "online",
  ONLINE_PAYMENT: "ONLINE_PAYMENT",
} as const;

/** Refund status values */
export const REFUND_STATUS = {
  PENDING: "pending_refund",
  INITIATED: "refund_initiated",
  REFUND_INITIATED: "REFUND_INITIATED",
  PROCESSED: "REFUND_PROCESSED",
  PROCESSING: "REFUND_PROCESSING",
  REFUNDED: "refunded",
  REFUNDED_UPPER: "REFUNDED",
  FAILED: "refund_failed",
  PAID: "paid",
  PAID_UPPER: "PAID",
  UNPAID: "unpaid",
} as const;

/** Sort direction values */
export const SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
} as const;

/** Company type options used in partner forms */
export const COMPANY_TYPES = [
  { label: "Private Limited", value: "pvt" },
  { label: "LLP", value: "llp" },
  { label: "Not Applicable", value: "not_applicable" },
] as const;
