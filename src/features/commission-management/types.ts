import { z } from "zod";

// Global Commission Settings
export interface GlobalCommissionSettings {
  currentRate: number;
  updatedRate: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CommissionResponse {
  code: string;
  percent: number;
}

export interface CommissionUpdatePayload {
  percent: number;
  reason: string;
}

// Commission Audit Log
export interface CommissionAuditLog {
  id: string;
  previousRate: number;
  newRate: number;
  updatedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface CommissionAuditLogsResponse {
  message: string;
  logs?: CommissionAuditLog[];
  data?: CommissionAuditLog[];
  meta?: CommissionListMeta;
}

// Commission Ledger
export interface CommissionLedgerItem {
  id: string;
  foddermanId: string;
  foddermanName: string;
  district: string;
  village: string;
  totalOrdersDelivered: number;
  pendingCommission: number;
  earnableCommission: number;
  lifetimePaid: number;
}

export interface CommissionLedgerResponse {
  message: string;
  data?: CommissionLedgerItem[];
  meta?: CommissionListMeta;
}

// Order-wise Commission Details
export interface OrderCommissionDetail {
  orderId: string;
  orderDate: string;
  orderAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  status: "pending" | "earnable" | "paid";
  lockedCommissionRate: number;
}

export interface OrderCommissionDetailsResponse {
  message: string;
  data?: OrderCommissionDetail[];
  meta?: CommissionListMeta;
}

// Payout Settlement
export interface PayoutSettlementPayload {
  foddermanId: string;
  transactionReferenceId: string;
  notes?: string;
}

export interface PayoutSettlementResponse {
  message: string;
  data?: {
    id: string;
    foddermanId: string;
    amount: number;
    transactionReferenceId: string;
    notes?: string;
    processedBy: string;
    createdAt: string;
  };
}

// Payout History
export interface PayoutHistoryItem {
  id: string;
  payoutDate: string;
  foddermanName: string;
  amountPaid: number;
  transactionReferenceId: string;
  processedBy: string;
}

export interface PayoutHistoryResponse {
  message: string;
  data?: PayoutHistoryItem[];
  meta?: CommissionListMeta;
}

// Common Meta for Pagination
export interface CommissionListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Sort and Filter Types
export type CommissionSortBy = "createdAt" | "foddermanName" | "district" | "earnableCommission" | "lifetimePaid";
export type CommissionSortOrder = "ASC" | "DESC";

// Form Schemas
export const commissionUpdateSchema = z.object({
  percent: z
    .number()
    .min(0, "Commission percentage cannot be negative")
    .max(100, "Commission percentage cannot exceed 100")
    .refine((val) => val >= 0 && val <= 100, "Commission percentage must be between 0 and 100"),
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .min(5, "Reason must be at least 5 characters long")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type CommissionUpdateFormValues = z.infer<typeof commissionUpdateSchema>;

export const payoutSettlementSchema = z.object({
  transactionReferenceId: z
    .string()
    .trim()
    .min(1, "Transaction Reference ID is required")
    .min(3, "Transaction Reference ID must be at least 3 characters long")
    .max(100, "Transaction Reference ID cannot exceed 100 characters"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

export type PayoutSettlementFormValues = z.infer<typeof payoutSettlementSchema>;

// Fodderman Commissions (Admin)
export interface FoddermanCommission {
  id: string;
  foddermanId: string;
  foddermanName: string;
  totalOrders: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  status: "pending" | "paid";
  lastOrderDate?: string;
}

export interface FoddermanCommissionListResponse {
  message: string;
  data?: FoddermanCommission[];
  meta?: CommissionListMeta;
}

// My Commissions (Fodderman)
export interface MyCommissionStats {
  totalOrders: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  lastPayoutDate?: string;
}

export interface MyCommissionDetail {
  orderId: string;
  orderDate: string;
  orderAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  status: "pending" | "paid";
  payoutDate?: string;
}

export interface FoddermanCommissionStatsResponse {
  message: string;
  data?: {
    stats: MyCommissionStats;
    commissions: MyCommissionDetail[];
  };
  meta?: CommissionListMeta;
}

// Create Payout
export interface CreatePayoutDto {
  foddermanId: string;
  amount: number;
  notes?: string;
}

export interface CreatePayoutResponse {
  message: string;
  data?: {
    id: string;
    foddermanId: string;
    amount: number;
  };
}
