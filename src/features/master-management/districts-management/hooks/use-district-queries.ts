import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { createDistrict, DistrictSortBy, DistrictSortOrder, getAllDistricts, getDistricts, updateDistrict } from "../services/district.api";
import { DistrictFormValues } from "../types";

export const useDistrictsInfiniteQuery = (params: {
  search?: string;
  stateId?: string;
  sortBy?: DistrictSortBy;
  sortOrder?: DistrictSortOrder;
}) => {
  return useInfiniteQuery({
    queryKey: ["districts", "infinite", params.search, params.stateId, params.sortBy, params.sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      getDistricts(pageParam, 20, params.search, params.stateId, params.sortBy, params.sortOrder),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.hasNextPage) return lastPage.meta.page + 1;
      return undefined;
    },
    retry: false,
  });
};

export const useDistrictsQuery = (params: { stateId?: string }) => {
  return useQuery({
    queryKey: ["districts", "list", "all", params.stateId],
    queryFn: () => getAllDistricts(params.stateId!, "name", "ASC"),
    enabled: !!params.stateId,
  });
};

export const useDistrictMutation = (id?: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DistrictFormValues) => {
      return id ? updateDistrict(id, data) : createDistrict(data);
    },
    onSuccess: (response) => {
      if (response.success || response.id) {
        toast.success(`District ${id ? "updated" : "added"} successfully`);
        queryClient.invalidateQueries({ queryKey: ["districts"] });
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
