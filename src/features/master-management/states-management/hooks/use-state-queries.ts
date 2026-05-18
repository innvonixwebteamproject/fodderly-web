import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { createState, getStates, StateSortBy, StateSortOrder, updateState } from "../services/state.api";
import { StateFormValues } from "../types";

export const useStatesQuery = (page: number, limit: number, search?: string) => {
  return useQuery({
    queryKey: ["states", page, limit, search],
    queryFn: () => getStates(page, limit, search),
  });
};

export const useStatesInfiniteQuery = (params: {
  search?: string;
  limit?: number;
  sortBy?: StateSortBy;
  sortOrder?: StateSortOrder;
  /** Fetch every page so dropdowns (e.g. create dialogs) are not limited to the first page. */
  prefetchAllPages?: boolean;
}) => {
  const limit = params.limit ?? 20;
  const query = useInfiniteQuery({
    queryKey: ["states", "infinite", params.search, params.sortBy, params.sortOrder, limit],
    queryFn: ({ pageParam = 1 }) =>
      getStates(pageParam, limit, params.search, params.sortBy, params.sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.hasNextPage) return lastPage.meta.page + 1;
      return undefined;
    },
    retry: false,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    if (!params.prefetchAllPages) return;
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [params.prefetchAllPages, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return query;
};

export const useStateMutation = (id?: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StateFormValues) => {
      return id ? updateState(id, data) : createState(data);
    },
    onSuccess: (response) => {
      if (response.success || response.id) {
        toast.success(`State ${id ? "updated" : "added"} successfully`);
        queryClient.invalidateQueries({ queryKey: ["states"] });
        onSuccess?.();
      } else {
        toast.error(response.message || "Something went wrong");
      }
    },
    onError: (error: unknown) => {
      toast.error(ApiError.getErrorMessage(error, "Operation failed"));
    },
  });
};
