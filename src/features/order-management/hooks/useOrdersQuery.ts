import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "../services/order.api";
import type { AdminOrderListApiSortBy, OrderListFilters } from "../types/order.types";

type SortOrder = "ASC" | "DESC";

/** Paginated list (e.g. exports); prefer `useOrdersInfiniteQuery` for table UIs. */
export function useOrdersQuery(
  page: number,
  limit: number,
  filters: OrderListFilters,
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: SortOrder,
) {
  return useQuery({
    queryKey: ["orders", "admin", page, limit, filters, sortBy, sortOrder],
    queryFn: () => getAdminOrders(page, limit, filters, sortBy, sortOrder),
    placeholderData: (prev) => prev,
  });
}

export function useOrdersInfiniteQuery(
  filters: OrderListFilters,
  sortBy?: AdminOrderListApiSortBy,
  sortOrder?: SortOrder,
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: ["orders", "admin", "infinite", filters, sortBy ?? "", sortOrder ?? "", limit],
    queryFn: ({ pageParam = 1 }) => getAdminOrders(pageParam, limit, filters, sortBy, sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}
