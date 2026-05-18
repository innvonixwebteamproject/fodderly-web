import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { foddermanApi } from "../services/fodderman.api";
import { IFoddermanFilters } from "../types";

export const useFoddermanByIdQuery = (id?: string) => {
  return useQuery({
    queryKey: ["fodderman", id],
    queryFn: () => foddermanApi.getFoddermanById(id || ""),
    enabled: Boolean(id),
  });
};

export const useFoddermenInfiniteQuery = (
  search?: string,
  filters?: IFoddermanFilters,
) => {
  return useInfiniteQuery({
    queryKey: ["foddermen-infinite", search, filters],
    queryFn: async ({ pageParam = 1 }) => {
      return foddermanApi.getFoddermen({
        page: pageParam,
        limit: 10,
        search,
        filters,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total, limit } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};
