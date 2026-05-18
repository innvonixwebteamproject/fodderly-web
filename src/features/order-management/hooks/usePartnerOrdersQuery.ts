import { useInfiniteQuery } from "@tanstack/react-query";
import { getOrders, getPartnerOrders } from "../services/order.api";
import type { OrderListFilters, OrderSortBy, PartnerDailyOrderListFilters } from "../types/order.types";

type SortOrder = "ASC" | "DESC";

export function usePartnerOrdersInfiniteQuery(
  filters: PartnerDailyOrderListFilters,
  sortBy?: string,
  sortOrder?: SortOrder,
  limit: number = 20,
) {
  return useInfiniteQuery({
    queryKey: ["partner-orders", "infinite", filters, sortBy ?? "", sortOrder ?? "", limit],
    queryFn: ({ pageParam = 1 }) => getPartnerOrders(pageParam, limit, filters, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined),
  });
}

export function usePartnerOrderHistoryInfiniteQuery(
  filters: OrderListFilters,
  sortBy?: OrderSortBy,
  sortOrder?: SortOrder,
  limit: number = 20,
) {
  return useInfiniteQuery({
    queryKey: ["partner-order-history", "infinite", filters, sortBy ?? "", sortOrder ?? "", limit],
    queryFn: ({ pageParam = 1 }) => getOrders(pageParam, limit, filters, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
    placeholderData: (prev) => prev,
  });
}
