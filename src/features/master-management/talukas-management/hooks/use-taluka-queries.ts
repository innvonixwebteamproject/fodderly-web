import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { createTaluka, getAllTalukas, getTalukas, TalukaSortBy, TalukaSortOrder, updateTaluka } from "../services/taluka.api";
import { TalukaFormValues } from "../types";

export const useTalukasInfiniteQuery = (params: {
  search?: string;
  stateId?: string;
  districtId?: string;
  sortBy?: TalukaSortBy;
  sortOrder?: TalukaSortOrder;
}) => {
  return useInfiniteQuery({
    queryKey: ["talukas", "infinite", params.search, params.stateId, params.districtId, params.sortBy, params.sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      getTalukas(
        pageParam,
        20,
        params.search,
        params.districtId,
        params.stateId,
        params.sortBy,
        params.sortOrder,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.hasNextPage) return lastPage.meta.page + 1;
      return undefined;
    },
    retry: false,
  });
};

export const useTalukasQuery = (params: { stateId?: string; districtId?: string }) => {
  return useQuery({
    queryKey: ["talukas", "list", "all", params.stateId, params.districtId],
    queryFn: () => getAllTalukas(params.districtId, params.stateId, "name", "ASC"),
    enabled: !!params.districtId || !!params.stateId,
  });
};

export const useTalukaMutation = (id?: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TalukaFormValues) => {
      return id ? updateTaluka(id, data) : createTaluka(data);
    },
    onSuccess: (response) => {
      if (response.success || response.id) {
        toast.success(`Taluka ${id ? "updated" : "added"} successfully`);
        queryClient.invalidateQueries({ queryKey: ["talukas"] });
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
