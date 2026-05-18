import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getCancelledRefundsQueue, getCancellationRefundAudit } from "../services/refund.api";
import type { AdminCancelledOrdersSortBy, CancellationRefundListFilters } from "../types/refund.types";

type SortOrder = "ASC" | "DESC";

export function useCancelledRefundsInfiniteQuery(
  filters: CancellationRefundListFilters,
  sortBy?: AdminCancelledOrdersSortBy,
  sortOrder?: SortOrder,
  limit: number = 20,
) {
  return useInfiniteQuery({
    queryKey: ["cancelled-refunds", "infinite", filters, sortBy ?? "", sortOrder ?? "", limit],
    queryFn: ({ pageParam = 1 }) => getCancelledRefundsQueue(pageParam, limit, filters, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useCancellationRefundAuditQuery(orderId: string | undefined, open: boolean) {
  return useQuery({
    queryKey: ["cancellation-refund-audit", orderId],
    queryFn: () => getCancellationRefundAudit(orderId as string),
    enabled: Boolean(orderId) && open,
  });
}
