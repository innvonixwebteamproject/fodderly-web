export const COMMON_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DISPATCHED: "dispatched",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const CANCELLATION_REASONS = {
  DELAYED: "DELAYED",
  DUPLICATE: "DUPLICATE_ORDER",
  FRAUD: "FRAUD_SUSPECTED",
  BY_ADMIN: "CANCELLED_BY_ADMIN",
  FARMER_REQUEST: "FARMER_REQUEST",
} as const;
