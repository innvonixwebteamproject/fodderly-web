import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { createVillage, getVillages, updateVillage, VillageSortBy, VillageSortOrder } from "../services/village.api";
import { VillageFormValues } from "../types";

export const useVillagesInfiniteQuery = (params: {
  search?: string;
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  sortBy?: VillageSortBy;
  sortOrder?: VillageSortOrder;
}) => {
  return useInfiniteQuery({
    queryKey: ["villages", "infinite", params.search, params.stateId, params.districtId, params.talukaId, params.sortBy, params.sortOrder],
    queryFn: ({ pageParam = 1 }) =>
      getVillages(
        pageParam,
        20,
        params.search,
        params.talukaId,
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

export const useVillageMutation = (id?: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VillageFormValues) => {
      return id ? updateVillage(id, data) : createVillage(data);
    },
    onSuccess: (response) => {
      if (response.success || response.id) {
        toast.success(`Village ${id ? "updated" : "added"} successfully`);
        queryClient.invalidateQueries({ queryKey: ["villages"] });
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
