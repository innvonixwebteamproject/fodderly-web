import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeManualRefund, getRefundQueue, initiateRefund } from "../services/refund.api";
import type { RefundInitiatePayload, RefundManualCompletePayload, RefundSortBy } from "../types/refund.types";

type SortOrder = "ASC" | "DESC";

export function useRefundsQuery(
  page: number,
  limit: number,
  sortBy?: RefundSortBy,
  sortOrder?: SortOrder,
) {
  return useQuery({
    queryKey: ["refunds", page, limit, sortBy, sortOrder],
    queryFn: () => getRefundQueue(page, limit, sortBy, sortOrder),
    placeholderData: (prev) => prev,
  });
}

export function useRefundsInfiniteQuery(
  sortBy?: RefundSortBy,
  sortOrder?: SortOrder,
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: ["refunds", "infinite", sortBy ?? "", sortOrder ?? "", limit],
    queryFn: ({ pageParam = 1 }) => getRefundQueue(pageParam, limit, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useInitiateRefundMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload?: RefundInitiatePayload }) =>
      initiateRefund(orderId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["refunds"] });
      qc.invalidateQueries({ queryKey: ["cancelled-refunds"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-detail"] });
      qc.invalidateQueries({ queryKey: ["admin-order-detail", variables.orderId] });
      qc.invalidateQueries({ queryKey: ["cancellation-refund-audit"] });
      toast.success(
        "Refund initiated. The farmer will receive an SMS that the full amount was refunded to the original payment method (3–5 business days).",
      );
    },
    onError: (e: Error) => {
      toast.error(e.message || "Refund initiation failed");
    },
  });
}

export function useManualRefundMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: RefundManualCompletePayload }) =>
      completeManualRefund(orderId, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["refunds"] });
      qc.invalidateQueries({ queryKey: ["cancelled-refunds"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-detail"] });
      qc.invalidateQueries({ queryKey: ["admin-order-detail", variables.orderId] });
      qc.invalidateQueries({ queryKey: ["cancellation-refund-audit"] });
      toast.success("Refund marked as processed; audit log updated.");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Update failed");
    },
  });
}
