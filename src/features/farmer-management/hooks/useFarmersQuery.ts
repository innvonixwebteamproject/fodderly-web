import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getFarmers, type FarmerListFilters } from "../services";

export const useFarmersQuery = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: FarmerListFilters,
) => {
  return useQuery({
    queryKey: ["farmers", page, limit, search ?? "", filters ?? {}],
    queryFn: () => getFarmers(page, limit, search, filters),
  });
};

export const useFarmersInfiniteQuery = (
  search?: string,
  filters?: FarmerListFilters,
  limit: number = 10,
) => {
  return useInfiniteQuery({
    queryKey: ["farmers-infinite", search ?? "", filters ?? {}, limit],
    queryFn: ({ pageParam = 1 }) => getFarmers(pageParam, limit, search, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
};
